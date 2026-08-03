import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bgDir = path.join(__dirname, '..', 'public', 'images', 'backgrounds');

// Fichiers de fond décoratifs — jamais affichés au-delà de leur taille de carte/section,
// donc on plafonne la largeur pour éviter de servir des photos surdimensionnées.
const BACKGROUNDS = [
  { file: 'avion-nez.jpg', maxWidth: 1920 },
  { file: 'grande-muraille.jpg', maxWidth: 1600 },
  { file: 'shanghai-skyline.jpg', maxWidth: 1920 },
  { file: 'chargement-cargo-1.jpg', maxWidth: 1200 },
  { file: 'chargement-cargo-2.jpg', maxWidth: 1200 },
];

async function run() {
  console.log('Compression WebP des images de fond…\n');

  for (const { file, maxWidth } of BACKGROUNDS) {
    const inputPath = path.join(bgDir, file);
    const outputPath = path.join(bgDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠ Introuvable, ignoré : ${file}`);
      continue;
    }

    const beforeSize = fs.statSync(inputPath).size;

    await sharp(inputPath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(outputPath);

    const afterSize = fs.statSync(outputPath).size;
    const reduction = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(0);

    console.log(
      `✓ ${file} → ${path.basename(outputPath)}  ` +
        `${(beforeSize / 1024).toFixed(0)} Ko → ${(afterSize / 1024).toFixed(0)} Ko (-${reduction}%)`,
    );
  }

  console.log('\nGénération du logo dédié 200×200 (navbar/favicon)…');

  const logoSrc = path.join(bgDir, 'dsl-logo.png');
  const logoOut = path.join(bgDir, 'dsl-logo-200.png');

  if (fs.existsSync(logoSrc)) {
    await sharp(logoSrc)
      .resize(200, 200, { fit: 'cover', position: 'center' })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(logoOut);
    const size = fs.statSync(logoOut).size;
    console.log(`✓ dsl-logo-200.png généré (${(size / 1024).toFixed(0)} Ko)`);
  } else {
    console.log('⚠ dsl-logo.png introuvable, logo 200×200 non généré.');
  }

  console.log('\nTerminé.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
