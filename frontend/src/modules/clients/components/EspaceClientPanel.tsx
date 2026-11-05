import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, KeyRound, MessageCircle, UserCheck } from 'lucide-react';
import { apiClient, ApiResponse, extractErrorMessage } from '@/lib/apiClient';
import { copyToClipboard } from '@/lib/clipboard';
import { Button, notify } from '@/ui';
import { whatsappUrl } from '@/modules/documents/documents.api';

interface Etat {
  actif: boolean;
  identifiant: string | null;
}

interface Acces {
  identifiant: string;
  motDePasse: string;
  dejaActif: boolean;
}

// Onglet « Espace client » de la fiche client : active le portail où le client retrouve ses
// factures et reçus, puis envoie ses accès sur WhatsApp. Le mot de passe n'est visible qu'ici,
// juste après sa création (il n'est conservé que haché).
export function EspaceClientPanel({ clientId, clientNom }: { clientId: string; clientNom: string }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [acces, setAcces] = useState<Acces | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get<ApiResponse<Etat>>(`/clients/${clientId}/espace-client`)
      .then((res) => setEtat(res.data.data!))
      .catch(() => setEtat({ actif: false, identifiant: null }));
  }, [clientId]);

  async function activer() {
    if (etat?.actif && !window.confirm("Générer de nouveaux accès ? L'ancien mot de passe ne fonctionnera plus.")) return;
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<Acces>>(`/clients/${clientId}/espace-client`);
      const data = res.data.data!;
      setAcces(data);
      setEtat({ actif: true, identifiant: data.identifiant });
      notify.success(data.dejaActif ? 'Nouveaux accès générés.' : 'Espace client activé.');
    } catch (err) {
      notify.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const message = acces
    ? `Bonjour ${clientNom.split(' ')[0]}, votre espace client DSL Air Cargo est prêt : retrouvez et téléchargez toutes vos factures et reçus.\n\n` +
      `Connexion : ${window.location.origin}/connexion\nIdentifiant : ${acces.identifiant}\nMot de passe : ${acces.motDePasse}\n\n` +
      'Gardez ce message pour vous. DSL Air Cargo'
    : '';

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-night-700">
        <UserCheck size={18} className={etat?.actif ? 'mt-0.5 text-emerald-500' : 'mt-0.5 text-slate-400'} />
        <div>
          <p className="font-medium text-night-900 dark:text-slate-100">
            {etat === null ? 'Chargement…' : etat.actif ? 'Espace client actif' : 'Espace client non activé'}
          </p>
          <p className="mt-0.5 text-slate-500 dark:text-slate-400">
            {etat?.actif
              ? `Le client se connecte avec son numéro ${etat.identifiant} et retrouve ses factures et reçus.`
              : 'Le client pourra se connecter avec son numéro de téléphone pour retrouver et télécharger ses factures et reçus.'}
          </p>
        </div>
      </div>

      {acces && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Accès à transmettre au client (affichés une seule fois)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Identifiant</p>
              <p className="font-mono font-semibold text-night-900 dark:text-slate-100">{acces.identifiant}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mot de passe</p>
              <p className="font-mono text-base font-semibold tracking-wider text-night-900 dark:text-slate-100">
                {acces.motDePasse}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={whatsappUrl(acces.identifiant, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-emerald-400"
            >
              <MessageCircle size={15} />
              Envoyer les accès sur WhatsApp
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => notify[(await copyToClipboard(message)) ? 'success' : 'error']('Message copié.')}
            >
              <Copy size={14} className="mr-1.5" />
              Copier
            </Button>
          </div>
        </motion.div>
      )}

      <Button
        variant={etat?.actif ? 'secondary' : 'primary'}
        fullWidth
        loading={loading}
        onClick={activer}
        disabled={etat === null}
      >
        <KeyRound size={15} className="mr-1.5" />
        {etat?.actif ? 'Générer de nouveaux accès' : "Activer l'espace client"}
      </Button>
    </div>
  );
}
