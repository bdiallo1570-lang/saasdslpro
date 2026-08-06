import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { listColis, Colis } from '../colis.api';
import { ModifierPrixModal } from '../components/ModifierPrixModal';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { useAuth } from '@/context/AuthContext';
import { ROLE_NAMES } from '@/lib/roles';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Badge, Input, Button } from '@/ui';

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
  const [editingColis, setEditingColis] = useState<Colis | null>(null);

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

  const filteredColis = useMemo(
    () => (query.trim() ? fuse.search(query.trim()).map((r) => r.item) : colis),
    [query, fuse, colis],
  );

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
          <h2 className="font-medium text-night-800 dark:text-slate-100">
            Colis ({filteredColis.length})
          </h2>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par N° de suivi, Nom client, ou Téléphone..."
          />
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : filteredColis.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
            {query.trim() ? 'Aucun colis ne correspond à cette recherche.' : 'Aucun colis enregistré pour le moment.'}
          </p>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-night-700 max-h-[32rem] overflow-y-auto"
          >
            {filteredColis.map((c) => (
              <motion.div
                key={c.id}
                variants={listItem}
                className="px-5 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-night-800 dark:text-slate-100 truncate">
                    {c.trackingId} · {c.client.fullName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {c.description} · {c.poidsReelKg} kg
                  </p>
                </div>
                <Badge tone={STATUS_TONE[c.status] ?? 'slate'}>
                  {COLIS_STATUS_LABELS[c.status] ?? c.status}
                </Badge>
                {c.montantEstime !== undefined && (
                  <p className="font-semibold text-night-900 dark:text-slate-100 whitespace-nowrap">
                    {Number(c.montantEstime).toLocaleString('fr-FR')} {c.currency}
                  </p>
                )}
                {canEditPrice && c.statutPaiement !== 'PARTIEL' && c.statutPaiement !== 'SOLDE' && (
                  <Button variant="secondary" size="sm" onClick={() => setEditingColis(c)}>
                    Modifier le prix
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>

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
