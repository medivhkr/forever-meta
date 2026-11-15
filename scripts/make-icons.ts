// Иконки приложения для установки на телефон (PWA): рисуем знак сайта в SVG и переводим в PNG.
//   node scripts/make-icons.ts
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = new URL('../public/icons/', import.meta.url);

// Тот же контур, что в src/components/BrandMark.tsx: петля бесконечности в квадрате 24×24
const LOOP =
  'M12 12C10 9.3 7.9 7.5 6.4 7.5 4.4 7.5 3 9.6 3 12s1.4 4.5 3.4 4.5c1.5 0 3.6-1.8 5.6-4.5s4.1-4.5 5.6-4.5c2 0 3.4 2.1 3.4 4.5s-1.4 4.5-3.4 4.5c-1.5 0-3.6-1.8-5.6-4.5Z';

// Графитовый фон и белая петля. Углы не скругляем: iOS и Android скругляют иконку сами.
// scale — размер знака: у maskable-иконки он меньше, чтобы Android мог обрезать края кругом или каплей.
const icon = (scale: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1d1d1f"/>
  <g transform="translate(256 256) scale(${scale}) translate(-12 -12)">
    <path d="${LOOP}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

async function render(svg: string, size: number, file: string) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(fileURLToPath(new URL(file, OUT)));
  console.log(`  ${file} ${size}×${size}`);
}

await mkdir(OUT, { recursive: true });
await render(icon(15), 192, 'icon-192.png');
await render(icon(15), 512, 'icon-512.png');
await render(icon(11), 512, 'icon-maskable-512.png');
await render(icon(15), 180, 'apple-touch-icon.png');
console.log('Иконки готовы → public/icons/');
