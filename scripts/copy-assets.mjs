// scripts/copy-assets.mjs
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');
const srcDir = join(repoRoot, 'src');
const distDir = join(repoRoot, 'dist');

const pairs = [
  [join(srcDir, 'prompt'), join(distDir, 'prompt')],
  [join(srcDir, 'schemas'), join(distDir, 'schemas')]
];

for (const [from, to] of pairs) {
  if (!existsSync(from)) continue;
  mkdirSync(distDir, { recursive: true });
  cpSync(from, to, { recursive: true });
}

