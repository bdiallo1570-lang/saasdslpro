import { MessageCircle } from 'lucide-react';
import { Magnetic } from '@/modules/landing/sections/motionKit';
import { lienDevisWhatsApp, noterDemandeDevis } from './devisWhatsApp';

interface BoutonDevisProps {
  // Endroit de la page (mesure d'audience) : « accueil », « calculateur », « fin du parcours »…
  emplacement: string;
  details?: string;
  taille?: 'normal' | 'large';
  pleineLargeur?: boolean;
  className?: string;
}

// Seul bouton plein orange du site : la demande de devis gratuit sur WhatsApp. Les autres
// actions (calculer, se connecter, voir les adresses) sont volontairement secondaires.
export function BoutonDevis({
  emplacement,
  details,
  taille = 'normal',
  pleineLargeur = false,
  className = '',
}: BoutonDevisProps) {
  const dimensions = taille === 'large' ? 'px-7 py-3.5 text-sm sm:text-base' : 'px-6 py-3 text-sm';
  return (
    <Magnetic strength={0.14} className={`${pleineLargeur ? 'block' : 'inline-block'} ${className}`}>
      <a
        href={lienDevisWhatsApp(details)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => noterDemandeDevis(emplacement)}
        className={`group inline-flex items-center justify-center gap-2 rounded-full bg-cargo-500 font-semibold text-ink-950 shadow-glow-cargo transition-colors hover:bg-cargo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cargo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ${dimensions} ${pleineLargeur ? 'w-full' : ''}`}
      >
        <MessageCircle size={17} className="transition-transform group-hover:-rotate-12" aria-hidden="true" />
        Demander mon devis gratuit
      </a>
    </Magnetic>
  );
}
