.PHONY: setup train serve clean test

# Setup del entorno
setup:
	python3 -m venv venv
	. venv/bin/activate && pip install -e .[dev]
	@echo "✅ Entorno virtual creado. Actívalo con: source venv/bin/activate"

# Entrenar modelo
train:
	python -m src.training.train_xgboost

# Iniciar servidor FastAPI
serve:
	uvicorn src.serving.app:app --reload --port 8000

# Ejecutar tests
test:
	pytest tests/ -v --cov=src

# Limpiar archivos temporales
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	@echo "✅ Archivos temporales eliminados"

# Iniciar MLflow UI
mlflow-ui:
	mlflow ui --backend-store-uri sqlite:///experiments/mlflow.db --port 5001

# Pipeline completo
pipeline:
	python -m src.features.pipeline --repo-id $(REPO_ID)