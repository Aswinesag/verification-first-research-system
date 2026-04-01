"""
Request Context for Production VARA System

Tracks request lifecycle across all components for observability and debugging.
"""

import uuid
import time
from datetime import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class RequestContext:
    """
    Centralized request context for tracking across all agents and components.
    """
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    start_time: float = field(default_factory=time.time)
    config_snapshot: Dict[str, Any] = field(default_factory=dict)
    steps: list = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize with timestamp"""
        self.metadata['created_at'] = datetime.utcnow().isoformat()
    
    def add_step(self, component: str, action: str, status: str = "started", 
                 latency_ms: Optional[float] = None, details: Optional[Dict[str, Any]] = None):
        """Add a step to the request trace"""
        step = {
            'timestamp': datetime.utcnow().isoformat(),
            'component': component,
            'action': action,
            'status': status,
            'latency_ms': latency_ms,
            'details': details or {}
        }
        self.steps.append(step)
    
    def complete_step(self, component: str, action: str, latency_ms: Optional[float] = None, 
                   details: Optional[Dict[str, Any]] = None):
        """Mark a step as completed"""
        self.add_step(component, action, "completed", latency_ms, details)
    
    def fail_step(self, component: str, action: str, error: str, 
                latency_ms: Optional[float] = None, details: Optional[Dict[str, Any]] = None):
        """Mark a step as failed"""
        step_details = {'error': error}
        if details:
            step_details.update(details)
        self.add_step(component, action, "failed", latency_ms, step_details)
    
    def get_elapsed_ms(self) -> float:
        """Get elapsed time in milliseconds"""
        return (time.time() - self.start_time) * 1000
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging"""
        return {
            'request_id': self.request_id,
            'start_time': self.start_time,
            'elapsed_ms': self.get_elapsed_ms(),
            'config_snapshot': self.config_snapshot,
            'steps': self.steps,
            'metadata': self.metadata
        }
    
    def get_component_steps(self, component: str) -> list:
        """Get all steps for a specific component"""
        return [step for step in self.steps if step['component'] == component]
    
    def get_failed_steps(self) -> list:
        """Get all failed steps"""
        return [step for step in self.steps if step['status'] == 'failed']
    
    def get_total_latency(self) -> float:
        """Get total latency from completed steps"""
        completed_steps = [step for step in self.steps if step['status'] == 'completed' and step['latency_ms']]
        return sum(step['latency_ms'] for step in completed_steps)
