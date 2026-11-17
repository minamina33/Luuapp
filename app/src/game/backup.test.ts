import { describe, expect, it } from 'vitest';
import { readCode } from './backup';
import { seal } from '../secure';
import { initialState } from './logic';
import { MAX_CODE_LENGTH } from './validate';

const state = () => {
  const s = initialState();
  s.pet.name = 'もち';
  s.journals = [{ id: 'j1', createdAt: '2026-11-10T21:00:00.000Z', updatedAt: '2026-11-10T21:00:00.000Z', content: '日記の中身' }];
  return s;
};
const legacy = (obj: unknown) => 'LUU1:' + btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj))));

describe('引き継ぎコードの読みこみ', () => {
  it('つくったコードを同じあいことばで読める', async () => {
    const code = await seal(JSON.stringify(state()), 'ながめのあいことば');
    const r = await readCode(code, 'ながめのあいことば');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.pet.name).toBe('もち');
    expect(r.state.journals[0].content).toBe('日記の中身');
    expect(r.legacy).toBe(false);
    expect(r.fixes).toBe(0);
  });
  it('あいことばがちがえば、分かりやすく断る', async () => {
    const code = await seal(JSON.stringify(state()), 'ながめのあいことば');
    const r = await readCode(code, 'ちがうことば');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('あいことば');
  });
  it('前の形式（LUU1・鍵なし）も読めて、そのことが分かる', async () => {
    const r = await readCode(legacy(state()), '');
    expect(r.ok && r.legacy).toBe(true);
    expect(r.ok && r.state.journals[0].content).toBe('日記の中身');
  });
  it('るうのコードではないもの・こわれたものは断る', async () => {
    for (const bad of ['', 'こんにちは', 'LUU1:%%%', legacy({ hello: 1 }), legacy([1, 2, 3]), 'LUU1:' + btoa('not json')]) {
      expect((await readCode(bad, 'x')).ok).toBe(false);
    }
  });
  it('鍵を開けた中身が、るうのデータでなければ断る', async () => {
    const code = await seal(JSON.stringify({ version: 1, pet: 'x' }), 'ながめのあいことば');
    expect((await readCode(code, 'ながめのあいことば')).ok).toBe(false);
  });
  it('長すぎるコードは、開こうとせずに断る', async () => {
    const r = await readCode('LUU3:' + 'A'.repeat(MAX_CODE_LENGTH), 'x');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('長すぎ');
  });
  it('一部の記録がこわれていても、その記録だけのぞいて読める', async () => {
    const s = state() as unknown as Record<string, unknown>;
    s.moods = [{ id: 'bad', value: 'happy' }];
    const code = await seal(JSON.stringify(s), 'ながめのあいことば');
    const r = await readCode(code, 'ながめのあいことば');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fixes).toBe(1);
      expect(r.state.moods).toEqual([]);
      expect(r.state.journals.length).toBe(1);
    }
  });
});
