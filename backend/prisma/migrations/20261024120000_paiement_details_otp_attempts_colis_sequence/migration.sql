-- AlterEnum
ALTER TYPE "SequenceType" ADD VALUE 'COLIS';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otp_attempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "commentaire" TEXT,
ADD COLUMN     "date_paiement" TIMESTAMP(3),
ADD COLUMN     "reference" TEXT;
