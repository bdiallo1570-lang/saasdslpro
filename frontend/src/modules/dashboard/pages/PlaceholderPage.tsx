import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/layout/AppShell';
import { PageHeader, StatCard, Button } from '@/ui';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// Page de destination générique par rôle. Sera remplacée module par module
// dans les phases suivantes (voir GEMINI.md §4 Modules fonctionnels).
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { user } = useAuth();

  // Démo brève de l'état de chargement (skeleton) avant d'afficher les valeurs placeholder.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppShell>
      <PageHeader title={title} description={description} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={item}>
          <StatCard label="CA du jour" value={0} suffix="GNF" tone="sky" loading={loading} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Colis en transit" value={0} tone="neutral" loading={loading} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Impayés" value={0} suffix="GNF" tone="cargo" loading={loading} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Lots actifs" value={0} tone="green" loading={loading} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.3 }}
        className="mt-10 text-center"
      >
        {user?.role === 'Admin' && (
          <Link to="/creances">
            <Button variant="cargo">Voir le suivi des créances &amp; impayés</Button>
          </Link>
        )}
        <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
          Module en cours de développement — voir GEMINI.md, phases de développement.
        </p>
      </motion.div>
    </AppShell>
  );
}
