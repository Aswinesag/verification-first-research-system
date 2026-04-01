"""
Enhanced Production-Ready Retry and Timeout Utilities
"""

import time
import random
from typing import Callable, Any, Optional, Type, Union
from functools import wraps
from utils.logging_utils_production import setup_logger, log_info, log_error


logger = setup_logger("retry_utils_enhanced")


class RetryError(Exception):
    """Raised when max retries are exceeded"""
    pass


class TimeoutError(Exception):
    """Raised when operation times out"""
    pass


def retry(
    max_attempts: int = 3,
    delay: float = 1.0,
    backoff_factor: float = 2.0,
    max_delay: float = 60.0,
    exceptions: tuple = (Exception,),
    jitter: bool = True
):
    """
    Retry decorator with exponential backoff and jitter.
    
    Args:
        max_attempts: Maximum number of retry attempts
        delay: Initial delay between retries in seconds
        backoff_factor: Multiplier for delay after each retry
        max_delay: Maximum delay between retries
        exceptions: Tuple of exceptions to catch and retry on
        jitter: Add random jitter to prevent thundering herd
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    if attempt == max_attempts - 1:
                        log_error(logger, e, 
                                f"Max retries ({max_attempts}) exceeded for {func.__name__}")
                        raise RetryError(f"Failed after {max_attempts} attempts") from e
                    
                    # Calculate delay with exponential backoff
                    current_delay = min(delay * (backoff_factor ** attempt), max_delay)
                    
                    # Add jitter if enabled
                    if jitter:
                        current_delay *= (0.5 + random.random() * 0.5)
                    
                    log_info(logger, 
                           f"Attempt {attempt + 1}/{max_attempts} failed for {func.__name__}: {str(e)}. "
                           f"Retrying in {current_delay:.2f}s...")
                    
                    time.sleep(current_delay)
            
            # This should never be reached
            raise RetryError("Unexpected error in retry logic")
        
        return wrapper
    return decorator


def timeout(seconds: float):
    """
    Timeout decorator for functions.
    
    Note: This is a simple implementation. For production, consider using
    signal-based timeouts or async approaches.
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            # This is a simplified timeout implementation
            # In production, you might want to use threading.Timer or signal
            result = func(*args, **kwargs)
            
            elapsed = time.time() - start_time
            if elapsed > seconds:
                log_error(logger, TimeoutError(f"Operation timed out after {elapsed:.2f}s (limit: {seconds}s)"),
                           f"Timeout in {func.__name__}")
            
            return result
        
        return wrapper
    return decorator


def safe_execute(
    func: Callable,
    fallback: Optional[Callable] = None,
    default_return: Any = None,
    exceptions: tuple = (Exception,),
    log_errors: bool = True
) -> Any:
    """
    Safely execute a function with fallback handling.
    
    Args:
        func: Function to execute
        fallback: Fallback function to call on failure
        default_return: Default return value if no fallback
        exceptions: Exceptions to catch
        log_errors: Whether to log errors
    """
    try:
        return func()
    except exceptions as e:
        if log_errors:
            log_error(logger, e, f"Safe execution failed for {func.__name__}")
        
        if fallback:
            try:
                return fallback()
            except Exception as fallback_error:
                if log_errors:
                    log_error(logger, fallback_error, f"Fallback also failed for {func.__name__}")
                return default_return
        
        return default_return


class CircuitBreaker:
    """
    Circuit breaker pattern for preventing cascading failures.
    """
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = 0
        self.state = 'closed'  # closed, open, half-open
    
    def __call__(self, func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if self.state == 'open':
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = 'half-open'
                    log_info(logger, f"Circuit breaker half-open for {func.__name__}")
                else:
                    raise RetryError(f"Circuit breaker open for {func.__name__}")
            
            try:
                result = func(*args, **kwargs)
                if self.state == 'half-open':
                    self.state = 'closed'
                    self.failure_count = 0
                    log_info(logger, f"Circuit breaker closed for {func.__name__}")
                return result
            except Exception as e:
                self.failure_count += 1
                self.last_failure_time = time.time()
                
                if self.failure_count >= self.failure_threshold:
                    self.state = 'open'
                    log_error(logger, e, f"Circuit breaker opened for {func.__name__}")
                
                raise
        
        return wrapper
