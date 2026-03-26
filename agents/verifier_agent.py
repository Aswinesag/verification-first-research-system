from schemas.verification_schema import VerificationResult
from llm.prompt_builder import build_verifier_prompt
from llm.response_parser import ResponseParser


class VerifierAgent:
    def __init__(self, llm):
        self.llm = llm

    def verify(self, claim) -> VerificationResult:
        prompt = build_verifier_prompt(claim.claim_text)

        try:
            data = ResponseParser.safe_parse(self.llm, prompt)

            return VerificationResult(
                claim_id=claim.claim_id,
                verification_status=data["verdict"],
                evidence_quality_score=data["evidence_score"],
                reasoning_validity_score=data["reasoning_score"],
                contradiction_flags=[]
            )

        except Exception:
            return VerificationResult(
                claim_id=claim.claim_id,
                verification_status="weak",
                evidence_quality_score=0.5,
                reasoning_validity_score=0.5,
                contradiction_flags=[]
            )