# apps/workers/src/features/data_validation.py
import pandas as pd
import logging
from typing import Tuple, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DataValidator:
    """Valida datos crudos antes de feature engineering"""
    
    def __init__(self, alert_callback=None):
        self.alert_callback = alert_callback
        self.violations = []
    
    def validate_schema(self, df: pd.DataFrame) -> bool:
        """Verificar que las columnas existan y tengan tipos correctos"""
        required_columns = {
            'date': 'datetime64[ns]',
            'commits': 'int64',
            'total_additions': 'int64',
            'total_deletions': 'int64'
        }
        
        for col, expected_type in required_columns.items():
            if col not in df.columns:
                self._add_violation(f"Missing column: {col}", severity='critical')
                return False
            
            if df[col].dtype != expected_type:
                self._add_violation(
                    f"Column {col} has type {df[col].dtype}, expected {expected_type}",
                    severity='high'
                )
        
        return len(self.violations) == 0
    
    def validate_no_nulls(self, df: pd.DataFrame, critical_columns: list) -> bool:
        """Verificar que no haya valores nulos en columnas críticas"""
        for col in critical_columns:
            null_count = df[col].isnull().sum()
            if null_count > 0:
                self._add_violation(
                    f"Column {col} has {null_count} null values",
                    severity='critical' if null_count > len(df) * 0.1 else 'medium'
                )
                return False
        return True
    
    def validate_range_checks(self, df: pd.DataFrame) -> bool:
        """Verificar rangos válidos"""
        checks = [
            (df['commits'] >= 0, "Negative commits found"),
            (df['total_additions'] >= 0, "Negative additions found"),
            (df['total_deletions'] >= 0, "Negative deletions found"),
            (df['date'] <= datetime.now(), "Future dates found"),
            (df['date'] >= datetime.now() - timedelta(days=365), "Data too old (>1 year)")
        ]
        
        for condition, message in checks:
            if not condition.all():
                self._add_violation(message, severity='high')
                return False
        return True
    
    def validate_anomalies(self, df: pd.DataFrame) -> bool:
        """Detectar anomalías (picos inusuales)"""
        mean_commits = df['commits'].mean()
        std_commits = df['commits'].std()
        
        # Detectar días con commits > 3 desviaciones estándar
        anomalies = df[df['commits'] > mean_commits + 3 * std_commits]
        
        if len(anomalies) > 0:
            self._add_violation(
                f"Found {len(anomalies)} anomalous days with unusually high commits",
                severity='medium',
                details=anomalies[['date', 'commits']].to_dict('records')
            )
            # No detenemos el pipeline por esto, solo alertamos
            return True
        
        return True
    
    def _add_violation(self, message: str, severity: str = 'medium', details=None):
        violation = {
            'message': message,
            'severity': severity,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.violations.append(violation)
        logger.warning(f"[{severity.upper()}] {message}")
        
        if severity == 'critical' and self.alert_callback:
            self.alert_callback(violation)
    
    def run_all(self, df: pd.DataFrame) -> Tuple[bool, Dict]:
        """Ejecutar todas las validaciones"""
        self.violations = []
        
        schema_ok = self.validate_schema(df)
        nulls_ok = self.validate_no_nulls(df, critical_columns=['date', 'commits'])
        ranges_ok = self.validate_range_checks(df)
        anomalies_ok = self.validate_anomalies(df)
        
        is_valid = schema_ok and nulls_ok and ranges_ok
        
        return is_valid, {
            'is_valid': is_valid,
            'violations': self.violations,
            'critical_count': sum(1 for v in self.violations if v['severity'] == 'critical'),
            'summary': f"{len(self.violations)} violations found"
        }