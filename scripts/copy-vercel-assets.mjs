import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('dist/assets');
const destination = path.resolve('public/assets');

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true, force: true });
console.log('Copied Vite assets to public/assets for Vercel CDN delivery.');
