-- CreateTable
CREATE TABLE "BeautyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skinType" TEXT NOT NULL,
    "concerns" TEXT NOT NULL DEFAULT '[]',
    "sensitivity" TEXT NOT NULL DEFAULT 'normal',
    "goals" TEXT NOT NULL DEFAULT '',
    "budget" INTEGER,
    "preferences" TEXT NOT NULL DEFAULT '',
    "consentAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BeautyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BeautyProfile_userId_key" ON "BeautyProfile"("userId");

-- CreateIndex
CREATE INDEX "BeautyProfile_updatedAt_idx" ON "BeautyProfile"("updatedAt");
