import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { ZONES_PRIVEES } from './src/lib/zonesPrivees';

// Adresse publique du site : VITE_SITE_URL si on la fixe (ex. domaine définitif), sinon
// l'adresse de production que Vercel fournit pendant le build, sinon rien (local).
const SITE_URL = (
  process.env.VITE_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
).replace(/\/$/, '');

// Écrite dans les balises de partage d'index.html (%SITE_URL%) ; vide en local (chemins relatifs).
function siteUrl(): Plugin {
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
  };
}

// Pages publiques à faire connaître aux moteurs de recherche. Les pages de l'application et les
// documents personnels (/document/…) n'y figurent pas : ils sont marqués « ne pas indexer ».
// `maj` : date de dernière modification du contenu (pages légales : même date que celle affichée
// en haut de la page) ; absente = date du build (l'accueil évolue avec le site).
const PAGES_PUBLIQUES: { chemin: string; maj?: string }[] = [
  { chemin: '/' },
  { chemin: '/conditions-generales', maj: '2026-11-19' },
  { chemin: '/confidentialite', maj: '2026-11-19' },
  { chemin: '/connexion', maj: '2026-11-19' },
];

function sitemapXml(base: string): string {
  const jour = new Date().toISOString().slice(0, 10);
  const urls = PAGES_PUBLIQUES.map(
    (p) => `  <url>\n    <loc>${base}${p.chemin}</loc>\n    <lastmod>${p.maj ?? jour}</lastmod>\n  </url>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// Écrans de l'application (connexion obligatoire, rien à indexer ; liste ZONES_PRIVEES dans
// src/lib/zonesPrivees.ts) : les robots n'ont pas à les explorer. Les documents /document/… restent volontairement autorisés : bloqués, les robots ne
// liraient plus leur en-tête « noindex » (vercel.json) et pourraient référencer l'adresse seule.

function robotsTxt(base: string): string {
  const lignes = [
    '# DSL Air Cargo : pages publiques ouvertes aux moteurs de recherche',
    'User-agent: *',
    'Allow: /',
    '',
    '# Espace de gestion (connexion obligatoire)',
    ...ZONES_PRIVEES.map((chemin) => `Disallow: ${chemin}`),
  ];
  if (base) lignes.push('', `Sitemap: ${base}/sitemap.xml`);
  return `${lignes.join('\n')}\n`;
}

// sitemap.xml et robots.txt : générés au build (adresses absolues obligatoires) et servis aussi
// par le serveur de développement pour pouvoir les vérifier en local.
function fichiersSeo(): Plugin {
  return {
    name: 'fichiers-seo',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const base = SITE_URL || `http://${req.headers.host}`;
        if (req.url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          return res.end(sitemapXml(base));
        }
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.end(robotsTxt(base));
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(SITE_URL) });
      if (SITE_URL) {
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(SITE_URL) });
      } else {
        this.warn('Adresse publique inconnue (VITE_SITE_URL) : sitemap.xml non généré.');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), siteUrl(), fichiersSeo()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Écoute sur toutes les interfaces (pas seulement 127.0.0.1) pour être accessible
    // depuis un téléphone sur le même réseau Wi-Fi, via l'IP locale de la machine.
    host: true,
  },
});
