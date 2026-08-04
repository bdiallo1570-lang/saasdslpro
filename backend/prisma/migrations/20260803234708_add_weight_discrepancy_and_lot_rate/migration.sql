-- AlterTable
ALTER TABLE "lots" ADD COLUMN     "taux_devise_origine" "Currency",
ADD COLUMN     "taux_vers_gnf_fige" DECIMAL(18,6);

-- CreateTable
CREATE TABLE "weight_discrepancies" (
    "id" TEXT NOT NULL,
    "colis_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "poids_chine_kg" DECIMAL(10,2) NOT NULL,
    "poids_guinee_kg" DECIMAL(10,2) NOT NULL,
    "ecart_pourcent" DECIMAL(6,2) NOT NULL,
    "seuil_applique_pourcent" DECIMAL(6,2) NOT NULL,
    "depasse_seuil" BOOLEAN NOT NULL,
    "agent_chine_user_id" TEXT,
    "agent_guinee_user_id" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" TEXT,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_discrepancies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "weight_discrepancies" ADD CONSTRAINT "weight_discrepancies_colis_id_fkey" FOREIGN KEY ("colis_id") REFERENCES "colis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
