from retrieval.retriever import Retriever
from schemas.claim_schema import Claim, Evidence
from utils.logging_utils_production import setup_logger, log_info, log_error
from llm.response_parser import ResponseParser

class ExecutorAgent:
    def __init__(self, llm):
        self.llm = llm
        self.retriever = Retriever()
        self.logger = setup_logger("executor_agent")

    def execute(self, task):
        docs = self.retriever.retrieve(task.description, top_k=5)

        context = "\n".join([d["text"] for d in docs])

        prompt = f"""
Use ONLY the context below to generate claims.

Context:
{context}

Task:
{task.description}

Return JSON:
{{ "claims": [{{"text": "...", "confidence": 0.0}}] }}
"""

        from llm.response_parser import ResponseParser
        try:
            data = ResponseParser.safe_parse(self.llm, prompt)
            log_info(self.logger, "Successfully parsed response")
        except Exception as e:
            log_error(self.logger, e, f"Error parsing response: {str(e)}")
            return []

        claims = []
        for item in data["claims"]:
            claims.append(
                Claim(
                    claim_text=item["text"],
                    evidence_sources=[
                        Evidence(
                            source="retrieved_doc",
                            snippet=context[:200],
                            score=item.get("confidence", 0.5)
                        )
                    ],
                    source_type="retrieval",
                    created_by_agent="executor_agent",
                    confidence=item.get("confidence", 0.5)
                )
            )

        return claims
