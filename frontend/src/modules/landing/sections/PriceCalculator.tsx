import { useState, useMemo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Package, ShieldAlert, MapPin } from 'lucide-react';
import { WarehouseAddressModal } from '@/modules/warehouses/WarehouseAddressModal';
import { StatCounter } from '@/ui';
import { AuroraBackground } from './AuroraBackground';
import { CursorSpotlight } from './CursorSpotlight';

interface PriceCalculatorProps {
  isDark: boolean;
}

// Tarifs affichés publiquement sur la landing — calcul 100% local (aucun appel réseau),
// pour un résultat instantané même sur une connexion mobile lente ou instable. Si les
// tarifs changent, mettre à jour ces valeurs (déjà affichées en dur dans les cartes ci-dessous).
const CATEGORIES = [
  {
    value: 'STANDARD' as const,
    label: 'Cargo Standard',
    pricePerKg: 160000,
    price: '160 000 GNF/kg',
    icon: Package,
    examples: 'Habits, chaussures, petits accessoires, jouets, vaisselle, articles ménagers…',
  },
  {
    value: 'RISQUE' as const,
    label: 'Cargo Sensible',
    pricePerKg: 180000,
    price: '180 000 GNF/kg',
    icon: ShieldAlert,
    examples: 'Batteries, liquides, produits électroniques, cosmétiques, produits inflammables…',
  },
];

export const PriceCalculator = forwardRef<HTMLDivElement, PriceCalculatorProps>(({ isDark }, ref) => {
  const [categorie, setCategorie] = useState<'STANDARD' | 'RISQUE'>('STANDARD');
  const [poidsKg, setPoidsKg] = useState(5);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const selectedCategorie = CATEGORIES.find((c) => c.value === categorie)!;
  const totalEstime = useMemo(
    () => (poidsKg > 0 ? poidsKg * selectedCategorie.pricePerKg : 0),
    [poidsKg, selectedCategorie],
  );

  return (
    <section
      id="calculateur"
      ref={ref}
      className={`relative overflow-hidden py-20 sm:py-28 transition-colors duration-300 ${
        isDark ? 'bg-night-800' : 'bg-slate-50'
      }`}
    >
      <AuroraBackground isDark={isDark} />
      <CursorSpotlight isDark={isDark} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            Nos tarifs
          </p>
          <h2 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-night-900'}`}>
            Calculez le prix de votre envoi en direct
          </h2>
          <p className={`mt-3 max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Aucune surprise : le tarif au kilo est fixe et transparent, affiché avant même votre
            première expédition.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`rounded-3xl border p-6 sm:p-10 shadow-xl ${
            isDark ? 'bg-night-900 border-white/10' : 'bg-white border-slate-200'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contrôles */}
            <div>
              <p className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Catégorie de marchandise
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = categorie === cat.value;
                  return (
                    <motion.button
                      key={cat.value}
                      onClick={() => setCategorie(cat.value)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative text-left rounded-2xl border-2 p-4 transition-colors overflow-hidden ${
                        active
                          ? isDark
                            ? 'border-emerald-400 bg-emerald-500/10'
                            : 'border-emerald-500 bg-emerald-50'
                          : isDark
                            ? 'border-white/10 hover:border-white/20'
                            : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="calculator-active-glow"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          className={`absolute inset-0 -z-10 ${
                            isDark ? 'bg-emerald-500/5' : 'bg-emerald-100/40'
                          }`}
                        />
                      )}
                      <motion.div animate={{ scale: active ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
                        <Icon
                          size={20}
                          className={active ? 'text-emerald-500' : isDark ? 'text-slate-400' : 'text-slate-400'}
                        />
                      </motion.div>
                      <p className={`mt-2 font-semibold text-sm ${isDark ? 'text-white' : 'text-night-900'}`}>
                        {cat.label}
                      </p>
                      <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {cat.price}
                      </p>
                      <p className={`text-[11px] mt-1.5 leading-snug ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {cat.examples}
                      </p>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Poids estimé
                </label>
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-night-900'}`}>
                  {poidsKg} kg
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={200}
                step={0.5}
                value={poidsKg}
                onChange={(e) => setPoidsKg(Number(e.target.value))}
                className="calculator-slider w-full accent-emerald-500"
                style={{
                  background: `linear-gradient(to right, #10B981 ${((poidsKg - 0.5) / 199.5) * 100}%, ${
                    isDark ? '#1E293B' : '#E2E8F0'
                  } ${((poidsKg - 0.5) / 199.5) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-xs mt-1">
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>0.5 kg</span>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>200 kg</span>
              </div>

              <input
                type="number"
                min={0.1}
                step={0.1}
                value={poidsKg}
                onChange={(e) => setPoidsKg(Number(e.target.value) || 0)}
                className={`mt-4 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 ${
                  isDark
                    ? 'bg-night-800 border-night-600 text-white'
                    : 'bg-white border-slate-200 text-night-900'
                }`}
              />
            </div>

            {/* Résultat */}
            <div className="flex flex-col justify-between">
              <motion.div
                animate={{ scale: [1, 1.015, 1] }}
                transition={{ duration: 0.3 }}
                key={categorie}
                className={`rounded-2xl border p-6 text-center ${
                  isDark
                    ? 'bg-gradient-to-br from-emerald-500/10 to-sky-500/10 border-emerald-500/30'
                    : 'bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-200'
                }`}
              >
                <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  Prix total estimé
                </p>
                <p className={`mt-2 text-4xl font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-night-900'}`}>
                  {poidsKg > 0 ? (
                    <StatCounter value={totalEstime} duration={0.5} />
                  ) : (
                    '—'
                  )}
                  <span className="text-lg font-semibold ml-1">GNF</span>
                </p>
                {poidsKg > 0 && (
                  <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {poidsKg} kg × {selectedCategorie.pricePerKg.toLocaleString('fr-FR')} GNF/kg
                  </p>
                )}
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAddressModalOpen(true)}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-cargo-500 hover:bg-cargo-400 text-white font-semibold px-5 py-3.5 rounded-xl shadow-glow-cargo transition-colors"
              >
                <MapPin size={17} />
                Obtenir les adresses d'expédition en Chine
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <WarehouseAddressModal open={addressModalOpen} onClose={() => setAddressModalOpen(false)} />
    </section>
  );
});
PriceCalculator.displayName = 'PriceCalculator';
