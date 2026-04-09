# apps/workers/src/features/feature_pipeline.py
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from datetime import datetime, timedelta
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeaturePipeline:
    def __init__(self):
        self.engine = create_engine(os.getenv('DATABASE_URL'))
        
    def fetch_commits(self, user_id: str, days_back: int = 90):
        """Fetch raw commits for feature engineering"""
        query = f"""
        SELECT 
            c.committed_at::DATE as date,
            COUNT(*) as commits,
            SUM(c.additions) as total_additions,
            SUM(c.deletions) as total_deletions,
            COUNT(DISTINCT c.repository_id) as repos_touched
        FROM analytics.commits c
        WHERE c.user_id = '{user_id}'
            AND c.committed_at >= CURRENT_DATE - INTERVAL '{days_back} days'
        GROUP BY c.committed_at::DATE
        ORDER BY date
        """
        return pd.read_sql(query, self.engine)
    
    def compute_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute all features from raw commits"""
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        
        # Temporal features
        df['day_of_week'] = df['date'].dt.dayofweek
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_monday'] = (df['day_of_week'] == 0).astype(int)
        df['is_friday'] = (df['day_of_week'] == 4).astype(int)
        df['days_since_last'] = df['date'].diff().dt.days.fillna(0)
        
        # Rolling averages (using shift to avoid lookahead bias)
        for window in [3, 7, 14, 30]:
            df[f'commits_avg_{window}d'] = (
                df['commits'].rolling(window, min_periods=1).mean().shift(1)
            )
        
        # Trend: 7-day vs 30-day average
        df['trend_7d_vs_30d'] = df['commits_avg_7d'] / df['commits_avg_30d'].replace(0, 1)
        
        # Target: commits tomorrow
        df['commits_tomorrow'] = df['commits'].shift(-1)
        
        # Drop rows without target
        df = df.dropna(subset=['commits_tomorrow'])
        
        return df
    
    def save_to_offline_store(self, df: pd.DataFrame, user_id: str):
        """Save features to PostgreSQL (offline store)"""
        df['user_id'] = user_id
        df['feature_version'] = 'v1'
        df['created_at'] = datetime.now()
        
        # Select columns for database
        cols = ['user_id', 'date', 'commits', 'total_additions', 'total_deletions',
                'repos_touched', 'commits_avg_3d', 'commits_avg_7d', 'commits_avg_14d',
                'commits_avg_30d', 'day_of_week', 'is_weekend', 'is_monday', 'is_friday',
                'days_since_last', 'trend_7d_vs_30d', 'commits_tomorrow', 'feature_version', 'created_at']
        
        df_to_save = df[cols]
        
        # Use upsert to avoid duplicates
        from sqlalchemy import text
        for _, row in df_to_save.iterrows():
            upsert_query = text("""
                INSERT INTO analytics.daily_features 
                (user_id, date, commits, total_additions, total_deletions, repos_touched,
                 commits_avg_3d, commits_avg_7d, commits_avg_14d, commits_avg_30d,
                 day_of_week, is_weekend, is_monday, is_friday, days_since_last,
                 trend_7d_vs_30d, commits_tomorrow, feature_version, created_at)
                VALUES (:user_id, :date, :commits, :total_additions, :total_deletions,
                        :repos_touched, :commits_avg_3d, :commits_avg_7d, :commits_avg_14d,
                        :commits_avg_30d, :day_of_week, :is_weekend, :is_monday, :is_friday,
                        :days_since_last, :trend_7d_vs_30d, :commits_tomorrow, :feature_version, :created_at)
                ON CONFLICT (user_id, date) DO UPDATE SET
                    commits = EXCLUDED.commits,
                    commits_avg_7d = EXCLUDED.commits_avg_7d,
                    updated_at = NOW()
            """)
            self.engine.execute(upsert_query, row.to_dict())
        
        logger.info(f"✅ Saved {len(df_to_save)} feature rows for user {user_id}")
    
    def run(self, user_id: str):
        """Run full feature pipeline"""
        logger.info(f"🔄 Starting feature pipeline for user {user_id}")
        
        # 1. Fetch raw commits
        df_raw = self.fetch_commits(user_id)
        logger.info(f"📊 Fetched {len(df_raw)} days of commits")
        
        # 2. Compute features
        df_features = self.compute_features(df_raw)
        logger.info(f"🔧 Computed {len(df_features)} feature rows")
        
        # 3. Save to offline store
        self.save_to_offline_store(df_features, user_id)
        
        logger.info(f"✅ Feature pipeline completed for user {user_id}")
        return df_features

if __name__ == "__main__":
    # Run for a specific user
    pipeline = FeaturePipeline()
    pipeline.run("your-user-id-here")  # Replace with actual user_id