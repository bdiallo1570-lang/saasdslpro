-- Tarif Standard porté à 170 000 GNF/kg à compter du déploiement (demande du 21/11/2026).
-- Les tarifs sont historisés : l'ancien est conservé (désactivé, jamais supprimé). Les colis déjà
-- enregistrés gardent leur tarif ; seuls les nouveaux colis, devis et simulations utilisent le
-- nouveau. Le libellé et la devise du tarif en vigueur sont repris.
WITH actuel AS (
  SELECT "label", "currency" FROM "pricing_rules"
  WHERE "category_name" = 'STANDARD' AND "is_active"
  ORDER BY "effective_from" DESC
  LIMIT 1
),
nouveau AS (
  INSERT INTO "pricing_rules" ("id", "category_name", "label", "price_per_kg", "currency", "effective_from", "is_active", "created_at", "updated_at")
  SELECT gen_random_uuid()::text, 'STANDARD',
         COALESCE((SELECT "label" FROM actuel), 'Colis standard'),
         170000,
         COALESCE((SELECT "currency" FROM actuel), 'GNF'),
         NOW(), true, NOW(), NOW()
  RETURNING "id"
)
UPDATE "pricing_rules" SET "is_active" = false, "updated_at" = NOW()
WHERE "category_name" = 'STANDARD' AND "is_active" AND "id" NOT IN (SELECT "id" FROM nouveau);
