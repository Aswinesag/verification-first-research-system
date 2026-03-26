from core.state_manager import StateManager
from core.execution_loop import ExecutionLoop
from schemas.goal_schema import Goal, SubTask


class Orchestrator:
    def __init__(self):
        self.state = StateManager()
        self.loop = ExecutionLoop(self.state)

    def run(self, user_query: str):
        # -------------------------
        # STEP 1: Parse Goal (Stub)
        # -------------------------
        goal = self._parse_goal(user_query)
        self.state.set_goal(goal)

        # -------------------------
        # STEP 2: Execute Loop
        # -------------------------
        self.loop.run()

        # -------------------------
        # STEP 3: Return State
        # -------------------------
        return self.state.get_state_snapshot()

    # -------------------------
    # MOCK GOAL PARSER
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