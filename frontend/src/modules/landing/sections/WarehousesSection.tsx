import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Phone } from 'lucide-react';
import { listWarehouses, WarehouseLocation } from '@/modules/warehouses/warehouses.api';
import { Skeleton } from '@/ui';

interface WarehousesSectionProps {
  isDark: boolean;
}

export function WarehousesSection({ isDark }: WarehousesSectionProps) {
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWarehouses()
      .then(setWarehouses)
      .finally(() => setLoading(false));
  }, []);

  const guangzhou = warehouses.find((w) => w.location === 'CHINE');
  const conakry = warehouses.find((w) => w.location === 'GUINEE');

  const cards = [
    {
      warehouse: guangzhou,
      flag: '🇨🇳',
      country: 'Chine',
      fallbackName: 'Entrepôt Guangzhou',
      photo: '/images/backgrounds/chargement-cargo-1.jpg',
    },
    {
      warehouse: conakry,
      flag: '🇬🇳',
      country: 'Guinée',
      fallbackName: 'Entrepôt Conakry — Madina',
      photo: '/images/backgrounds/chargement-cargo-2.jpg',
    },
  ];

  return (
    <section
      id="entrepots"
      className={`py-20 sm:py-28 transition-colors duration-300 ${isDark ? 'bg-night-800' : 'bg-slate-50'}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            Nos entrepôts
          </p>
          <h2 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-night-900'}`}>
            Une équipe locale à chaque bout de la chaîne
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.country}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`overflow-hidden rounded-2xl border ${
                isDark ? 'bg-night-900 border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <div className="relative h-36 overflow-hidden">
                <motion.img
                  src={card.photo}
                  alt=""
                  initial={{ scale: 1.1 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute inset-0 h-full w-full object-cover grayscale"
                />
                <div
                  className={`absolute inset-0 ${
                    isDark
                      ? 'bg-gradient-to-t from-night-900 via-night-900/40 to-night-900/10'
                      : 'bg-gradient-to-t from-white via-white/30 to-black/10'
                  }`}
                />
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <span className="text-xl drop-shadow">{card.flag}</span>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full backdrop-blur-sm ${
                      isDark ? 'bg-white/10 text-white' : 'bg-night-900/70 text-white'
                    }`}
                  >
                    {card.country}
                  </span>
                </div>
              </div>

              <div className="p-6 pt-4">
                <p className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-night-900'}`}>
                  {card.warehouse?.name ?? card.fallbackName}
                </p>

                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <>
                    {card.warehouse?.addressZh && (
                      <div className="flex items-start gap-2 mb-2">
                        <Building2 size={15} className={`mt-0.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {card.warehouse.addressZh}
                        </p>
                      </div>
                    )}
                    {card.warehouse?.addressFr && (
                      <div className="flex items-start gap-2 mb-3">
                        <Building2 size={15} className="opacity-0 shrink-0" />
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {card.warehouse.addressFr}
                        </p>
                      </div>
                    )}

                    {card.warehouse?.contactNumbersJson &&
                      Object.keys(card.warehouse.contactNumbersJson).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {Object.entries(card.warehouse.contactNumbersJson).map(([name, phone]) => (
                            <span
                              key={name}
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                                isDark
                                  ? 'bg-white/5 text-slate-300 border-white/10'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <Phone size={11} />
                              {name}
                              {phone ? ` — ${phone}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
