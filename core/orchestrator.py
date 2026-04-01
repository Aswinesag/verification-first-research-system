from core.state_manager import StateManager
from core.execution_loop import ExecutionLoop
from core.request_context import RequestContext

from agents.planner_agent import PlannerAgent
from agents.executor_agent import ExecutorAgent
from agents.verifier_agent import VerifierAgent
from agents.debate_agent import DebateAgent
from uncertainty.uncertainty_estimator import UncertaintyEstimator
from utils.metrics import metrics_collector
from utils.logging_utils_production import setup_logger, log_info, log_error
from utils.retry_utils_enhanced import safe_execute, TimeoutError
import time
from typing import Optional


class Orchestrator:
    def __init__(self, llm, settings):
        self.state = StateManager()
        self.uncertainty_estimator = UncertaintyEstimator()
        self.settings = settings
        self.logger = setup_logger("orchestrator")
        self.llm = llm

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

    def run(self, query: str, request_context: Optional[RequestContext] = None):
        """Run the VARA system with optional request context"""
        start_time = time.time()
        request_id = request_context.request_id if request_context else 'unknown'
        
        try:
            # Record metrics
            metrics_collector.increment_counter('requests')
            
            # Add planning step
            if request_context:
                request_context.add_step('orchestrator', 'planning')
            
            goal = self.planner.plan(query)
            self.state.set_goal(goal)
            
            log_info(self.logger, "Planning completed", 
                    request_id=request_id, 
                    component='orchestrator',
                    action='planning',
                    subtasks=len(goal.subtasks))
            
            # Add execution step
            if request_context:
                request_context.add_step('orchestrator', 'execution')
            
            self.loop.run()
            
            elapsed_ms = (time.time() - start_time) * 1000
            
            # Record success metrics
            metrics_collector.record_component_call('orchestrator', success=True)
            metrics_collector.record_latency('orchestrator', elapsed_ms)
            
            if request_context:
                request_context.complete_step('orchestrator', 'execution', elapsed_ms)
            
            result = self.state.get_state_snapshot()
            
            log_info(self.logger, "Orchestration completed successfully",
                    request_id=request_id,
                    component='orchestrator',
                    action='run',
                    latency_ms=elapsed_ms,
                    status='success',
                    claims_count=len(result.get('claims', [])),
                    verifications_count=len(result.get('verifications', [])))
            
            return result
            
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            
            # Record failure metrics
            metrics_collector.record_component_call('orchestrator', success=False)
            metrics_collector.increment_counter('failures')
            
            log_error(self.logger, e, "Orchestration failed",
                     request_id=request_id,
                     component='orchestrator',
                     action='run',
                     latency_ms=elapsed_ms,
                     status='failed')
            
            if request_context:
                request_context.fail_step('orchestrator', 'run', str(e), elapsed_ms)
            
            raise