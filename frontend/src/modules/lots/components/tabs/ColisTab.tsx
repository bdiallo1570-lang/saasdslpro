import { Colis, StatutPaiementColis, dateReceptionEffective } from '@/modules/colis/colis.api';
import { COLIS_STATUS_LABELS } from '@/modules/landing/trackingLabels';
import { STATUT_PAIEMENT_LABELS } from '../../paiementsLot.api';
import { Card, Badge } from '@/ui';

const STATUT_PAIEMENT_TONE: Record<StatutPaiementColis, 'red' | 'amber' | 'green' | 'sky'> = {
  IMPAYE: 'red',
  PARTIEL: 'amber',
  SOLDE: 'green',
  TROP_PERCU: 'sky',
};

interface ColisTabProps {
  colis: Colis[];
}

// Onglet "Colis" — liste du manifeste avec colonnes Payé / Reste à payer + pastille de statut
// (rouge Impayé, orange Partiel, vert Soldé, bleu Trop-perçu).
export function ColisTab({ colis }: ColisTabProps) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-night-700">
        <h2 className="font-medium text-night-800 dark:text-slate-100">Colis du lot ({colis.length})</h2>
      </div>
      {colis.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 px-5 py-6">Aucun colis dans ce lot.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-night-700">
                <th className="px-5 py-3 font-medium">Colis</th>
                <th className="px-3 py-3 font-medium">Reçu le</th>
                <th className="px-3 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">Statut</th>
                <th className="px-3 py-3 font-medium text-right">Dû</th>
                <th className="px-3 py-3 font-medium text-right">Payé</th>
                <th className="px-3 py-3 font-medium text-right">Reste à payer</th>
                <th className="px-5 py-3 font-medium">Paiement</th>
              </tr>
            </thead>
            <tbody>
              {colis.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 dark:border-night-700 last:border-0">
                  <td className="px-5 py-3 font-medium text-night-800 dark:text-slate-100">{c.trackingId}</td>
                  <td className="px-3 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(dateReceptionEffective(c)).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{c.client.fullName}</td>
                  <td className="px-3 py-3">
                    <Badge tone="slate">{COLIS_STATUS_LABELS[c.status] ?? c.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {c.montantDuGnf !== undefined ? Math.round(c.montantDuGnf).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-green-600 dark:text-emerald-400">
                    {c.montantPayeGnf !== undefined ? Math.round(c.montantPayeGnf).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-night-900 dark:text-slate-100">
                    {c.resteAPayerGnf !== undefined ? Math.round(c.resteAPayerGnf).toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {c.statutPaiement && (
                      <Badge tone={STATUT_PAIEMENT_TONE[c.statutPaiement]}>
                        {STATUT_PAIEMENT_LABELS[c.statutPaiement]}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
