/*
  Warnings:

  - Added the required column `updatedAt` to the `Mentorship` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mentorship" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mentorId" INTEGER NOT NULL,
    "menteeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "topic" TEXT,
    "preferredSlot" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mentorship_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Mentorship" ("id", "menteeId", "mentorId") SELECT "id", "menteeId", "mentorId" FROM "Mentorship";
DROP TABLE "Mentorship";
ALTER TABLE "new_Mentorship" RENAME TO "Mentorship";
CREATE INDEX "Mentorship_mentorId_idx" ON "Mentorship"("mentorId");
CREATE INDEX "Mentorship_menteeId_idx" ON "Mentorship"("menteeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
