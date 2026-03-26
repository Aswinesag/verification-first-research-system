from schemas.verification_schema import VerificationResult


class VerifierAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def verify(self, claim) -> VerificationResult:
        evidence_score = self._score_evidence(claim)
        reasoning_score = self._score_reasoning(claim)
        specificity_score = self._score_specificity(claim)

        final_score = (evidence_score + reasoning_score + specificity_score) / 3

        status = self._determine_status(final_score)

        return VerificationResult(
            claim_id=claim.claim_id,
            verification_status=status,
            evidence_quality_score=evidence_score,
            reasoning_validity_score=reasoning_score,
            contradiction_flags=[],
            verifier_notes=f"Final score: {round(final_score,2)}"
        )

    # -------------------------
    # Scoring Logic
    # -------------------------
    def _score_evidence(self, claim):
        if not claim.evidence_sources:
            return 0.2
        return min(1.0, sum(e.score or 0.5 for e in claim.evidence_sources) / len(claim.evidence_sources))

    def _score_reasoning(self, claim):
        return 0.7  # placeholder (LLM later)

    def _score_specificity(self, claim):
        length = len(claim.claim_text.split())
        return min(1.0, length / 12)

    def _determine_status(self, score):
        if score > 0.75:
            return "verified"
        elif score > 0.5:
            return "weak"
        else:
            return "unsupported"