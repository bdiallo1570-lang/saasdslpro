-- Les numéros de colis (DSL-AAAA-NNNNN) partageaient jusqu'ici le compteur LTA avec les lots.
-- Le nouveau compteur COLIS repart de la valeur actuelle de LTA pour chaque année, afin de ne
-- jamais réémettre un numéro de colis déjà attribué. (Migration séparée : une valeur d'enum
-- ajoutée ne peut pas être utilisée dans la même transaction que son ALTER TYPE.)
INSERT INTO "sequence_counters" ("id", "sequence_type", "year", "last_value")
SELECT gen_random_uuid(), 'COLIS', "year", "last_value"
FROM "sequence_counters"
WHERE "sequence_type" = 'LTA'
ON CONFLICT ("sequence_type", "year") DO NOTHING;
