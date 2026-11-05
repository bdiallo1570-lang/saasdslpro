import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ExternalLink, FileText, MessageCircle, Receipt, ShieldCheck } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { DocumentSummary, getPublicDocument, publicPdfUrl } from '../documents.api';

// Numéro WhatsApp de l'entreprise (le même que sur les factures et la landing)
const WHATSAPP_DSL = '224628674895';
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Page publique ouverte par le client depuis le lien WhatsApp ou le QR code de son PDF : résumé du
// document et téléchargement, sans compte. L'accès repose sur la signature du lien.
export default function DocumentPage() {
  const { token = '' } = useParams();
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.title = 'Votre document — DSL Air Cargo';
    getPublicDocument(token)
      .then(setDoc)
      .catch(() => setFailed(true));
  }, [token]);

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-ink-950 px-4 py-10 text-cream">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18),transparent_70%)]" />

      <Link to="/" className="relative flex items-center gap-3">
        <img src="/images/backgrounds/dsl-logo-200.png" alt="" className="h-11 w-11 rounded-full bg-white object-cover" />
        <span className="font-editorial text-2xl">DSL Air Cargo</span>
      </Link>

      <main className="relative mt-10 w-full max-w-md">
        {!doc && !failed && (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            <div className="h-9 w-56 animate-pulse rounded bg-white/10" />
            <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-12 animate-pulse rounded-xl bg-white/10" />
          </div>
        )}

        {failed && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center"
          >
            <FileText size={34} className="mx-auto text-slate-500" />
            <h1 className="mt-4 text-xl font-semibold">Ce lien n'est plus valable</h1>
            <p className="mt-2 text-sm text-slate-400">
              Il a peut-être expiré ou a été mal copié. Écrivez-nous, nous vous renvoyons votre document tout de suite.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_DSL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-ink-950 hover:bg-emerald-400"
            >
              <MessageCircle size={17} />
              Nous écrire sur WhatsApp
            </a>
          </motion.div>
        )}

        {doc && <DocumentCard doc={doc} token={token} />}
      </main>

      <p className="relative mt-8 flex items-center gap-1.5 text-center text-xs text-slate-400">
        <ShieldCheck size={13} className="shrink-0" />
        Lien personnel et sécurisé : ne le partagez qu'avec des personnes de confiance.
      </p>
    </div>
  );
}

function DocumentCard({ doc, token }: { doc: DocumentSummary; token: string }) {
  const isFacture = doc.type === 'facture';
  const Icon = isFacture ? FileText : Receipt;
  const prenom = doc.clientNom.split(' ')[0];
  const date = new Date(doc.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const solde = doc.reste <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl"
    >
      <div className="p-7">
        <p className="text-sm text-slate-400">Bonjour {prenom},</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ember-400/15 text-ember-400">
            <Icon size={21} />
          </span>
          <div>
            <h1 className="font-label text-[11px] uppercase tracking-[0.2em] text-ember-400">
              {isFacture ? 'Votre facture' : 'Votre reçu de paiement'}
            </h1>
            <p className="text-lg font-semibold">{doc.numero}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/[0.04] p-5">
          <p className="text-xs text-slate-400">{isFacture ? 'Montant de la facture' : 'Montant reçu'}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {formatNumber(doc.montant)} <span className="text-lg font-semibold text-slate-300">{doc.devise}</span>
          </p>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-400">{isFacture ? `Émise le ${date}` : `Payé le ${date}`}</span>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                solde ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
              }`}
            >
              {solde ? 'Facture soldée' : `Reste ${formatNumber(doc.reste)} GNF`}
            </span>
          </div>
          {!isFacture && <p className="mt-2 text-xs text-slate-400">Facture {doc.factureNumero}</p>}
        </div>

        <a
          href={publicPdfUrl(token, true)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ember-400 px-5 py-4 text-base font-semibold text-ink-950 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.7)] transition-colors hover:bg-ember-300"
        >
          <Download size={19} />
          Télécharger le PDF
        </a>
        <a
          href={publicPdfUrl(token, false)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
        >
          <ExternalLink size={16} />
          Ouvrir sans télécharger
        </a>
      </div>
      <a
        href={`https://wa.me/${WHATSAPP_DSL}?text=${encodeURIComponent(`Bonjour DSL, j'ai une question sur le document ${doc.numero}.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-4 text-sm text-slate-300 transition-colors hover:text-white"
      >
        <MessageCircle size={16} className="text-emerald-400" />
        Une question ? Écrivez-nous sur WhatsApp
      </a>
    </motion.div>
  );
}
