// Copie les assets binaires (logos, images) de src/ vers dist/ après compilation TypeScript —
// tsc ne copie que les fichiers .ts, les fichiers statiques doivent être copiés manuellement.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcAssets = join(__dirname, '..', 'src', 'assets');
const distAssets = join(__dirname, '..', 'dist', 'assets');

if (existsSync(srcAssets)) {
  mkdirSync(distAssets, { recursive: true });
  cpSync(srcAssets, distAssets, { recursive: true });
  console.log(`Assets copiés : ${srcAssets} -> ${distAssets}`);
} else {
  console.log('Aucun dossier src/assets trouvé, rien à copier.');
}
