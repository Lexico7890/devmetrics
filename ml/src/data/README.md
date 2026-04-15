# Capa de Datos - Time-to-Merge Estimator
## Arquitectura Empresarial con Ejecución Híbrida

### 📋 Propósito

Implementar un **Feature Store completo** siguiendo patrones de Uber Michelangelo, con ejecución híbrida (EC2 + GitHub Actions) para optimizar recursos manteniendo estándares empresariales.

### 🏗️ Arquitectura de Ejecución

graph TD
    subgraph GITHUB_ACTIONS ["🚀 GitHub Actions (7GB RAM - $0)"]
        direction TB
        A[Extracción de Datos] --> B[Validación: Great Expectations]
        B --> C[Data Augmentation: Time-windowing]
        C --> D[Feature Engineering: Pandas]
        D --> E[Entrenamiento XGBoost]
        E --> F[Materialización a Redis]
    end

    subgraph EC2_SERVER ["☁️ EC2 Instance (400MB RAM - $0)"]
        direction LR
        G[(PostgreSQL: Offline Store)]
        H[(Redis: Online Store)]
        I[NestJS API: Serving]
    end

    GITHUB_ACTIONS -.->|Actualiza Features| H
    GITHUB_ACTIONS -.->|Persiste Logs| G
    H <--> I


### 📁 Estructura del Proyecto

src/data/
├── extractors/
│ ├── postgres_extractor.py # Extrae de PostgreSQL (EC2)
│ └── github_api_extractor.py # Transfer learning (público)
│
├── validators/
│ ├── schemas.py # Pydantic
│ ├── expectations/ # Great Expectations suite
│ └── quality_gates.py # Gates pre-features
│
├── augmentation/
│ ├── time_windowing.py # Múltiples observaciones/PR
│ ├── bootstrap_sampler.py # Resampling con ruido
│ └── pseudo_labeler.py # PRs abiertos
│
├── features/
│ ├── transformers/
│ │ ├── pr_features.py
│ │ ├── author_features.py
│ │ └── temporal_features.py
│ ├── feature_pipeline.py # Orquestación Feast-compatible
│ └── feast_registry.py # Definición FeatureViews
│
├── pipelines/
│ └── training_pipeline.py # Flujo completo
│
└── snapshots/
├── raw/ # Datos extraídos
├── augmented/ # Post-augmentation
└── features/ # Dataset final (parquet)


### 🔬 Técnicas de Data Augmentation

| Técnica | Implementación | Resultado |
|---------|---------------|-----------|
| **Time Windowing** | 5 observaciones por PR | 20 PRs → 100 observaciones |
| **Bootstrap + Noise** | Resampling con ±10% ruido | 100 → 1,000 observaciones |
| **Pseudo-labeling** | PRs abiertos con confianza >0.7 | +75 observaciones |
| **Transfer Learning** | Datos de repos públicos | Pre-entrenamiento |

📦 Dependencias

feast
great-expectations
mlflow
evidently
pandas
xgboost
redis

### 🚀 Conclusión

Esta arquitectura demuestra que se pueden implementar patrones MLOps empresariales completos (Feature Store, Data Quality, Experiment Tracking, Orquestación) con $0 de costo y <500 MB de RAM, mediante ejecución híbrida y diseño modular.
