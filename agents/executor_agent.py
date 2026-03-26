from typing import List
from schemas.claim_schema import Claim, Evidence


class ExecutorAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def execute(self, task) -> List[Claim]:
        """
        Returns multiple atomic claims for a task
        """

        base = task.description

        claims = [
            self._build_claim(f"{base} involves fundamental principles."),
            self._build_claim(f"{base} includes multiple interacting components."),
            self._build_claim(f"{base} has real-world applications.")
        ]

        return claims

    def _build_claim(self, text: str) -> Claim:
        evidence = [
            Evidence(
                source="reasoning_trace",
                snippet=f"Inferred from structured reasoning: {text}",
                score=0.6
            )
        ]

        return Claim(
            claim_text=text,
            evidence_sources=evidence,
            source_type="reasoning",
            created_by_agent="executor_agent",
            confidence=0.6
        )