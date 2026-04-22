# ml/src/features/pipeline.py

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import hashlib
import json
from typing import Dict, List, Tuple
import sys
sys.path.append('..')
from utils.redis_cache import FeatureCache
from features.validation import DataValidator
from utils.db import DatabaseConnector

class DebtFeaturePipeline:
    """Pipeline principal de feature engineering para Technical Debt Prediction"""
    
    def __init__(self):
        self.db = DatabaseConnector()
        self.validator = DataValidator()
        self.bug_keywords = ['fix', 'bug', 'hotfix', 'patch', 'resolve', 'issue', 'error']
        self.urgent_hours = list(range(18, 24)) + list(range(0, 8))  # 6pm-8am
        
    def extract_features(self, repository_id: str, window_days: int = 30) -> pd.DataFrame:
        """Extrae y calcula features por archivo"""
        
        print(f"📊 Extrayendo datos para repo {repository_id}...")
        
        # Obtener commits
        commits_df = self.db.get_commit_history(repository_id, window_days)
        
        if len(commits_df) == 0:
            print(f"⚠️ No hay commits para repo {repository_id}")
            return pd.DataFrame()
        
        # Por ahora, asumimos que necesitas la tabla commit_files
        # Si no existe, la creamos en el siguiente paso
        print(f"✅ {len(commits_df)} commits encontrados")
        
        # Calcular features por archivo (simulado por ahora)
        features_df = self._calculate_file_features(commits_df)
        
        return features_df
    
    def _calculate_file_features(self, commits_df: pd.DataFrame) -> pd.DataFrame:
        """Calcula features agregadas por archivo"""
        
        # Features básicas por commit
        commits_df['is_bugfix'] = commits_df['message'].str.lower().str.contains(
            '|'.join(self.bug_keywords), na=False
        )
        commits_df['is_urgent'] = commits_df['hour_of_day'].isin(self.urgent_hours)
        commits_df['is_weekend'] = commits_df['day_of_week'].isin([5, 6])
        
        # Por ahora, agrupamos por repository_id (luego será por archivo)
        features = commits_df.groupby('repository_id').agg({
            'id': 'count',  # total_commits
            'user_id': 'nunique',  # unique_authors
            'additions': ['mean', 'sum'],
            'deletions': ['mean', 'sum'],
            'is_bugfix': 'sum',  # bugfix_count
            'is_urgent': 'sum',  # urgent_fix_count
            'is_weekend': 'sum',  # weekend_commits
            'hour_of_day': 'mean',  # avg_hour
        }).reset_index()
        
        # Aplanar columnas multi-nivel
        features.columns = ['repository_id', 'total_commits', 'unique_authors', 
                           'avg_additions', 'total_additions', 'avg_deletions', 
                           'total_deletions', 'bugfix_count', 'urgent_fix_count',
                           'weekend_commits', 'avg_hour']
        
        # Features derivadas
        features['total_lines_changed'] = features['total_additions'] + features['total_deletions']
        features['time_between_changes'] = 0  # TODO: calcular con timestamps reales
        
        # Label (por ahora aleatorio para testing)
        features['was_refactored'] = np.random.choice([True, False], size=len(features), p=[0.2, 0.8])
        features['refactor_severity'] = np.where(features['was_refactored'], 
                                                 np.random.uniform(0.3, 0.9, len(features)), 
                                                 0)
        
        # Hash del featureset
        features['features_hash'] = features.apply(
            lambda x: hashlib.md5(str(x.to_dict()).encode()).hexdigest()[:8], 
            axis=1
        )
        
        # Agregar file_path (temporal)
        features['file_path'] = 'src/components/Example.tsx'
        
        return features
    
    def run(self, repository_id: str) -> Dict:
        """Ejecuta pipeline completo"""
        
        print(f"\n🚀 Iniciando pipeline para repo {repository_id}")
        print("=" * 50)
        
        # 1. Extraer features
        features_df = self.extract_features(repository_id)
        
        if len(features_df) == 0:
            return {"status": "no_data", "repository_id": repository_id}

         # Validar features antes de guardar
        passed, checks, quality_score = self.validator.validate(features_df)

        if not passed:
            print("⚠️ Validación fallida:")
            print(self.validator.get_validation_summary(checks))
            
            # Guardar en data_quality_logs
            self._log_validation(repository_id, passed, checks, quality_score)
            
            if quality_score < 0.5:
                raise ValueError(f"Quality score muy bajo: {quality_score}")
        
        # Agregar quality score al DataFrame
        features_df['data_quality_score'] = quality_score
        
        # 2. Guardar en PostgreSQL
        print(f"💾 Guardando {len(features_df)} registros en ml.file_metrics...")
        self.db.save_file_metrics(features_df, repository_id)
        cache = FeatureCache()
        for _, row in features_df.iterrows():
            cache.set_features(
                repository_id, 
                row['file_path'],
                json.loads(row.to_json())
            )
        
        # 3. Calcular data quality
        quality_score = self._calculate_quality_score(features_df)
        
        print(f"\n✅ Pipeline completado:")
        print(f"   - Archivos procesados: {len(features_df)}")
        print(f"   - Data quality score: {quality_score:.2f}")
        print(f"   - Features hash: {features_df['features_hash'].iloc[0]}")
        
        return {
            "status": "success",
            "repository_id": repository_id,
            "files_processed": len(features_df),
            "quality_score": quality_score,
            "positive_labels": int(features_df['was_refactored'].sum())
        }
    
    def _calculate_quality_score(self, df: pd.DataFrame) -> float:
        """Calcula score de calidad de datos"""
        score = 1.0
        
        # Penalizar por nulos
        null_ratio = df.isnull().sum().sum() / (len(df) * len(df.columns))
        score -= null_ratio
        
        # Penalizar por pocos datos
        if len(df) < 10:
            score -= 0.2
        
        return max(0.0, min(1.0, score))

    def _log_validation(self, repository_id: str, passed: bool, checks: dict, quality_score: float) -> None:
        """Registra el resultado de la validación"""
        print(f"  -> log_validation: repo={repository_id}, passed={passed}, score={quality_score}")
        # Aquí se podría registrar en un log, una base de datos o monitor de data quality


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Pipeline de features para Technical Debt Prediction')
    parser.add_argument('--repo-id', type=str, required=True, help='Repository ID')
    
    args = parser.parse_args()
    
    pipeline = DebtFeaturePipeline()
    result = pipeline.run(args.repo_id)
    
    print("\n" + "=" * 50)
    print(json.dumps(result, indent=2))