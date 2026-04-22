"""Validación de calidad de datos para features de Technical Debt Prediction"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, List
from datetime import datetime


class DataValidator:
    """Valida features antes de guardar en file_metrics"""
    
    def __init__(self):
        self.required_columns = [
            'file_path', 'total_commits', 'unique_authors', 
            'avg_additions', 'avg_deletions', 'total_lines_changed',
            'bugfix_count', 'urgent_fix_count', 'avg_hour',
            'weekend_commits', 'time_between_changes'
        ]
    
    def validate(self, df: pd.DataFrame) -> Tuple[bool, Dict, float]:
        """
        Ejecuta todas las validaciones
        
        Returns:
            passed: bool - True si pasa todas las validaciones
            checks: dict - Resultado detallado por validación
            quality_score: float - Score de calidad 0-1
        """
        if len(df) == 0:
            return False, {'error': 'DataFrame vacío'}, 0.0
        
        checks = {
            'required_columns': self._check_columns(df),
            'no_nulls': self._check_nulls(df),
            'positive_values': self._check_positive_values(df),
            'reasonable_ranges': self._check_ranges(df),
            'label_distribution': self._check_label_distribution(df)
        }
        
        passed = all(checks.values())
        quality_score = self._calculate_quality_score(checks)
        
        return passed, checks, quality_score
    
    def _check_columns(self, df: pd.DataFrame) -> bool:
        """Verifica que existan todas las columnas requeridas"""
        return all(col in df.columns for col in self.required_columns)
    
    def _check_nulls(self, df: pd.DataFrame) -> bool:
        """Verifica que no haya valores nulos en columnas críticas"""
        critical_cols = ['file_path', 'total_commits', 'unique_authors']
        return df[critical_cols].isnull().sum().sum() == 0
    
    def _check_positive_values(self, df: pd.DataFrame) -> bool:
        """Verifica que métricas de conteo sean positivas"""
        positive_cols = ['total_commits', 'unique_authors', 'total_lines_changed']
        return (df[positive_cols] >= 0).all().all()
    
    def _check_ranges(self, df: pd.DataFrame) -> bool:
        """Verifica que valores estén en rangos razonables"""
        checks = [
            df['avg_hour'].between(0, 24).all(),  # Horas válidas
            df['weekend_commits'] <= df['total_commits'],  # Weekend <= total
            df['unique_authors'] <= df['total_commits'],  # Authors <= commits
        ]
        return all(checks)
    
    def _check_label_distribution(self, df: pd.DataFrame) -> bool:
        """Verifica distribución de labels (si existe la columna)"""
        if 'was_refactored' not in df.columns:
            return True
        
        positive_ratio = df['was_refactored'].mean()
        # Mínimo 5%, máximo 50% de positivos
        return 0.05 <= positive_ratio <= 0.50
    
    def _calculate_quality_score(self, checks: Dict) -> float:
        """Calcula score de calidad basado en checks pasados"""
        weights = {
            'required_columns': 0.3,
            'no_nulls': 0.2,
            'positive_values': 0.2,
            'reasonable_ranges': 0.2,
            'label_distribution': 0.1
        }
        
        score = sum(weights[check] for check, passed in checks.items() if passed)
        return round(score, 3)
    
    def get_validation_summary(self, checks: Dict) -> str:
        """Genera resumen legible de validaciones"""
        summary = []
        for check, passed in checks.items():
            status = "✅" if passed else "❌"
            summary.append(f"{status} {check}")
        return "\n".join(summary)


class DataDriftDetector:
    """Detecta drift entre features actuales y referencia"""
    
    def __init__(self, reference_df: pd.DataFrame):
        self.reference_df = reference_df
        self.reference_stats = self._calculate_stats(reference_df)
    
    def _calculate_stats(self, df: pd.DataFrame) -> Dict:
        """Calcula estadísticas de referencia"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        stats = {}
        for col in numeric_cols:
            stats[col] = {
                'mean': df[col].mean(),
                'std': df[col].std(),
                'min': df[col].min(),
                'max': df[col].max()
            }
        return stats
    
    def detect_drift(self, current_df: pd.DataFrame, threshold: float = 2.0) -> Tuple[bool, Dict]:
        """
        Detecta drift usando z-score
        
        Returns:
            has_drift: bool - True si hay drift significativo
            drift_report: dict - Detalle por columna
        """
        current_stats = self._calculate_stats(current_df)
        drift_report = {}
        has_drift = False
        
        for col in self.reference_stats:
            if col in current_stats:
                ref_mean = self.reference_stats[col]['mean']
                ref_std = self.reference_stats[col]['std']
                curr_mean = current_stats[col]['mean']
                
                if ref_std > 0:
                    z_score = abs(curr_mean - ref_mean) / ref_std
                    drift_detected = z_score > threshold
                    
                    drift_report[col] = {
                        'reference_mean': ref_mean,
                        'current_mean': curr_mean,
                        'z_score': round(z_score, 3),
                        'drift_detected': drift_detected
                    }
                    
                    if drift_detected:
                        has_drift = True
        
        return has_drift, drift_report