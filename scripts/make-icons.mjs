// Generates the PWA icons in public/icons from assets/images/icon.png.
// Run with `pnpm icons` after changing the source icon.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "assets/images/icon.png";
const OUT = "public/icons";
const BG = "#000000";
mkdirSync(OUT, { recursive: true });

const any = (size) => sharp(SRC).resize(size, size).png().toFile(`${OUT}/icon-${size}.png`);

// Maskable icons get cropped to a circle/squircle by the OS, so the artwork
// must sit inside the central 80% "safe zone" on a solid background.
const maskable = (size) =>
  sharp(SRC)
    .resize(Math.round(size * 0.7), Math.round(size * 0.7))
    .extend({
      top: Math.round(size * 0.15),
      bottom: size - Math.round(size * 0.7) - Math.round(size * 0.15),
      left: Math.round(size * 0.15),
      right: size - Math.round(size * 0.7) - Math.round(size * 0.15),
      background: BG,
    })
    .flatten({ background: BG })
    .png()
    .toFile(`${OUT}/maskable-${size}.png`);

// iOS ignores manifest icons; it uses apple-touch-icon and fills transparency
// with black, so flatten it explicitly.
const apple = () =>
  sharp(SRC).resize(180, 180).flatten({ background: BG }).png().toFile(`${OUT}/apple-touch-icon.png`);

await Promise.all([any(192), any(512), maskable(512), apple()]);
console.log("Icons written to", OUT);
