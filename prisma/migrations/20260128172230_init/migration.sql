-- CreateTable
CREATE TABLE "PostItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL DEFAULT 'instagram',
    "igUrl" TEXT NOT NULL,
    "igId" TEXT,
    "isLiked" BOOLEAN NOT NULL DEFAULT false,
    "isSaved" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "caption" TEXT,
    "timestamp" DATETIME,
    "importBatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PostItem_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "files" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stats" TEXT NOT NULL,
    "errorLog" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PostItem_igUrl_key" ON "PostItem"("igUrl");
