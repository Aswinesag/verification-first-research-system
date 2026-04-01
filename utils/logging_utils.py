import logging
import sys
from datetime import datetime
from typing import Optional

def setup_logger(name: str = "vara", level: str = "INFO") -> logging.Logger:
    """Setup structured logger for VARA system"""
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

def log_error(logger: logging.Logger, error: Exception, context: Optional[str] = None):
    """Log error with context"""
    msg = f"Error: {str(error)}"
    if context:
        msg = f"{context} - {msg}"
    logger.error(msg, exc_info=True)

def log_info(logger: logging.Logger, message: str, context: Optional[dict] = None):
    """Log info with optional context"""
    if context:
        message = f"{message} | Context: {context}"
    logger.info(message)

def log_warning(logger: logging.Logger, message: str):
    """Log warning"""
    logger.warning(message)
