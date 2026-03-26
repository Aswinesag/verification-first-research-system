from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

class SubTask(BaseModel):
    task_id: str = Field(default_factory=lambda: str(uuid4()))
    description: str
    status: str = "pending"

class Goal(BaseModel):
    goal_id: str = Field(default_factory=lambda: str(uuid4()))
    user_query: str
    parsed_objective: str
    constraints: Optional[List[str]] = []
    success_criteria: Optional[List[str]] = []
    subtasks: List[SubTask] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)