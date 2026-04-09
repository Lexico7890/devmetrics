# apps/workers/src/features/online_store.py
import redis
import json
import os
from datetime import datetime
from sqlalchemy import create_engine

class OnlineFeatureStore:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
        self.engine = create_engine(os.getenv('DATABASE_URL'))
        self.ttl_seconds = 86400  # 24 hours
    
    def sync_to_online_store(self, user_id: str):
        """Sync latest features from offline to online store"""
        query = f"""
        SELECT 
            date, commits, commits_avg_7d, commits_avg_30d,
            day_of_week, is_weekend, days_since_last, trend_7d_vs_30d
        FROM analytics.daily_features
        WHERE user_id = '{user_id}'
        ORDER BY date DESC
        LIMIT 1
        """
        
        df = pd.read_sql(query, self.engine)
        if df.empty:
            return None
        
        latest = df.iloc[0].to_dict()
        key = f"features:{user_id}:latest"
        
        self.redis_client.setex(
            key,
            self.ttl_seconds,
            json.dumps({
                'user_id': user_id,
                'date': latest['date'].isoformat() if hasattr(latest['date'], 'isoformat') else latest['date'],
                'features': {
                    'commits_avg_7d': latest['commits_avg_7d'],
                    'commits_avg_30d': latest['commits_avg_30d'],
                    'day_of_week': latest['day_of_week'],
                    'is_weekend': latest['is_weekend'],
                    'days_since_last': latest['days_since_last'],
                    'trend_7d_vs_30d': latest['trend_7d_vs_30d']
                }
            })
        )
        
        return latest
    
    def get_latest_features(self, user_id: str):
        """Get latest features from Redis (fast path)"""
        key = f"features:{user_id}:latest"
        data = self.redis_client.get(key)
        
        if data:
            return json.loads(data)
        
        # Fallback to PostgreSQL
        return self.sync_to_online_store(user_id)