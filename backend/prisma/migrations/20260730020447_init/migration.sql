-- CreateEnum
CREATE TYPE "Location" AS ENUM ('CHINE', 'GUINEE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('GNF', 'USD', 'EUR', 'CNY');

-- CreateEnum
CREATE TYPE "PricingCategory" AS ENUM ('STANDARD', 'RISQUE', 'PERSONNALISE');

-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('POIDS_REEL', 'POIDS_TAXABLE');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('EN_RECEPTION', 'FERME', 'ENVOLE', 'ARRIVE', 'EN_DEDOUANEMENT', 'EN_ENTREPOT', 'CLOTURE');

-- CreateEnum
CREATE TYPE "ColisStatus" AS ENUM ('ENREGISTRE', 'ASSIGNE_LOT', 'ENVOLE', 'ARRIVE', 'EN_DEDOUANEMENT', 'DISPONIBLE_ENTREPOT', 'LIVRE');

-- CreateEnum
CREATE TYPE "SequenceType" AS ENUM ('LTA', 'FACTURE', 'DEVIS');

-- CreateEnum
CREATE TYPE "FactureStatus" AS ENUM ('IMPAYE', 'PARTIEL', 'PAYE');

-- CreateEnum
CREATE TYPE "CashTransactionType" AS ENUM ('ENTREE', 'DEPENSE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ESPECES', 'ORANGE_MONEY', 'VIREMENT');

-- CreateEnum
CREATE TYPE "CashClosureStatus" AS ENUM ('OUVERTE', 'CLOTUREE');

-- CreateEnum
CREATE TYPE "WhatsAppMessageType" AS ENUM ('CONFIRMATION_RECEPTION', 'ARRIVEE_LOT', 'RELANCE_IMPAYE');

-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('ENVOYE', 'ECHEC');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "permissions_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "location" "Location",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "otp_code" TEXT,
    "otp_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "client_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_gn" TEXT,
    "phone_cn" TEXT,
    "phone_whatsapp" TEXT,
    "address" TEXT,
    "total_spent" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "outstanding_balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequence_counters" (
    "id" TEXT NOT NULL,
    "sequence_type" "SequenceType" NOT NULL,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sequence_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_code_counter" (
    "id" TEXT NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "client_code_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" TEXT NOT NULL,
    "lot_number" TEXT NOT NULL,
    "flight_number" TEXT,
    "departure_date" TIMESTAMP(3),
    "estimated_arrival" TIMESTAMP(3),
    "customs_cost" DECIMAL(18,2),
    "freight_cost" DECIMAL(18,2),
    "status" "LotStatus" NOT NULL DEFAULT 'EN_RECEPTION',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colis" (
    "id" TEXT NOT NULL,
    "tracking_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "lot_id" TEXT,
    "facture_id" TEXT,
    "description" TEXT NOT NULL,
    "poids_reel_kg" DECIMAL(10,2) NOT NULL,
    "longueur_cm" DECIMAL(10,2),
    "largeur_cm" DECIMAL(10,2),
    "hauteur_cm" DECIMAL(10,2),
    "poids_volumetrique_kg" DECIMAL(10,2) NOT NULL,
    "poids_taxable_kg" DECIMAL(10,2) NOT NULL,
    "categorie_tarif" "PricingCategory" NOT NULL,
    "pricing_rule_id" TEXT NOT NULL,
    "montant_estime" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'GNF',
    "photos" JSONB,
    "status" "ColisStatus" NOT NULL DEFAULT 'ENREGISTRE',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "colis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "category_name" "PricingCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "price_per_kg" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'GNF',
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_product_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_currency" "Currency" NOT NULL,
    "to_currency" "Currency" NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address_zh" TEXT,
    "address_fr" TEXT,
    "contact_numbers_json" JSONB NOT NULL,
    "location" "Location" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" TEXT NOT NULL,
    "facture_number" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "montant_total" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'GNF',
    "status" "FactureStatus" NOT NULL DEFAULT 'IMPAYE',
    "livraison_debloquee_manuel" BOOLEAN NOT NULL DEFAULT false,
    "livraison_deblocage_motif" TEXT,
    "livraison_deblocage_par_id" TEXT,
    "livraison_deblocage_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "facture_id" TEXT NOT NULL,
    "montant" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "taux_vers_gnf" DECIMAL(18,6) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "cash_transaction_id" TEXT,
    "received_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_register_closures" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "CashClosureStatus" NOT NULL DEFAULT 'OUVERTE',
    "fond_ouverture" DECIMAL(18,2) NOT NULL,
    "solde_theorique" DECIMAL(18,2),
    "comptage_physique" DECIMAL(18,2),
    "ecart" DECIMAL(18,2),
    "opened_by_user_id" TEXT NOT NULL,
    "closed_by_user_id" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_register_closures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" TEXT NOT NULL,
    "closure_id" TEXT NOT NULL,
    "type" "CashTransactionType" NOT NULL,
    "category" TEXT,
    "label" TEXT NOT NULL,
    "montant" DECIMAL(18,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "method" "PaymentMethod",
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_message_logs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "phone_number" TEXT NOT NULL,
    "message_type" "WhatsAppMessageType" NOT NULL,
    "status" "WhatsAppMessageStatus" NOT NULL,
    "payload" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_code_key" ON "clients"("client_code");

-- CreateIndex
CREATE UNIQUE INDEX "sequence_counters_sequence_type_year_key" ON "sequence_counters"("sequence_type", "year");

-- CreateIndex
CREATE UNIQUE INDEX "lots_lot_number_key" ON "lots"("lot_number");

-- CreateIndex
CREATE UNIQUE INDEX "colis_tracking_id_key" ON "colis"("tracking_id");

-- CreateIndex
CREATE UNIQUE INDEX "risk_product_types_name_key" ON "risk_product_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "factures_facture_number_key" ON "factures"("facture_number");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_cash_transaction_id_key" ON "paiements"("cash_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_register_closures_date_currency_key" ON "cash_register_closures"("date", "currency");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis" ADD CONSTRAINT "colis_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis" ADD CONSTRAINT "colis_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis" ADD CONSTRAINT "colis_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "factures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colis" ADD CONSTRAINT "colis_pricing_rule_id_fkey" FOREIGN KEY ("pricing_rule_id") REFERENCES "pricing_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "factures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_cash_transaction_id_fkey" FOREIGN KEY ("cash_transaction_id") REFERENCES "cash_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_closure_id_fkey" FOREIGN KEY ("closure_id") REFERENCES "cash_register_closures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
