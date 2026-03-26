from typing import Dict, List, Optional
from schemas.goal_schema import Goal, SubTask
from schemas.claim_schema import Claim
from schemas.verification_schema import VerificationResult


class StateManager:
    def __init__(self):
        self.goal: Optional[Goal] = None
        self.current_task: Optional[SubTask] = None

        self.claims: Dict[str, Claim] = {}
        self.verifications: Dict[str, VerificationResult] = {}

        self.execution_log: List[Dict] = []

    # -------------------------
    # Goal Handling
    # -------------------------
    def set_goal(self, goal: Goal):
        self.goal = goal

    def get_next_task(self) -> Optional[SubTask]:
        for task in self.goal.subtasks:
            if task.status == "pending":
                self.current_task = task
                return task
        return None

    def mark_task_complete(self, task_id: str):
        for task in self.goal.subtasks:
            if task.task_id == task_id:
                task.status = "completed"

    # -------------------------
    # Claims & Verification
    # -------------------------
    def add_claim(self, claim: Claim):
        self.claims[claim.claim_id] = claim

    def add_verification(self, result: VerificationResult):
        self.verifications[result.claim_id] = result

    # -------------------------
    # Logging
    # -------------------------
    def log_step(self, data: Dict):
        self.execution_log.append(data)

    # -------------------------
    # Debug / Inspection
    # -------------------------
    def get_state_snapshot(self) -> Dict:
        return {
            "goal": self.goal,
            "current_task": self.current_task,
            "claims": list(self.claims.keys()),
            "verifications": list(self.verifications.keys()),
            "steps": len(self.execution_log),
        }