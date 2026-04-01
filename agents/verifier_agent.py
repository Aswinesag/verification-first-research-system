from schemas.verification_schema import VerificationResult
from llm.response_parser import ResponseParser
from utils.logging_utils_production import setup_logger, log_info, log_error
from utils.retry_utils import retry
import re
from difflib import SequenceMatcher


class VerifierAgent:
    def __init__(self, llm):
        self.llm = llm
        self.logger = setup_logger("verifier_agent")
    
    @retry(max_attempts=3, delay=0.5)
    def verify(self, claim):
        try:
            log_info(self.logger, f"Verifying claim: {claim.claim_text[:50]}...")
            
            evidence_text = " ".join([e.snippet for e in claim.evidence_sources])
            
            if not evidence_text.strip():
                log_info(self.logger, "No evidence found, returning unsupported")
                return VerificationResult(
                    claim_id=claim.claim_id,
                    verification_status="unsupported",
                    evidence_quality_score=0.0,
                    reasoning_validity_score=0.0,
                    contradiction_flags=["no_evidence"],
                    verifier_notes="No evidence provided"
                )
            
            # Check for circular validation (claim reused as evidence)
            circular_penalty = self._check_circular_validation(claim.claim_text, evidence_text)
            
            # Build critical verification prompt
            prompt = self._build_verification_prompt(claim.claim_text, evidence_text, circular_penalty)
            
            data = ResponseParser.safe_parse(self.llm, prompt)
            
            # Apply enhanced validation logic
            result = self._apply_validation_rules(claim, data, circular_penalty)
            
            log_info(self.logger, f"Verification completed: {result.verification_status} (evidence: {result.evidence_quality_score:.2f}, reasoning: {result.reasoning_validity_score:.2f})")
            return result
            
        except Exception as e:
            log_error(self.logger, e, f"Verification failed for claim: {claim.claim_text[:30]}...")
            # Return fallback result
            return VerificationResult(
                claim_id=claim.claim_id,
                verification_status="unsupported",
                evidence_quality_score=0.0,
                reasoning_validity_score=0.0,
                contradiction_flags=["verification_error"],
                verifier_notes=f"Verification error: {str(e)}"
            )
    
    def _check_circular_validation(self, claim_text, evidence_text):
        """Check if claim text is being reused as evidence"""
        claim_words = set(re.findall(r'\b\w+\b', claim_text.lower()))
        evidence_words = set(re.findall(r'\b\w+\b', evidence_text.lower()))
        
        # Calculate similarity
        if not claim_words:
            return 0.0
        
        similarity = len(claim_words.intersection(evidence_words)) / len(claim_words)
        
        # If high similarity, apply penalty
        if similarity > 0.7:
            return similarity * 0.5  # Penalty up to 50%
        return 0.0
    
    def _build_verification_prompt(self, claim_text, evidence_text, circular_penalty):
        """Build strict verification prompt"""
        circular_note = "\nWARNING: Claim text appears to be reused as evidence" if circular_penalty > 0 else ""
        
        return f"""
You are a CRITICAL and SKEPTICAL verifier. Your job is to rigorously evaluate claims against evidence.

{circular_note}

## EVALUATION CRITERIA:
1. **Evidence Relevance**: Does evidence directly support the claim?
2. **Evidence Completeness**: Is evidence sufficient and specific?
3. **Logical Consistency**: Does reasoning follow from evidence?
4. **Contradiction Detection**: Does evidence contradict the claim?

## STRICT REQUIREMENTS:
- Be highly skeptical of vague or unsupported claims
- Penalize weak, generic, or irrelevant evidence
- Detect logical fallacies and inconsistencies
- Require STRONG evidence for high confidence

## CLAIM TO VERIFY:
"{claim_text}"

## AVAILABLE EVIDENCE:
"{evidence_text[:1500]}"

## ANALYSIS REQUIRED:
Evaluate the claim using ALL criteria above. Consider:
- Is evidence directly relevant or tangential?
- Is evidence specific or generic?
- Does evidence contain actual support or just mentions?
- Are there logical gaps or fallacies?
- Is claim too strong for available evidence?

## OUTPUT JSON (strict format):
{{
  "verdict": "supported|partially_supported|weak|unsupported|contradictory",
  "confidence": 0.0-1.0,
  "evidence_score": 0.0-1.0,
  "reasoning_score": 0.0-1.0,
  "issues": ["missing_evidence", "weak_evidence", "irrelevant_evidence", "contradiction", "vague_claim", "overconfident_claim"],
  "reasoning": "Detailed explanation of your analysis"
}}

Remember: Be SKEPTICAL and demand HIGH QUALITY evidence.
"""
    
    def _apply_validation_rules(self, claim, data, circular_penalty):
        """Apply strict validation rules and calibrate scores"""
        verdict = data.get("verdict", "unsupported")
        confidence = float(data.get("confidence", 0.0))
        evidence_score = float(data.get("evidence_score", 0.0))
        reasoning_score = float(data.get("reasoning_score", 0.0))
        issues = data.get("issues", [])
        reasoning = data.get("reasoning", "")
        
        # Validate verdict
        valid_verdicts = ["supported", "partially_supported", "weak", "unsupported", "contradictory"]
        if verdict not in valid_verdicts:
            verdict = "unsupported"
            issues.append("invalid_verdict")
        
        # Apply hard rules
        if "missing_evidence" in issues or "weak_evidence" in issues:
            verdict = "unsupported" if verdict not in ["contradictory"] else verdict
            evidence_score = min(evidence_score, 0.3)
        
        if "irrelevant_evidence" in issues:
            evidence_score = min(evidence_score, 0.2)
            reasoning_score = min(reasoning_score, 0.4)
        
        if "vague_claim" in issues or "overconfident_claim" in issues:
            confidence = min(confidence, 0.5)
        
        if "contradiction" in issues:
            verdict = "contradictory"
            confidence = min(confidence, 0.3)
        
        # Apply circular validation penalty
        if circular_penalty > 0:
            evidence_score = max(0.1, evidence_score - circular_penalty)
            reasoning_score = max(0.1, reasoning_score - circular_penalty)
            if "circular_validation" not in issues:
                issues.append("circular_validation")
        
        # Score calibration - prevent all high scores
        if verdict == "supported":
            evidence_score = min(evidence_score, 0.9)
            reasoning_score = min(reasoning_score, 0.9)
            confidence = min(confidence, 0.85)
        elif verdict == "partially_supported":
            evidence_score = min(evidence_score, 0.7)
            reasoning_score = min(reasoning_score, 0.7)
            confidence = min(confidence, 0.6)
        elif verdict == "weak":
            evidence_score = min(evidence_score, 0.5)
            reasoning_score = min(reasoning_score, 0.5)
            confidence = min(confidence, 0.4)
        else:  # unsupported or contradictory
            evidence_score = min(evidence_score, 0.3)
            reasoning_score = min(reasoning_score, 0.3)
            confidence = min(confidence, 0.2)
        
        # Final clamping
        evidence_score = max(0.0, min(1.0, evidence_score))
        reasoning_score = max(0.0, min(1.0, reasoning_score))
        confidence = max(0.0, min(1.0, confidence))
        
        # Map to existing schema
        verification_status = verdict
        if verdict in ["supported", "partially_supported"]:
            verification_status = "verified"
        
        return VerificationResult(
            claim_id=claim.claim_id,
            verification_status=verification_status,
            evidence_quality_score=evidence_score,
            reasoning_validity_score=reasoning_score,
            contradiction_flags=issues,
            verifier_notes=reasoning[:200] if reasoning else None  # Limit notes length
        )