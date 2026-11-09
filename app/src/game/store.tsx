import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Celebration, GameState } from '../types';
import { sound } from '../sound';
import { ITEM_MAP } from '../data/items';
import { fb, Feedback, initialState, seasonCheck } from './logic';

const KEY = 'luu-prototype-v1';

function load(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw) as GameState);
  } catch {
    /* 保存領域が使えない環境でも動くようにする */
  }
  return initialState();
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
function save(s: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

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
  celebrations: Celebration[];
  popCelebration: () => void;
  importState: (s: GameState) => void;
}
const C = createContext<Ctx>(null as unknown as Ctx);
export const useGame = () => useContext(C);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<GameState>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [storageOk, setStorageOk] = useState(true);
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
    setStorageOk(save(s));
  }, [s]);
  useEffect(() => {
    sound.configure(s.settings);
  }, [s.settings]);

  // 起動時：季節プレゼント
  useEffect(() => {
    if (ref.current.player) update((d, f) => seasonCheck(d, f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importState = useCallback((x: GameState) => {
    const n = migrate(structuredClone(x));
    ref.current = n;
    setS(n);
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

  return <C.Provider value={{ s, update, reset, toasts, toast, storageOk, celebrations, popCelebration, importState }}>{children}</C.Provider>;
}
