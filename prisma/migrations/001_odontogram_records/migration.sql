-- AlterTable
ALTER TABLE "odontograms" ADD COLUMN "dentition" TEXT NOT NULL DEFAULT 'permanent';

-- CreateTable
CREATE TABLE "odontogram_records" (
    "id" TEXT NOT NULL,
    "odontogramId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "toothNumber" INTEGER NOT NULL,
    "faces" JSONB NOT NULL DEFAULT '[]',
    "catalogId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "odontogram_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "odontogram_records_odontogramId_toothNumber_idx" ON "odontogram_records"("odontogramId", "toothNumber");

-- AddForeignKey
ALTER TABLE "odontogram_records" ADD CONSTRAINT "odontogram_records_odontogramId_fkey" FOREIGN KEY ("odontogramId") REFERENCES "odontograms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontogram_records" ADD CONSTRAINT "odontogram_records_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
