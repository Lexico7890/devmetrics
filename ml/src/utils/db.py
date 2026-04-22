# ml/src/utils/db.py

import os
import pandas as pd
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

class DatabaseConnector:
    """Maneja conexiones y queries a PostgreSQL"""
    
    def __init__(self):
        self.conn_string = os.getenv('DATABASE_URL')
        if not self.conn_string:
            raise ValueError("DATABASE_URL no encontrada en .env")
    
    def get_connection(self):
        """Crea conexión a la base de datos"""
        return psycopg2.connect(self.conn_string)
    
    def query_to_dataframe(self, query: str, params: tuple = None) -> pd.DataFrame:
        """Ejecuta query y retorna DataFrame"""
        with self.get_connection() as conn:
            return pd.read_sql_query(query, conn, params=params)
    
    def execute(self, query: str, params: tuple = None):
        """Ejecuta INSERT/UPDATE/DELETE"""
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)
                conn.commit()
    
    def get_commit_history(self, repository_id: str, days_back: int = 90) -> pd.DataFrame:
        """Obtiene historial de commits con archivos modificados"""
        
        query = """
        WITH commit_data AS (
            SELECT 
                c.id,
                c.sha,
                c.repository_id,
                c.user_id,
                c.message,
                c.additions,
                c.deletions,
                c.files_changed,
                c.committed_at,
                EXTRACT(HOUR FROM c.committed_at) as hour_of_day,
                EXTRACT(DOW FROM c.committed_at) as day_of_week
            FROM analytics.commits c
            WHERE c.repository_id = %s
              AND c.committed_at >= NOW() - INTERVAL '%s days'
        )
        SELECT * FROM commit_data
        ORDER BY committed_at DESC
        """
        
        return self.query_to_dataframe(query, (repository_id, days_back))
    
    def get_pr_history(self, repository_id: str, days_back: int = 90) -> pd.DataFrame:
        """Obtiene historial de PRs"""
        
        query = """
        SELECT 
            pr.id,
            pr.repository_id,
            pr.user_id,
            pr.state,
            pr.additions,
            pr.deletions,
            pr.changed_files,
            pr.comments,
            pr.review_comments,
            pr.created_at,
            pr.merged_at,
            pr.closed_at,
            EXTRACT(EPOCH FROM (pr.merged_at - pr.created_at))/3600 as hours_to_merge
        FROM analytics.pull_requests pr
        WHERE pr.repository_id = %s
          AND pr.created_at >= NOW() - INTERVAL '%s days'
        ORDER BY created_at DESC
        """
        
        return self.query_to_dataframe(query, (repository_id, days_back))
    
    def save_file_metrics(self, df: pd.DataFrame, repository_id: str):
        """Guarda features calculados en ml.file_metrics"""
        
        window_start = datetime.now() - timedelta(days=30)
        window_end = datetime.now()
        
        for _, row in df.iterrows():
            query = """
            INSERT INTO ml.file_metrics (
                id, repository_id, file_path, window_start, window_end,
                total_commits, unique_authors, avg_additions, avg_deletions,
                total_lines_changed, bugfix_count, urgent_fix_count,
                avg_hour_of_day, weekend_commits, time_between_changes,
                avg_review_comments, avg_time_to_merge,
                was_refactored, refactor_severity, calculated_at, features_hash
            ) VALUES (
                gen_random_uuid(), %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s
            )
            ON CONFLICT (repository_id, file_path, window_start, window_end) 
            DO UPDATE SET
                total_commits = EXCLUDED.total_commits,
                unique_authors = EXCLUDED.unique_authors,
                avg_additions = EXCLUDED.avg_additions,
                avg_deletions = EXCLUDED.avg_deletions,
                total_lines_changed = EXCLUDED.total_lines_changed,
                bugfix_count = EXCLUDED.bugfix_count,
                urgent_fix_count = EXCLUDED.urgent_fix_count,
                avg_hour_of_day = EXCLUDED.avg_hour_of_day,
                weekend_commits = EXCLUDED.weekend_commits,
                time_between_changes = EXCLUDED.time_between_changes,
                avg_review_comments = EXCLUDED.avg_review_comments,
                avg_time_to_merge = EXCLUDED.avg_time_to_merge,
                was_refactored = EXCLUDED.was_refactored,
                refactor_severity = EXCLUDED.refactor_severity,
                calculated_at = NOW(),
                features_hash = EXCLUDED.features_hash
            """
            
            params = (
                repository_id,
                row['file_path'],
                window_start.date(),
                window_end.date(),
                int(row.get('total_commits', 0)),
                int(row.get('unique_authors', 0)),
                float(row.get('avg_additions', 0)),
                float(row.get('avg_deletions', 0)),
                int(row.get('total_lines_changed', 0)),
                int(row.get('bugfix_count', 0)),
                int(row.get('urgent_fix_count', 0)),
                float(row.get('avg_hour', 0)),
                int(row.get('weekend_commits', 0)),
                float(row.get('time_between_changes', 0)),
                float(row.get('avg_review_comments', 0)),
                float(row.get('avg_time_to_merge', 0)),
                bool(row.get('was_refactored', False)),
                float(row.get('refactor_severity')) if row.get('refactor_severity') else None,
                row.get('features_hash', None)
            )
            
            try:
                self.execute(query, params)
            except Exception as e:
                print(f"Error guardando métricas para {row['file_path']}: {e}")