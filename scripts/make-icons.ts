import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = new URL('../public/icons/', import.meta.url);

const MONOGRAM = 'M7 24V8h9M7 16h7M19 24V8l3.5 8L26 8v16';

const icon = (scale: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#16191f"/>
  <g transform="translate(256 256) scale(${scale}) translate(-16.5 -16)">
    <path d="${MONOGRAM}" fill="none" stroke="#f2b84b" stroke-width="2.6" stroke-linecap="square"/>
  </g>
</svg>`;

async function render(svg: string, size: number, file: string) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(fileURLToPath(new URL(file, OUT)));
  console.log(`  ${file} ${size}×${size}`);
}

await mkdir(OUT, { recursive: true });
await render(icon(13), 192, 'icon-192.png');
await render(icon(13), 512, 'icon-512.png');
await render(icon(9.5), 512, 'icon-maskable-512.png');
await render(icon(13), 180, 'apple-touch-icon.png');
