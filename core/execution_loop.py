from enum import Enum
from core.state_manager import StateManager
from schemas.claim_schema import Claim
from schemas.verification_schema import VerificationResult


class StepType(str, Enum):
    EXECUTE = "execute"
    VERIFY = "verify"
    GRAPH_UPDATE = "graph_update"


class ExecutionContext:
    def __init__(self, task):
        self.task = task
        self.claim = None
        self.verification = None


class ExecutionLoop:
    MAX_STEPS = 50

    def __init__(self, state: StateManager, executor=None, verifier=None):
        self.state = state
        self.executor = executor or self._default_executor
        self.verifier = verifier or self._default_verifier

    def run(self):
        steps = 0

        while steps < self.MAX_STEPS:
            task = self.state.get_next_task()

            if not task:
                break

            context = ExecutionContext(task)

            # -------------------------
            # STEP 1: Execute
            # -------------------------
            claims = self.executor(task)

            for claim in claims:
                self.state.add_claim(claim)

                verification = self.verifier(claim)
                self.state.add_verification(verification)

                if verification.verification_status == "verified":
                    status = "verified"
                else:
                    status = "failed"

                self.state.log_step({
                    "step_type": StepType.VERIFY,
                    "task_id": task.task_id,
                    "claim_id": claim.claim_id,
                    "status": verification.verification_status
                })

            # -------------------------
            # STEP 2: Verify
            # -------------------------
            context.verification = self.verifier(context.claim)

            self.state.add_verification(context.verification)

            self.state.log_step({
                "step_type": StepType.VERIFY,
                "task_id": task.task_id,
                "claim_id": context.claim.claim_id,
                "status": context.verification.verification_status
            })

            # -------------------------
            # STEP 3: Verification Gate
            # -------------------------
            if all(
                self.state.verifications[c.claim_id].verification_status == "verified"
                for c in claims
            ):
                self.state.mark_task_complete(task.task_id)
                break
            else:
                self.state.mark_task_failed(task.task_id)
                break

            steps += 1 

    # -------------------------
    # Default Executor (Stub)
    # -------------------------
    def _default_executor(self, task):
        return Claim(
            claim_text=f"Executed: {task.description}",
            source_type="reasoning",
            created_by_agent="executor_agent"
        )

    # -------------------------
    # Default Verifier (Stub)
    # -------------------------
    def _default_verifier(self, claim):
        return VerificationResult(
            claim_id=claim.claim_id,
            verification_status="verified",
            evidence_quality_score=0.8,
            reasoning_validity_score=0.9,
            contradiction_flags=[]
        )

    # -------------------------
    # Graph Placeholder
    # -------------------------
    def _update_graph(self, context: ExecutionContext):
        self.state.log_step({
            "step_type": StepType.GRAPH_UPDATE,
            "task_id": context.task.task_id,
            "claim_id": context.claim.claim_id,
            "status": "graph_updated"
        })