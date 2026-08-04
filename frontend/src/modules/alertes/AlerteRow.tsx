import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Alerte, NiveauAlerte } from './alertes.api';
import { Badge } from '@/ui';

const NIVEAU_TONE: Record<NiveauAlerte, 'red' | 'amber' | 'sky'> = {
  CRITIQUE: 'red',
  ATTENTION: 'amber',
  INFO: 'sky',
};

const NIVEAU_LABELS: Record<NiveauAlerte, string> = {
  CRITIQUE: 'Critique',
  ATTENTION: 'Attention',
  INFO: 'Info',
};

// Message WhatsApp pré-rempli pour relancer un client sur une créance — lien wa.me cliquable,
// aucun envoi serveur (cohérent avec le pattern déjà utilisé pour les contacts entrepôts).
function buildRelanceWhatsappUrl(alerte: Alerte): string | null {
  if (!alerte.clientTelephone) return null;
  const numero = alerte.clientTelephone.replace(/\D/g, '');
  if (!numero) return null;

  const message =
    `Bonjour ${alerte.clientNom ?? ''}, votre colis` +
    (alerte.lotNumber ? ` du lot ${alerte.lotNumber}` : '') +
    ` est arrivé à Madina. ${alerte.message.includes('GNF') ? '' : ''}` +
    ` Merci de passer récupérer votre marchandise. — DSL Air Cargo`;

  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}

interface AlerteRowProps {
  alerte: Alerte;
}

// Ligne d'alerte réutilisable (onglet Alertes du lot + page globale /alertes) — cliquable vers
// le colis/lot concerné, avec bouton de relance WhatsApp sur les alertes de créance.
export function AlerteRow({ alerte }: AlerteRowProps) {
  const lien = alerte.colisId
    ? `/lots/${alerte.lotId}`
    : alerte.lotId
      ? `/lots/${alerte.lotId}`
      : null;
  const whatsappUrl = buildRelanceWhatsappUrl(alerte);

  return (
    <div className="px-5 py-3.5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone={NIVEAU_TONE[alerte.niveau]}>{NIVEAU_LABELS[alerte.niveau]}</Badge>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {new Date(alerte.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
        {lien ? (
          <Link to={lien} className="text-sm text-night-800 dark:text-slate-100 hover:underline">
            {alerte.message}
          </Link>
        ) : (
          <p className="text-sm text-night-800 dark:text-slate-100">{alerte.message}</p>
        )}
      </div>
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/25 transition-colors shrink-0"
        >
          <MessageCircle size={13} />
          Relancer
        </a>
      )}
    </div>
  );
}
