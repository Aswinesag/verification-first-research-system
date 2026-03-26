from schemas.goal_schema import Goal, SubTask
from llm.prompt_builder import build_planner_prompt
from llm.response_parser import ResponseParser


class PlannerAgent:
    def __init__(self, llm):
        self.llm = llm

    def plan(self, user_query: str) -> Goal:
        prompt = build_planner_prompt(user_query)

        try:
            data = ResponseParser.safe_parse(self.llm, prompt)

            subtasks = [SubTask(description=s) for s in data["subtasks"]]

            return Goal(
                user_query=user_query,
                parsed_objective=data["objective"],
                subtasks=subtasks
            )

        except Exception:
            return Goal(
                user_query=user_query,
                parsed_objective=user_query,
                subtasks=[SubTask(description="Fallback task")]
            )