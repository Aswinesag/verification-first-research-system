from schemas.verification_schema import VerificationResult
from llm.response_parser import ResponseParser


class VerifierAgent:
    def __init__(self, llm):
        self.llm = llm

    def verify(self, claim):
        evidence_text = " ".join([e.snippet for e in claim.evidence_sources])

        prompt = f"""
Check if claim is supported by evidence.

Claim: {claim.claim_text}

Evidence:
{evidence_text}

Return JSON:
{{
 "evidence_score": 0-1,
 "reasoning_score": 0-1,
 "verdict": "verified | weak | unsupported"
}}
"""

        from llm.response_parser import ResponseParser
        data = ResponseParser.safe_parse(self.llm, prompt)

        from schemas.verification_schema import VerificationResult
        return VerificationResult(
            claim_id=claim.claim_id,
            verification_status=data["verdict"],
            evidence_quality_score=data["evidence_score"],
            reasoning_validity_score=data["reasoning_score"],
            contradiction_flags=[]
        )