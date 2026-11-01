import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Adresse publique du site, écrite dans les balises de partage d'index.html (%SITE_URL%) :
// VITE_SITE_URL si on la fixe (ex. domaine définitif), sinon l'adresse de production que Vercel
// fournit pendant le build, sinon rien (chemins relatifs, suffisants en local).
function siteUrl(): Plugin {
  const fromEnv = process.env.VITE_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
  const url = fromEnv.replace(/\/$/, '');
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url),
  };
}

export default defineConfig({
  plugins: [react(), siteUrl()],
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
