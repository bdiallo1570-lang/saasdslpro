import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/224628674895?text=Bonjour%2C%20je%20souhaite%20des%20informations%20sur%20DSL%20Air%20Cargo.';

// Pastille flottante WhatsApp — toujours visible, lien direct sans détour par l'assistant
// virtuel (Oury, juste en dessous) : certains visiteurs veulent joindre un humain tout de
// suite plutôt que de passer par le chat automatisé.
export function WhatsAppFab() {
  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      aria-label="Nous contacter sur WhatsApp"
      title="Nous contacter sur WhatsApp"
      className="fixed bottom-5 right-24 z-40 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-glow-cargo flex items-center justify-center text-white"
    >
      <MessageCircle size={24} fill="currentColor" className="text-white" />
    </motion.a>
  );
}
