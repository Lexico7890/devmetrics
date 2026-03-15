-- AlterTable
ALTER TABLE "jobs"."webhook_deliveries" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "error_message" TEXT;

