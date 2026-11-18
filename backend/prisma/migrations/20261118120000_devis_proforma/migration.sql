-- CreateEnum
CREATE TYPE "DevisStatus" AS ENUM ('BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE');

-- CreateEnum
CREATE TYPE "DevisLigneType" AS ENUM ('AERIEN_STANDARD', 'AERIEN_SENSIBLE', 'MARITIME', 'LIBRE');

-- CreateTable
CREATE TABLE "devis" (
    "id" TEXT NOT NULL,
    "devis_number" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "status" "DevisStatus" NOT NULL DEFAULT 'BROUILLON',
    "valid_until" TIMESTAMP(3) NOT NULL,
    "taux_usd_gnf" DECIMAL(18,6),
    "sous_total" DECIMAL(18,2) NOT NULL,
    "remise" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL,
    "note" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devis_lignes" (
    "id" TEXT NOT NULL,
    "devis_id" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "type" "DevisLigneType" NOT NULL,
    "libelle" TEXT NOT NULL,
    "quantite" DECIMAL(18,3) NOT NULL,
    "unite" TEXT NOT NULL,
    "prix_unitaire_usd" DECIMAL(18,2),
    "prix_unitaire" DECIMAL(18,2) NOT NULL,
    "montant" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "devis_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devis_devis_number_key" ON "devis"("devis_number");

-- CreateIndex
CREATE INDEX "devis_client_id_idx" ON "devis"("client_id");

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis_lignes" ADD CONSTRAINT "devis_lignes_devis_id_fkey" FOREIGN KEY ("devis_id") REFERENCES "devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Prix du fret maritime au m³ (USD), jusqu'ici écrit dans le site : désormais en base,
-- lu par les devis et par la landing. N'écrase pas une valeur déjà présente.
INSERT INTO "settings" ("id", "key", "value", "updated_at")
VALUES (gen_random_uuid()::text, 'prix_maritime_usd_m3', '370'::jsonb, NOW())
ON CONFLICT ("key") DO NOTHING;
