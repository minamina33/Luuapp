import { describe, expect, it } from 'vitest';
import { BEFORE_IMPORT_KEY, BROKEN_KEY, KEY, loadFrom, saveTo } from './store';
import { initialState } from './logic';
import { MemStore } from '../test/memStore';

const withJournal = () => {
  const s = initialState();
  s.journals = [{ id: 'j1', createdAt: '2026-11-10T21:00:00.000Z', updatedAt: '2026-11-10T21:00:00.000Z', content: 'だいじな日記' }];
  return s;
};

describe('起動時の読みこみ', () => {
  it('何も保存されていなければ、はじめから', () => {
    const r = loadFrom(new MemStore());
    expect(r.status).toBe('ok');
    expect(r.state.journals).toEqual([]);
  });
  it('保存された記録をそのまま読む', () => {
    const st = new MemStore();
    st.setItem(KEY, JSON.stringify(withJournal()));
    const r = loadFrom(st);
    expect(r.status).toBe('ok');
    expect(r.repaired).toBe(0);
    expect(r.state.journals[0].content).toBe('だいじな日記');
    expect(st.getItem(BROKEN_KEY)).toBeNull();
  });
  it('読めないデータは、元のまま別の場所にとっておき、上書きしない', () => {
    const st = new MemStore();
    const raw = '{"version":1,"pet":{"name":"るう"},"journals":[{"content":"だいじ"';
    st.setItem(KEY, raw);
    const r = loadFrom(st);
    expect(r.status).toBe('recovered');
    expect(st.getItem(BROKEN_KEY)).toBe(raw);
    expect(st.getItem(KEY)).toBe(raw);
  });
  it('るうのデータでないもの（形がちがう）も、とっておく', () => {
    const st = new MemStore();
    st.setItem(KEY, JSON.stringify({ version: 99 }));
    expect(loadFrom(st).status).toBe('recovered');
    expect(st.getItem(BROKEN_KEY)).toBe(JSON.stringify({ version: 99 }));
  });
  it('とっておけない（容量がいっぱい）ときは stuck にして、保存を止めてもらう', () => {
    const st = new MemStore();
    st.setItem(KEY, '{こわれた');
    st.quota = 0;
    const r = loadFrom(st);
    expect(r.status).toBe('stuck');
    expect(st.getItem(KEY)).toBe('{こわれた');
  });
  it('保存領域が使えない環境でも、はじめから動く', () => {
    expect(loadFrom(new MemStore(Infinity, 'read')).status).toBe('unavailable');
  });
  it('一部の記録だけこわれていたら、その記録だけのぞき、元の形もとっておく', () => {
    const st = new MemStore();
    const s = withJournal() as unknown as Record<string, unknown>;
    s.moods = [{ id: 'ok', at: '2026-11-10T10:00:00Z', value: 4, reasons: [] }, { id: 'bad', at: 'x', value: 4 }];
    const raw = JSON.stringify(s);
    st.setItem(KEY, raw);
    const r = loadFrom(st);
    expect(r.status).toBe('ok');
    expect(r.repaired).toBe(1);
    expect(r.state.moods.map((m) => m.id)).toEqual(['ok']);
    expect(r.state.journals[0].content).toBe('だいじな日記');
    expect(st.getItem(BROKEN_KEY)).toBe(raw);
  });
});

describe('保存', () => {
  it('ふつうに保存できる', () => {
    const st = new MemStore();
    expect(saveTo(st, withJournal())).toBe(true);
    expect(JSON.parse(st.getItem(KEY)!).journals[0].content).toBe('だいじな日記');
  });
  it('容量が足りないときは false。前に保存した内容は残る', () => {
    const st = new MemStore();
    const first = JSON.stringify(initialState());
    st.setItem(KEY, first);
    st.quota = first.length + KEY.length + 10;
    const big = withJournal();
    big.journals[0].content = 'あ'.repeat(5000);
    expect(saveTo(st, big)).toBe(false);
    expect(st.getItem(KEY)).toBe(first);
  });
  it('容量が足りないときは、引き継ぎ前のひかえを消して、いまの記録を優先する', () => {
    const st = new MemStore();
    const backup = 'x'.repeat(5000);
    st.setItem(BEFORE_IMPORT_KEY, backup);
    const s = withJournal();
    st.quota = backup.length + BEFORE_IMPORT_KEY.length + JSON.stringify(s).length + KEY.length - 10;
    expect(saveTo(st, s)).toBe(true);
    expect(st.getItem(BEFORE_IMPORT_KEY)).toBeNull();
    expect(st.getItem(KEY)).not.toBeNull();
  });
});
