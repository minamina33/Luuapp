/**
 * 引き継ぎコードの読みこみ（画面から切りはなして、テストできるようにしてある）
 * - 長すぎるコードは開かずに断る
 * - あいことばで開いたあと、データの形を確かめる（こわれた記録だけのぞく）
 * - 前の形式（LUU1：鍵なし）も読めるが、そのことを知らせる
 */
import type { GameState } from '../types';
import { isSealed, unseal } from '../secure';
import { checkState, MAX_CODE_LENGTH, MAX_STATE_CHARS } from './validate';

const LEGACY_PREFIX = 'LUU1:';

export type ReadResult = { ok: true; state: GameState; fixes: number; legacy: boolean } | { ok: false; error: string };

function parseChecked(text: string): ReadResult {
  if (text.length > MAX_STATE_CHARS) return { ok: false, error: 'データが大きすぎて読みこめませんでした。' };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'コードを読みこめませんでした。最初から最後まで全部貼りつけてね。' };
  }
  const r = checkState(json);
  if (!r.ok) return { ok: false, error: `読みこめませんでした（${r.reason}）。` };
  return { ok: true, state: r.state, fixes: r.fixes, legacy: false };
}

export async function readCode(input: string, pass: string): Promise<ReadResult> {
  const t = input.trim();
  if (!t) return { ok: false, error: 'コードを貼りつけてね。' };
  if (t.length > MAX_CODE_LENGTH) return { ok: false, error: 'コードが長すぎます。るうの引き継ぎコードか確かめてね。' };
  if (isSealed(t)) {
    const text = await unseal(t, pass);
    if (text === null) return { ok: false, error: 'あいことばがちがうか、コードがとちゅうで切れているみたい。' };
    return parseChecked(text);
  }
  if (t.startsWith(LEGACY_PREFIX)) {
    let text: string;
    try {
      const bin = atob(t.slice(LEGACY_PREFIX.length));
      text = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    } catch {
      return { ok: false, error: 'コードを読みこめませんでした。最初から最後まで全部貼りつけてね。' };
    }
    const r = parseChecked(text);
    return r.ok ? { ...r, legacy: true } : r;
  }
  return { ok: false, error: 'るうの引き継ぎコードではないみたい（LUU から始まる文字列を貼りつけてね）。' };
}
