from core.state_manager import StateManager
from core.execution_loop import ExecutionLoop

from agents.planner_agent import PlannerAgent
from agents.executor_agent import ExecutorAgent
from agents.verifier_agent import VerifierAgent



class Orchestrator:
    def __init__(self, llm=None):
        self.state = StateManager()

        # Agents
        self.planner = PlannerAgent(llm)
        self.executor = ExecutorAgent(llm)
        self.verifier = VerifierAgent(llm)

        # Inject agents into loop
        self.loop = ExecutionLoop(
            self.state,
            executor=self.executor.execute,
            verifier=self.verifier.verify
        )

    def run(self, user_query: str):
        # -------------------------
        # STEP 1: Plan
        # -------------------------
        goal = self.planner.plan(user_query)
        self.state.set_goal(goal)

        # -------------------------
        # STEP 2: Execute Loop
        # -------------------------
        self.loop.run()

        return self.state.get_state_snapshot()