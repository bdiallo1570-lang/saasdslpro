import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { Button, Input, notify } from '@/ui';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'demande' | 'confirmation'>('demande');
  const [identifier, setIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/password/reset-request', { identifier });
      setMessage(res.data.data.message);
      setStep('confirmation');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post('/auth/password/reset-confirm', { identifier, otpCode, newPassword });
      notify.success('Mot de passe réinitialisé — vous pouvez vous connecter.');
      navigate('/connexion');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-night-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-night-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-night-600 p-8"
      >
        <h1 className="text-xl font-semibold text-white text-center mb-1">
          Réinitialiser le mot de passe
        </h1>
        <p className="text-sm text-slate-400 text-center mb-6">
          {step === 'demande'
            ? 'Recevez un code de vérification par WhatsApp/SMS.'
            : 'Saisissez le code reçu et votre nouveau mot de passe.'}
        </p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 overflow-hidden"
            >
              {error}
            </motion.div>
          )}
          {message && step === 'confirmation' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 overflow-hidden"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 'demande' ? (
            <motion.form
              key="demande"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              onSubmit={handleRequest}
              className="space-y-4"
            >
              <Input
                label="Téléphone ou email"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+224 6XX XX XX XX ou email"
                className="dark:bg-night-700 dark:border-night-600"
              />
              <Button type="submit" loading={loading} fullWidth size="lg">
                Envoyer le code
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="confirmation"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              onSubmit={handleConfirm}
              className="space-y-4"
            >
              <Input
                label="Code reçu (6 chiffres)"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="text-center tracking-widest dark:bg-night-700 dark:border-night-600"
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8 caractères minimum"
                className="dark:bg-night-700 dark:border-night-600"
              />
              <Button type="submit" loading={loading} fullWidth size="lg">
                Réinitialiser le mot de passe
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/connexion" className="hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
