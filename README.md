# 📊 DevMetrics

DevMetrics es una plataforma integral diseñada para rastrear, analizar y visualizar métricas de desarrollo y actividad de usuarios. Se integra directamente con GitHub para procesar eventos en tiempo real, ofreciendo un panel de control interactivo con estadísticas en vivo, y utiliza Inteligencia Artificial para consultas avanzadas.

---

## 🏗️ Arquitectura del Sistema

El proyecto está construido como un **Monorepo** utilizando [Turborepo](https://turbo.build/) y NPM Workspaces. Esto permite compartir código eficientemente y mantener múltiples aplicaciones y paquetes juntos.

### 🌐 Aplicaciones (`/apps`)

- **`web`**: El frontend (Dashboard). Construido con **Next.js 16** (App Router), React 19 y TailwindCSS v4. Utiliza **Recharts** para la visualización de datos de métricas y `@google/genai` para integraciones de IA. Incluye analíticas integradas con Vercel Analytics.
- **`api`**: El backend principal. Construido con **NestJS 11**. Se encarga de la autenticación (OAuth con GitHub usando Passport y JWT), gestión de usuarios y sirve los datos principales para el panel de web.
- **`sync-service`**: Servicio especializado para la sincronización de datos construido también sobre NestJS. Recibe y procesa los Webhooks de GitHub en tiempo real, encolando eventos mediante RabbitMQ para su procesamiento asíncrono.
- **`workers`**: Trabajadores en segundo plano para procesar colas pesadas, transformar datos de webhooks a registros analíticos estructurados (ej. historial de commits) y actualizar el estado de la base de datos sin bloquear las APIs principales.

### 📦 Paquetes Compartidos (`/packages`)

- **`database`**: Contiene el esquema principal de la base de datos usando **Prisma ORM**, migraciones y el cliente generado. Se comparte a través de todas las aplicaciones del backend y microservicios.
- **`shared`**: Tipos de TypeScript, DTOs (Data Transfer Objects) e interfaces compartidas entre frontend y backend para asegurar un tipado estricto y comunicación coherente.
- **`eslint-config` / `tsconfig`**: Configuraciones predeterminadas para asegurar estándares de calidad de código en todo el monorepo.

### 🐳 Infraestructura & Tecnologías Core (Docker)

El orquestamiento principal (y entorno de desarrollo local/producción) se maneja con **Docker Compose** (`docker-compose.yml`), el cual levanta los siguientes componentes críticos:

- **PostgreSQL (16)**: Base de datos relacional principal.
- **Redis (7)**: Caché de alta velocidad para manejar límites de ratio (Rate Limiting de la API de GitHub) y almacenamiento volátil rápido.
- **RabbitMQ**: Message Broker (gestor de colas) utilizado para comunicar eficientemente el `sync-service` con los `workers` y la `api`.
- **Nginx**: Reverse Proxy para unificar el acceso a los servicios (Web y API) bajo un mismo dominio/puerto.
- **Herramientas de Dev**: `pgAdmin` y `redis-commander` para inspeccionar el estado de la base de datos y la caché en tiempo real.

---

## ✨ Funcionalidades Principales

1. **Dashboard Interactivo y Analíticas**: Visualización de commits, actividad y métricas combinadas a través de diferentes vistas fluidas.
2. **Sincronización en Tiempo Real con GitHub**: Escucha de webhooks de GitHub para sincronizar repositorios, commits y métricas de desempeño automáticamente.
3. **Autenticación Segura (OAuth)**: Ingreso a la plataforma usando cuentas de GitHub, gestionando la sesión mediante tokens seguros (JWT Access & Refresh).
4. **Resiliencia de Datos (Eventos en Colas)**: Utiliza RabbitMQ para desacoplar la ingesta de webhooks (alta concurrencia) del análisis pesado de los datos, asegurando la escalabilidad.
5. **Inteligencia Artificial Integrada**: Permite el análisis inteligente con GenAI optimizando las consultas SQL a través del entendimiento del esquema en la base de datos de manera dinámica.
6. **Rate Limiting Eficiente**: Cuida el uso severo de las cuotas del API de GitHub utilizando un control de concurrencia administrado por Redis.

---

## 🚀 Guía de Inicio Local

### Prerrequisitos
- **Node.js**: >= 20.0.0
- **NPM**: >= 10.8.0
- **Docker** y Docker Compose instalados.

### 1. Variables de Entorno
Clona el archivo de ejemplo para configurar tu entorno local:
```bash
cp .env.example .env.local
```
*(Asegúrate de configurar los valores de `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` y los JWT Secrets antes del inicio).*

### 2. Levantar la Infraestructura Core
Inicia todos los servicios requeridos (Bases de datos y brokers) levantando los contenedores de Docker:
```bash
npm run docker:up
```

### 3. Instalar Dependencias
Instala todas las dependencias del monorepo situándote en la carpeta raíz:
```bash
npm install
```

### 4. Base de Datos
Genera el cliente de Prisma y aplica las migraciones a la base de datos PostgreSQL:
```bash
npm run db:generate
npm run db:migrate
```

### 5. Iniciar la Aplicación
Arranca en entorno de desarrollo usando Turborepo. Esto iniciará al mismo tiempo el frontend, las APIs y los workers:
```bash
npm run dev
```

---

## 🛠️ Scripts Útiles (Comandos de Turborepo)

Turborepo maneja la ejecución en paralelo de los pipelines por cada workspace. Para usarlos sitúate en la raíz del proyecto:

- `npm run dev`: Inicia el modo desarrollo.
- `npm run build`: Compila las aplicaciones preparándolas para producción.
- `npm run lint`: Ejecuta correcciones de código en todo el monorepo.
- `npm run docker:logs`: Visualiza logs emitidos por los contenedores.
- `npm run docker:down`: Detiene y remueve los contenedores locales. 

---
> Proyecto desarrollado con 💻 y Turborepo.
