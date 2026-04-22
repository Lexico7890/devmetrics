# DevMetrics ML Pipeline

Pipeline de Machine Learning para predicción de deuda técnica basado en patrones de commits.

## 🏗️ Estructura

ml/
├── src/ # Código fuente Python
│ ├── features/ # Feature engineering
│ ├── training/ # Entrenamiento de modelos
│ ├── serving/ # API de inferencia
│ └── utils/ # Utilidades compartidas
├── data/ # Datasets versionados
├── models/ # Modelos entrenados
├── experiments/ # MLflow tracking
├── notebooks/ # Exploración y análisis
└── tests/ # Tests unitarios


## 🚀 Quick Start

```bash
# 1. Setup inicial
make setup
source venv/bin/activate

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Generar features
make pipeline REPO_ID=all

# 4. Entrenar modelo
make train

# 5. Ver experimentos
make mlflow-ui

# 6. Iniciar API
make serve

📊 Modelo
Algoritmo: XGBoost Classifier

Objetivo: Predecir probabilidad de refactor en próximos 30 días

Features: 25+ señales de actividad de commits, PRs y revisiones

Métrica principal: AUC-ROC


## 📋 Flujo de Trabajo

1. **Feature Engineering**: Procesa commits y genera features por archivo
2. **Validación**: Checks de calidad y drift detection
3. **Entrenamiento**: XGBoost con hyperparameter tuning
4. **Registro**: MLflow tracking de experimentos
5. **Inferencia**: API REST para predicciones en tiempo real
6. **Cache**: Redis para features y predicciones

## 🧪 Testing

```bash
# Tests unitarios
make test

# Tests con cobertura
make test-coverage
```

## 🚀 Despliegue

### Docker

```bash
# Build image
docker build -t devmetrics-ml .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  devmetrics-ml
```

### Kubernetes

```bash
# Deploy a K8s
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## 📊 API Endpoints

### Feature Engineering

```http
POST /api/v1/features/generate
Content-Type: application/json

{
  "repositoryIds": ["repo1", "repo2"]
}
```

### Inference

```http
POST /api/v1/predict
Content-Type: application/json

{
  "file_path": "src/main.py",
  "repository_id": "repo1"
}
```

### Health Check

```http
GET /health
```

## 📈 Monitoring

```bash
# Ver logs
docker logs -f devmetrics-ml

# Ver métricas de Redis
redis-cli INFO

# Ver logs de MLflow
mlflow ui
```

## 🔐 Seguridad

- Usar tokens para endpoints sensibles
- Validar inputs con Pydantic
- Rate limiting en API
- Secrets management con Vault o K8s Secrets

## 📚 Documentación

- [Feature Engineering](src/features/README.md)
- [Training](src/training/README.md)
- [Serving](src/serving/README.md)
- [Validation](src/features/validation.py)

## 🤝 Contribuciones

1. Crear branch: `git checkout -b feat/nombre-feature`
2. Desarrollar feature
3. Tests: `make test`
4. Pull request con descripción clara
5. Code review y aprobación

## 📝 License

MIT License

## 👨‍💻 Autor

Oscar Casas

## 📄 Changelog

Ver [CHANGELOG.md](CHANGELOG.md)