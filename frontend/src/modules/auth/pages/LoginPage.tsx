import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { Button, Input, notify } from '@/ui';

type LoginMode = 'password' | 'otp';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithPassword, loginWithOtp } = useAuth();

  const [mode, setMode] = useState<LoginMode>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { redirectTo } = await loginWithPassword(identifier, password);
      notify.success('Connexion réussie — bienvenue !');
      navigate(redirectTo);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp() {
    setError(null);
    setLoading(true);
    try {
      await apiClient.post('/auth/otp/request', { identifier });
      setOtpSent(true);
      notify.info('Code envoyé par WhatsApp/SMS si ce compte existe.');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { redirectTo } = await loginWithOtp(identifier, otpCode);
      notify.success('Connexion réussie — bienvenue !');
      navigate(redirectTo);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-night-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cargo-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-night-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-night-600 p-8"
      >
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 mx-auto flex items-center justify-center text-white font-bold text-lg shadow-glow-sky">
            DSL
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">Connexion à DSL Cargo</h1>
          <p className="text-sm text-slate-400 mt-1">Accédez à votre espace de gestion</p>
        </div>

        <div className="flex bg-night-700 rounded-lg p-1 mb-6 text-sm font-medium">
          <button
            className={`relative flex-1 py-2 rounded-md transition-colors ${
              mode === 'password' ? 'text-white' : 'text-slate-400'
            }`}
            onClick={() => {
              setMode('password');
              setError(null);
            }}
          >
            {mode === 'password' && (
              <motion.span
                layoutId="login-tab"
                className="absolute inset-0 bg-night-600 rounded-md shadow"
              />
            )}
            <span className="relative">Mot de passe</span>
          </button>
          <button
            className={`relative flex-1 py-2 rounded-md transition-colors ${
              mode === 'otp' ? 'text-white' : 'text-slate-400'
            }`}
            onClick={() => {
              setMode('otp');
              setError(null);
            }}
          >
            {mode === 'otp' && (
              <motion.span
                layoutId="login-tab"
                className="absolute inset-0 bg-night-600 rounded-md shadow"
              />
            )}
            <span className="relative">Code OTP</span>
          </button>
        </div>

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
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {mode === 'password' ? (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handlePasswordSubmit}
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
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-300">Mot de passe</label>
                  <Link to="/mot-de-passe-oublie" className="text-xs text-sky-400 hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="dark:bg-night-700 dark:border-night-600"
                />
              </div>
              <Button type="submit" loading={loading} fullWidth size="lg">
                Se connecter
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="otp"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleOtpSubmit}
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

              {!otpSent ? (
                <Button
                  type="button"
                  onClick={handleRequestOtp}
                  loading={loading}
                  disabled={!identifier}
                  fullWidth
                  size="lg"
                >
                  Recevoir un code par WhatsApp/SMS
                </Button>
              ) : (
                <>
                  <Input
                    label="Code reçu (6 chiffres)"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="text-center tracking-widest dark:bg-night-700 dark:border-night-600"
                  />
                  <Button type="submit" loading={loading} fullWidth size="lg">
                    Valider le code
                  </Button>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="w-full text-sky-400 text-sm hover:underline"
                  >
                    Renvoyer le code
                  </button>
                </>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link to="/" className="hover:underline">
            ← Retour à l'accueil
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
