-- AlterTable
ALTER TABLE "auth"."sessions" ALTER COLUMN "refresh_token_hash" SET NOT NULL;

-- CreateTable
CREATE TABLE "jobs"."webhook_deliveries" (
    "id" TEXT NOT NULL,
    "github_delivery_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "action" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_deliveries_github_delivery_id_key" ON "jobs"."webhook_deliveries"("github_delivery_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_status_idx" ON "jobs"."webhook_deliveries"("event", "status");

-- AddForeignKey
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

