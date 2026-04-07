import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const publicDir = path.join(root, 'public');
const publicAssetsDir = path.join(publicDir, 'assets');

await mkdir(publicDir, { recursive: true });

// Clean generated files in public to avoid stale hashed assets.
await rm(path.join(publicDir, 'index.html'), { force: true });
await rm(publicAssetsDir, { recursive: true, force: true });

await cp(distDir, publicDir, { recursive: true, force: true });

console.log('Build synced from dist to public.');
