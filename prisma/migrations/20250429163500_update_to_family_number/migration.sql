/*
  Warnings:

  - You are about to drop the column `client_id` on the `ConnectedFamily` table. All the data in the column will be lost.
  - You are about to drop the column `connected_to` on the `ConnectedFamily` table. All the data in the column will be lost.
  - You are about to drop the column `family_search_id` on the `ContactNote` table. All the data in the column will be lost.
  - You are about to drop the column `family_search_id` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `family_search_id` on the `PhoneLog` table. All the data in the column will be lost.
  - Added the required column `connected_family_number` to the `ConnectedFamily` table without a default value. This is not possible if the table is not empty.
  - Added the required column `family_number` to the `ConnectedFamily` table without a default value. This is not possible if the table is not empty.
  - Added the required column `family_number` to the `ContactNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `family_number` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `family_number` to the `PhoneLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ConnectedFamily" DROP CONSTRAINT "ConnectedFamily_client_id_fkey";

-- DropForeignKey
ALTER TABLE "ContactNote" DROP CONSTRAINT "ContactNote_family_search_id_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_family_search_id_fkey";

-- DropForeignKey
ALTER TABLE "PhoneLog" DROP CONSTRAINT "PhoneLog_family_search_id_fkey";

-- DropIndex
DROP INDEX "ContactNote_family_search_id_idx";

-- AlterTable
ALTER TABLE "ConnectedFamily" DROP COLUMN "client_id",
DROP COLUMN "connected_to",
ADD COLUMN     "connected_family_number" TEXT NOT NULL,
ADD COLUMN     "family_number" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ContactNote" DROP COLUMN "family_search_id",
ADD COLUMN     "family_number" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "family_search_id",
ADD COLUMN     "family_number" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PhoneLog" DROP COLUMN "family_search_id",
ADD COLUMN     "family_number" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ConnectedFamily_family_number_idx" ON "ConnectedFamily"("family_number");

-- CreateIndex
CREATE INDEX "ConnectedFamily_connected_family_number_idx" ON "ConnectedFamily"("connected_family_number");

-- CreateIndex
CREATE INDEX "ContactNote_family_number_idx" ON "ContactNote"("family_number");

-- CreateIndex
CREATE INDEX "Order_family_number_idx" ON "Order"("family_number");

-- CreateIndex
CREATE INDEX "PhoneLog_family_number_idx" ON "PhoneLog"("family_number");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_family_number_fkey" FOREIGN KEY ("family_number") REFERENCES "Client"("family_number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneLog" ADD CONSTRAINT "PhoneLog_family_number_fkey" FOREIGN KEY ("family_number") REFERENCES "Client"("family_number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedFamily" ADD CONSTRAINT "ConnectedFamily_family_number_fkey" FOREIGN KEY ("family_number") REFERENCES "Client"("family_number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedFamily" ADD CONSTRAINT "ConnectedFamily_connected_family_number_fkey" FOREIGN KEY ("connected_family_number") REFERENCES "Client"("family_number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactNote" ADD CONSTRAINT "ContactNote_family_number_fkey" FOREIGN KEY ("family_number") REFERENCES "Client"("family_number") ON DELETE CASCADE ON UPDATE CASCADE;
