-- Tarif « Gros volume » : prix au kilo négocié, saisi à chaque colis et dans les devis
ALTER TYPE "PricingCategory" ADD VALUE IF NOT EXISTS 'GROS_VOLUME';
ALTER TYPE "DevisLigneType" ADD VALUE IF NOT EXISTS 'AERIEN_GROS_VOLUME';
