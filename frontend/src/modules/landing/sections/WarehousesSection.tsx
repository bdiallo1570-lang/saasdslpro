import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Phone, Copy, Check, MessageCircle } from 'lucide-react';
import { listWarehouses, WarehouseLocation } from '@/modules/warehouses/warehouses.api';
import { Skeleton, notify } from '@/ui';
import { AuroraBackground } from './AuroraBackground';
import { CursorSpotlight } from './CursorSpotlight';

interface WarehousesSectionProps {
  isDark: boolean;
}

export function WarehousesSection({ isDark }: WarehousesSectionProps) {
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    listWarehouses()
      .then(setWarehouses)
      .finally(() => setLoading(false));
  }, []);

  async function handleCopy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      notify.success('Adresse copiée dans le presse-papiers.');
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } catch {
      notify.error('Impossible de copier — sélectionnez le texte manuellement.');
    }
  }

  const guangzhou = warehouses.find((w) => w.location === 'CHINE');
  const conakry = warehouses.find((w) => w.location === 'GUINEE');

  const cards = [
    {
      warehouse: guangzhou,
      flag: '🇨🇳',
      country: 'Chine',
      fallbackName: 'Entrepôt Guangzhou',
      photo: '/images/backgrounds/chargement-cargo-1.webp',
    },
    {
      warehouse: conakry,
      flag: '🇬🇳',
      country: 'Guinée',
      fallbackName: 'Entrepôt Conakry — Madina',
      photo: '/images/backgrounds/chargement-cargo-2.webp',
    },
  ];

  return (
    <section
      id="entrepots"
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
              className="relative overflow-hidden rounded-2xl border border-white/10 min-h-[300px] sm:min-h-[420px] flex flex-col justify-end"
            >
              {/* Photo en fond plein cadre */}
              <motion.img
                src={card.photo}
                alt=""
                initial={{ scale: 1.1 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Voile sombre pour la lisibilité du texte par-dessus la photo */}
              <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/75 to-night-950/25" />

              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="text-xl drop-shadow">{card.flag}</span>
                <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-white backdrop-blur-sm">
                  {card.country}
                </span>
              </div>

              <div className="relative p-6 pt-10">
                <p className="font-semibold text-lg mb-4 text-white drop-shadow">
                  {card.warehouse?.name ?? card.fallbackName}
                </p>

                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                  </div>
                ) : (
                  <>
                    {card.warehouse?.addressZh && (
                      <button
                        type="button"
                        onClick={() => handleCopy(`${card.country}-zh`, card.warehouse!.addressZh!)}
                        className="group w-full flex items-start gap-2 mb-2 text-left rounded-lg -mx-2 px-2 py-1.5 transition-colors hover:bg-white/10"
                        title="Copier l'adresse (中文)"
                      >
                        <Building2 size={15} className="mt-0.5 shrink-0 text-slate-300" />
                        <p className="flex-1 min-w-0 break-words text-sm text-slate-100 drop-shadow">
                          {card.warehouse.addressZh}
                        </p>
                        {copiedKey === `${card.country}-zh` ? (
                          <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                        ) : (
                          <Copy
                            size={14}
                            className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300"
                          />
                        )}
                      </button>
                    )}
                    {card.warehouse?.addressFr && (
                      <button
                        type="button"
                        onClick={() => handleCopy(`${card.country}-fr`, card.warehouse!.addressFr!)}
                        className="group w-full flex items-start gap-2 mb-3 text-left rounded-lg -mx-2 px-2 py-1.5 transition-colors hover:bg-white/10"
                        title="Copier l'adresse"
                      >
                        <Building2 size={15} className="opacity-0 shrink-0" />
                        <p className="flex-1 min-w-0 break-words text-sm text-slate-200 drop-shadow">
                          {card.warehouse.addressFr}
                        </p>
                        {copiedKey === `${card.country}-fr` ? (
                          <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                        ) : (
                          <Copy
                            size={14}
                            className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300"
                          />
                        )}
                      </button>
                    )}

                    {card.warehouse?.contactNumbersJson &&
                      Object.keys(card.warehouse.contactNumbersJson).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {Object.entries(card.warehouse.contactNumbersJson).map(([name, phone]) => {
                            // wa.me exige le format international sans "+", espaces ni tirets.
                            const waNumber = phone.replace(/\D/g, '');
                            return waNumber ? (
                              <a
                                key={name}
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Écrire à ${name} sur WhatsApp`}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-100 border-emerald-400/30 backdrop-blur-sm transition-colors hover:bg-emerald-500/30 hover:border-emerald-400/50"
                              >
                                <MessageCircle size={11} />
                                {name} — {phone}
                              </a>
                            ) : (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-white/10 text-slate-100 border-white/20 backdrop-blur-sm"
                              >
                                <Phone size={11} />
                                {name}
                              </span>
                            );
                          })}
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
