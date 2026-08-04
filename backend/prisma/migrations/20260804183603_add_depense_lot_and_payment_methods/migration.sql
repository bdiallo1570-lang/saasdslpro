-- CreateEnum
CREATE TYPE "CategorieDepenseLot" AS ENUM ('DEDOUANEMENT', 'TRANSPORT_AEROPORT_MADINA', 'MANUTENTION', 'STOCKAGE', 'DOCUMENTATION', 'DIVERS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'MTN_MOMO';
ALTER TYPE "PaymentMethod" ADD VALUE 'AUTRE';

-- CreateTable
CREATE TABLE "depenses_lot" (
    "id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "categorie" "CategorieDepenseLot" NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'GNF',
    "taux_vers_gnf" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "montant_gnf" DECIMAL(18,2) NOT NULL,
    "date_depense" TIMESTAMP(3) NOT NULL,
    "beneficiaire" TEXT,
    "reference_recu" TEXT,
    "justificatif_url" TEXT,
    "saisi_par_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "depenses_lot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "depenses_lot_lot_id_categorie_idx" ON "depenses_lot"("lot_id", "categorie");

-- AddForeignKey
ALTER TABLE "depenses_lot" ADD CONSTRAINT "depenses_lot_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
