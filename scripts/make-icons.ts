// Иконки приложения для установки на телефон (PWA): рисуем знак сайта в SVG и переводим в PNG.
//   node scripts/make-icons.ts
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = new URL('../public/icons/', import.meta.url);

// scale — размер знака: у maskable-иконки он меньше, чтобы Android мог обрезать края кругом или каплей
const icon = (scale: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="70%">
      <stop offset="0" stop-color="#241d33"/>
      <stop offset="1" stop-color="#08090c"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f9dfa6"/>
      <stop offset="1" stop-color="#c88f37"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${scale}) translate(-16 -16)" fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-linejoin="round">
    <path d="M16 2 30 16 16 30 2 16Z"/>
    <path d="M10.4 16c0-1.9 1.4-3.2 3-3.2 2.7 0 3.6 6.4 6.2 6.4 1.7 0 2.9-1.3 2.9-3.2s-1.2-3.2-2.9-3.2c-2.6 0-3.5 6.4-6.2 6.4-1.6 0-3-1.3-3-3.2Z"/>
  </g>
</svg>`;

async function render(svg: string, size: number, file: string) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(fileURLToPath(new URL(file, OUT)));
  console.log(`  ${file} ${size}×${size}`);
}

await mkdir(OUT, { recursive: true });
await render(icon(10.5), 192, 'icon-192.png');
await render(icon(10.5), 512, 'icon-512.png');
await render(icon(7.5), 512, 'icon-maskable-512.png');
await render(icon(10.5), 180, 'apple-touch-icon.png');
console.log('Иконки готовы → public/icons/');
