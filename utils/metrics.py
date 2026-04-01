"""
Production Metrics Collection for VARA System
"""

import time
from collections import defaultdict, deque
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
import threading


@dataclass
class MetricsCollector:
    """Thread-safe metrics collector"""
    
    def __init__(self):
        self._lock = threading.Lock()
        
        # Counters
        self.request_count = 0
        self.llm_calls = 0
        self.retrieval_calls = 0
        self.failure_count = 0
        
        # Latency tracking (last 1000 samples)
        self.latencies = defaultdict(lambda: deque(maxlen=1000))
        
        # Component-specific metrics
        self.component_metrics = defaultdict(lambda: {
            'calls': 0,
            'failures': 0,
            'total_latency': 0.0
        })
    
    def increment_counter(self, metric_name: str):
        """Increment a counter"""
        with self._lock:
            if metric_name == 'requests':
                self.request_count += 1
            elif metric_name == 'llm_calls':
                self.llm_calls += 1
            elif metric_name == 'retrieval_calls':
                self.retrieval_calls += 1
            elif metric_name == 'failures':
                self.failure_count += 1
    
    def record_latency(self, component: str, latency_ms: float):
        """Record latency for a component"""
        with self._lock:
            self.latencies[component].append(latency_ms)
            self.component_metrics[component]['total_latency'] += latency_ms
    
    def record_component_call(self, component: str, success: bool = True):
        """Record a component call"""
        with self._lock:
            self.component_metrics[component]['calls'] += 1
            if not success:
                self.component_metrics[component]['failures'] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get all metrics as dictionary"""
        with self._lock:
            metrics = {
                'request_count': self.request_count,
                'llm_calls': self.llm_calls,
                'retrieval_calls': self.retrieval_calls,
                'failure_count': self.failure_count,
                'failure_rate': self.failure_count / max(self.request_count, 1),
                'component_metrics': {}
            }
            
            # Add component-specific metrics
            for component, data in self.component_metrics.items():
                latencies = list(self.latencies[component])
                metrics['component_metrics'][component] = {
                    'calls': data['calls'],
                    'failures': data['failures'],
                    'failure_rate': data['failures'] / max(data['calls'], 1),
                    'avg_latency_ms': sum(latencies) / max(len(latencies), 1),
                    'p95_latency_ms': sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0,
                    'p99_latency_ms': sorted(latencies)[int(len(latencies) * 0.99)] if latencies else 0
                }
            
            return metrics


# Global metrics instance
metrics_collector = MetricsCollector()
