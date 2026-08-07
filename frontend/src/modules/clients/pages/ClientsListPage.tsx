import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { listAllClients, ClientListItem } from '../clients.api';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, Card, Badge, Input, Select } from '@/ui';

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

const CORRIDOR_TOUS = 'Tous les corridors';

// Liste complète des clients avec nombre de colis associés — accessible à Admin, Agent Chine
// et Agent Guinée. Recherche par nom + filtre par corridor (un seul corridor actif aujourd'hui,
// Chine → Guinée — le filtre reste prêt à accueillir de futurs corridors sans changement).
export default function ClientsListPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [corridorFiltre, setCorridorFiltre] = useState(CORRIDOR_TOUS);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setClients(await listAllClients());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const corridors = useMemo(
    () => [CORRIDOR_TOUS, ...Array.from(new Set(clients.map((c) => c.corridor)))],
    [clients],
  );

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      const matchQuery = !q || c.fullName.toLowerCase().includes(q) || c.clientCode.toLowerCase().includes(q);
      const matchCorridor = corridorFiltre === CORRIDOR_TOUS || c.corridor === corridorFiltre;
      return matchQuery && matchCorridor;
    });
  }, [clients, query, corridorFiltre]);

  return (
    <AppShell>
      <PageHeader
        title="Clients"
        description="Vue d'ensemble de tous les clients, leur corridor et leur nombre de colis."
      />

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700 space-y-3">
          <h2 className="font-medium text-night-800 dark:text-slate-100">
            Clients ({filteredClients.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom ou code client..."
              />
            </div>
            <Select value={corridorFiltre} onChange={(e) => setCorridorFiltre(e.target.value)}>
              {corridors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Chargement…</p>
        ) : filteredClients.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">
            {query.trim() || corridorFiltre !== CORRIDOR_TOUS
              ? 'Aucun client ne correspond à ces critères.'
              : 'Aucun client enregistré pour le moment.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-night-700">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-3 py-3 font-medium">Téléphone</th>
                  <th className="px-3 py-3 font-medium">Corridor</th>
                  <th className="px-5 py-3 font-medium text-right">Colis</th>
                </tr>
              </thead>
              <motion.tbody variants={listContainer} initial="hidden" animate="show">
                {filteredClients.map((c) => (
                  <motion.tr
                    key={c.id}
                    variants={listItem}
                    className="border-b border-slate-100 dark:border-night-700 last:border-0"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-night-800 dark:text-slate-100">{c.fullName}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{c.clientCode}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                      {c.phoneWhatsapp || c.phoneGn || c.phoneCn || '—'}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone="sky">{c.corridor}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-night-900 dark:text-slate-100">
                      {c.nombreColis}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
