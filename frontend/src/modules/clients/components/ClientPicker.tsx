import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Client, searchClients, createClient } from '../clients.api';
import { extractErrorMessage } from '@/lib/apiClient';
import { useValidation } from '@/lib/validation';
import { schemaClient } from '../clientSchema';
import { Button, notify } from '@/ui';

interface ClientPickerProps {
  selectedClient: Client | null;
  onSelect: (client: Client) => void;
  // Message d'erreur du formulaire parent (ex. « Sélectionnez ou créez un client. ») : marque le
  // champ de recherche comme invalide pour que le curseur s'y place
  erreur?: string;
}

const FIELD_BASE =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-night-900 placeholder:text-slate-400 ' +
  'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 ' +
  'dark:border-night-600 dark:bg-night-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400';

const FIELD_BASE_SM =
  'w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-night-900 placeholder:text-slate-400 ' +
  'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 ' +
  'dark:border-night-600 dark:bg-night-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400';

// Recherche/création rapide de client — utilisé dans le formulaire de réception Chine.
export function ClientPicker({ selectedClient, onSelect, erreur }: ClientPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState({ fullName: '', phoneGn: '', phoneWhatsapp: '' });
  const { erreurs, valider, effacer } = useValidation(schemaClient);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const clients = await searchClients(query);
        setResults(clients);
      } finally {
        setLoading(false);
      }
      // Debounce à 500ms plutôt que 300 — la latence réseau vers la base (Neon, hors Guinée)
      // dépasse souvent 1s par requête ; un debounce plus court laisse presque chaque frappe
      // déclencher son propre appel au lieu d'attendre une pause dans la saisie.
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function handleCreate() {
    if (!valider({ ...newClient, phoneCn: '' })) return;
    setCreating(true);
    try {
      const client = await createClient(newClient);
      onSelect(client);
      notify.success('Client créé avec succès.');
      setShowCreateForm(false);
      setShowDropdown(false);
      setQuery('');
      setNewClient({ fullName: '', phoneGn: '', phoneWhatsapp: '' });
    } catch (err) {
      // Auparavant silencieux : un refus du serveur ne laissait aucun message
      notify.error(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  if (selectedClient) {
    return (
      <div className="rounded-lg border border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10 px-3 py-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-900 dark:text-sky-100">{selectedClient.fullName}</p>
          <p className="text-xs text-sky-600 dark:text-sky-400">{selectedClient.clientCode}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null as unknown as Client)}
          className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
        >
          Changer
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Rechercher un client (nom, code, téléphone)…"
        aria-label="Rechercher un client"
        aria-invalid={erreur ? true : undefined}
        className={`${FIELD_BASE} ${erreur ? 'border-red-400' : ''}`}
      />

      <AnimatePresence>
        {showDropdown && (query.trim() || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg dark:bg-night-800 dark:border-night-600 max-h-64 overflow-y-auto"
          >
            {loading && <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Recherche…</div>}

            {!loading &&
              results.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    onSelect(client);
                    setShowDropdown(false);
                    setQuery('');
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-night-700 border-b border-slate-100 dark:border-night-700 last:border-0"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-200">{client.fullName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {client.clientCode} {client.phoneGn ? `· ${client.phoneGn}` : ''}
                  </p>
                </button>
              ))}

            {!loading && results.length === 0 && !showCreateForm && (
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(true);
                  setNewClient((c) => ({ ...c, fullName: query }));
                }}
                className="w-full text-left px-3 py-2 text-sm text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10"
              >
                + Créer un nouveau client
              </button>
            )}

            {showCreateForm && (
              <div className="p-3 space-y-2 bg-slate-50 dark:bg-night-700">
                <div>
                  <input
                    type="text"
                    placeholder="Nom complet *"
                    aria-label="Nom complet"
                    aria-invalid={erreurs.fullName ? true : undefined}
                    value={newClient.fullName}
                    onChange={(e) => {
                      setNewClient((c) => ({ ...c, fullName: e.target.value }));
                      effacer('fullName');
                    }}
                    className={`${FIELD_BASE_SM} ${erreurs.fullName ? 'border-red-400' : ''}`}
                  />
                  {erreurs.fullName && (
                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {erreurs.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Téléphone Guinée (+224…)"
                    aria-label="Téléphone Guinée (+224…)"
                    aria-invalid={erreurs.phoneGn ? true : undefined}
                    value={newClient.phoneGn}
                    onChange={(e) => {
                      setNewClient((c) => ({ ...c, phoneGn: e.target.value }));
                      effacer('phoneGn');
                    }}
                    className={`${FIELD_BASE_SM} ${erreurs.phoneGn ? 'border-red-400' : ''}`}
                  />
                  {erreurs.phoneGn && (
                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {erreurs.phoneGn}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="WhatsApp"
                    aria-label="WhatsApp"
                    aria-invalid={erreurs.phoneWhatsapp ? true : undefined}
                    value={newClient.phoneWhatsapp}
                    onChange={(e) => {
                      setNewClient((c) => ({ ...c, phoneWhatsapp: e.target.value }));
                      effacer('phoneWhatsapp');
                    }}
                    className={`${FIELD_BASE_SM} ${erreurs.phoneWhatsapp ? 'border-red-400' : ''}`}
                  />
                  {erreurs.phoneWhatsapp && (
                    <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {erreurs.phoneWhatsapp}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={creating}
                    loading={creating}
                    onClick={handleCreate}
                    className="flex-1"
                  >
                    {creating ? 'Création…' : 'Créer'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
