import numpy as np
from utils.logging_utils import setup_logger, log_error, log_info
from utils.retry_utils import retry
from retrieval.embeddings_fallback import EmbeddingModel
from collections import defaultdict
import time


class ConflictDetector:
    def __init__(self, llm=None):
        self.llm = llm
        self.logger = setup_logger("conflict_detector")
        self.embedder = EmbeddingModel()
        self.similarity_threshold = 0.6  # Only compare semantically similar claims
        self.max_comparisons = 50  # Prevent O(n²) explosion
    
    def detect(self, graph):
        """Detect conflicts using semantic reasoning"""
        try:
            log_info(self.logger, "Starting conflict detection...")
            
            conflicts = []
            # Access the NetworkX graph inside KnowledgeGraph
            nx_graph = graph.graph if hasattr(graph, 'graph') else graph
            nodes = list(nx_graph.nodes(data=True))
            
            if len(nodes) < 2:
                log_info(self.logger, "Not enough nodes for conflict detection")
                return conflicts
            
            # Pre-compute embeddings for all claims
            claim_texts = [node[1].get("text", "") for node in nodes]
            embeddings = self.embedder.encode(claim_texts)
            
            # Find semantically similar pairs to compare
            similar_pairs = self._find_similar_pairs(nodes, embeddings)
            
            log_info(self.logger, f"Found {len(similar_pairs)} semantically similar pairs to analyze")
            
            # Analyze each similar pair for contradictions
            for i, (node1_idx, node2_idx, similarity) in enumerate(similar_pairs[:self.max_comparisons]):
                node1_id, node1_data = nodes[node1_idx]
                node2_id, node2_data = nodes[node2_idx]
                
                text1 = node1_data.get("text", "")
                text2 = node2_data.get("text", "")
                
                conflict_result = self._detect_semantic_conflict(text1, text2, similarity)
                
                if conflict_result["contradiction"]:
                    conflicts.append({
                        "node1_id": node1_id,
                        "node2_id": node2_id,
                        "confidence": conflict_result["confidence"],
                        "severity": conflict_result["severity"],
                        "reason": conflict_result["reason"],
                        "similarity": similarity
                    })
                    
                    # Add contradiction edge to graph
                    nx_graph.add_edge(node1_id, node2_id, 
                                  edge_type="contradicts",
                                  confidence=conflict_result["confidence"],
                                  severity=conflict_result["severity"])
                    
                    log_info(self.logger, f"Conflict detected: {node1_id[:8]}... vs {node2_id[:8]}... (confidence: {conflict_result['confidence']:.2f})")
            
            log_info(self.logger, f"Conflict detection completed. Found {len(conflicts)} conflicts")
            return conflicts
            
        except Exception as e:
            log_error(self.logger, e, "Conflict detection failed")
            return []
    
    def _find_similar_pairs(self, nodes, embeddings):
        """Find pairs of semantically similar claims to compare"""
        similar_pairs = []
        n = len(nodes)
        
        for i in range(n):
            for j in range(i + 1, n):
                # Calculate cosine similarity
                if embeddings[i] is not None and embeddings[j] is not None:
                    similarity = np.dot(embeddings[i], embeddings[j]) / (
                        np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[j]) + 1e-8
                    )
                    
                    if similarity > self.similarity_threshold:
                        similar_pairs.append((i, j, similarity))
        
        # Sort by similarity (highest first)
        similar_pairs.sort(key=lambda x: x[2], reverse=True)
        return similar_pairs
    
    @retry(max_attempts=2, delay=0.5)
    def _detect_semantic_conflict(self, text1, text2, similarity):
        """Use LLM to detect semantic contradictions"""
        if not self.llm:
            # Fallback to basic logic if no LLM available
            return self._basic_conflict_detection(text1, text2)
        
        prompt = f"""
You are a logical reasoning expert specialized in detecting contradictions.

Analyze these two statements for semantic contradictions:

STATEMENT 1: "{text1}"
STATEMENT 2: "{text2}"

## CONTRADICTION TYPES:
1. **Direct Negation**: One statement explicitly denies the other
2. **Mutual Exclusion**: Both cannot be true simultaneously
3. **Logical Inconsistency**: Combined statements create a paradox
4. **Factual Opposition**: Statements claim opposite facts

## ANALYSIS REQUIREMENTS:
- Consider the full semantic meaning, not just keywords
- Account for context and nuance
- Distinguish between disagreement and contradiction
- Evaluate confidence based on clarity of contradiction

## OUTPUT JSON:
{{
  "contradiction": true/false,
  "confidence": 0.0-1.0,
  "severity": "weak|moderate|strong",
  "reason": "Detailed explanation of why these statements contradict or not"
}}

Remember: True contradictions are rare. Be precise.
"""
        
        try:
            from llm.response_parser import ResponseParser
            data = ResponseParser.safe_parse(self.llm, prompt)
            
            # Validate and normalize response
            contradiction = bool(data.get("contradiction", False))
            confidence = float(data.get("confidence", 0.0))
            severity = data.get("severity", "moderate")
            reason = data.get("reason", "")
            
            # Validate severity
            if severity not in ["weak", "moderate", "strong"]:
                severity = "moderate"
            
            # Adjust confidence based on similarity
            if similarity < 0.7:
                confidence *= 0.8  # Lower confidence for less similar claims
            
            return {
                "contradiction": contradiction,
                "confidence": max(0.0, min(1.0, confidence)),
                "severity": severity,
                "reason": reason[:200] if reason else "No explanation provided"
            }
            
        except Exception as e:
            log_error(self.logger, e, "LLM conflict detection failed")
            return self._basic_conflict_detection(text1, text2)
    
    def _basic_conflict_detection(self, text1, text2):
        """Fallback basic conflict detection without LLM"""
        text1_lower = text1.lower()
        text2_lower = text2.lower()
        
        # Check for explicit negation patterns
        negation_patterns = [
            "not", "no", "never", "cannot", "can't", "won't", "doesn't", "isn't", "aren't"
        ]
        
        # Look for direct contradictions
        for neg in negation_patterns:
            if f"{neg} " in text1_lower and text2_lower.replace(f"{neg} ", "") in text1_lower:
                return {
                    "contradiction": True,
                    "confidence": 0.6,
                    "severity": "moderate",
                    "reason": f"Direct negation detected with '{neg}'"
                }
            
            if f"{neg} " in text2_lower and text1_lower.replace(f"{neg} ", "") in text2_lower:
                return {
                    "contradiction": True,
                    "confidence": 0.6,
                    "severity": "moderate",
                    "reason": f"Direct negation detected with '{neg}'"
                }
        
        # Check for opposite claims
        opposite_pairs = [
            ("always", "never"),
            ("all", "none"),
            ("every", "no"),
            ("increase", "decrease"),
            ("improve", "worsen"),
            ("better", "worse")
        ]
        
        for pos, neg in opposite_pairs:
            if pos in text1_lower and neg in text2_lower:
                return {
                    "contradiction": True,
                    "confidence": 0.4,
                    "severity": "weak",
                    "reason": f"Opposite terms detected: '{pos}' vs '{neg}'"
                }
            
            if neg in text1_lower and pos in text2_lower:
                return {
                    "contradiction": True,
                    "confidence": 0.4,
                    "severity": "weak",
                    "reason": f"Opposite terms detected: '{neg}' vs '{pos}'"
                }
        
        return {
            "contradiction": False,
            "confidence": 0.0,
            "severity": "weak",
            "reason": "No clear contradiction detected"
        }
    
    def get_conflict_summary(self, conflicts):
        """Generate summary of detected conflicts"""
        if not conflicts:
            return {"total_conflicts": 0, "severity_breakdown": {}, "average_confidence": 0.0}
        
        severity_counts = defaultdict(int)
        total_confidence = 0.0
        
        for conflict in conflicts:
            severity = conflict["severity"]
            severity_counts[severity] += 1
            total_confidence += conflict["confidence"]
        
        return {
            "total_conflicts": len(conflicts),
            "severity_breakdown": dict(severity_counts),
            "average_confidence": total_confidence / len(conflicts),
            "high_confidence_conflicts": len([c for c in conflicts if c["confidence"] > 0.7])
        }