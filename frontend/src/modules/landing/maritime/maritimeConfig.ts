// Réglages du fret maritime affichés sur la landing. Le prix au m³ n'est PAS ici : il est en base
// (réglage « prix_maritime_usd_m3 »), lu par la landing via publicPricing.ts et par les devis.
export const MARITIME = {
  // Délai porte-à-porte annoncé au client (Guangzhou → Conakry, dédouanement compris)
  transitLabel: '3 mois',
  transitDays: 90,
  // Dédouanement à Conakry, en option, en francs guinéens par m³. `null` = « sur devis » :
  // l'option reste proposée dans le calculateur, sans montant affiché.
  customsPerCbmGnf: null as number | null,
  // Numéro WhatsApp qui reçoit les demandes de devis (format international, sans « + »)
  whatsappNumber: '224628674895',
  // Entrepôt de groupage maritime à Guangzhou — distinct de l'entrepôt aérien (géré en base,
  // depuis l'admin). Adresse en chinois telle que fournie par l'équipe, à donner aux fournisseurs.
  seaWarehouse: {
    name: 'Entrepôt maritime Guangzhou',
    addressZh: '广州市白云区石井大冈西街13号 大管家仓储园2号门仓库',
    addressFr:
      'Entrepôt porte n° 2, Parc logistique Daguanjia, 13 rue Dagang Ouest, Shijing, District de Baiyun, Guangzhou, Chine',
    contacts: { 'M. Guo': '+8613427672637', Man: '+8613246463616' } as Record<string, string>,
  },
};

// Volumes utiles usuels des conteneurs maritimes, en m³
export const CONTAINERS = [
  { id: '20', label: 'Conteneur 20 pieds', capacity: 33 },
  { id: '40', label: 'Conteneur 40 pieds', capacity: 67 },
] as const;
