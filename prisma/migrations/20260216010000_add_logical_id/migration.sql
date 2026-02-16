-- AlterTable
ALTER TABLE "GamePlayer" ADD COLUMN "logicalId" TEXT;

-- Backfill: orderIndex 0 = human, else bot-{orderIndex-1}
UPDATE "GamePlayer" SET "logicalId" = CASE WHEN "orderIndex" = 0 THEN 'human' ELSE 'bot-' || ("orderIndex" - 1)::text END;

-- Make required and add unique constraint
ALTER TABLE "GamePlayer" ALTER COLUMN "logicalId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayer_gameId_logicalId_key" ON "GamePlayer"("gameId", "logicalId");
