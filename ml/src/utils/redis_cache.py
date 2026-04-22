# ml/src/utils/redis_cache.py

import redis
import json
import os
from datetime import timedelta

class FeatureCache:
    def __init__(self):
        self.redis = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
        self.ttl = int(os.getenv('FEATURE_STORE_TTL', 86400))  # 24h
    
    def get_features(self, repository_id: str, file_path: str) -> dict:
        key = f"features:{repository_id}:{file_path}"
        data = self.redis.get(key)
        return json.loads(data) if data else None
    
    def set_features(self, repository_id: str, file_path: str, features: dict):
        key = f"features:{repository_id}:{file_path}"
        self.redis.setex(key, self.ttl, json.dumps(features))
    
    def invalidate(self, repository_id: str, file_path: str = None):
        if file_path:
            self.redis.delete(f"features:{repository_id}:{file_path}")
        else:
            pattern = f"features:{repository_id}:*"
            for key in self.redis.scan_iter(match=pattern):
                self.redis.delete(key)