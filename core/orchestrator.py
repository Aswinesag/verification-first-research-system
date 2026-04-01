from core.state_manager import StateManager
from core.execution_loop import ExecutionLoop

from agents.planner_agent import PlannerAgent
from agents.executor_agent import ExecutorAgent
from agents.verifier_agent import VerifierAgent
from agents.debate_agent import DebateAgent
from uncertainty.uncertainty_estimator import UncertaintyEstimator


class Orchestrator:
    def __init__(self, llm, settings):
        self.state = StateManager()
        self.uncertainty_estimator = UncertaintyEstimator()

        self.planner = PlannerAgent(llm)
        self.executor = ExecutorAgent(llm)
        self.verifier = VerifierAgent(llm)

        debate_agent = None
        if settings.ENABLE_SELF_DEBATE:
            debate_agent = DebateAgent(
                executor=self.executor.execute,
                verifier=self.verifier.verify,
                rounds=settings.DEBATE_ROUNDS
            )

        self.loop = ExecutionLoop(
            self.state,
            executor=self.executor.execute,
            verifier=self.verifier.verify,
            debate_agent=debate_agent,
            llm=llm,
            uncertainty_estimator=self.uncertainty_estimator
        )

    def run(self, query: str):
        goal = self.planner.plan(query)
        self.state.set_goal(goal)

        self.loop.run()

        return self.state.get_state_snapshot()