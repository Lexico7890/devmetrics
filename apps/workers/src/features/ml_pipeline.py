# apps/workers/src/features/ml_pipeline.py
import pandas as pd
import logging
from datetime import datetime
from sqlalchemy import create_engine
import os

from data_validation import DataValidator
from feature_validation import FeatureValidator
from feature_pipeline import FeaturePipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLPipeline:
    """Orchestrates the complete ML pipeline with validation gates"""
    
    def __init__(self):
        self.engine = create_engine(os.getenv('DATABASE_URL'))
        self.data_validator = DataValidator(alert_callback=self.send_alert)
        self.feature_validator = FeatureValidator()
        self.feature_pipeline = FeaturePipeline()
    
    def send_alert(self, violation: dict):
        """Send alert (Slack, email, or just log)"""
        # En producción: enviar a Slack, PagerDuty, etc.
        logger.error(f"🚨 ALERT: {violation['message']}")
        # Aquí podrías agregar webhook a Slack
        # requests.post(SLACK_WEBHOOK, json={'text': violation['message']})
    
    def should_stop_pipeline(self, validation_result: dict) -> bool:
        """Decide si detener el pipeline basado en validaciones"""
        critical_violations = validation_result.get('critical_count', 0)
        
        if critical_violations > 0:
            logger.error(f"Pipeline stopped: {critical_violations} critical violations")
            return True
        
        return False
    
    def run_training_pipeline(self, user_id: str) -> dict:
        """Run complete training pipeline with validation gates"""
        
        logger.info(f"🚀 Starting ML Pipeline for user {user_id}")
        
        # ========== GATE 1: Fetch raw data ==========
        logger.info("📥 Fetching raw commits...")
        df_raw = self.feature_pipeline.fetch_commits(user_id, days_back=90)
        
        if len(df_raw) < 7:
            logger.warning(f"Insufficient data: only {len(df_raw)} days")
            return {'status': 'skipped', 'reason': 'insufficient_data'}
        
        # ========== GATE 2: Validate raw data ==========
        logger.info("🔍 Validating raw data...")
        is_data_valid, data_validation_result = self.data_validator.run_all(df_raw)
        
        if not is_data_valid or self.should_stop_pipeline(data_validation_result):
            return {
                'status': 'failed',
                'stage': 'data_validation',
                'validation_result': data_validation_result,
                'timestamp': datetime.now().isoformat()
            }
        
        logger.info("✅ Data validation passed")
        
        # ========== GATE 3: Feature engineering ==========
        logger.info("🔧 Computing features...")
        df_features = self.feature_pipeline.compute_features(df_raw)
        
        # ========== GATE 4: Validate features (drift detection) ==========
        logger.info("📊 Checking for feature drift...")
        is_drift_acceptable, drift_result = self.feature_validator.validate_features(
            df_features, self.engine, user_id
        )
        
        if not is_drift_acceptable:
            logger.warning("⚠️ Drift detected, stopping retraining")
            return {
                'status': 'failed',
                'stage': 'drift_detection',
                'drift_result': drift_result,
                'timestamp': datetime.now().isoformat()
            }
        
        logger.info("✅ Drift check passed")
        
        # ========== GATE 5: Save to offline store ==========
        logger.info("💾 Saving features to offline store...")
        self.feature_pipeline.save_to_offline_store(df_features, user_id)
        
        # ========== GATE 6: Train model (if enough data) ==========
        if len(df_features) >= 30:
            logger.info("🤖 Training model...")
            # Aquí llamarías al entrenamiento del modelo
            # model = train_model(df_features)
            pass
        else:
            logger.info(f"⏳ Not enough data for training: {len(df_features)} days (need 30)")
        
        # ========== GATE 7: Sync to online store ==========
        logger.info("⚡ Syncing features to Redis...")
        from online_store import OnlineFeatureStore
        online_store = OnlineFeatureStore()
        online_store.sync_to_online_store(user_id)
        
        logger.info("✅ ML Pipeline completed successfully")
        
        return {
            'status': 'success',
            'data_validation': data_validation_result,
            'drift_check': drift_result if 'drift_result' in locals() else None,
            'features_computed': len(df_features),
            'timestamp': datetime.now().isoformat()
        }

if __name__ == "__main__":
    pipeline = MLPipeline()
    result = pipeline.run_training_pipeline("your-user-id-here")
    print(result)