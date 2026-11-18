import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FilePlus2, FileText, Pencil, Search, Trash2 } from 'lucide-react';
import { AppShell } from '@/layout/AppShell';
import { Badge, Button, Card, Input, PageHeader, Select, notify } from '@/ui';
import { extractErrorMessage } from '@/lib/apiClient';
import { formatNumber } from '@/lib/format';
import { SendToClientButton } from '@/modules/documents/SendToClientButton';
import { DevisEditor } from '../DevisEditor';
import {
  deleteDevis,
  Devis,
  DevisStatus,
  DevisVariante,
  downloadDevisPdf,
  listDevis,
  setDevisStatus,
  STATUS_LABELS,
} from '../devis.api';

const FILTRES: { key: string; label: string }[] = [
  { key: '', label: 'Tous' },
  { key: 'BROUILLON', label: 'Brouillons' },
  { key: 'ENVOYE', label: 'Envoyés' },
  { key: 'ACCEPTE', label: 'Acceptés' },
  { key: 'REFUSE', label: 'Refusés' },
  { key: 'EXPIRE', label: 'Expirés' },
];

const TON: Record<DevisStatus, 'slate' | 'sky' | 'green' | 'red'> = {
  BROUILLON: 'slate',
  ENVOYE: 'sky',
  ACCEPTE: 'green',
  REFUSE: 'red',
};

const dateCourte = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

// Devis et factures proforma : propositions de prix envoyées aux clients. Aucun effet comptable
// (ni créance, ni caisse) : les vraies factures restent créées à partir des colis reçus.
export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [editing, setEditing] = useState<Devis | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      setDevis(await listDevis({ q: q || undefined, statut: statut || undefined }));
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [q, statut]);

  useEffect(() => {
    const t = setTimeout(charger, 250);
    return () => clearTimeout(t);
  }, [charger]);

  async function action(id: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(id);
    try {
      await fn();
      if (ok) notify.success(ok);
      await charger();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function telecharger(d: Devis, variante: DevisVariante) {
    setBusy(`${d.id}-${variante}`);
    try {
      await downloadDevisPdf(d, variante);
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Devis et proformas"
        description="Propositions de prix pour vos clients, en devis ou en facture proforma. Sans effet sur la comptabilité."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <FilePlus2 size={16} className="mr-1.5" />
            Nouveau devis
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Rechercher un numéro ou un client…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTRES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatut(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statut === f.key
                  ? 'bg-cargo-500 text-ink-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-night-700 dark:text-slate-300 dark:hover:bg-night-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && devis.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-night-800" />
          ))}
        </div>
      ) : devis.length === 0 ? (
        <Card className="p-10 text-center">
          <FileText size={32} className="mx-auto text-slate-400" />
          <p className="mt-3 font-medium text-night-900 dark:text-slate-100">
            Aucun devis {statut ? 'dans ce filtre' : 'pour le moment'}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Créez un devis pour chiffrer un envoi avant de recevoir la marchandise.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {devis.map((d, i) => {
            const modifiable = d.status === 'BROUILLON' || d.status === 'ENVOYE';
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Card className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-night-900 dark:text-slate-100">{d.numero}</p>
                        <Badge tone={d.expire ? 'red' : TON[d.status]}>{d.expire ? 'Expiré' : STATUS_LABELS[d.status]}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                        {d.client.nom} <span className="text-slate-500 dark:text-slate-400">· {d.client.code}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {d.lignes.length} ligne{d.lignes.length > 1 ? 's' : ''} · émis le {dateCourte(d.createdAt)} · valable
                        jusqu'au {dateCourte(d.validUntil)}
                      </p>
                    </div>
                    <p className="text-xl font-bold tabular-nums text-night-900 dark:text-white lg:text-right">
                      {formatNumber(d.total)} GNF
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-night-700">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busy === `${d.id}-devis`}
                      onClick={() => telecharger(d, 'devis')}
                    >
                      <Download size={14} className="mr-1.5" /> Devis
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busy === `${d.id}-proforma`}
                      onClick={() => telecharger(d, 'proforma')}
                    >
                      <Download size={14} className="mr-1.5" /> Proforma
                    </Button>
                    <SendToClientButton type="devis" id={d.id} label="Envoyer le devis" />
                    <SendToClientButton type="proforma" id={d.id} label="Envoyer la proforma" />
                    <div className="ml-auto flex items-center gap-2">
                      <Select
                        aria-label="Statut du devis"
                        className="!py-1.5 text-xs"
                        value={d.status}
                        disabled={busy === d.id}
                        onChange={(e) =>
                          action(d.id, () => setDevisStatus(d.id, e.target.value as DevisStatus), 'Statut mis à jour.')
                        }
                      >
                        {(Object.keys(STATUS_LABELS) as DevisStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </Select>
                      {modifiable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Modifier"
                          onClick={() => {
                            setEditing(d);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil size={14} />
                        </Button>
                      )}
                      {d.status === 'BROUILLON' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Supprimer"
                          onClick={() =>
                            window.confirm(`Supprimer le brouillon ${d.numero} ?`) &&
                            action(d.id, () => deleteDevis(d.id), 'Brouillon supprimé.')
                          }
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <DevisEditor
        open={editorOpen}
        devis={editing}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          setEditorOpen(false);
          charger();
        }}
      />
    </AppShell>
  );
}
