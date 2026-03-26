from pydantic import BaseModel
from typing import List, Optional


class VerificationResult(BaseModel):
    claim_id: str
    verification_status: str
    evidence_quality_score: float
    reasoning_validity_score: float
    contradiction_flags: Optional[List[str]] = []
    verifier_notes: Optional[str] = None