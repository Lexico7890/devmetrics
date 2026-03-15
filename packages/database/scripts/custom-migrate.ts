import { execSync } from "child_process";
import { mkdirSync, existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";

/**
 * Custom Migration Script for Prisma Multi-Schema
 * Proporciona control total sobre la generación y aplicación de migraciones
 * evitando conflictos con la Shadow DB en configuraciones de múltiples esquemas.
 */

// 1. Configuración de nombres y rutas
const args = process.argv.slice(2);
const migrationNameInput = args[0];

if (!migrationNameInput) {
  console.error("❌ Error: Se requiere un nombre para la migración.");
  console.log("💡 Uso: npm run db:migrate:custom -- nombre_de_la_migracion");
  process.exit(1);
}

const migrationName = migrationNameInput.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
const folderName = `${timestamp}_${migrationName}`;

const migrationsDir = join(process.cwd(), "prisma/migrations");
const currentMigrationDir = join(migrationsDir, folderName);
const sqlFilePath = join(currentMigrationDir, "migration.sql");

// 2. Carga de Variables de Entorno (Compatibilidad multiplataforma)
const getDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    const match = envContent.match(/^DATABASE_URL=["']?([^"'\n]+)["']?$/m);
    return match ? match[1] : "";
  }
  return "";
};

const dbUrl = getDatabaseUrl();
if (!dbUrl) {
  console.error("❌ Error: No se encontró DATABASE_URL en el entorno ni en el .env");
  process.exit(1);
}

console.log(`\n🛠️  Generando migración: ${folderName}`);

try {
  // Crear directorio de la migración
  mkdirSync(currentMigrationDir, { recursive: true });

  // PASO 1: Generar el Diff SQL
  console.log("⏳ 1/4 - Comparando esquemas y generando SQL...");
  execSync(
    `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > "${sqlFilePath}"`,
    { stdio: "inherit" }
  );

  // Validar si el archivo SQL está vacío o no tiene cambios reales
  const sqlContent = readFileSync(sqlFilePath, "utf-8");
  if (!sqlContent.trim() || sqlContent.includes("-- This is an empty migration.")) {
    console.log("✨ No se detectaron cambios. Limpiando...");
    rmSync(currentMigrationDir, { recursive: true, force: true });
    process.exit(0);
  }

  // PASO 2: Ejecución directa en DB
  console.log("⏳ 2/4 - Aplicando SQL directamente a la base de datos...");
  execSync(`npx prisma db execute --url="${dbUrl}" --file="${sqlFilePath}"`, { stdio: "inherit" });

  // PASO 3: Registrar en el historial de Prisma
  console.log("⏳ 3/4 - Sincronizando historial de migraciones...");
  execSync(`npx prisma migrate resolve --applied ${folderName}`, { stdio: "inherit" });

  // PASO 4: Regenerar el Cliente
  console.log("⏳ 4/4 - Generando Prisma Client...");
  execSync(`npx prisma generate`, { stdio: "inherit" });

  console.log(`\n✅ ¡Éxito! Migración aplicada y registrada correctamente.\n`);
} catch (error) {
  console.error("\n❌ Fallo en el proceso de migración:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}