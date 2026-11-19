import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { lienDevisWhatsApp, noterDemandeDevis } from '../devis/devisWhatsApp';


// Pastille flottante WhatsApp — toujours visible, lien direct sans détour par l'assistant
// virtuel (Oury, juste en dessous) : certains visiteurs veulent joindre un humain tout de
// suite plutôt que de passer par le chat automatisé.
export function WhatsAppFab() {
  return (
    <motion.a
      href={lienDevisWhatsApp()}
      onClick={() => noterDemandeDevis('bouton flottant')}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      aria-label="Demander un devis sur WhatsApp"
      title="Demander un devis sur WhatsApp"
      className="fixed bottom-5 right-24 z-40 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-glow-cargo flex items-center justify-center text-white"
    >
      <MessageCircle size={24} fill="currentColor" className="text-white" />
    </motion.a>
  );
}
