import { execSync } from "child_process";
import { mkdirSync, existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";

// 1. Obtener y sanitizar el nombre de la migración
const args = process.argv.slice(2);
const migrationNameInput = args[0];

if (!migrationNameInput) {
  console.error("❌ Por favor, provee un nombre para la migración. Ejemplo:");
  console.error("   npm run db:migrate:custom -- add_new_table");
  process.exit(1);
}

const migrationName = migrationNameInput.replace(/[^a-z0-9_]/gi, "_").toLowerCase();

// 2. Generar Timestamp YYYYMMDDHHMMSS
const now = new Date();
const timestamp = now.toISOString().replace(/[-:T.]/g, "").slice(0, 14);
const folderName = `${timestamp}_${migrationName}`;

const migrationsDir = join(__dirname, "../prisma/migrations");
const currentMigrationDir = join(migrationsDir, folderName);
const sqlFilePath = join(currentMigrationDir, "migration.sql");

// 3. Extraer DATABASE_URL del .env manualmente para OS multiplataforma
const envPath = join(__dirname, "../.env");
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl && existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  // Buscar línea DATABASE_URL="algo" o DATABASE_URL=algo
  const match = envContent.match(/^DATABASE_URL="?([^"\n]+)"?$/m);
  if (match) {
    dbUrl = match[1];
  }
}

if (!dbUrl) {
  console.error("❌ No se encontró la variable DATABASE_URL en el entorno o en el archivo .env");
  process.exit(1);
}

console.log(`🚀 Iniciando generación de migración custom: ${folderName}...`);

try {
  mkdirSync(currentMigrationDir, { recursive: true });

  console.log(`\n⏳ 1/4 - Generando SQL de diferencias (migrate diff)...`);
  // Usamos stdio pipe o ignore para no ensuciar la consola, prisma diff escribirá al archivo
  execSync(
    `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > "${sqlFilePath}"`,
    { stdio: "inherit", shell: true }
  );

  // Leer el archivo sql para ver si está vacío
  const sqlContent = readFileSync(sqlFilePath, "utf-8");
  if (!sqlContent.trim() || sqlContent.includes("-- This is an empty migration.")) {
    console.log(`\n⚠️ No se detectaron cambios en el esquema. Cancelando migración y limpiando carpeta.`);
    rmSync(currentMigrationDir, { recursive: true, force: true });
    process.exit(0);
  }

  console.log(`\n⏳ 2/4 - Aplicando el archivo SQL a la base de datos (db execute)...`);
  execSync(`npx prisma db execute --url="${dbUrl}" --file="${sqlFilePath}"`, { stdio: "inherit", shell: true });

  console.log(`\n⏳ 3/4 - Marcando migración como resuelta en el historial (migrate resolve)...`);
  execSync(`npx prisma migrate resolve --applied ${folderName}`, { stdio: "inherit", shell: true });

  console.log(`\n⏳ 4/4 - Generando cliente de Prisma (generate)...`);
  execSync(`npx prisma generate`, { stdio: "inherit", shell: true });

  console.log(`\n✅ ¡Migración '${folderName}' completada y aplicada satisfactoriamente!`);
} catch (error) {
  console.error(`\n❌ Error durante la migración:`, error instanceof Error ? error.message : error);
  process.exit(1);
}
