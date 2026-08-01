import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-night-900 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-2xl font-semibold text-white">Accès refusé</h1>
        <p className="mt-2 text-slate-400 max-w-sm">
          Votre rôle ne dispose pas des permissions nécessaires pour consulter cette page.
        </p>
        <Link to="/" className="mt-6 inline-block text-sky-400 hover:underline text-sm">
          ← Retour à l'accueil
        </Link>
      </motion.div>
    </div>
  );
}
