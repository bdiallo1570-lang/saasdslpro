import { useState, FormEvent, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimate } from 'framer-motion';
import { ArrowLeft, KeyRound, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { Button, Input, notify } from '@/ui';
import { LAND_PATHS, MAP_HEIGHT, MAP_WIDTH, project } from '@/modules/landing/maritime/seaMap';

type LoginMode = 'password' | 'otp';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const OTP_LENGTH = 6;

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithPassword, loginWithOtp } = useAuth();
  const [scope, animate] = useAnimate();

  const [mode, setMode] = useState<LoginMode>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Petit tremblement du formulaire en cas d'échec, en plus du message
  function fail(err: unknown) {
    setError(extractErrorMessage(err));
    animate(scope.current, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.45 });
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { redirectTo } = await loginWithPassword(identifier, password);
      notify.success('Connexion réussie — bienvenue !');
      navigate(redirectTo);
    } catch (err) {
      fail(err);
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
      fail(err);
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
      fail(err);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: LoginMode) {
    setMode(next);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-night-950 lg:grid lg:grid-cols-[1.15fr_1fr]">
      <BrandPanel />

      {/* overflow-clip (et non hidden) : le focus du champ OTP ne peut pas faire défiler la colonne */}
      <main className="relative flex min-h-screen items-center justify-center overflow-clip px-4 py-10">
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-cargo-500/10 blur-3xl lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.15 }}
          className="relative w-full max-w-md"
        >
          <div ref={scope}>
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <img src="/images/backgrounds/dsl-logo-200.png" alt="" className="h-10 w-10 rounded-full" />
              <span className="font-editorial text-2xl text-white">DSL Air Cargo</span>
            </div>

            <h1 className="font-editorial text-4xl text-white">Bon retour</h1>
            <p className="mt-2 text-sm text-slate-400">Connectez-vous à votre espace de gestion.</p>

            <div className="mt-8 mb-6 flex rounded-xl bg-night-800 p-1 text-sm font-medium ring-1 ring-inset ring-white/5">
              {(
                [
                  ['password', 'Mot de passe', KeyRound],
                  ['otp', 'Code WhatsApp', MessageCircle],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 transition-colors ${
                    mode === key ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  onClick={() => switchMode(key)}
                >
                  {mode === key && (
                    <motion.span
                      layoutId="login-tab"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-lg bg-night-600 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_6px_20px_-8px_rgba(0,0,0,0.6)]"
                    />
                  )}
                  <Icon size={15} className="relative" />
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              {mode === 'password' ? (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                  exit={{ opacity: 0, x: 12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4"
                >
                  <Input
                    label="Téléphone ou email"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+224 6XX XX XX XX ou email"
                    className="dark:bg-night-800 dark:border-night-600"
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-password" className="block text-sm font-medium text-slate-300">
                        Mot de passe
                      </label>
                      <Link to="/mot-de-passe-oublie" className="text-xs text-sky-400 hover:underline">
                        Mot de passe oublié ?
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="dark:bg-night-800 dark:border-night-600"
                    />
                  </div>
                  <Button type="submit" loading={loading} fullWidth size="lg">
                    Se connecter
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
                  exit={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleOtpSubmit}
                  className="space-y-4"
                >
                  <Input
                    label="Téléphone ou email"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+224 6XX XX XX XX ou email"
                    className="dark:bg-night-800 dark:border-night-600"
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
                      <OtpInput value={otpCode} onChange={setOtpCode} />
                      <Button type="submit" loading={loading} disabled={otpCode.length < OTP_LENGTH} fullWidth size="lg">
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

            <p className="mt-8 text-center text-xs text-slate-400">
              <Link to="/" className="group inline-flex items-center gap-1.5 transition-colors hover:text-slate-300">
                <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                Retour à l'accueil
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Saisie du code en 6 cases : un vrai <input> transparent posé par-dessus garde le clavier
// numérique, le collage et l'autocomplétion SMS ; les cases ne font qu'afficher.
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label htmlFor="login-otp" className="mb-1.5 block text-sm font-medium text-slate-300">
        Code reçu (6 chiffres)
      </label>
      <div className="relative" onClick={() => inputRef.current?.focus()}>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: OTP_LENGTH }, (_, i) => {
            const char = value[i];
            const active = focused && (i === value.length || (i === OTP_LENGTH - 1 && value.length === OTP_LENGTH));
            return (
              <div
                key={i}
                className={`relative flex h-14 items-center justify-center rounded-xl border bg-night-800 text-2xl font-semibold tabular-nums text-white transition-colors ${
                  active ? 'border-sky-400 ring-2 ring-sky-400/30' : char ? 'border-night-500' : 'border-night-600'
                }`}
              >
                <AnimatePresence>
                  {char && (
                    <motion.span
                      key={char}
                      initial={{ scale: 0.4, opacity: 0, y: 6 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 24 }}
                    >
                      {char}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && !char && <span className="h-6 w-px animate-pulse bg-sky-400" />}
              </div>
            );
          })}
        </div>
        <input
          ref={inputRef}
          id="login-otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          maxLength={OTP_LENGTH}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
        />
      </div>
    </div>
  );
}

// Panneau de marque (grand écran) : carte en pointillés et vol Guangzhou → Conakry qui se trace,
// avec l'avion qui suit l'arc en boucle.
const GUANGZHOU = project([113.3, 23.1]);
const CONAKRY = project([-13.7, 9.5]);
const ARC = `M${GUANGZHOU.join(',')} Q${(GUANGZHOU[0] + CONAKRY[0]) / 2},${Math.min(GUANGZHOU[1], CONAKRY[1]) - 170} ${CONAKRY.join(',')}`;

const STEPS = ['Réception à Guangzhou', 'Groupage et vol', 'Remise à Madina'];

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden border-r border-white/5 bg-[radial-gradient(ellipse_at_30%_20%,rgba(14,165,233,0.16),transparent_60%),radial-gradient(ellipse_at_80%_90%,rgba(245,158,11,0.12),transparent_55%)] lg:flex lg:flex-col lg:justify-between lg:p-12">
      {/* Photo d'ambiance (générée pour DSL) : lent dézoom façon Ken Burns sous la carte */}
      <motion.img
        src="/images/freight/air.jpg"
        alt=""
        aria-hidden="true"
        initial={{ scale: 1.18, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.32 }}
        transition={{ scale: { duration: 14, ease: 'easeOut' }, opacity: { duration: 1.6 } }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-night-950/70 via-night-950/40 to-night-950/95" />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className="relative flex items-center gap-3"
      >
        <img src="/images/backgrounds/dsl-logo-200.png" alt="" className="h-11 w-11 rounded-full" />
        <span className="font-editorial text-2xl text-white">DSL Air Cargo</span>
      </motion.div>

      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="relative w-full" aria-hidden="true">
        <defs>
          <pattern id="login-dots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="1.3" fill="rgba(148,163,184,0.28)" />
          </pattern>
          <linearGradient id="login-arc" x1="1" x2="0" y1="0" y2="0">
            <stop offset="0" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
          <filter id="login-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
          {LAND_PATHS.map((d, i) => (
            <path key={i} d={d} fill="url(#login-dots)" />
          ))}
        </motion.g>

        <motion.path
          d={ARC}
          fill="none"
          stroke="url(#login-arc)"
          strokeWidth="6"
          filter="url(#login-glow)"
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.path
          d={ARC}
          fill="none"
          stroke="url(#login-arc)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.5 }}
        />

        {[
          { p: GUANGZHOU, label: 'Guangzhou', color: '#38bdf8', anchor: 'end' as const, dx: -14 },
          { p: CONAKRY, label: 'Conakry', color: '#f59e0b', anchor: 'start' as const, dx: 14 },
        ].map(({ p, label, color, anchor, dx }) => (
          <g key={label}>
            <circle cx={p[0]} cy={p[1]} r="5" fill={color} />
            <circle cx={p[0]} cy={p[1]} r="5" fill="none" stroke={color} strokeWidth="1.5">
              <animate attributeName="r" values="5;22" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <text x={p[0] + dx} y={p[1] + 5} textAnchor={anchor} fill="rgba(226,232,240,0.85)" fontSize="17" fontFamily="inherit">
              {label}
            </text>
          </g>
        ))}

        {/* Avion qui parcourt l'arc en boucle, orienté selon la trajectoire */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;1" begin="2.6s" dur="0.4s" fill="freeze" />
          <g>
            <animateMotion dur="6s" begin="2.6s" repeatCount="indefinite" rotate="auto" path={ARC} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1" />
            <path d="M14 0 L-8 -9 L-4 0 L-8 9 Z" fill="#fff" />
          </g>
        </g>
      </svg>

      <div className="relative">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.3 }}
          className="max-w-md font-editorial text-5xl leading-[1.05] text-cream"
        >
          Chaque colis, de Guangzhou à Madina.
        </motion.p>
        <ol className="mt-8 flex gap-6">
          {STEPS.map((step, i) => (
            <motion.li
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.6 + i * 0.12 }}
              className="flex items-center gap-2 text-sm text-slate-400"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 font-label text-[11px] text-slate-300">
                {i + 1}
              </span>
              {step}
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
