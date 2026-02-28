import { GITHUB_API_BASE, JOB_TYPES, APP_NAME } from "@devmetrics/shared";

console.log(`🚀 ${APP_NAME} Workers starting...`);
console.log(`📡 GitHub API: ${GITHUB_API_BASE}`);
console.log(`📋 Available job types:`, Object.values(JOB_TYPES));
console.log(`⏳ Workers ready, waiting for jobs...`);

// Placeholder — BullMQ workers se implementan en la siguiente sección
process.on("SIGTERM", () => {
  console.log("Workers shutting down gracefully...");
  process.exit(0);
});