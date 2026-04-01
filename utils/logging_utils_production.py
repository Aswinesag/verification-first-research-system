"""
Production Structured Logging Utilities
"""

import logging
import json
import time
from typing import Dict, Any, Optional


class StructuredFormatter(logging.Formatter):
    """Structured JSON formatter for production logging"""
    
    def format(self, record):
        log_entry = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(record.created)),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage()
        }
        
        # Add structured data if present
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        
        if hasattr(record, 'component'):
            log_entry['component'] = record.component
            
        if hasattr(record, 'action'):
            log_entry['action'] = record.action
            
        if hasattr(record, 'latency_ms'):
            log_entry['latency_ms'] = record.latency_ms
            
        if hasattr(record, 'status'):
            log_entry['status'] = record.status
            
        if hasattr(record, 'extra_data'):
            log_entry['extra_data'] = record.extra_data
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry)


def setup_logger(name: str, level: str = 'INFO') -> logging.Logger:
    """Setup structured logger with JSON formatting"""
    logger = logging.getLogger(name)
    
    if logger.handlers:
        return logger
    
    logger.setLevel(getattr(logging, level.upper()))
    
    # Create console handler with structured formatter
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    logger.addHandler(handler)
    
    return logger


def log_structured(logger: logging.Logger, level: str, message: str, 
                   request_id: Optional[str] = None, component: Optional[str] = None,
                   action: Optional[str] = None, latency_ms: Optional[float] = None,
                   status: Optional[str] = None, **kwargs):
    """Log structured message with additional fields"""
    extra = {
        'request_id': request_id,
        'component': component,
        'action': action,
        'latency_ms': latency_ms,
        'status': status,
        'extra_data': kwargs
    }
    
    # Filter out None values
    extra = {k: v for k, v in extra.items() if v is not None}
    
    getattr(logger, level.lower())(message, extra=extra)


def log_info(logger: logging.Logger, message: str, **kwargs):
    """Log info message with structured data"""
    log_structured(logger, 'INFO', message, **kwargs)


def log_error(logger: logging.Logger, error: Exception, message: str, **kwargs):
    """Log error message with exception details"""
    kwargs['error_type'] = type(error).__name__
    kwargs['error_message'] = str(error)
    log_structured(logger, 'ERROR', message, **kwargs)


def log_warning(logger: logging.Logger, message: str, **kwargs):
    """Log warning message with structured data"""
    log_structured(logger, 'WARNING', message, **kwargs)


def log_debug(logger: logging.Logger, message: str, **kwargs):
    """Log debug message with structured data"""
    log_structured(logger, 'DEBUG', message, **kwargs)
