ALTER TABLE "auth"."sessions" ADD COLUMN "refresh_token_hash" TEXT UNIQUE;
