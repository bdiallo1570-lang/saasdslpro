import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import {
  matchIntent,
  FALLBACK_ANSWER,
  WELCOME_MESSAGE,
  STARTER_SUGGESTIONS,
} from './knowledgeBase';

interface ChatAssistantProps {
  isDark: boolean;
}

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  suggestions?: string[];
}

const WHATSAPP_URL = 'https://wa.me/224628674895';

function makeId() {
  return Math.random().toString(36).slice(2);
}

// Assistant virtuel de la landing — moteur de correspondance par mots-clés (knowledgeBase.ts),
// aucun appel réseau : réponses instantanées, gratuites. Sort du script vers WhatsApp dès qu'une
// question sort du champ couvert, plutôt que d'inventer une réponse.
export function ChatAssistant({ isDark }: ChatAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'bot', text: WELCOME_MESSAGE, suggestions: STARTER_SUGGESTIONS },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  // Petite invitation après quelques secondes si l'assistant n'a jamais été ouvert — signale sa
  // présence sans être intrusif (pas de son, pas d'ouverture automatique).
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!open) setHasUnread(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [open]);

  function respondTo(userText: string) {
    const trimmed = userText.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setTyping(true);

    // Léger délai simulé — rend la réponse plus naturelle qu'un affichage instantané figé.
    setTimeout(() => {
      const intent = matchIntent(trimmed);
      const botMessage: ChatMessage = {
        id: makeId(),
        role: 'bot',
        text: intent?.answer ?? FALLBACK_ANSWER,
        suggestions: intent?.suggestions,
      };
      setMessages((prev) => [...prev, botMessage]);
      setTyping(false);
    }, 500);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    respondTo(input);
  }

  function handleOpen() {
    setOpen(true);
    setHasUnread(false);
  }

  return (
    <>
      {/* Bulle flottante */}
      <motion.button
        onClick={() => (open ? setOpen(false) : handleOpen())}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? 'Fermer Oury' : "Ouvrir Oury, l'assistant virtuel"}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_0_1px_rgba(14,165,233,0.4),0_8px_24px_-4px_rgba(14,165,233,0.35)] flex items-center justify-center text-white"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'chat'}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
          >
            {open ? <X size={22} /> : <MessageCircle size={22} />}
          </motion.span>
        </AnimatePresence>
        {hasUnread && !open && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white"
          />
        )}
      </motion.button>

      {/* Panneau de chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[32rem] max-h-[75vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
              isDark ? 'bg-ink-900 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            {/* En-tête */}
            <div className="shrink-0 px-4 py-3.5 flex items-center gap-2.5 bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">Oury</p>
                <p className="text-[11px] text-white/80 leading-tight">Assistant DSL Air Cargo</p>
              </div>
            </div>

            {/* Fil de conversation */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : isDark
                            ? 'bg-ink-800 text-slate-200 rounded-bl-md'
                            : 'bg-slate-100 text-slate-700 rounded-bl-md'
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.div>

                  {m.role === 'bot' && m.suggestions && m.suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="flex flex-wrap gap-1.5 mt-2"
                    >
                      {m.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => respondTo(s)}
                          className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                            isDark
                              ? 'border-white/15 text-slate-300 hover:bg-white/10'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}

              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div
                    className={`rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1 ${
                      isDark ? 'bg-ink-800' : 'bg-slate-100'
                    }`}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                        className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-slate-400' : 'bg-slate-400'}`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-center text-xs mt-1 pt-1 ${
                  isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Une question précise sur votre colis ? Écrivez-nous sur WhatsApp →
              </a>
            </div>

            {/* Zone de saisie */}
            <form
              onSubmit={handleSubmit}
              className={`shrink-0 border-t p-2.5 flex gap-2 ${isDark ? 'border-white/10' : 'border-slate-200'}`}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                className={`flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors ${
                  isDark
                    ? 'bg-ink-950 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/50'
                    : 'bg-slate-100 text-night-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400/40'
                }`}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!input.trim()}
                aria-label="Envoyer"
                className="shrink-0 h-10 w-10 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
              >
                <Send size={16} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
