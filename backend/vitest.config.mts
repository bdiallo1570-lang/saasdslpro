import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Même alias que tsconfig.json (`@/` → src/) pour que les tests importent le code réel.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
