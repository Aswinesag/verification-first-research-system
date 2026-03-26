from core.state_manager import StateManager
from core.execution_loop import ExecutionLoop
from schemas.goal_schema import Goal, SubTask


class Orchestrator:
    def __init__(self, executor=None, verifier=None):
        self.state = StateManager()
        self.loop = ExecutionLoop(self.state, executor, verifier)

    def run(self, user_query: str):
        goal = self._parse_goal(user_query)
        self.state.set_goal(goal)

        self.loop.run()

        return self.state.get_state_snapshot()

    # -------------------------
    # TEMP Goal Parser (Stub)
    # -------------------------
    def _parse_goal(self, query: str) -> Goal:
        return Goal(
            user_query=query,
            parsed_objective=query,
            subtasks=[
                SubTask(description="Analyze the problem"),
                SubTask(description="Gather information"),
                SubTask(description="Produce answer")
            ]
        )