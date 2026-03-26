from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4
from datetime import datetime


class Evidence(BaseModel):
    source: str
    snippet: str
    score: Optional[float] = None


class Claim(BaseModel):
    claim_id: str = Field(default_factory=lambda: str(uuid4()))
    claim_text: str
    evidence_sources: List[Evidence] = []
    source_type: str
    created_by_agent: str
    confidence: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)