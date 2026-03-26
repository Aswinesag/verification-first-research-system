from enum import Enum
from config.settings import settings


class StepType(str, Enum):
    EXECUTE = "execute"
    VERIFY = "verify"


class ExecutionLoop:
    def __init__(self, state, executor, verifier, debate_agent=None):
        self.state = state
        self.executor = executor
        self.verifier = verifier
        self.debate_agent = debate_agent

    def run(self):
        steps = 0

        while steps < settings.MAX_EXECUTION_STEPS:
            task = self.state.get_next_task()
            if not task:
                break

            # -------------------------
            # EXECUTION (Debate-enabled)
            # -------------------------
            if self.debate_agent:
                claims = self.debate_agent.run(task)
            else:
                claims = self.executor(task)

            all_verified = True

            for claim in claims:
                self.state.add_claim(claim)

                verification = self.verifier(claim)
                self.state.add_verification(verification)

                if verification.verification_status != "verified":
                    all_verified = False

                self.state.log_step({
                    "step": StepType.VERIFY,
                    "claim_id": claim.claim_id,
                    "status": verification.verification_status
                })

            if all_verified:
                self.state.mark_task_complete(task.task_id)
            else:
                self.state.mark_task_failed(task.task_id)

            steps += 1