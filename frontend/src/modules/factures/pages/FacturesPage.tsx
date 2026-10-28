import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, PlusCircle, AlertTriangle, Unlock, Search } from 'lucide-react';
import {
  listFacturesByClient,
  listUnbilledColis,
  createFacture,
  debloquerLivraison,
  downloadFacturePdf,
  Facture,
} from '../factures.api';
import { listAllClients, ClientListItem } from '@/modules/clients/clients.api';
import { Colis } from '@/modules/colis/colis.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Badge, Button, Input, Select, Modal, notify } from '@/ui';

const STATUT_LABELS: Record<string, string> = {
  IMPAYE: 'Impayée',
  PARTIEL: 'Paiement partiel',
  PAYE: 'Payée',
};
const STATUT_TONE: Record<string, 'red' | 'amber' | 'green'> = {
  IMPAYE: 'red',
  PARTIEL: 'amber',
  PAYE: 'green',
};

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// ─── Page Factures ─────────────────────────────────────────────────────────────
// Permet de consulter toutes les factures d'un client sélectionné, de créer une
// facture groupée à partir de colis non encore facturés, de télécharger les PDFs
// officiels (DSL Air Cargo) et de débloquer manuellement une livraison (Admin).
export default function FacturesPage() {
  const { user } = useAuth();
  const role = user?.role;

  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [factures, setFactures] = useState<Facture[]>([]);
  const [unbilledColis, setUnbilledColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // État pour la création de facture groupée
  const [showCreerFacture, setShowCreerFacture] = useState(false);
  const [selectedColisIds, setSelectedColisIds] = useState<string[]>([]);
  const [creatingFacture, setCreatingFacture] = useState(false);

  // État pour le déblocage admin
  const [deblocageFactureId, setDeblocageFactureId] = useState<string | null>(null);
  const [motifDeblocage, setMotifDeblocage] = useState('');
  const [deblocking, setDeblocking] = useState(false);

  // État téléchargements
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const peutCreerFacture = hasPermission(role, 'factures:write');
  const peutDebloquer = hasPermission(role, 'livraison:deblocage_force');

  // Chargement liste clients
  useEffect(() => {
    listAllClients().then(setClients).catch(() => {});
  }, []);

  const refreshFactures = useCallback(async () => {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const [facs, unbilled] = await Promise.all([
        listFacturesByClient(selectedClientId),
        peutCreerFacture ? listUnbilledColis(selectedClientId) : Promise.resolve([]),
      ]);
      setFactures(facs);
      setUnbilledColis(unbilled as unknown as Colis[]);
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, peutCreerFacture]);

  useEffect(() => {
    setFactures([]);
    setUnbilledColis([]);
    setSelectedColisIds([]);
    refreshFactures();
  }, [refreshFactures]);

  const filteredFactures = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return factures;
    return factures.filter(
      (f) =>
        f.factureNumber.toLowerCase().includes(q) ||
        f.status.toLowerCase().includes(q),
    );
  }, [factures, searchQuery]);

  // Créer une facture groupée
  async function handleCreerFacture() {
    if (!selectedClientId || selectedColisIds.length === 0) return;
    setCreatingFacture(true);
    try {
      const newFacture = await createFacture(selectedClientId, selectedColisIds);
      notify.success(`Facture ${newFacture.factureNumber} créée avec succès.`);
      setShowCreerFacture(false);
      setSelectedColisIds([]);
      refreshFactures();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setCreatingFacture(false);
    }
  }

  // Déblocage manuel livraison
  async function handleDebloquer() {
    if (!deblocageFactureId || !motifDeblocage.trim()) return;
    setDeblocking(true);
    try {
      await debloquerLivraison(deblocageFactureId, motifDeblocage.trim());
      notify.success("Livraison débloquée — motif tracé au journal d'audit.");
      setDeblocageFactureId(null);
      setMotifDeblocage('');
      refreshFactures();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setDeblocking(false);
    }
  }

  // Téléchargement PDF
  async function handleDownloadPdf(facture: Facture) {
    setDownloadingId(facture.id);
    try {
      await downloadFacturePdf(facture.id, facture.factureNumber);
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <AppShell>
      <PageHeader
        title="Factures"
        description="Gestion et téléchargement des factures officielles DSL Air Cargo"
      />

      {/* Sélecteur de client */}
      <Card className="mb-6 p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <Select
              label="Sélectionner un client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">— Choisir un client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.clientCode})
                </option>
              ))}
            </Select>
          </div>
          {selectedClientId && peutCreerFacture && unbilledColis.length > 0 && (
            <Button
              variant="cargo"
              onClick={() => setShowCreerFacture(true)}
            >
              <PlusCircle size={16} className="mr-2" />
              Nouvelle facture ({unbilledColis.length} colis non facturés)
            </Button>
          )}
        </div>
      </Card>

      {/* Contenu principal */}
      {!selectedClientId ? (
        <Card className="text-center py-16">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Sélectionnez un client pour voir ses factures
          </p>
        </Card>
      ) : loading ? (
        <Card className="text-center py-12">
          <p className="text-slate-400 dark:text-slate-500">Chargement…</p>
        </Card>
      ) : factures.length === 0 ? (
        <Card className="text-center py-16">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Aucune facture pour {selectedClient?.fullName}
          </p>
          {peutCreerFacture && unbilledColis.length > 0 && (
            <Button
              variant="cargo"
              className="mt-4"
              onClick={() => setShowCreerFacture(true)}
            >
              <PlusCircle size={16} className="mr-2" />
              Créer la première facture ({unbilledColis.length} colis)
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Barre de recherche */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Rechercher par numéro ou statut…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {filteredFactures.length} / {factures.length} facture(s)
            </span>
          </div>

          <motion.div className="space-y-3" variants={listContainer} initial="hidden" animate="show">
            {filteredFactures.map((facture) => {
              const totalColis = (facture.colis ?? []).length;
              return (
                <motion.div key={facture.id} variants={listItem}>
                  <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="shrink-0 rounded-xl bg-sky-50 dark:bg-sky-500/10 p-2.5">
                        <FileText size={20} className="text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-night-800 dark:text-slate-100 text-sm">
                            {facture.factureNumber}
                          </span>
                          <Badge tone={STATUT_TONE[facture.status] ?? 'slate'}>
                            {STATUT_LABELS[facture.status] ?? facture.status}
                          </Badge>
                          {facture.livraisonDebloqueeManuel && (
                            <Badge tone="amber">Déblocage admin</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {Number(facture.montantTotal).toLocaleString('fr-FR')} {facture.currency}
                          {totalColis > 0 && ` · ${totalColis} colis`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Déblocage admin pour factures non soldées */}
                      {peutDebloquer && facture.status !== 'PAYE' && !facture.livraisonDebloqueeManuel && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDeblocageFactureId(facture.id)}
                          title="Débloquer la livraison malgré facture impayée"
                        >
                          <Unlock size={14} className="mr-1.5 text-amber-500" />
                          Débloquer
                        </Button>
                      )}

                      {/* Téléchargement PDF */}
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={downloadingId === facture.id}
                        onClick={() => handleDownloadPdf(facture)}
                      >
                        <Download size={14} className="mr-1.5" />
                        PDF
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      {/* Modal création facture groupée */}
      <Modal
        open={showCreerFacture}
        onClose={() => { setShowCreerFacture(false); setSelectedColisIds([]); }}
        title="Nouvelle facture groupée"
        maxWidthClassName="max-w-lg"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Sélectionnez les colis à inclure dans cette facture. Tous les colis doivent être
          dans la même devise.
        </p>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {unbilledColis.map((c) => {
            const checked = selectedColisIds.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  checked
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10 dark:border-sky-500'
                    : 'border-slate-200 dark:border-night-600 hover:bg-slate-50 dark:hover:bg-night-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setSelectedColisIds((prev) =>
                      e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                    );
                  }}
                  className="accent-sky-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-night-800 dark:text-slate-100 truncate">
                    {c.trackingId}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {c.description} · {c.poidsReelKg} kg ·{' '}
                    {Number(c.montantEstime ?? 0).toLocaleString('fr-FR')} {c.currency ?? 'GNF'}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-night-600 flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => { setShowCreerFacture(false); setSelectedColisIds([]); }}
          >
            Annuler
          </Button>
          <Button
            variant="cargo"
            fullWidth
            disabled={selectedColisIds.length === 0}
            loading={creatingFacture}
            onClick={handleCreerFacture}
          >
            <FileText size={16} className="mr-2" />
            Créer la facture ({selectedColisIds.length} colis)
          </Button>
        </div>
      </Modal>

      {/* Modal déblocage livraison admin */}
      <Modal
        open={!!deblocageFactureId}
        onClose={() => { setDeblocageFactureId(null); setMotifDeblocage(''); }}
        title="Déblocage exceptionnel de livraison"
        maxWidthClassName="max-w-md"
      >
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 mb-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Action tracée au journal d'audit</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Ce déblocage permet la livraison malgré une facture impayée. Il sera enregistré
              avec votre identité, la date et le motif.
            </p>
          </div>
        </div>

        <Input
          label="Motif du déblocage (obligatoire)"
          type="text"
          value={motifDeblocage}
          onChange={(e) => setMotifDeblocage(e.target.value)}
          placeholder="Ex: Accord gérant, client payera à la livraison…"
        />

        <div className="mt-4 flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => { setDeblocageFactureId(null); setMotifDeblocage(''); }}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={!motifDeblocage.trim()}
            loading={deblocking}
            onClick={handleDebloquer}
          >
            <Unlock size={16} className="mr-2" />
            Confirmer le déblocage
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
