import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
