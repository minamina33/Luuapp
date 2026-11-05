// ビルドした dist/ を、リポジトリのいちばん上（GitHub Pages が公開している場所）にコピーする
import { cpSync, rmSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(app, '..');
const dist = join(app, 'dist');
if (!existsSync(dist)) throw new Error('先に npm run build してね（dist/ がない）');

// 前回の公開ファイルを消す（app/ や .git、説明ファイルには触らない）
const keep = new Set(['.git', 'app', 'README.md', 'CLAUDE.md', '.gitignore', '.github']);
for (const f of readdirSync(root)) if (!keep.has(f)) rmSync(join(root, f), { recursive: true, force: true });

cpSync(dist, root, { recursive: true });
writeFileSync(join(root, '.nojekyll'), '');
console.log('公開用ファイルを更新しました。git add -A して commit・push すると、数分でアプリに反映されます。');
