from pydantic import BaseModel
from typing import List, Dict, Any


class KnowledgeGraphSummary(BaseModel):
    total_nodes: int
    total_edges: int
    contradictions_detected: int


class FinalReport(BaseModel):
    goal: str
    verified_claims: List[str]
    rejected_claims: List[str]
    knowledge_graph_summary: KnowledgeGraphSummary
    final_hypothesis: str
    uncertainty_sources: List[str]
    final_confidence: float