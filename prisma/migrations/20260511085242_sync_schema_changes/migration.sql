/*
  Warnings:

  - A unique constraint covering the columns `[codeInvitation]` on the table `Tontine` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Tontine" ADD COLUMN     "codeInvitation" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tontine_codeInvitation_key" ON "Tontine"("codeInvitation");
