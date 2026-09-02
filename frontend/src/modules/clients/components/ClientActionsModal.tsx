import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Client, getClientById, deleteClient } from '../clients.api';
import { Colis, listColis, dateReceptionEffective } from '@/modules/colis/colis.api';
import { ColisActionsModal } from '@/modules/colis/components/ColisActionsModal';
import { ClientEditModal } from './ClientEditModal';
import { RelancerWhatsAppButton } from '@/modules/paiements/components/RelancerWhatsAppButton';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { STATUT_PAIEMENT_LABELS } from '@/modules/lots/paiementsLot.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/context/AuthContext';
import { Modal, Tabs, Button, Badge, notify } from '@/ui';

const STATUT_PAIEMENT_TONE: Record<string, 'red' | 'amber' | 'green' | 'sky'> = {
  IMPAYE: 'red',
  PARTIEL: 'amber',
  SOLDE: 'green',
  TROP_PERCU: 'sky',
};

interface ClientActionsModalProps {
  clientId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}

// Panneau d'actions centralisé pour un client — même principe que ColisActionsModal : un clic
// sur un client (page Clients) ouvre ce panneau au lieu de disperser les actions (modifier,
// supprimer, voir ses colis, agir sur un colis, relancer par WhatsApp) sur plusieurs écrans.
export function ClientActionsModal({ clientId, onClose, onUpdated }: ClientActionsModalProps) {
  const { user } = useAuth();
  const role = user?.role;
  const [tab, setTab] = useState('infos');

  const [client, setClient] = useState<Client | null>(null);
  const [loadingClient, setLoadingClient] = useState(false);

  const [colisDuClient, setColisDuClient] = useState<Colis[]>([]);
  const [loadingColis, setLoadingColis] = useState(false);
  const [colisOuvert, setColisOuvert] = useState<Colis | null>(null);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refreshClient = useCallback(async () => {
    if (!clientId) return;
    setLoadingClient(true);
    try {
      setClient(await getClientById(clientId));
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setLoadingClient(false);
    }
  }, [clientId]);

  const refreshColis = useCallback(async () => {
    if (!clientId) return;
    setLoadingColis(true);
    try {
      const tous = await listColis();
      setColisDuClient(tous.filter((c) => c.client.id === clientId));
    } finally {
      setLoadingColis(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) {
      setClient(null);
      return;
    }
    setTab('infos');
    refreshClient();
    refreshColis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) return null;

  const peutModifier = hasPermission(role, 'clients:write');
  const peutMessager = hasPermission(role, 'whatsapp:send');
  const peutLireFinances = client && (client.totalSpent !== undefined || client.outstandingBalance !== undefined);

  async function handleDelete() {
    if (!client) return;
    if (!window.confirm(`Supprimer ${client.fullName} ? Cette action est bloquée si le client a des colis ou factures en cours.`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteClient(client.id);
      notify.success('Client supprimé.');
      onUpdated?.();
      onClose();
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  const tabs = [
    { key: 'infos', label: 'Infos' },
    { key: 'colis', label: `Colis (${colisDuClient.length})` },
    ...(peutMessager ? [{ key: 'message', label: 'Message client' }] : []),
  ];

  return (
    <>
      <Modal open={!!clientId} onClose={onClose} title={client?.fullName ?? '…'} maxWidthClassName="max-w-lg">
        {loadingClient && !client ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Chargement…</p>
        ) : !client ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Client introuvable.</p>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs text-slate-400 dark:text-slate-500">{client.clientCode}</p>
              {peutLireFinances && (
                <div className="flex items-center gap-2 mt-2 text-sm tabular-nums">
                  <span className="text-slate-500 dark:text-slate-400">
                    Total dépensé : {Number(client.totalSpent).toLocaleString('fr-FR')} GNF
                  </span>
                  {Number(client.outstandingBalance) > 0 && (
                    <Badge tone="red">Doit {Number(client.outstandingBalance).toLocaleString('fr-FR')} GNF</Badge>
                  )}
                </div>
              )}
            </div>

            <Tabs tabs={tabs} active={tab} onChange={setTab} />

            {tab === 'infos' && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Téléphone Guinée</p>
                    <p className="font-medium text-night-900 dark:text-slate-100">{client.phoneGn || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Téléphone Chine</p>
                    <p className="font-medium text-night-900 dark:text-slate-100">{client.phoneCn || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500">WhatsApp</p>
                    <p className="font-medium text-night-900 dark:text-slate-100">{client.phoneWhatsapp || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-night-700 p-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Adresse</p>
                    <p className="font-medium text-night-900 dark:text-slate-100">{client.address || '—'}</p>
                  </div>
                </div>

                {peutModifier && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" fullWidth onClick={() => setEditing(true)}>
                      <Pencil size={14} className="mr-1.5" />
                      Modifier
                    </Button>
                    <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
                      <Trash2 size={14} className="mr-1.5" />
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            )}

            {tab === 'colis' && (
              <div className="space-y-2">
                {loadingColis ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">Chargement…</p>
                ) : colisDuClient.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">Aucun colis pour ce client.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-night-700 max-h-96 overflow-y-auto">
                    {colisDuClient.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setColisOuvert(c)}
                        className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-night-700/50 rounded-md px-1 -mx-1 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-night-800 dark:text-slate-100 truncate">{c.trackingId}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                            {c.description} · Reçu le {new Date(dateReceptionEffective(c)).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge tone="slate">{COLIS_STATUS_LABELS[c.status] ?? c.status}</Badge>
                          {c.statutPaiement && (
                            <Badge tone={STATUT_PAIEMENT_TONE[c.statutPaiement]}>
                              {STATUT_PAIEMENT_LABELS[c.statutPaiement]}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'message' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Envoyer un message de relance sur WhatsApp au client ({client.fullName}).
                </p>
                <RelancerWhatsAppButton mode="serveur" clientId={client.id} fullWidth size="lg" />
              </div>
            )}
          </>
        )}
      </Modal>

      <ClientEditModal
        client={editing ? client : null}
        onClose={() => setEditing(false)}
        onUpdated={() => {
          refreshClient();
          onUpdated?.();
        }}
      />

      <ColisActionsModal colis={colisOuvert} onClose={() => setColisOuvert(null)} onUpdated={refreshColis} />
    </>
  );
}
