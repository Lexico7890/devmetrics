# Capa de Datos - Time-to-Merge Estimator

## 📋 Propósito

Extraer, validar y transformar datos de Pull Requests desde PostgreSQL para generar:
- **Snapshots históricos** (`.parquet`) → Entrenamiento de modelos
- **Agregados en Redis** → Inferencia en tiempo real

## 📁 Estructura

src/data/
├── extractors/ # Consultas SQL a PostgreSQL (PRs, commits, users)
├── validators/ # Pydantic schemas + reglas (nulls, rangos, merged_at > created_at)
├── features/ # Transformaciones (tamaño, velocidad autor, hora cíclica)
├── stores/ # Offline (Parquet) + Online (Redis)
├── pipelines/ # Orquestación del flujo completo
└── snapshots/
├── raw/ # Datos crudos validados (debug)
└── features/ # Dataset final con features (para entrenar)


## 🔄 Flujo del Pipeline

PostgreSQL → Validación (GATE) → Feature Engineering → Parquet + Redis


Si la validación falla, el pipeline aborta.

## 🧠 Decisiones Técnicas Clave

| Decisión | Herramienta | Justificación |
|----------|-------------|---------------|
| **Fuente offline** | PostgreSQL | Ya existe en docker-compose, datos actualizados por sync-service |
| **Fuente online** | Redis | Latencia <1ms, ya está en docker-compose (rate limiting) |
| **Formato snapshots** | Parquet | Columnar, comprimido, nativo en pandas |
| **Validación** | Pydantic | Schemas estrictos, falla temprano |
| **No versionado** | Sin DVC | Datos pequeños (KB/MB), timestamp en nombre archivo |
| **No feature store externo** | Sin Feast | Overkill, se reemplaza con código compartido |

## 📊 Features Generadas

- **PR:** `size_category`, `complexity_score`, `files_changed_log`, `is_draft`
- **Autor:** `historical_merge_time`, `merge_rate`, `total_prs`
- **Temporal:** `is_weekend`, `hour_sin/cos`, `day_sin/cos`
- **Target:** `merge_time_hours` (horas desde creación hasta merge)

## 🔌 Conexión con Schema Prisma

**Tablas usadas:**
- `analytics.pull_requests` → Principal (PRs mergeados)
- `analytics.commits` → Actividad del autor
- `analytics.repositories` → Contexto del repo
- `auth.users` → Datos del autor

**Query clave:** JOIN de estas 4 tablas filtrando `merged_at IS NOT NULL`.

## ⚠️ Lo que este módulo NO hace

- ❌ Entrenar modelos → Capa de Entrenamiento
- ❌ Split train/test → Capa de Entrenamiento
- ❌ API de predicción → Capa de Serving
- ❌ Monitorear drift → Capa de Monitoreo

## 📦 Dependencias

pandas, numpy, pyarrow, psycopg2-binary, sqlalchemy, redis, pydantic


## 🚀 Uso

```python
from src.data.pipelines import IngestionPipeline

pipeline = IngestionPipeline(days_back=90)
result = pipeline.run()

# Output: snapshots/features/features_YYYYMMDD.parquet
# Output: Redis actualizado con agregados
