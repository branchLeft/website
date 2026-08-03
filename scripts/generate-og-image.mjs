#!/usr/bin/env node
// Generates public/og-image.png (the Open Graph / Twitter Card share image)
// and the favicon PNG set from the brand source assets at the monorepo
// root. Those source files (branchLeft-logo.png, branchLeft-wordmark.png)
// are NOT part of this repo — this script only runs from a checkout that
// has the monorepo root sibling present. It's a rarely-run regeneration
// tool, not part of `pnpm build`; its outputs are committed to public/.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// website/ sits directly inside the monorepo root, so two levels up from
// this file (website/scripts) reaches it. Overridable via env var for a
// checkout laid out differently (e.g. a git worktree, which nests deeper).
const monorepoRoot = process.env.MONOREPO_ROOT ?? path.resolve(__dirname, '../..');
const publicDir = path.resolve(__dirname, '../public');

const LOGO_PATH = path.join(monorepoRoot, 'branchLeft-logo.png');
const WORDMARK_PATH = path.join(monorepoRoot, 'branchLeft-wordmark.png');

// Matches --color-bg in app/styles/theme.css.
const BG_COLOR = { r: 0, g: 0, b: 0, alpha: 1 };

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  const logo = await sharp(LOGO_PATH).resize({ height: 180 }).toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const wordmark = await sharp(WORDMARK_PATH).resize({ width: 640 }).toBuffer();
  const wordmarkMeta = await sharp(wordmark).metadata();

  const gap = 40;
  const totalHeight = (logoMeta.height ?? 0) + gap + (wordmarkMeta.height ?? 0);
  const top = Math.round((height - totalHeight) / 2);

  await sharp({
    create: { width, height, channels: 4, background: BG_COLOR },
  })
    .composite([
      {
        input: logo,
        top,
        left: Math.round((width - (logoMeta.width ?? 0)) / 2),
      },
      {
        input: wordmark,
        top: top + (logoMeta.height ?? 0) + gap,
        left: Math.round((width - (wordmarkMeta.width ?? 0)) / 2),
      },
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));

  console.log('Wrote public/og-image.png');
}

async function generateFavicons() {
  const sizes = [
    { file: 'favicon-32.png', size: 32 },
    { file: 'favicon-192.png', size: 192 },
    { file: 'favicon-512.png', size: 512 },
    { file: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { file, size } of sizes) {
    await sharp(LOGO_PATH)
      .resize(size, size, { fit: 'contain', background: BG_COLOR })
      .flatten({ background: BG_COLOR })
      .png()
      .toFile(path.join(publicDir, file));
    console.log(`Wrote public/${file}`);
  }
}

await generateOgImage();
await generateFavicons();
