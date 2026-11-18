// フォント（Zen Maru Gothic）の読みこみ用 CSS をつくる。
// @fontsource の CSS は woff2 と woff の両方を指していて、両方が同梱されてしまうので、
// いまのブラウザ・iPhone がすべて使える woff2 だけを指す CSS を src/fonts.css に書き出す。
// フォントのパッケージを更新したら、もう一度 `node scripts/make-fonts-css.mjs` を実行する。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = join(app, 'node_modules/@fontsource/zen-maru-gothic');
const version = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')).version;
let out = `/* 自動生成（scripts/make-fonts-css.mjs）。手で編集しない。\n   Zen Maru Gothic ${version}（@fontsource）— SIL Open Font License 1.1 */\n`;
for (const w of ['500', '700']) {
  const css = readFileSync(join(pkg, `${w}.css`), 'utf8');
  out += css
    .replace(/url\(\.\/files\/([^)]+\.woff2)\) format\('woff2'\),\s*url\(\.\/files\/[^)]+\.woff\) format\('woff'\)/g, "url('../node_modules/@fontsource/zen-maru-gothic/files/$1') format('woff2')")
    .replace(/\/\* zen-maru-gothic-[^*]*\*\/\n/g, '');
}
if (/\.woff'\)|format\('woff'\)/.test(out)) throw new Error('woff が残っています。@fontsource の CSS の形が変わったかも');
writeFileSync(join(app, 'src/fonts.css'), out);
console.log('src/fonts.css を書き出しました', (out.match(/@font-face/g) || []).length, '個');
