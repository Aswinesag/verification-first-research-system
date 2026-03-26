from typing import Dict, List, Optional
from datetime import datetime
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
                task.status = "in_progress"
                self.current_task = task
                return task
        return None

    def mark_task_complete(self, task_id: str):
        for task in self.goal.subtasks:
            if task.task_id == task_id:
                task.status = "verified"

    def mark_task_failed(self, task_id: str):
        for task in self.goal.subtasks:
            if task.task_id == task_id:
                task.status = "failed"

    # -------------------------
    # Claims & Verification
    # -------------------------
    def add_claim(self, claim: Claim):
        self.claims[claim.claim_id] = claim

    def add_verification(self, result: VerificationResult):
        if result.claim_id not in self.claims:
            raise ValueError("Verification for unknown claim")
        self.verifications[result.claim_id] = result

    # -------------------------
    # Logging
    # -------------------------
    def log_step(self, data: Dict):
        data["timestamp"] = datetime.utcnow().isoformat()
        self.execution_log.append(data)

    # -------------------------
    # Snapshot (Serializable)
    # -------------------------
    def get_state_snapshot(self) -> Dict:
        return {
            "goal": self.goal.model_dump() if self.goal else None,
            "current_task": self.current_task.model_dump() if self.current_task else None,
            "claims": [c.model_dump() for c in self.claims.values()],
            "verifications": [v.model_dump() for v in self.verifications.values()],
            "steps": len(self.execution_log),
        }