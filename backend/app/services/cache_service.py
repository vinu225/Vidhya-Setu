import time
from typing import Any, Optional, Dict, Tuple
from threading import Lock

class SimpleCache:
    """Thread-safe in-memory TTL cache for high-speed API response serving (< 5ms)"""
    def __init__(self, default_ttl: int = 60):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = Lock()
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key in self._cache:
                value, expires_at = self._cache[key]
                if time.time() < expires_at:
                    return value
                else:
                    del self._cache[key]
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        duration = ttl if ttl is not None else self._default_ttl
        with self._lock:
            self._cache[key] = (value, time.time() + duration)

    def delete(self, key: str) -> None:
        with self._lock:
            self._cache.pop(key, None)

    def clear(self, pattern: Optional[str] = None) -> None:
        with self._lock:
            if not pattern:
                self._cache.clear()
            else:
                keys_to_del = [k for k in self._cache if pattern in k]
                for k in keys_to_del:
                    del self._cache[k]

cache = SimpleCache(default_ttl=60)

