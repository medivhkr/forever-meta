// GitHub Pages не умеет отдавать index.html на любые пути, поэтому кладём его копию в 404.html.
// Тогда прямая ссылка вроде /forever-meta/raid/123 откроет приложение, а дальше путь разберёт React Router.
import { copyFile } from 'node:fs/promises';

await copyFile(new URL('../dist/index.html', import.meta.url), new URL('../dist/404.html', import.meta.url));
console.log('dist/404.html готов');
