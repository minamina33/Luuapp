/**
 * 保存データ・引き継ぎデータの形を確かめる
 * - 形がまったくちがう（るうのデータではない）ときは、読みこまない
 * - 一部の記録だけこわれているときは、その記録だけをのぞく／初期値にもどす
 *   （正しい記録には手をふれない。こわれた記録のせいで画面が開けなくなるのを防ぐため）
 * 足りない項目は、このあと migrate() が初期値で補う。
 */
import type { GameState } from '../types';

/** 引き継ぎコードの長さの上限（文字）。端末の保存領域（ふつう 5MB ほど）に入らない大きさは受けつけない */
export const MAX_CODE_LENGTH = 6_000_000;
/** データ（JSON）の長さの上限（文字） */
export const MAX_STATE_CHARS = 4_000_000;
/** 1つの一覧に入る件数の上限（ふつうに何年使ってもとどかない数） */
export const MAX_LIST = 100_000;

export type CheckResult = { ok: true; state: GameState; fixes: number } | { ok: false; reason: string };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown, max = 100_000): v is string => typeof v === 'string' && v.length <= max;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isDate = (v: unknown) => isStr(v, 40) && !Number.isNaN(Date.parse(v));
const isDay = (v: unknown) => isStr(v, 10) && /^\d{4}-\d{2}-\d{2}$/.test(v);

class Fixer {
  n = 0;
  /** 配列：配列でなければ空に、こわれた要素はのぞく */
  list(o: Obj, key: string, ok: (x: Obj) => boolean, fix?: (x: Obj) => void) {
    const v = o[key];
    if (v === undefined) return;
    if (!Array.isArray(v)) {
      o[key] = [];
      this.n++;
      return;
    }
    if (v.length > MAX_LIST) throw new Error(`${key} の件数が多すぎます`);
    const out: Obj[] = [];
    for (const x of v) {
      if (isObj(x) && ok(x)) {
        fix?.(x);
        out.push(x);
      } else this.n++;
    }
    o[key] = out;
  }
  /** 文字の配列 */
  strings(o: Obj, key: string) {
    const v = o[key];
    if (v === undefined) return;
    if (!Array.isArray(v)) {
      o[key] = [];
      this.n++;
      return;
    }
    if (v.length > MAX_LIST) throw new Error(`${key} の件数が多すぎます`);
    const out = v.filter((x) => isStr(x, 200));
    this.n += v.length - out.length;
    o[key] = out;
  }
  /** 「名前 → 値」の表：値の形がちがうものだけのぞく */
  record(o: Obj, key: string, ok: (x: unknown) => boolean) {
    const v = o[key];
    if (v === undefined) return;
    if (!isObj(v)) {
      o[key] = {};
      this.n++;
      return;
    }
    for (const k of Object.keys(v)) {
      if (!ok(v[k])) {
        delete v[k];
        this.n++;
      }
    }
  }
  /** 単純な値：形がちがえば初期値に */
  value(o: Obj, key: string, ok: (x: unknown) => boolean, def: unknown) {
    if (o[key] === undefined) return;
    if (!ok(o[key])) {
      o[key] = def;
      this.n++;
    }
  }
  /** なくてもよい値：形がちがえば消す */
  optional(o: Obj, key: string, ok: (x: unknown) => boolean) {
    if (o[key] === undefined) return;
    if (!ok(o[key])) {
      delete o[key];
      this.n++;
    }
  }
}

function checkPet(p: Obj, f: Fixer) {
  f.value(p, 'id', (x) => isStr(x, 80), 'pet1');
  f.value(p, 'name', (x) => isStr(x, 60), 'るう');
  f.value(p, 'color', (x) => isStr(x, 40), 'milk');
  f.value(p, 'createdAt', isDate, new Date().toISOString());
  f.value(p, 'totalBondPoints', (x) => isNum(x) && x >= 0, 0);
  f.strings(p, 'activeDays');
  f.record(p, 'found', (x) => isStr(x, 40));
  f.record(p, 'personalityScores', (x) => isNum(x) && x >= 0);
  f.value(p, 'outfit', (x) => x === null || isStr(x, 80), null);
  f.record(p, 'roomSlots', (x) => x === null || isStr(x, 80));
  f.optional(p, 'daily', (x) => isObj(x) && isStr(x.day, 10) && Array.isArray(x.meals) && isNum(x.plays));
}

