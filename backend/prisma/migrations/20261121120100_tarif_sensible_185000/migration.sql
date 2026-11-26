-- Tarif Sensible porté à 185 000 GNF/kg à compter du déploiement (demande du 21/11/2026).
-- Même principe que le tarif Standard : l'ancien tarif est conservé (désactivé), les colis déjà
-- enregistrés gardent leur prix ; le libellé et la devise du tarif en vigueur sont repris.
WITH actuel AS (
  SELECT "label", "currency" FROM "pricing_rules"
  WHERE "category_name" = 'RISQUE' AND "is_active"
  ORDER BY "effective_from" DESC
  LIMIT 1
),
nouveau AS (
  INSERT INTO "pricing_rules" ("id", "category_name", "label", "price_per_kg", "currency", "effective_from", "is_active", "created_at", "updated_at")
  SELECT gen_random_uuid()::text, 'RISQUE',
         COALESCE((SELECT "label" FROM actuel), 'Colis à risque'),
         185000,
         COALESCE((SELECT "currency" FROM actuel), 'GNF'),
         NOW(), true, NOW(), NOW()
  RETURNING "id"
)
UPDATE "pricing_rules" SET "is_active" = false, "updated_at" = NOW()
WHERE "category_name" = 'RISQUE' AND "is_active" AND "id" NOT IN (SELECT "id" FROM nouveau);
