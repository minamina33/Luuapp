import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Celebration, GameState } from '../types';
import { sound } from '../sound';
import { ITEM_MAP } from '../data/items';
import { fb, Feedback, initialState, seasonCheck } from './logic';
import { checkState } from './validate';

export const KEY = 'luu-prototype-v1';
/** 読みこめなかった（こわれていた）データを、消さずにとっておく場所 */
export const BROKEN_KEY = `${KEY}-broken`;
/** 引き継ぎコードで置きかえる直前のデータを、とっておく場所 */
export const BEFORE_IMPORT_KEY = `${KEY}-before-import`;

type Store = Pick<Storage, 'getItem' | 'setItem'>;
/**
 * 起動時の読みこみの結果
 * - ok：ふつうに読めた（repaired＞0 なら、こわれた記録だけのぞいた）
 * - recovered：読めなかったので、元のデータを BROKEN_KEY にとっておいて、はじめから
 * - stuck：読めず、とっておくこともできなかった（上書きしないよう、保存を止める）
 * - unavailable：保存領域そのものが使えない
 */
export type LoadStatus = 'ok' | 'recovered' | 'stuck' | 'unavailable';
export interface Loaded {
  state: GameState;
  status: LoadStatus;
  repaired: number;
}

/** 文字列（保存されていたJSON）を、形を確かめてから今のデータの形にする。読めなければ例外 */
export function parseState(raw: string): { state: GameState; fixes: number } {
  const r = checkState(JSON.parse(raw));
  if (!r.ok) throw new Error(r.reason);
  return { state: migrate(r.state), fixes: r.fixes };
}

/** 保存領域から読みこむ。読めなかったときも、元のデータは決して上書きしない */
export function loadFrom(store: Store): Loaded {
  let raw: string | null;
  try {
    raw = store.getItem(KEY);
  } catch {
    return { state: initialState(), status: 'unavailable', repaired: 0 };
  }
  if (!raw) return { state: initialState(), status: 'ok', repaired: 0 };
  try {
    const { state, fixes } = parseState(raw);
    // こわれた記録をのぞいたときは、念のため元の形もとっておく
    if (fixes > 0) {
      try {
        store.setItem(BROKEN_KEY, raw);
      } catch {
        /* とっておけなくても、正しい記録は読めているので続ける */
      }
    }
    return { state, status: 'ok', repaired: fixes };
  } catch {
    try {
      store.setItem(BROKEN_KEY, raw);
      return { state: initialState(), status: 'recovered', repaired: 0 };
    } catch {
      return { state: initialState(), status: 'stuck', repaired: 0 };
    }
  }
}
function load(): Loaded {
  try {
    return loadFrom(localStorage);
  } catch {
    return { state: initialState(), status: 'unavailable', repaired: 0 };
  }
}
/** 古い形式のデータを今の形にそろえる（引き継ぎコードの読みこみでも使う） */
export function migrate(s: GameState): GameState {
  {
    {
      // 欠けた項目は初期値で補う（簡易マイグレーション）
      const base = initialState();
      // v0.2: 「窓辺」スロットを「タンスの上」に移行
      const rs = (s.pet?.roomSlots ?? {}) as Record<string, string | null>;
      if ('sill' in rs) {
        rs.top = rs.top ?? rs.sill;
        delete rs.sill;
      }
      // v0.3: 「床の小物」をなくし、置き場所が変わった家具は新しい場所へ
      if ('floor' in rs) {
        const id = rs.floor;
        delete rs.floor;
        const to = id ? ITEM_MAP[id]?.slot : undefined;
        if (to && !rs[to]) rs[to] = id;
      }
      if (s.inventory && !s.inventory.cur_default) s.inventory.cur_default = 1;
      // v0.12: 星のモビール（絵なし）は、月のモビール（絵あり）にまとめる
      if (s.inventory?.wall_mobile) {
        s.inventory.wl_mobile = (s.inventory.wl_mobile ?? 0) + s.inventory.wall_mobile;
        delete s.inventory.wall_mobile;
        if (s.discovered && !s.discovered.wl_mobile) s.discovered.wl_mobile = s.discovered.wall_mobile ?? new Date().toISOString();
        for (const p of [s.pet, ...(s.otherPets ?? [])]) {
          if (!p) continue;
          if (p.roomSlots?.wall === 'wall_mobile') p.roomSlots.wall = 'wl_mobile';
          if (p.roomSlots?.wall2 === 'wall_mobile') p.roomSlots.wall2 = 'wl_mobile';
        }
      }
      // v0.12: 絵のないアイテム（麦わら帽子）を外す
      for (const gone of ['wall_hat']) {
        if (s.inventory) delete s.inventory[gone];
        if (s.discovered) delete s.discovered[gone];
        if (s.pet?.found) delete s.pet.found[gone];
        for (const p of [s.pet, ...(s.otherPets ?? [])]) {
          if (!p) continue;
          for (const k of Object.keys(p.roomSlots ?? {}) as Array<keyof typeof p.roomSlots>) if (p.roomSlots[k] === gone) p.roomSlots[k] = null;
          if (p.found) delete p.found[gone];
        }
      }
      // v0.4: 複数のるう。1匹目に id・色・その子のみつけたもの帳を補う
      if (s.pet && !s.pet.found) s.pet.found = { ...(s.discovered ?? {}) };
      if (!s.sky) (s as GameState).sky = { stars: [], names: {} };
      // v0.13: 性格「くいしんぼう」を追加。前のデータには点数がないので 0 で補う
      for (const p of [s.pet, ...(s.otherPets ?? [])]) if (p) p.personalityScores = { ...base.pet.personalityScores, ...p.personalityScores };
      return { ...base, ...s, pet: { ...base.pet, ...s.pet, roomSlots: { ...base.pet.roomSlots, ...s.pet?.roomSlots } }, debug: { ...base.debug, ...s.debug }, settings: { ...base.settings, ...s.settings } };
    }
  }
}
/** 保存。容量不足などで書けなければ false（前に保存した内容はそのまま残る） */
export function saveTo(store: Store & Partial<Pick<Storage, 'removeItem'>>, s: GameState) {
  const json = JSON.stringify(s);
  try {
    store.setItem(KEY, json);
    return true;
  } catch {
    // 容量が足りないときは、引き継ぎ前のひかえ（確認画面で了承ずみ）を消して、いまの記録を優先する
    try {
      if (store.getItem(BEFORE_IMPORT_KEY) === null) return false;
      store.removeItem?.(BEFORE_IMPORT_KEY);
      store.setItem(KEY, json);
      return true;
    } catch {
      return false;
    }
  }
}
const save = (s: GameState) => {
  try {
    return saveTo(localStorage, s);
  } catch {
    return false;
  }
};

