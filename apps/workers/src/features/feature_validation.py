# apps/workers/src/features/feature_validation.py
import pandas as pd
import numpy as np
from typing import Dict, Tuple
from datetime import datetime, timedelta
from sqlalchemy import create_engine
import logging

logger = logging.getLogger(__name__)

class FeatureValidator:
    """Valida features antes de entrenamiento (detecta drift)"""
    
    @staticmethod
    def calculate_psi(expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
        """Calculate Population Stability Index"""
        expected_percents, bins_edges = np.histogram(expected, bins=bins, density=False)
        actual_percents, _ = np.histogram(actual, bins=bins_edges, density=False)
        
        # Add small constant to avoid division by zero
        expected_percents = expected_percents + 1e-10
        actual_percents = actual_percents + 1e-10
        
        # Normalize
        expected_percents = expected_percents / expected_percents.sum()
        actual_percents = actual_percents / actual_percents.sum()
        
        psi = np.sum((actual_percents - expected_percents) * np.log(actual_percents / expected_percents))
        return psi
    
    @staticmethod
    def interpret_psi(psi: float) -> Tuple[str, bool]:
        """Interpret PSI value and decide if drift is acceptable"""
        if psi < 0.1:
            return "No drift detected", True
        elif psi < 0.2:
            return "Slight drift - monitor", True
        elif psi < 0.3:
            return "Moderate drift - consider retraining", False
        else:
            return "Severe drift - retraining halted", False
    
    def validate_features(self, df_new: pd.DataFrame, engine, user_id: str) -> Tuple[bool, Dict]:
        """Compare new features with historical baseline"""
        
        # Get baseline (last 30 days of features)
        baseline_query = f"""
        SELECT commits, commits_avg_7d, day_of_week, is_weekend, days_since_last
        FROM analytics.daily_features
        WHERE user_id = '{user_id}'
        ORDER BY date DESC
        LIMIT 30
        """
        
        df_baseline = pd.read_sql(baseline_query, engine)
        
        if len(df_baseline) < 7:
            logger.info("Insufficient baseline data, skipping drift detection")
            return True, {'status': 'skipped', 'reason': 'insufficient baseline'}
        
        results = {}
        all_acceptable = True
        
        # Check PSI for each feature
        features_to_check = ['commits', 'commits_avg_7d', 'days_since_last']
        
        for feature in features_to_check:
            if feature in df_new.columns and feature in df_baseline.columns:
                psi = self.calculate_psi(df_baseline[feature].values, df_new[feature].values)
                interpretation, is_acceptable = self.interpret_psi(psi)
                
                results[feature] = {
                    'psi': round(psi, 4),
                    'interpretation': interpretation,
                    'acceptable': is_acceptable
                }
                
                if not is_acceptable:
                    all_acceptable = False
                    logger.warning(f"❌ Drift detected in {feature}: PSI={psi:.3f} - {interpretation}")
                else:
                    logger.info(f"✅ {feature}: PSI={psi:.3f} - {interpretation}")
        
        return all_acceptable, {
            'drift_detected': not all_acceptable,
            'results': results,
            'should_retrain': all_acceptable
        }