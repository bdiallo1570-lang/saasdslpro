import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { listColis, Colis, dateReceptionEffective } from '../colis.api';
import { ModifierPrixModal } from '../components/ModifierPrixModal';
import { ColisActionsModal } from '../components/ColisActionsModal';
import { grouperParMois, cleMois } from '../colisParMois';
import { MoisSelect, EnteteMois } from '../components/MoisSections';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAMES } from '@/lib/roles';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Badge, Input, Button } from '@/ui';
import { formatNumber } from '@/lib/format';

const STATUS_TONE: Record<string, 'sky' | 'cargo' | 'green' | 'amber' | 'red' | 'slate'> = {
  ENREGISTRE: 'slate',
  ASSIGNE_LOT: 'sky',
  ENVOLE: 'sky',
  ARRIVE: 'cargo',
  EN_DEDOUANEMENT: 'amber',
  DISPONIBLE_ENTREPOT: 'cargo',
  LIVRE: 'green',
};

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

const CAN_EDIT_PRICE_ROLES: string[] = [ROLE_NAMES.ADMIN, ROLE_NAMES.AGENT_CHINE];

// Liste de tous les colis enregistrés, avec recherche fuzzy. Pour Admin/Agent Chine, permet de
// corriger le prix d'un colis tant qu'aucun paiement n'a été enregistré (verrouillé par le
// backend au-delà, 409) — l'enregistrement initial du colis reste sur ReceptionPage.
export default function ReceptionConsultationPage() {
  const { user } = useAuth();
  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  // Mois affiché (« AAAA-MM »), vide = tous les mois
  const [mois, setMois] = useState('');
  const [editingColis, setEditingColis] = useState<Colis | null>(null);
  // Colis ouvert dans le panneau d'actions (onglet « Modifier », historique)
  const [colisOuvert, setColisOuvert] = useState<Colis | null>(null);

  const canEditPrice = !!user && CAN_EDIT_PRICE_ROLES.includes(user.role);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setColis(await listColis());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fuse = useMemo(
    () =>
      new Fuse(colis, {
        keys: ['trackingId', 'client.fullName', 'client.phoneGn', 'client.phoneWhatsapp'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [colis],
  );

  // Le score de pertinence Fuse casserait l'ordre chronologique lors d'une recherche —
  // on retrie systématiquement par date d'enregistrement décroissante (le plus récent en premier).
  const filteredColis = useMemo(() => {
    const base = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : colis;
    return base
      .filter((c) => !mois || cleMois(dateReceptionEffective(c)) === mois)
      .sort((a, b) => new Date(dateReceptionEffective(b)).getTime() - new Date(dateReceptionEffective(a)).getTime());
  }, [query, fuse, colis, mois]);

  // Options du sélecteur : tous les mois où au moins un colis a été reçu
  const tousLesMois = useMemo(() => grouperParMois(colis), [colis]);
  const groupes = useMemo(() => grouperParMois(filteredColis), [filteredColis]);

  return (
    <AppShell>
      <PageHeader
        title="Colis enregistrés"
        description={
          canEditPrice
            ? "Vue d'ensemble de tous les colis — le prix reste modifiable tant qu'aucun paiement n'a été enregistré."
            : "Vue d'ensemble de tous les colis enregistrés (lecture seule)."
        }
      />

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700 space-y-3">
          <h2 className="font-medium text-night-800 dark:text-slate-100">Colis ({filteredColis.length})</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_15rem]">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par N° de suivi, Nom client, ou Téléphone..."
            />
            <MoisSelect mois={tousLesMois} value={mois} onChange={setMois} />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 px-5 py-6">Chargement…</p>
        ) : filteredColis.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 px-5 py-6">
            {query.trim() || mois
              ? 'Aucun colis ne correspond à cette recherche.'
              : 'Aucun colis enregistré pour le moment.'}
          </p>
        ) : (
          <motion.div
            key={mois}
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="max-h-[32rem] overflow-y-auto"
          >
            {groupes.map((g) => (
              <section key={g.cle}>
                <EnteteMois groupe={g} />
                <div className="divide-y divide-slate-100 dark:divide-night-700">
                  {g.colis.map((c) => (
                    <motion.div
                      key={c.id}
                      variants={listItem}
                      className="px-5 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-2"
                    >
                      <div className="flex-1 min-w-0 basis-full sm:basis-auto">
                        <p className="font-medium text-night-800 dark:text-slate-100 truncate">
                          {c.trackingId} · {c.client.fullName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {c.description} · {c.poidsReelKg} kg · Reçu le{' '}
                          {new Date(dateReceptionEffective(c)).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[c.status] ?? 'slate'}>{COLIS_STATUS_LABELS[c.status] ?? c.status}</Badge>
                      {c.montantEstime !== undefined && (
                        <p className="font-semibold text-night-900 dark:text-slate-100 whitespace-nowrap">
                          {formatNumber(Number(c.montantEstime))} {c.currency}
                        </p>
                      )}
                      {canEditPrice && (
                        <Button variant="secondary" size="sm" onClick={() => setColisOuvert(c)}>
                          Modifier
                        </Button>
                      )}
                      {canEditPrice && c.statutPaiement !== 'PARTIEL' && c.statutPaiement !== 'SOLDE' && (
                        <Button variant="secondary" size="sm" onClick={() => setEditingColis(c)}>
                          Modifier le prix
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </motion.div>
        )}
      </Card>

      <ColisActionsModal
        colis={colisOuvert}
        ongletInitial="modifier"
        onClose={() => setColisOuvert(null)}
        onUpdated={(updated) => {
          setColis((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        }}
      />

      <ModifierPrixModal
        colis={editingColis}
        onClose={() => setEditingColis(null)}
        onUpdated={(updated) => {
          setColis((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        }}
      />
    </AppShell>
  );
}
