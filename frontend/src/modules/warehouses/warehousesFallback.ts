import { WarehouseLocation } from './warehouses.api';

// Copie de secours des adresses d'entrepôts, affichée instantanément le temps que la vraie
// réponse réseau arrive (voir WarehousesSection.tsx) — évite tout délai perceptible, y compris
// au réveil du backend après une période d'inactivité. À tenir à jour manuellement si les
// adresses/contacts changent depuis l'admin ; une divergence temporaire n'est pas grave, la
// vraie donnée écrase silencieusement ce fallback dès qu'elle arrive.
export const WAREHOUSES_FALLBACK: WarehouseLocation[] = [
  {
    id: 'fallback-guangzhou',
    name: 'Entrepôt Guangzhou',
    addressZh: '广东省广州市越秀区环市中路207号恒生大厦C座705',
    addressFr:
      '705, Bloc C, Immeuble Hengsten, 207 Huanshi Middle Road, District de Yuexiu, Guangzhou, Province du Guangdong, Chine',
    contactNumbersJson: { Man: '+8613246463616', Luna: '', Amadou: '+8617620097697' },
    location: 'CHINE',
  },
  {
    id: 'fallback-conakry',
    name: 'Entrepôt Conakry',
    addressZh: null,
    addressFr:
      'Madina, Gare voitures Liberia, juste en face du Centre Ariboyah, Centre Sidy, 2ème étage, Boutique C6, Conakry, Guinée',
    contactNumbersJson: { 'Boubacar Diallo': '' },
    location: 'GUINEE',
  },
];
