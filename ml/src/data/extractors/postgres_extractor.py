"""
Extractor de datos desde PostgreSQL.
Extrae PRs mergeados con features básicas para el modelo Time-to-Merge.
"""

import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

class PostgresExtractor:
    def __init__(self):
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("❌ DATABASE_URL no encontrada")
        
        # Agregar schema por defecto para que las queries funcionen
        self.engine = create_engine(
            database_url,
            connect_args={
                'options': '-c search_path=analytics,auth,jobs,public'
            }
        )
        print(f"✅ Conectado a PostgreSQL (user: devmetrics, db: devmetrics)")
    
    def extract_merged_prs(self, days_back: int = 90) -> pd.DataFrame:
        """
        Extrae PRs mergeados de los últimos N días.
        
        Args:
            days_back: Ventana de tiempo en días para extraer datos históricos
        
        Returns:
            DataFrame con PRs mergeados y su tiempo real de merge
        """
        query = f"""
        SELECT 
            pr.id,
            pr.github_id,
            pr.repository_id,
            pr.user_id,
            pr.number,
            pr.title,
            pr.state,
            pr.is_draft,
            pr.additions,
            pr.deletions,
            pr.changed_files,
            pr.commits,
            pr.comments,
            pr.review_comments,
            pr.created_at,
            pr.merged_at,
            pr.closed_at,
            
            -- Target: tiempo de merge en horas
            EXTRACT(EPOCH FROM (pr.merged_at - pr.created_at)) / 3600.0 
                AS merge_time_hours,
            
            -- Contexto del repositorio
            repo.full_name AS repo_full_name,
            repo.language AS repo_language,
            repo.stargazers_count,
            repo.forks_count,
            
            -- Contexto del autor
            u.username AS author_username,
            u.login AS author_login
            
        FROM analytics.pull_requests pr
        JOIN analytics.repositories repo ON pr.repository_id = repo.id
        JOIN auth.users u ON pr.user_id = u.id
        
        WHERE pr.merged_at IS NOT NULL
          AND pr.created_at >= NOW() - INTERVAL '{days_back} days'
        
        ORDER BY pr.created_at DESC
        """
        
        print(f"📊 Extrayendo PRs mergeados de últimos {days_back} días...")
        df = pd.read_sql(query, self.engine)
        print(f"✅ Extraídos {len(df)} PRs")
        
        return df
    
    def extract_open_prs(self) -> pd.DataFrame:
        """
        Extrae PRs abiertos actualmente (para pseudo-labeling).
        """
        query = """
        SELECT 
            pr.id,
            pr.repository_id,
            pr.user_id,
            pr.additions,
            pr.deletions,
            pr.changed_files,
            pr.commits,
            pr.created_at,
            
            -- Tiempo transcurrido hasta ahora
            EXTRACT(EPOCH FROM (NOW() - pr.created_at)) / 3600.0 
                AS hours_since_creation,
            
            repo.full_name AS repo_full_name,
            u.username AS author_username
            
        FROM analytics.pull_requests pr
        JOIN analytics.repositories repo ON pr.repository_id = repo.id
        JOIN auth.users u ON pr.user_id = u.id
        
        WHERE pr.merged_at IS NULL
          AND pr.closed_at IS NULL
          AND pr.is_draft = false
        
        ORDER BY pr.created_at DESC
        """
        
        print("📊 Extrayendo PRs abiertos...")
        df = pd.read_sql(query, self.engine)
        print(f"✅ Extraídos {len(df)} PRs abiertos")
        
        return df
    
    def extract_author_history(self, user_id: str, days_back: int = 90) -> pd.DataFrame:
        """
        Extrae historial completo de un autor específico.
        Útil para features de velocidad del autor.
        """
        query = f"""
        SELECT 
            pr.id,
            pr.created_at,
            pr.merged_at,
            pr.additions,
            pr.deletions,
            pr.changed_files,
            EXTRACT(EPOCH FROM (pr.merged_at - pr.created_at)) / 3600.0 
                AS merge_time_hours
                
        FROM analytics.pull_requests pr
        WHERE pr.user_id = '{user_id}'
          AND pr.merged_at IS NOT NULL
          AND pr.created_at >= NOW() - INTERVAL '{days_back} days'
        
        ORDER BY pr.created_at DESC
        """
        
        return pd.read_sql(query, self.engine)


# Prueba rápida
if __name__ == "__main__":
    extractor = PostgresExtractor()
    
    # Probar extracción
    df_merged = extractor.extract_merged_prs(days_back=90)
    print(f"\n📈 Columnas extraídas: {list(df_merged.columns)}")
    print(f"🎯 Target (merge_time_hours) - Media: {df_merged['merge_time_hours'].mean():.2f}h")
    print(f"🎯 Target - Mediana: {df_merged['merge_time_hours'].median():.2f}h")
    
    # Guardar snapshot crudo
    os.makedirs("ml/src/data/snapshots/raw", exist_ok=True)
    from datetime import datetime
    date_str = datetime.now().strftime("%Y%m%d")
    df_merged.to_parquet(f"ml/src/data/snapshots/raw/pr_snapshot_{date_str}.parquet")
    print(f"\n💾 Snapshot guardado en: ml/src/data/snapshots/raw/pr_snapshot_{date_str}.parquet")