/** データの形を確かめる。正しく直せないほどちがうときは ok:false */
export function checkState(input: unknown): CheckResult {
  try {
    if (!isObj(input)) return { ok: false, reason: 'るうのデータではないみたい' };
    if (input.version !== 1) return { ok: false, reason: 'このバージョンのアプリでは読めないデータです' };
    if (!isObj(input.pet)) return { ok: false, reason: 'るうのデータが見つかりませんでした' };
    const s = structuredClone(input) as Obj;
    const f = new Fixer();

    checkPet(s.pet as Obj, f);
    f.list(s, 'otherPets', () => true, (p) => checkPet(p, f));
    f.value(s, 'player', (x) => x === null || (isObj(x) && isStr(x.nickname, 60) && isDate(x.createdAt)), null);
    if (isObj(s.player)) f.strings(s.player, 'goals');

    // 記録
    f.list(s, 'moods', (m) => isStr(m.id, 80) && isDate(m.at) && isNum(m.value) && m.value >= 1 && m.value <= 5 && Number.isInteger(m.value), (m) => {
      f.strings(m, 'reasons');
      f.optional(m, 'note', (x) => isStr(x, 10_000));
    });
    f.list(s, 'journals', (j) => isStr(j.id, 80) && isDate(j.createdAt) && isStr(j.content, 100_000), (j) => {
      if (!isDate(j.updatedAt)) j.updatedAt = j.createdAt;
    });
    f.list(s, 'sleeps', (x) => isStr(x.id, 80) && isDate(x.startedAt) && (x.endedAt === undefined || isDate(x.endedAt)));
    f.list(s, 'completions', (c) => isStr(c.id, 80) && isDay(c.day) && isStr(c.kind, 40) && isStr(c.at, 40), (c) => {
      if (!isBool(c.rewardGranted)) c.rewardGranted = false;
      f.optional(c, 'minutes', (x) => isNum(x) && x >= 0);
      f.optional(c, 'detail', (x) => isStr(x, 500));
    });
    f.list(s, 'tasks', (t) => isStr(t.id, 80) && isStr(t.title, 500), (t) => {
      if (!['daily', 'weekdays', 'weekends'].includes(t.repeat as string)) t.repeat = 'daily';
      if (!isBool(t.isActive)) t.isActive = true;
      if (t.source !== 'suggested' && t.source !== 'custom') t.source = 'custom';
    });
    f.list(s, 'adventures', (a) => isStr(a.id, 80) && isStr(a.itemId, 80) && isStr(a.createdAt, 40), (a) => {
      if (!isBool(a.claimed)) a.claimed = true;
      if (!isNum(a.stars)) a.stars = 0;
    });
    f.list(s, 'ledger', (l) => isStr(l.id, 80) && isDay(l.day) && isStr(l.action, 200) && isNum(l.starsDelta) && Math.abs(l.starsDelta) <= 1_000_000);
    f.list(s, 'album', (a) => isStr(a.id, 80) && isStr(a.title, 500) && isStr(a.at, 40));

    // 持ちもの・図鑑など
    f.record(s, 'inventory', (x) => isNum(x) && x >= 0 && x <= 1_000_000);
    f.record(s, 'discovered', (x) => isStr(x, 40));
    f.record(s, 'rewardKeys', (x) => x === true);
    f.record(s, 'letterAuthors', (x) => isStr(x, 80));
    f.strings(s, 'usedToys');
    f.strings(s, 'lettersSeen');
    f.value(s, 'pity', (x) => isNum(x) && x >= 0, 0);
    f.value(s, 'personalityDaily', (x) => isObj(x) && isStr(x.day, 10) && isObj(x.got), { day: '', got: {} });
    f.value(s, 'sky', (x) => isObj(x) && Array.isArray(x.stars) && isObj(x.names), { stars: [], names: {} });
    if (isObj(s.sky)) {
      f.list(s.sky, 'stars', (x) => isStr(x.d, 20) && isNum(x.y));
      f.record(s.sky, 'names', (x) => isStr(x, 60));
    }

    // 設定（ロック番号は形がちがえば消す：開けなくなるのを防ぐ）
    f.value(s, 'settings', isObj, {});
    if (isObj(s.settings)) {
      for (const k of ['se', 'bgm', 'muted', 'reduceMotion']) f.optional(s.settings, k, isBool);
      f.optional(s.settings, 'lockHash', (x) => isStr(x, 400));
    }
    f.value(s, 'debug', (x) => isObj(x) && isBool(x.enabled) && isNum(x.timeOffsetMs), { enabled: false, timeOffsetMs: 0, forceRarity: null });

    // そのときだけの状態（こわれていたら、なかったことにする）
    f.value(s, 'eggOffer', (x) => x === null || (isObj(x) && isStr(x.petId, 80) && Array.isArray(x.choices)), null);
    f.value(s, 'egg', (x) => x === null || (isObj(x) && isStr(x.color, 40) && isNum(x.nightsLeft)), null);
    f.value(s, 'lastCare', (x) => x === null || (isObj(x) && isStr(x.id, 80) && isStr(x.kind, 40) && isStr(x.at, 40)), null);
    f.value(s, 'outing', (x) => x === null || (isObj(x) && isStr(x.kind, 40) && isDate(x.startedAt)), null);
    f.value(s, 'leaf', (x) => x === null || (isObj(x) && isStr(x.icon, 40) && isStr(x.until, 40)), null);

    return { ok: true, state: s as unknown as GameState, fixes: f.n };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'データの形がちがうみたい' };
  }
}
