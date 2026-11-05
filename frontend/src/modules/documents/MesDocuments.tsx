import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Receipt } from 'lucide-react';
import { apiClient, ApiResponse } from '@/lib/apiClient';
import { formatNumber } from '@/lib/format';
import { Card, Tabs } from '@/ui';
import { publicPdfUrl } from './documents.api';

interface FactureClient {
  id: string;
  numero: string;
  date: string;
  montant: number;
  devise: string;
  paye: number;
  reste: number;
  colis: number;
  token: string;
}

interface RecuClient {
  id: string;
  numero: string;
  date: string;
  montant: number;
  devise: string;
  factureNumero: string;
  token: string;
}

interface MesDocumentsData {
  client: { nom: string; code: string } | null;
  factures: FactureClient[];
  recus: RecuClient[];
}

const dateFr = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

// Portail client : ses factures et reçus, téléchargeables en un geste (même route publique signée
// que les liens envoyés sur WhatsApp).
export function MesDocuments() {
  const [data, setData] = useState<MesDocumentsData | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState('factures');

  useEffect(() => {
    apiClient
      .get<ApiResponse<MesDocumentsData>>('/me/documents')
      .then((res) => setData(res.data.data!))
      .catch(() => setFailed(true));
  }, []);

  const resteTotal = data?.factures.reduce((s, f) => s + f.reste, 0) ?? 0;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-night-900 dark:text-slate-100">Mes factures et reçus</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data?.client ? `${data.client.nom} · ${data.client.code}` : 'Téléchargez vos documents à tout moment.'}
          </p>
        </div>
        {data && data.factures.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Reste à payer</p>
            <p className={`text-lg font-bold tabular-nums ${resteTotal > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {resteTotal > 0 ? `${formatNumber(resteTotal)} GNF` : 'Tout est réglé'}
            </p>
          </div>
        )}
      </div>

      {failed && <p className="text-sm text-red-500">Impossible de charger vos documents. Réessayez dans un instant.</p>}
      {!data && !failed && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-night-700" />
          ))}
        </div>
      )}
      {data && !data.client && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-night-700 dark:text-slate-400">
          Votre compte n'est pas encore relié à votre fiche client. Contactez DSL Air Cargo sur WhatsApp pour l'activer.
        </p>
      )}

      {data?.client && (
        <>
          <Tabs
            tabs={[
              { key: 'factures', label: `Factures (${data.factures.length})` },
              { key: 'recus', label: `Reçus (${data.recus.length})` },
            ]}
            active={tab}
            onChange={setTab}
          />
          <div className="mt-3 space-y-2">
            {tab === 'factures' &&
              (data.factures.length === 0 ? (
                <Vide texte="Aucune facture pour le moment." />
              ) : (
                data.factures.map((f, i) => (
                  <Ligne
                    key={f.id}
                    index={i}
                    icon={<FileText size={17} />}
                    titre={f.numero}
                    detail={`${dateFr(f.date)} · ${f.colis} colis · ${formatNumber(f.montant)} ${f.devise}`}
                    statut={f.reste > 0 ? { texte: `Reste ${formatNumber(f.reste)} GNF`, ok: false } : { texte: 'Payée', ok: true }}
                    token={f.token}
                  />
                ))
              ))}
            {tab === 'recus' &&
              (data.recus.length === 0 ? (
                <Vide texte="Aucun paiement enregistré pour le moment." />
              ) : (
                data.recus.map((r, i) => (
                  <Ligne
                    key={r.id}
                    index={i}
                    icon={<Receipt size={17} />}
                    titre={`${formatNumber(r.montant)} ${r.devise}`}
                    detail={`${dateFr(r.date)} · Reçu ${r.numero} · Facture ${r.factureNumero}`}
                    token={r.token}
                  />
                ))
              ))}
          </div>
        </>
      )}
    </Card>
  );
}

function Vide({ texte }: { texte: string }) {
  return <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">{texte}</p>;
}

function Ligne({
  index,
  icon,
  titre,
  detail,
  statut,
  token,
}: {
  index: number;
  icon: React.ReactNode;
  titre: string;
  detail: string;
  statut?: { texte: string; ok: boolean };
  token: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-night-700"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cargo-500/10 text-cargo-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium text-night-900 dark:text-slate-100">
          {titre}
          {statut && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                statut.ok ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {statut.texte}
            </span>
          )}
        </p>
        <p className="text-xs leading-snug text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <a
        href={publicPdfUrl(token, true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-night-900 transition-colors hover:bg-slate-200 dark:bg-night-700 dark:text-slate-100 dark:hover:bg-night-600"
        aria-label={`Télécharger ${titre}`}
      >
        <Download size={14} />
        <span className="hidden sm:inline">PDF</span>
      </a>
    </motion.div>
  );
}
