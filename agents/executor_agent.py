from typing import List
from schemas.claim_schema import Claim, Evidence
from llm.prompt_builder import build_executor_prompt
from llm.response_parser import ResponseParser


class ExecutorAgent:
    def __init__(self, llm):
        self.llm = llm

    def execute(self, task) -> List[Claim]:
        prompt = build_executor_prompt(task.description)

        try:
            data = ResponseParser.safe_parse(self.llm, prompt)

            claims = []
            for item in data.get("claims", []):
                claims.append(
                    Claim(
                        claim_text=item["text"],
                        evidence_sources=[
                            Evidence(
                                source="llm",
                                snippet=item["text"],
                                score=item.get("confidence", 0.5)
                            )
                        ],
                        source_type="llm",
                        created_by_agent="executor_agent",
                        confidence=item.get("confidence", 0.5)
                    )
                )
            return claims

        except Exception:
            return []