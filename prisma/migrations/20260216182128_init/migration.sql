-- CreateTable
CREATE TABLE "PostItem" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'instagram',
    "igUrl" TEXT NOT NULL,
    "isLiked" BOOLEAN NOT NULL DEFAULT false,
    "isSaved" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "caption" TEXT,
    "timestamp" TIMESTAMP(3),
    "contentType" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "files" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stats" TEXT NOT NULL,
    "errorLog" TEXT NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostItem_igUrl_key" ON "PostItem"("igUrl");
