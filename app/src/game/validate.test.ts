import { describe, expect, it } from 'vitest';
import { checkState, MAX_LIST } from './validate';
import { initialState, starsBalance, stageOf, tasksForToday, careCountToday } from './logic';
import { migrate } from './store';
import type { GameState } from '../types';

const good = (): GameState => {
  const s = initialState();
  s.player = { id: 'p', nickname: 'みな', createdAt: '2026-11-01T00:00:00.000Z', goals: ['calm'], premiumDemo: false };
  s.moods = [{ id: 'm1', at: '2026-11-10T10:00:00.000Z', value: 3, reasons: ['仕事'], note: 'ふつう' }];
  s.journals = [{ id: 'j1', createdAt: '2026-11-10T21:00:00.000Z', updatedAt: '2026-11-10T21:00:00.000Z', content: '今日のこと' }];
  s.tasks = [{ id: 't1', title: '水を飲む', source: 'suggested', repeat: 'daily', isActive: true, libId: 'water', size: 'small', when: 'morning' }];
  s.ledger = [{ id: 'l1', at: '2026-11-10T10:00:00.000Z', day: '2026-11-10', action: 'task', starsDelta: 10, care: true }];
  return s;
};

describe('データの形の確認', () => {
  it('ふつうのデータはそのまま通り、何も直さない', () => {
    const s = good();
    const r = checkState(s);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fixes).toBe(0);
      expect(r.state).toEqual(s);
    }
  });
  it('元のデータは書きかえない', () => {
    const s = good() as unknown as Record<string, unknown>;
    s.moods = 'こわれた';
    checkState(s);
    expect(s.moods).toBe('こわれた');
  });
  it('るうのデータではないものは断る', () => {
    expect(checkState(null).ok).toBe(false);
    expect(checkState('文字列').ok).toBe(false);
    expect(checkState([]).ok).toBe(false);
    expect(checkState({ version: 2, pet: {} }).ok).toBe(false);
    expect(checkState({ version: 1 }).ok).toBe(false);
    expect(checkState({ version: 1, pet: 'x' }).ok).toBe(false);
  });
  it('配列でない一覧は空にし、こわれた記録だけのぞく', () => {
    const s = good() as unknown as Record<string, unknown>;
    s.completions = 'abc';
    s.moods = [...(s.moods as unknown[]), { id: 'm2', at: 'いつか', value: 3 }, { id: 'm3', at: '2026-11-11T00:00:00Z', value: 9 }, null, 5];
    const r = checkState(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.completions).toEqual([]);
    expect(r.state.moods.map((m) => m.id)).toEqual(['m1']);
    expect(r.fixes).toBe(5);
  });
  it('日記：中身が文字でないものはのぞき、更新日がおかしければ作成日にそろえる', () => {
    const s = good() as unknown as Record<string, unknown>;
    s.journals = [{ id: 'a', createdAt: '2026-11-10T00:00:00Z', content: 123 }, { id: 'b', createdAt: '2026-11-10T00:00:00Z', updatedAt: 'x', content: 'ok' }];
    const r = checkState(s);
    expect(r.ok && r.state.journals).toEqual([{ id: 'b', createdAt: '2026-11-10T00:00:00Z', updatedAt: '2026-11-10T00:00:00Z', content: 'ok' }]);
  });
  it('睡眠：終わりの時刻がこわれた記録は、寝たままにならないようのぞく', () => {
    const s = good() as unknown as Record<string, unknown>;
    s.sleeps = [{ id: 's1', startedAt: '2026-11-10T23:00:00Z', endedAt: 'あさ' }];
    const r = checkState(s);
    expect(r.ok && r.state.sleeps).toEqual([]);
  });
  it('星：ありえない数はのぞく／持ちもの：マイナスはのぞく', () => {
    const s = good() as unknown as Record<string, unknown>;
    s.ledger = [{ id: 'x', at: 'a', day: '2026-11-10', action: 'hack', starsDelta: 1e12 }, { id: 'y', at: 'a', day: '2026-11-10', action: 'ok', starsDelta: Number.NaN }];
    s.inventory = { bed_default: 1, cheat: -5, odd: 'many' };
    const r = checkState(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.ledger).toEqual([]);
    expect(r.state.inventory).toEqual({ bed_default: 1 });
  });
  it('ロック番号の形がおかしければ消す（開けなくなるのを防ぐ）', () => {
    const s = good() as unknown as { settings: Record<string, unknown> };
    s.settings.lockHash = 12345;
    const r = checkState(s);
    expect(r.ok && r.state.settings.lockHash).toBeUndefined();
  });
  it('件数が多すぎる一覧は断る', () => {
    const s = good() as unknown as Record<string, unknown>;
    s.album = new Array(MAX_LIST + 1).fill({ id: 'a', title: 't', at: 'x' });
    expect(checkState(s).ok).toBe(false);
  });
  it('古いデータ（項目が足りない）も読めて、足りない分は初期値で補われる', () => {
    const old = { version: 1, pet: { name: 'むかしのるう', id: 'pet1', color: 'milk', createdAt: '2025-01-01T00:00:00Z', roomSlots: { sill: 'x' } }, moods: [], journals: [] };
    const r = checkState(old);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = migrate(r.state);
    expect(s.pet.name).toBe('むかしのるう');
    expect(s.sky).toEqual({ stars: [], names: {} });
    expect(s.pet.personalityScores.foodie).toBe(0);
    expect(Array.isArray(s.tasks)).toBe(true);
  });
  it('こわれた入力でも、確認と移行のあとは主な計算がエラーにならない', () => {
    const messy = {
      version: 1,
      pet: { name: 5, activeDays: 'x', personalityScores: { calm: 'a' }, roomSlots: 3 },
      moods: [{}],
      tasks: [{ id: 't', title: 't', repeat: 'sometimes', isActive: 'yes' }],
      completions: [{ id: 'c', day: 'きのう', kind: 'task', at: 'x' }],
      ledger: { a: 1 },
      settings: 'none',
      sky: { stars: 'x', names: [] },
    };
    const r = checkState(messy);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = migrate(r.state);
    expect(() => [starsBalance(s), stageOf(s), tasksForToday(s.tasks, Date.now()), careCountToday(s)]).not.toThrow();
    expect(s.tasks[0]).toMatchObject({ repeat: 'daily', isActive: true });
    expect(s.pet.name).toBe('るう');
  });
});
