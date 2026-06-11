-- CreateTable
CREATE TABLE "Room" (
    "roomId" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "extensionEnabled" BOOLEAN NOT NULL DEFAULT 1,
    "nowPlaying" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoomFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "cfCountry" TEXT,
    "cfRay" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomFingerprint_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("roomId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RoomFingerprint_roomId_idx" ON "RoomFingerprint"("roomId");
