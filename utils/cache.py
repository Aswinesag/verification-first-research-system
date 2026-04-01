"""
Production-Ready Caching Layer for VARA System
"""

import hashlib
import json
import time
from typing import Any, Optional, Dict, Callable
from functools import wraps
from dataclasses import dataclass
import threading


@dataclass
class CacheEntry:
    """Cache entry with TTL"""
    value: Any
    created_at: float
    ttl: float
    
    def is_expired(self) -> bool:
        """Check if cache entry is expired"""
        return time.time() > (self.created_at + self.ttl)


class Cache:
    """Thread-safe in-memory cache with TTL support"""
    
    def __init__(self, default_ttl: float = 3600, max_size: int = 10000):
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl
        self.max_size = max_size
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = {
            'prefix': prefix,
            'args': args,
            'kwargs': sorted(kwargs.items())
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.sha256(key_str.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            if entry.is_expired():
                del self._cache[key]
                return None
            return entry.value
    
    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        """Set value in cache"""
        with self._lock:
            # Implement LRU eviction if at capacity
            if len(self._cache) >= self.max_size and key not in self._cache:
                # Remove oldest entry
                oldest_key = min(self._cache.keys(), 
                              key=lambda k: self._cache[k].created_at)
                del self._cache[oldest_key]
            
            self._cache[key] = CacheEntry(
                value=value,
                created_at=time.time(),
                ttl=ttl or self.default_ttl
            )
    
    def delete(self, key: str) -> None:
        """Delete key from cache"""
        with self._lock:
            self._cache.pop(key, None)
    
    def clear(self) -> None:
        """Clear all cache entries"""
        with self._lock:
            self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove expired entries, return count removed"""
        with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items()
                if entry.is_expired()
            ]
            for key in expired_keys:
                del self._cache[key]
            return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._lock:
            total_entries = len(self._cache)
            expired_entries = sum(
                1 for entry in self._cache.values()
                if entry.is_expired()
            )
            return {
                'total_entries': total_entries,
                'expired_entries': expired_entries,
                'valid_entries': total_entries - expired_entries,
                'max_size': self.max_size,
                'utilization': total_entries / self.max_size
            }


# Global cache instances
llm_cache = Cache(default_ttl=3600, max_size=1000)  # 1 hour TTL
retrieval_cache = Cache(default_ttl=1800, max_size=5000)  # 30 min TTL


def cached(cache_instance: Cache, prefix: str, ttl: Optional[float] = None):
    """Decorator for caching function results"""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            key = cache_instance._generate_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_result = cache_instance.get(key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_instance.set(key, result, ttl)
            return result
        
        return wrapper
    return decorator


def enable_caching(func: Callable, cache_type: str = 'llm'):
    """Helper to enable caching based on environment"""
    from config.settings import settings
    
    if cache_type == 'llm' and settings.ENABLE_CACHE:
        return cached(llm_cache, 'llm')(func)
    elif cache_type == 'retrieval' and settings.ENABLE_CACHE:
        return cached(retrieval_cache, 'retrieval')(func)
    else:
        return func
