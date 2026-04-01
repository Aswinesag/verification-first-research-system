"""
Uncertainty Estimator for VARA System

Computes calibrated confidence scores, uncertainty estimates, and trust levels
based on evidence quality, source diversity, and contradiction detection.
"""

import numpy as np
from typing import Dict, List, Any, Optional
from utils.logging_utils_production import setup_logger, log_info, log_error


class UncertaintyEstimator:
    """
    Estimates uncertainty and calibrates confidence for claims based on:
    - Evidence quality and diversity
    - Contradiction detection
    - Source reliability
    - Verification consistency
    """
    
    def __init__(self, config: Optional[Dict[str, float]] = None):
        self.logger = setup_logger("uncertainty_estimator")
        
        # Configurable weights for confidence calculation
        self.weights = config or {
            'evidence_weight': 0.4,
            'reasoning_weight': 0.3,
            'source_diversity_weight': 0.2,
            'contradiction_penalty_weight': 0.3
        }
        
        # Source reliability scores
        self.source_reliability = {
            'web_search': 0.7,
            'retrieved_doc': 0.8,
            'dataset': 0.9,
            'local_index': 0.85
        }
        
        log_info(self.logger, f"UncertaintyEstimator initialized with weights: {self.weights}")
    
    def estimate_claim_uncertainty(self, claim: Dict[str, Any], 
                              verification_result: Dict[str, Any],
                              graph_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Estimate uncertainty and calibrate confidence for a single claim.
        
        Args:
            claim: Claim dictionary with text, confidence, evidence_sources
            verification_result: Verification result with scores and flags
            graph_context: Graph information including contradictions
            
        Returns:
            Dictionary with calibrated confidence, uncertainty, and trust level
        """
        try:
            # Extract base components
            evidence_score = float(verification_result.get('evidence_quality_score', 0.0))
            reasoning_score = float(verification_result.get('reasoning_validity_score', 0.0))
            claim_confidence = float(claim.get('confidence', 0.0))
            
            # Calculate source diversity score
            evidence_sources = claim.get('evidence_sources', [])
            if evidence_sources and hasattr(evidence_sources, '__iter__'):
                source_diversity = self._calculate_source_diversity(evidence_sources)
            else:
                source_diversity = 0.0
            
            # Calculate contradiction penalty
            contradiction_penalty = self._calculate_contradiction_penalty(
                claim.get('claim_id', ''), 
                graph_context.get('contradictions', [])
            )
            
            # Calculate calibrated confidence
            base_confidence = self._calculate_base_confidence(
                evidence_score, reasoning_score, source_diversity
            )
            
            final_confidence = max(0.0, min(1.0, 
                base_confidence - contradiction_penalty))
            
            # Calculate uncertainty
            uncertainty = 1.0 - final_confidence
            
            # Determine trust level
            trust_level = self._classify_trust_level(final_confidence)
            
            # Generate explanation
            explanation = self._generate_explanation(
                evidence_score, reasoning_score, source_diversity,
                contradiction_penalty, verification_result.get('contradiction_flags', [])
            )
            
            result = {
                'final_confidence': round(final_confidence, 3),
                'uncertainty': round(uncertainty, 3),
                'trust_level': trust_level,
                'explanation': explanation,
                'components': {
                    'evidence_score': round(evidence_score, 3),
                    'reasoning_score': round(reasoning_score, 3),
                    'source_diversity': round(source_diversity, 3),
                    'contradiction_penalty': round(contradiction_penalty, 3),
                    'base_confidence': round(base_confidence, 3)
                }
            }
            
            log_info(self.logger, 
                f"Claim {claim.get('claim_id', 'unknown')[:8]}...: "
                f"confidence={final_confidence:.3f}, uncertainty={uncertainty:.3f}, "
                f"trust={trust_level}")
            
            return result
            
        except Exception as e:
            log_error(self.logger, e, "Failed to estimate claim uncertainty")
            return self._fallback_result()
    
    def _calculate_source_diversity(self, evidence_sources: List[Dict[str, Any]]) -> float:
        """
        Calculate source diversity score based on number and variety of sources.
        
        Higher diversity = higher confidence
        """
        if not evidence_sources:
            return 0.0
        
        # Count unique source types
        source_types = set()
        total_reliability = 0.0
        
        for source in evidence_sources:
            source_type = source.get('source', 'unknown')
            source_types.add(source_type)
            
            # Add source reliability
            reliability = self.source_reliability.get(source_type, 0.5)
            total_reliability += reliability
        
        # Diversity bonus for multiple source types
        diversity_bonus = min(len(source_types) / 3.0, 1.0)  # Max bonus for 3+ types
        
        # Normalize and combine with reliability
        avg_reliability = total_reliability / len(evidence_sources) if evidence_sources else 0.0
        source_diversity = (avg_reliability * 0.7) + (diversity_bonus * 0.3)
        
        return min(source_diversity, 1.0)
    
    def _calculate_contradiction_penalty(self, claim_id: str, 
                                   contradictions: List[Dict[str, Any]]) -> float:
        """
        Calculate penalty based on contradictions in the graph.
        
        More/severe contradictions = higher penalty
        """
        if not contradictions:
            return 0.0
        
        # Find contradictions involving this claim
        claim_contradictions = [
            c for c in contradictions 
            if c.get('node1_id') == claim_id or c.get('node2_id') == claim_id
        ]
        
        if not claim_contradictions:
            return 0.0
        
        # Calculate penalty based on number and severity of contradictions
        total_penalty = 0.0
        for contradiction in claim_contradictions:
            severity = contradiction.get('severity', 'weak')
            confidence = contradiction.get('confidence', 0.0)
            
            # Severity-based penalty
            severity_penalty = {
                'weak': 0.1,
                'moderate': 0.2,
                'strong': 0.4
            }.get(severity, 0.2)
            
            # Confidence-weighted penalty
            weighted_penalty = severity_penalty * confidence
            total_penalty += weighted_penalty
        
        # Cap penalty to prevent negative confidence
        return min(total_penalty, 0.8)
    
    def _calculate_base_confidence(self, evidence_score: float, 
                               reasoning_score: float,
                               source_diversity: float) -> float:
        """
        Calculate base confidence from evidence, reasoning, and source diversity.
        """
        base_confidence = (
            (self.weights['evidence_weight'] * evidence_score) +
            (self.weights['reasoning_weight'] * reasoning_score) +
            (self.weights['source_diversity_weight'] * source_diversity)
        )
        
        # Add small boost for consistent high scores
        consistency_bonus = 0.0
        if evidence_score > 0.7 and reasoning_score > 0.7:
            consistency_bonus = 0.1
        
        return min(base_confidence + consistency_bonus, 1.0)
    
    def _classify_trust_level(self, confidence: float) -> str:
        """
        Classify trust level based on confidence score.
        """
        if confidence > 0.75:
            return "high"
        elif confidence >= 0.4:
            return "medium"
        else:
            return "low"
    
    def _generate_explanation(self, evidence_score: float, reasoning_score: float,
                          source_diversity: float, contradiction_penalty: float,
                          flags: List[str]) -> str:
        """
        Generate human-readable explanation of confidence calculation.
        """
        explanations = []
        
        # Evidence quality
        if evidence_score > 0.7:
            explanations.append("Strong evidence quality")
        elif evidence_score > 0.4:
            explanations.append("Moderate evidence quality")
        else:
            explanations.append("Weak evidence quality")
        
        # Reasoning quality
        if reasoning_score > 0.7:
            explanations.append("Strong reasoning")
        elif reasoning_score > 0.4:
            explanations.append("Moderate reasoning")
        else:
            explanations.append("Weak reasoning")
        
        # Source diversity
        if source_diversity > 0.7:
            explanations.append("High source diversity")
        elif source_diversity > 0.4:
            explanations.append("Moderate source diversity")
        else:
            explanations.append("Low source diversity")
        
        # Contradictions
        if contradiction_penalty > 0.3:
            explanations.append("Strong contradiction penalty")
        elif contradiction_penalty > 0.1:
            explanations.append("Moderate contradiction penalty")
        elif contradiction_penalty > 0:
            explanations.append("Minor contradiction penalty")
        
        # Issue flags
        if flags:
            flag_explanations = {
                'missing_evidence': 'Missing evidence',
                'weak_evidence': 'Weak evidence',
                'irrelevant_evidence': 'Irrelevant evidence',
                'contradiction': 'Contradiction detected',
                'vague_claim': 'Vague claim',
                'overconfident_claim': 'Overconfident claim',
                'circular_validation': 'Circular validation'
            }
            
            for flag in flags:
                if flag in flag_explanations:
                    explanations.append(flag_explanations[flag])
        
        return "; ".join(explanations)
    
    def _fallback_result(self) -> Dict[str, Any]:
        """
        Return fallback result for error cases.
        """
        return {
            'final_confidence': 0.1,
            'uncertainty': 0.9,
            'trust_level': 'low',
            'explanation': 'Error in uncertainty estimation - using fallback',
            'components': {
                'evidence_score': 0.0,
                'reasoning_score': 0.0,
                'source_diversity': 0.0,
                'contradiction_penalty': 0.0,
                'base_confidence': 0.1
            }
        }
    
    def estimate_system_confidence(self, claims: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Estimate overall system confidence and risk level.
        
        Args:
            claims: List of claims with uncertainty estimates
            
        Returns:
            System-level confidence and risk assessment
        """
        try:
            if not claims:
                return {
                    'overall_confidence': 0.0,
                    'risk_level': 'high',
                    'explanation': 'No claims available'
                }
            
            # Calculate average confidence
            confidences = [c.get('final_confidence', 0.0) for c in claims]
            avg_confidence = np.mean(confidences)
            
            # Calculate confidence variance (higher variance = lower trust)
            confidence_variance = np.var(confidences)
            variance_penalty = min(confidence_variance * 0.5, 0.2)
            
            # Adjust for uncertainty spread
            uncertainties = [c.get('uncertainty', 1.0) for c in claims]
            avg_uncertainty = np.mean(uncertainties)
            
            # Calculate final system confidence
            system_confidence = max(0.0, min(1.0, 
                avg_confidence - variance_penalty))
            
            # Classify risk level
            risk_level = self._classify_risk_level(
                system_confidence, avg_uncertainty, confidence_variance
            )
            
            # Generate explanation
            explanation = self._generate_system_explanation(
                avg_confidence, avg_uncertainty, confidence_variance, len(claims)
            )
            
            result = {
                'overall_confidence': round(system_confidence, 3),
                'risk_level': risk_level,
                'average_uncertainty': round(avg_uncertainty, 3),
                'confidence_variance': round(confidence_variance, 3),
                'claim_count': len(claims),
                'explanation': explanation
            }
            
            log_info(self.logger, 
                f"System confidence: {system_confidence:.3f}, risk: {risk_level}")
            
            return result
            
        except Exception as e:
            log_error(self.logger, e, "Failed to estimate system confidence")
            return {
                'overall_confidence': 0.1,
                'risk_level': 'high',
                'explanation': 'Error in system confidence estimation'
            }
    
    def _classify_risk_level(self, confidence: float, uncertainty: float, 
                          variance: float) -> str:
        """
        Classify overall system risk level.
        """
        # High risk: low confidence, high uncertainty, high variance
        if confidence < 0.4 or uncertainty > 0.7 or variance > 0.1:
            return 'high'
        
        # Medium risk: moderate values
        elif confidence < 0.7 or uncertainty > 0.4 or variance > 0.05:
            return 'medium'
        
        # Low risk: high confidence, low uncertainty, low variance
        else:
            return 'low'
    
    def _generate_system_explanation(self, avg_confidence: float, avg_uncertainty: float,
                                variance: float, claim_count: int) -> str:
        """
        Generate explanation for system-level confidence.
        """
        explanations = []
        
        # Average confidence
        if avg_confidence > 0.7:
            explanations.append("High average claim confidence")
        elif avg_confidence > 0.4:
            explanations.append("Moderate average claim confidence")
        else:
            explanations.append("Low average claim confidence")
        
        # Uncertainty
        if avg_uncertainty > 0.6:
            explanations.append("High overall uncertainty")
        elif avg_uncertainty > 0.3:
            explanations.append("Moderate overall uncertainty")
        else:
            explanations.append("Low overall uncertainty")
        
        # Variance
        if variance > 0.08:
            explanations.append("High confidence variance")
        elif variance > 0.03:
            explanations.append("Moderate confidence variance")
        else:
            explanations.append("Low confidence variance")
        
        # Claim count
        explanations.append(f"Based on {claim_count} claims")
        
        return "; ".join(explanations)
