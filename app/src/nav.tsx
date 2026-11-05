import { createContext, useContext } from 'react';
import type { MoodValue } from './types';
import type { RecId } from './data/content';

export type Tab = 'home' | 'kokoro' | 'kiroku' | 'shop' | 'bouken';
export type SheetState =
  | { k: 'mood'; value?: MoodValue }
  | { k: 'recs'; recs: RecId[]; reply?: string; low?: boolean }
  | { k: 'breathing'; minutes?: 1 | 3 }
  | { k: 'journal'; id?: string; prompt?: string }
  | { k: 'tasks' }
  | { k: 'walk' }
  | { k: 'rest' }
  | { k: 'adventure'; id: string }
  | { k: 'wardrobe' }
  | { k: 'room' }
  | { k: 'settings' }
  | { k: 'sleepEdit'; id: string }
  | { k: 'moodEdit'; id: string }
  | { k: 'buy'; itemId: string }
  | { k: 'exchange'; itemId: string }
  | { k: 'sleepInfo' }
  | { k: 'eggs' }
  | { k: 'newPet'; id: string }
  | { k: 'pets' }
  | { k: 'letter'; month: string }
  | { k: 'backup' }
  | { k: 'charms' }
  | { k: 'sky' }
  | { k: 'morningMood'; advId: string | null }
  | { k: 'test' }
  | { k: 'wakeAsk'; sessId: string; advId: string | null; auto?: boolean }
  | { k: 'soloNight' }
  | { k: 'care' }
  | { k: 'help'; crisis?: boolean }
  | { k: 'outingBack'; kind: import('./types').OutingKind; min: number; auto?: boolean; compId?: string };

export interface Nav {
  tab: Tab;
  setTab: (t: Tab) => void;
  open: (s: SheetState) => void;
  close: () => void;
  /** おへやでふれあいメニューを開く（おすすめ「るうとあそぶ」用） */
  requestInteract: () => void;
  interactReq: number;
  /** ぼうけん画面のサブタブ指定 */
  boukenView: 'zukan' | 'craft' | 'items' | 'history';
  setBoukenView: (v: 'zukan' | 'craft' | 'items' | 'history') => void;
  /** いま開いているシートの種類 */
  sheetKind: SheetState['k'] | null;
}
export const NavCtx = createContext<Nav>(null as unknown as Nav);
export const useNav = () => useContext(NavCtx);

export function runRec(nav: Nav, id: RecId, toast: (t: string) => void) {
  switch (id) {
    case 'breath1':
      return nav.open({ k: 'breathing', minutes: 1 });
    case 'breath3':
      return nav.open({ k: 'breathing', minutes: 3 });
    case 'journal':
      return nav.open({ k: 'journal' });
    case 'goodthing':
      return nav.open({ k: 'journal', prompt: '今日の良かったこと：' });
    case 'walk':
      return nav.open({ k: 'walk' });
    case 'tasks':
      return nav.open({ k: 'tasks' });
    case 'rest':
      return nav.open({ k: 'rest' });
    case 'play':
      nav.close();
      nav.setTab('home');
      nav.requestInteract();
      return;
    case 'sleepNote':
      nav.close();
      nav.setTab('home');
      toast('夜になったら、おへやの「おやすみ」を押してね');
      return;
  }
}
