from typing import List
from schemas.goal_schema import Goal, SubTask


class PlannerAgent:
    def __init__(self, llm=None):
        self.llm = llm

    def plan(self, user_query: str) -> Goal:
        subtasks = self._decompose_query(user_query)

        return Goal(
            user_query=user_query,
            parsed_objective=self._extract_objective(user_query),
            subtasks=subtasks
        )

    # -------------------------
    # Improved Decomposition
    # -------------------------
    def _decompose_query(self, query: str) -> List[SubTask]:
        return [
            SubTask(description=f"Define key concepts in: {query}"),
            SubTask(description=f"Identify components and mechanisms of: {query}"),
            SubTask(description=f"Analyze real-world applications of: {query}"),
            SubTask(description=f"Synthesize a structured explanation of: {query}")
        ]

    def _extract_objective(self, query: str) -> str:
        return f"Provide a comprehensive and structured explanation of: {query}"