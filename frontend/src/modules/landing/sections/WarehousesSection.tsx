import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Phone, Copy, Check, MessageCircle } from 'lucide-react';
import { listWarehouses } from '@/modules/warehouses/warehouses.api';
import { WAREHOUSES_FALLBACK } from '@/modules/warehouses/warehousesFallback';
import { notify } from '@/ui';
import { copyToClipboard } from '@/lib/clipboard';
import { AuroraBackground } from './AuroraBackground';
import { SectionHeading } from './SectionHeading';

interface WarehousesSectionProps {
  isDark: boolean;
}

// Texte prêt à envoyer à un fournisseur : nom de l'entrepôt, adresse en chinois (si elle existe),
// adresse en français. Les numéros de contact ne sont pas inclus (certains sont vides).
function fullAddress(
  warehouse: { name?: string; addressZh?: string | null; addressFr?: string | null },
  fallbackName: string,
): string {
  return [warehouse.name ?? fallbackName, warehouse.addressZh, warehouse.addressFr].filter(Boolean).join('\n');
}

export function WarehousesSection({ isDark }: WarehousesSectionProps) {
  // Pré-rempli avec la dernière adresse connue — affichage instantané, aucun skeleton. La vraie
  // réponse réseau écrase silencieusement ce fallback dès qu'elle arrive (utile si une adresse
  // a été changée depuis l'admin entre-temps), sans jamais bloquer le rendu initial.
  const [warehouses, setWarehouses] = useState(WAREHOUSES_FALLBACK);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    listWarehouses()
      .then((data) => {
        if (data.length > 0) setWarehouses(data);
      })
      .catch(() => {
        // Le fallback reste affiché — ne pas dégrader l'UI pour un souci réseau silencieux.
      });
  }, []);

  async function handleCopy(key: string, text: string) {
    if (await copyToClipboard(text)) {
      setCopiedKey(key);
      notify.success('Adresse copiée dans le presse-papiers.');
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } else {
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
      fallbackName: 'Entrepôt Conakry',
      photo: '/images/backgrounds/chargement-cargo-2.webp',
    },
  ];

  return (
    <section
      id="entrepots"
      className={`relative overflow-hidden py-20 sm:py-28 transition-colors duration-300 ${
        isDark ? 'bg-ink-900' : 'bg-slate-50'
      }`}
    >
      <AuroraBackground isDark={isDark} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <SectionHeading
          isDark={isDark}
          eyebrow="Nos entrepôts"
          title="Une équipe locale à chaque bout de la chaîne"
          className="mb-14"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            // Le déclencheur est le conteneur (visible), la carte porte le rideau (clip-path) : un
            // élément entièrement masqué ne se déclencherait pas lui-même.
            <motion.div
              key={card.country}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="relative"
            >
            <motion.div
              variants={{
                hidden: { clipPath: 'inset(0 0 100% 0 round 1rem)' },
                show: {
                  clipPath: 'inset(0 0 0% 0 round 1rem)',
                  transition: { duration: 1.2, delay: i * 0.18, ease: [0.76, 0, 0.24, 1] },
                },
              }}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 min-h-[300px] sm:min-h-[420px] flex flex-col justify-end"
            >
              {/* Photo en fond plein cadre */}
              <motion.img
                src={card.photo}
                alt=""
                variants={{
                  hidden: { scale: 1.3 },
                  show: { scale: 1, transition: { duration: 2, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] } },
                }}
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

                <div>
                  {card.warehouse?.addressZh && (
                    <motion.button
                      type="button"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCopy(`${card.country}-zh`, card.warehouse!.addressZh!)}
                      className="group w-full flex items-start gap-2 mb-2 text-left rounded-lg -mx-2 px-2 py-1.5 transition-colors hover:bg-white/10"
                      title="Copier l'adresse (中文)"
                    >
                      <Building2 size={15} className="mt-0.5 shrink-0 text-slate-300" />
                      <p className="flex-1 min-w-0 select-text break-words text-sm text-slate-100 drop-shadow">
                        {card.warehouse.addressZh}
                      </p>
                      {copiedKey === `${card.country}-zh` ? (
                        <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                      ) : (
                        <Copy
                          size={14}
                          className="shrink-0 mt-0.5 text-slate-300 opacity-70 transition-opacity group-hover:opacity-100"
                        />
                      )}
                    </motion.button>
                  )}
                  {card.warehouse?.addressFr && (
                    <motion.button
                      type="button"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCopy(`${card.country}-fr`, card.warehouse!.addressFr!)}
                      className="group w-full flex items-start gap-2 mb-3 text-left rounded-lg -mx-2 px-2 py-1.5 transition-colors hover:bg-white/10"
                      title="Copier l'adresse"
                    >
                      <Building2 size={15} className="opacity-0 shrink-0" />
                      <p className="flex-1 min-w-0 select-text break-words text-sm text-slate-200 drop-shadow">
                        {card.warehouse.addressFr}
                      </p>
                      {copiedKey === `${card.country}-fr` ? (
                        <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                      ) : (
                        <Copy
                          size={14}
                          className="shrink-0 mt-0.5 text-slate-300 opacity-70 transition-opacity group-hover:opacity-100"
                        />
                      )}
                    </motion.button>
                  )}

                  {(card.warehouse?.addressZh || card.warehouse?.addressFr) && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleCopy(`${card.country}-all`, fullAddress(card.warehouse!, card.fallbackName))}
                      className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                      {copiedKey === `${card.country}-all` ? (
                        <Check size={13} className="text-emerald-300" />
                      ) : (
                        <Copy size={13} />
                      )}
                      {copiedKey === `${card.country}-all` ? 'Adresse copiée' : "Copier l'adresse complète"}
                    </motion.button>
                  )}

                  {card.warehouse?.contactNumbersJson &&
                    Object.keys(card.warehouse.contactNumbersJson).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(card.warehouse.contactNumbersJson).map(([name, phone]) => {
                          // wa.me exige le format international sans "+", espaces ni tirets.
                          const waNumber = phone.replace(/\D/g, '');
                          return waNumber ? (
                            <motion.a
                              key={name}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Écrire à ${name} sur WhatsApp`}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-100 border-emerald-400/30 backdrop-blur-sm transition-colors hover:bg-emerald-500/30 hover:border-emerald-400/50"
                            >
                              <MessageCircle size={11} />
                              {name} — {phone}
                            </motion.a>
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
                </div>
              </div>
            </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
