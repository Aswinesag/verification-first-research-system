from core.state_manager import StateManager
from schemas.claim_schema import Claim
from schemas.verification_schema import VerificationResult


class ExecutionLoop:
    def __init__(self, state_manager: StateManager):
        self.state = state_manager

    def run(self):
        while True:
            task = self.state.get_next_task()

            if not task:
                break

            # -------------------------
            # STEP 1: Execute (Stub)
            # -------------------------
            claim = self._execute_task(task)

            # -------------------------
            # STEP 2: Verify (Stub)
            # -------------------------
            verification = self._verify_claim(claim)

            # -------------------------
            # STEP 3: Store Results
            # -------------------------
            self.state.add_claim(claim)
            self.state.add_verification(verification)

            # -------------------------
            # STEP 4: Log
            # -------------------------
            self.state.log_step({
                "task": task.description,
                "claim": claim.claim_text,
                "verification": verification.verification_status
            })

            # -------------------------
            # STEP 5: Mark Done
            # -------------------------
            self.state.mark_task_complete(task.task_id)

    # -------------------------
    # MOCK EXECUTOR
    # -------------------------
    def _execute_task(self, task):
        return Claim(
            claim_text=f"Executed: {task.description}",
            source_type="reasoning",
            created_by_agent="executor_agent"
        )

    # -------------------------
    # MOCK VERIFIER
    # -------------------------
    def _verify_claim(self, claim):
        return VerificationResult(
            claim_id=claim.claim_id,
            verification_status="verified",
            evidence_quality_score=0.8,
            reasoning_validity_score=0.9,
            contradiction_flags=[]
        )