export interface Toast {
  id: number;
  text: string;
}

interface Ctx {
  s: GameState;
  /** 状態を複製して書き換える。Feedback を返すと星・親密度のトーストを出す */
  update: (fn: (d: GameState, f: Feedback) => void) => Feedback;
  reset: () => void;
  toasts: Toast[];
  toast: (t: string) => void;
  storageOk: boolean;
  /** 起動時の読みこみの結果（読めなかったときの案内用） */
  loadStatus: LoadStatus;
  /** 起動時に、こわれた記録をのぞいた件数 */
  repaired: number;
  dismissLoadNotice: () => void;
  celebrations: Celebration[];
  popCelebration: () => void;
  /** 引き継ぎコードのデータに置きかえる。置きかえる前のデータはとっておく。できなければ false（いまのデータはそのまま） */
  importState: (s: GameState) => boolean;
}
const C = createContext<Ctx>(null as unknown as Ctx);
export const useGame = () => useContext(C);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [loaded] = useState<Loaded>(load);
  const [s, setS] = useState<GameState>(loaded.state);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(loaded.status);
  const [repaired, setRepaired] = useState(loaded.repaired);
  const dismissLoadNotice = useCallback(() => (setRepaired(0), setLoadStatus((x) => (x === 'recovered' ? 'ok' : x))), []);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storageOk, setStorageOk] = useState(loaded.status !== 'unavailable');
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const popCelebration = useCallback(() => setCelebrations((c) => c.slice(1)), []);
  const ref = useRef(s);
  ref.current = s;
  const tid = useRef(1);

  const toast = useCallback((text: string) => {
    const id = tid.current++;
    setToasts((t) => [...t, { id, text }].slice(-3));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const update = useCallback(
    (fn: (d: GameState, f: Feedback) => void) => {
      const d = structuredClone(ref.current);
      const f = fb();
      fn(d, f);
      ref.current = d;
      setS(d);
      const parts: string[] = [];
      if (f.stars) parts.push(`★ +${f.stars}`);
      if (f.bond) parts.push(`💗 +${f.bond}`);
      if (parts.length) toast(parts.join('　'));
      f.messages.forEach((m, i) => setTimeout(() => toast(m), 350 * (i + 1)));
      if (f.events.length) setCelebrations((c) => [...c, ...f.events.map((e) => ({ ...e, id: tid.current++ }))]);
      else if (f.stars > 0) sound.se('coin');
      return f;
    },
    [toast]
  );

  useEffect(() => {
    // 読めなかった元のデータをとっておけなかったときは、上書きしないよう保存しない
    if (loadStatus === 'stuck') return setStorageOk(false);
    setStorageOk(save(s));
  }, [s, loadStatus]);
  // 別のタブ・ウィンドウで記録が変わったら、こちらもそれに合わせる（古い内容で上書きしないように）
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        const n = parseState(e.newValue).state;
        ref.current = n;
        setS(n);
      } catch {
        /* 読めない内容なら無視する */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => {
    sound.configure(s.settings);
  }, [s.settings]);

  // 起動時：季節プレゼント
  useEffect(() => {
    if (ref.current.player) update((d, f) => seasonCheck(d, f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importState = useCallback((x: GameState) => {
    let n: GameState;
    try {
      n = migrate(structuredClone(x));
    } catch {
      return false;
    }
    // 置きかえる前のデータをとっておく（とっておけなくても、確認画面で了承ずみなので続ける）
    try {
      localStorage.setItem(BEFORE_IMPORT_KEY, JSON.stringify(ref.current));
    } catch {
      /* noop */
    }
    ref.current = n;
    setS(n);
    // 読めなかったデータの上書きを止めていた場合も、引き継いだデータは保存してよい
    setLoadStatus((st) => (st === 'stuck' ? 'ok' : st));
    return true;
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
    const n = initialState();
    ref.current = n;
    setS(n);
  }, []);

  return (
    <C.Provider value={{ s, update, reset, toasts, toast, storageOk, loadStatus, repaired, dismissLoadNotice, celebrations, popCelebration, importState }}>{children}</C.Provider>
  );
}
