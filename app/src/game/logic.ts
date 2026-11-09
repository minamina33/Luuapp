/**
 * ゲームロジック（決定論的・端末内のみ）
 * 関数の多くは「複製済みの state を直接書き換える」形。呼び出しは store.tsx の update() 経由。
 */
import {
  ADVENTURE_STARS,
  AREA_INFO,
  AREA_RATES,
  BOND_NAMES,
  BOND_POINTS,
  BOND_THRESHOLDS,
  DAILY_CARE_STAR_CAP,
  DAY_START_HOUR,
  EXCHANGE_STARS,
  PERSONALITY_BIAS,
  PERSONALITY_DAILY_CAP,
  PERSONALITY_REVEAL_POINTS,
  PERSONALITY_NAMES,
  RARITY_RATES,
  SECRET_PITY,
  STAGE_DAYS,
  STAGE_NAMES,
  STARS,
  WELCOME_STARS,
} from '../config';
import { BOND_GIFTS, INITIAL_INVENTORY, ITEMS, item, SEASON_GIFTS, STAGE_GIFTS } from '../data/items';
import { COLOR_MAP, COLORS } from '../data/colors';
import { CHEER_AT, EGG_CHOICES, EGG_NIGHTS, EGG_SECRET_RATE, PLAY_BASE, PLAY_MAX, SEASON_RATE, SERIES_RATE, SNACKS_PER_DAY, FOODIE_EXTRA_SNACKS } from '../config';
import { FOODS, storyFor } from '../data/content';
import { RECIPES, recipeFor } from '../data/recipes';
import { CARE_CHARM, CHARMS, heartLine, MAX_CHARMS, WORDS_LINES, type CharmId } from '../data/charms';
import { withYou } from '../data/content';
import { constellationsOf } from '../data/sky';
import type { OutingKind, AdventureResult, Area, CareTask, Celebration, CareKind, ColorId, GameState, ItemCategory, ItemDef, Pet, Personality, Rarity, Season, SleepSession } from '../types';

// ---------------------------------------------------------------- 時間
export const nowMs = (s: GameState) => Date.now() + (s.debug?.timeOffsetMs ?? 0);
export const nowIso = (s: GameState) => new Date(nowMs(s)).toISOString();
const pad = (n: number) => String(n).padStart(2, '0');
/** 朝4時区切りの「その日」 */
export function dayKey(ms: number | string): string {
  const t = typeof ms === 'string' ? new Date(ms).getTime() : ms;
  const d = new Date(t - DAY_START_HOUR * 3600_000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const today = (s: GameState) => dayKey(nowMs(s));
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';
export function timeOfDay(ms: number): TimeOfDay {
  const h = new Date(ms).getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'evening';
  return 'night';
}
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---------------------------------------------------------------- 初期状態
export function initialState(): GameState {
  return {
    version: 1,
    player: null,
    pet: newPet('milk', 'るう', new Date().toISOString(), 'pet1'),
    moods: [],
    tasks: [],
    completions: [],
    journals: [],
    sleeps: [],
    adventures: [],
    inventory: { ...INITIAL_INVENTORY },
    discovered: {},
    ledger: [],
    rewardKeys: {},
    album: [],
    pity: 0,
    personalityDaily: { day: '', got: {} },
    usedToys: [],
    debug: { enabled: false, timeOffsetMs: 0, forceRarity: null },
    settings: { se: true, bgm: false, muted: false, reduceMotion: false },
    otherPets: [],
    eggOffer: null,
    egg: null,
    lettersSeen: [],
    sky: { stars: [], names: {} },
    letterAuthors: {},
  };
}

export function newPet(color: ColorId, name: string, at: string, id = 'pet_' + uid()): Pet {
  return {
    id,
    color,
    createdAt: at,
    found: {},
    name,
    totalBondPoints: 0,
    activeDays: [],
    personalityScores: { energetic: 0, calm: 0, affectionate: 0, adventurous: 0, foodie: 0 },
    outfit: null,
    roomSlots: { bed: 'bed_default', rug: 'rug_default', curtain: 'cur_default', wall: null, wall2: null, chest: null, top: null, top2: null, plush: null, floor: null, floor2: null },
  };
}
/** 1匹目は従来のキー、2匹目以降はその子のIDつきのキー（記念品の二重付与防止） */
const petKey = (s: GameState, k: string) => (s.pet.id === 'pet1' ? k : `${k}:${s.pet.id}`);
export const allPets = (s: GameState) => [s.pet, ...s.otherPets];
export function seasonOf(ms: number): Season {
  const m = new Date(ms).getMonth() + 1;
  return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
}

// ---------------------------------------------------------------- 導出値
export const starsBalance = (s: GameState) => s.ledger.reduce((a, l) => a + l.starsDelta, 0);
export function stageOf(s: GameState): number {
  const n = s.pet.activeDays.length;
  let st = 1;
  STAGE_DAYS.forEach((d, i) => {
    if (n >= d) st = i + 1;
  });
  return st;
}
export const stageName = (st: number) => STAGE_NAMES[st - 1];
export function bondLevel(points: number): number {
  let lv = 1;
  BOND_THRESHOLDS.forEach((t, i) => {
    if (points >= t) lv = i + 1;
  });
  return lv;
}
export function bondProgress(points: number) {
  const lv = bondLevel(points);
  const cur = BOND_THRESHOLDS[lv - 1];
  const next = BOND_THRESHOLDS[lv];
  return { lv, name: BOND_NAMES[lv - 1], cur: points - cur, need: next === undefined ? null : next - cur, toNext: next === undefined ? null : next - points };
}
export function personalityTop(s: GameState): { main: Personality | null; sub: Personality | null } {
  const e = Object.entries(s.pet.personalityScores).sort((a, b) => b[1] - a[1]) as Array<[Personality, number]>;
  // 数日いっしょにすごすまでは「まだわからない」。少しずつ見えてくるようにする
  const total = e.reduce((a, [, v]) => a + v, 0);
  if (total < PERSONALITY_REVEAL_POINTS) return { main: null, sub: null };
  const main = e[0][1] > 0 ? e[0][0] : null;
  const sub = e[1][1] > 0 && e[1][1] >= e[0][1] * 0.5 ? e[1][0] : null;
  return { main, sub };
}
export const personalityLabel = (s: GameState) => {
  const { main, sub } = personalityTop(s);
  if (!main) return 'まだわからない';
  return PERSONALITY_NAMES[main] + (sub ? `・すこし${PERSONALITY_NAMES[sub]}` : '');
};
export const careStarsOn = (s: GameState, day: string) =>
  s.ledger.filter((l) => l.care && l.day === day).reduce((a, l) => a + l.starsDelta, 0);
export const currentSleep = (s: GameState): SleepSession | undefined => s.sleeps.find((x) => !x.endedAt);
export const doneToday = (s: GameState, kind: CareKind, taskId?: string) =>
  s.completions.some((c) => c.kind === kind && c.day === today(s) && (taskId === undefined || c.taskId === taskId));

// ---------------------------------------------------------------- 報酬
export interface Feedback {
  stars: number;
  bond: number;
  messages: string[];
  /** 全画面のお祝い演出に回すイベント */
  events: Celebration[];
}
export const fb = (): Feedback => ({ stars: 0, bond: 0, messages: [], events: [] });

/** 一意キーで1回だけ星を付与。care=true のときは1日の上限を適用 */
export function grantStars(s: GameState, f: Feedback, key: string, action: string, amount: number, care: boolean, relatedId?: string) {
  if (s.rewardKeys[key]) return 0;
  s.rewardKeys[key] = true;
  let n = amount;
  const day = today(s);
  if (care) n = Math.max(0, Math.min(n, DAILY_CARE_STAR_CAP - careStarsOn(s, day)));
  if (n > 0) {
    s.ledger.push({ id: uid(), at: nowIso(s), day, action, starsDelta: n, care, relatedId });
    f.stars += n;
  }
  return n;
}
export function spendStars(s: GameState, action: string, amount: number, relatedId?: string) {
  s.ledger.push({ id: uid(), at: nowIso(s), day: today(s), action, starsDelta: -amount, relatedId });
}

export function addItem(s: GameState, f: Feedback | null, id: string, n = 1) {
  s.inventory[id] = (s.inventory[id] ?? 0) + n;
  if (!s.discovered[id]) s.discovered[id] = nowIso(s);
  if (!s.pet.found[id]) s.pet.found[id] = nowIso(s);
  if (f) f.messages.push(`「${item(id).title}」をもらった`);
}

export function giftOnce(s: GameState, f: Feedback, key: string, itemId: string, title: string, sub?: string) {
  if (s.rewardKeys[key]) return;
  s.rewardKeys[key] = true;
  addItem(s, null, itemId);
  s.album.push({ id: uid(), at: nowIso(s), kind: 'gift', title, detail: `「${item(itemId).title}」をもらった` });
  f.events.push({ kind: 'gift', title, sub: sub ?? `${s.pet.name}からのプレゼント`, itemId });
}

/** 親密度（種類ごとに1日1回） */
export function addBond(s: GameState, f: Feedback, kind: keyof typeof BOND_POINTS | 'debug', pts: number, once = true) {
  if (once) {
    const key = `bond:${kind}:${today(s)}`;
    if (s.rewardKeys[key]) return 0;
    s.rewardKeys[key] = true;
  }
  const before = bondLevel(s.pet.totalBondPoints);
  s.pet.totalBondPoints += pts;
  f.bond += pts;
  const after = bondLevel(s.pet.totalBondPoints);
  for (let lv = before + 1; lv <= after; lv++) {
    s.album.push({ id: uid(), at: nowIso(s), kind: 'bond', title: `親密度 Lv${lv}「${BOND_NAMES[lv - 1]}」` });
    f.events.push({ kind: 'bond', level: lv, title: `${s.pet.name}ともっと仲良くなった！`, sub: `親密度 Lv${lv}「${BOND_NAMES[lv - 1]}」` });
    (BOND_GIFTS[lv] ?? []).forEach((id, i) => giftOnce(s, f, petKey(s, `gift:bond:${lv}${i ? ':' + i : ''}`), id, `親密度Lv${lv}の記念`));
  }
  return pts;
}

/** ふれあい日数（1日上限1・後退なし） */
export function markActive(s: GameState, f: Feedback) {
  const d = today(s);
  if (s.pet.activeDays.includes(d)) return;
  const before = stageOf(s);
  s.pet.activeDays.push(d);
  const after = stageOf(s);
  for (let st = before + 1; st <= after; st++) onStage(s, f, st);
}
/** 開発者用：ふれあい日数を n 日ぶん追加（成長イベントも発生させる） */
export function devAddDays(s: GameState, f: Feedback, n: number) {
  for (let i = 0; i < n; i++) {
    const before = stageOf(s);
    s.pet.activeDays.unshift(`dev-${uid()}`);
    const after = stageOf(s);
    for (let st = before + 1; st <= after; st++) onStage(s, f, st);
  }
}
function onStage(s: GameState, f: Feedback, st: number) {
  s.album.push({ id: uid(), at: nowIso(s), kind: 'growth', title: `${s.pet.name}が「${stageName(st)}」になった`, detail: `Stage ${st}` });
  const newFood = FOODS.find((x) => x.stage === st);
  const newToy = s.pet.id === 'pet1' ? (STAGE_GIFTS[st] ?? []).map((id) => item(id)).find((i) => i.category === 'toy') : undefined;
  const note = [newFood && `ごはんに「${newFood.label}」`, newToy && `あそびに「${newToy.title}」`].filter(Boolean).join('、');
  // 成長の朝には、ちょっとした「はじめて」が起きる
  const you = s.player?.nickname || 'あなた';
  const { main } = personalityTop(s);
  const TITLE: Record<number, string> = {
    2: `「……${you}！」`,
    3: `${s.pet.name}が、ひとりで窓の外を見ている…`,
    4: `${s.pet.name}から、手紙がとどいた`,
  };
  const STORY: Record<number, string> = {
    2: `${s.pet.name}が、はじめてことばをしゃべった！さいしょのことばは、${you}の名前だったよ。`,
    3: `「あっちにも、いってみたい」だって。${main ? `${s.pet.name}は「${TOKUI[main]}」がすきな子に育ってきたみたい。` : ''}`,
    4: `「いつもそばにいてくれて、ありがとう。これからも、いっしょにいようね。」${s.pet.name}は、おとなになったよ。`,
  };
  f.events.push({ kind: 'stage', stage: st, title: TITLE[st] ?? `${s.pet.name}がすこし大きくなった！`, sub: `Stage ${st}「${stageName(st)}」`, story: STORY[st], note: note ? `${note}がふえたよ` : undefined });
  // 1匹目は決まった記念品、2匹目以降はその子の色シリーズ
  const later: Record<number, string[]> = { 2: [`se_${s.pet.color}_col`], 3: [`se_${s.pet.color}_cur`], 4: [`se_${s.pet.color}_rug`] };
  // 成長すると、ごはんのメニューもふえる
  // 1匹目は「あたらしいあそび（おもちゃ）」。もう持っているときや2匹目以降は、その子の色シリーズ
  const base = STAGE_GIFTS[st] ?? [];
  const gifts = s.pet.id === 'pet1' ? base : [...base.filter((id) => !(s.inventory[id] > 0)), ...(later[st] ?? [])];
  gifts.forEach((id, i) => giftOnce(s, f, petKey(s, `gift:stage:${st}${i ? ':' + i : ''}`), id, `Stage${st}の成長記念`));
  if (st === 4) offerEggs(s, f);
}

// ---------------------------------------------------------------- たまご・なかま
/** おとなになったら、まだ迎えていない色のたまごを3つ持って帰ってくる */
export function offerEggs(s: GameState, f: Feedback) {
  const key = `eggs:${s.pet.id}`;
  if (s.rewardKeys[key] || s.eggOffer || s.egg) return;
  s.rewardKeys[key] = true;
  const owned = new Set(allPets(s).map((p) => p.color));
  let pool = COLORS.filter((c) => !c.secret && !owned.has(c.id)).map((c) => c.id);
  if (pool.length < EGG_CHOICES) pool = COLORS.filter((c) => !c.secret).map((c) => c.id);
  const choices: ColorId[] = [];
  while (choices.length < Math.min(EGG_CHOICES, pool.length)) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    if (!choices.includes(c)) choices.push(c);
  }
  if (!owned.has('yuki') && Math.random() < EGG_SECRET_RATE) choices[choices.length - 1] = 'yuki';
  s.eggOffer = { petId: s.pet.id, choices };
  s.album.push({ id: uid(), at: nowIso(s), kind: 'gift', title: `${s.pet.name}がたまごを見つけてきた` });
  f.events.push({ kind: 'eggs', title: `${s.pet.name}がたまごを見つけてきた！`, sub: 'どのたまごを温める？' });
}
export function chooseEgg(s: GameState, color: ColorId) {
  if (!s.eggOffer || !s.eggOffer.choices.includes(color)) return;
  s.egg = { color, nightsLeft: EGG_NIGHTS, startedAt: nowIso(s) };
  s.eggOffer = null;
}
/** おはようのたびに1晩ぶん進む（1日1回）。かえったら新しい子をなかまに加える */
function eggNight(s: GameState, f: Feedback) {
  if (!s.egg || s.egg.lastNight === today(s)) return;
  s.egg.lastNight = today(s);
  s.egg.nightsLeft -= 1;
  if (s.egg.nightsLeft > 0) {
    f.messages.push(`🥚 たまごがすこし動いた…（あと${s.egg.nightsLeft}晩）`);
    return;
  }
  const c = COLOR_MAP[s.egg.color];
  const p = newPet(c.id, c.name, nowIso(s));
  s.otherPets.push(p);
  s.egg = null;
  s.album.push({ id: uid(), at: nowIso(s), kind: 'start', title: `${c.name}のるうが生まれた` });
  f.events.push({ kind: 'hatch', color: c.id, petId: p.id, title: 'たまごがかえった！', sub: `${c.name}のるうが生まれたよ` });
}
/** おへやに出す子を切り替える（部屋はそのまま引きつぐ） */
export function switchPet(s: GameState, id: string) {
  const i = s.otherPets.findIndex((p) => p.id === id);
  if (i < 0) return;
  const next = s.otherPets[i];
  next.roomSlots = s.pet.roomSlots;
  s.otherPets.splice(i, 1, s.pet);
  s.pet = next;
  s.personalityDaily = { day: '', got: {} };
}

export function addPersonality(s: GameState, p: Personality, pts = 2) {
  const d = today(s);
  // 前の形式（total だけの保存データ）は got がないので、その日の分から数え直す
  if (s.personalityDaily.day !== d || !s.personalityDaily.got) s.personalityDaily = { day: d, got: {} };
  const got = s.personalityDaily.got[p] ?? 0;
  const n = Math.max(0, Math.min(pts, PERSONALITY_DAILY_CAP - got));
  s.pet.personalityScores[p] += n;
  s.personalityDaily.got[p] = got + n;
}

/** セルフケア実施の共通処理（ふれあい日数・その日最初のケア親密度・記録） */
export function onCare(s: GameState, f: Feedback, kind: CareKind, opts: { taskId?: string; detail?: string; starKey?: string; stars?: number; minutes?: number; approx?: boolean; range?: string } = {}) {
  markActive(s, f);
  // どんなケアをするかで、るうの「とくい」が育つ
  const CARE_P: Partial<Record<CareKind, Personality>> = { walk: 'energetic', breathing: 'calm', journal: 'calm', mood: 'affectionate', task: 'adventurous' };
  if (CARE_P[kind]) addPersonality(s, CARE_P[kind]!, 1);
  addBond(s, f, 'firstCareOfDay', BOND_POINTS.firstCareOfDay);
  let got = 0;
  if (opts.starKey && opts.stars) got = grantStars(s, f, opts.starKey, kind, opts.stars, true);
  const id = uid();
  const before = charmsFor(s, today(s));
  s.completions.push({ id, at: nowIso(s), day: today(s), kind, taskId: opts.taskId, detail: opts.detail, rewardGranted: got > 0, minutes: opts.minutes, approx: opts.approx, range: opts.range });
  // おまもりが新しくかばんに入ったら知らせる
  const after = charmsFor(s, today(s));
  const added = after.find((c) => !before.includes(c));
  // おまもりは裏で効くだけにして、毎回は知らせない（朝の冒険のひとことで伝える）
  void added;
  // おへやに戻ったときに、るうが今のケアを喜ぶ
  s.lastCare = { id, kind, detail: opts.detail, at: nowIso(s) };
  // 今日のタスクがぜんぶできたら、るうがお祝い（1日1回）
  if (kind === 'task') {
    const list = tasksForToday(s.tasks, nowMs(s));
    if (list.length >= 2 && list.every((t) => doneToday(s, 'task', t.id)) && !s.rewardKeys[`cheer:tasks:${today(s)}`]) {
      s.rewardKeys[`cheer:tasks:${today(s)}`] = true;
      s.rewardKeys[`cheer:${today(s)}`] = true;
      f.events.push({ kind: 'cheer', title: '今日のタスク、ぜんぶできたね！', sub: `${list.length}つの小さな習慣、ぜんぶ。${s.pet.name}、とびはねちゃう！` });
    }
  }
  // その日のケアが CHEER_AT 個になったら、るうがお祝い（1日1回）
  const n = careCountToday(s);
  // （タスク全部のお祝いと同時なら、そちらだけにする）
  if (n >= CHEER_AT && !s.rewardKeys[`cheer:${today(s)}`]) {
    s.rewardKeys[`cheer:${today(s)}`] = true;
    f.events.push({ kind: 'cheer', title: `今日のケア、${CHEER_AT}つめ！`, sub: `自分のこと、大事にできてるね。${s.pet.name}もうれしい！` });
  }
}

/** その日の（曜日に合う）タスク */
export function tasksForToday(tasks: CareTask[], ms: number) {
  const dow = new Date(ms - DAY_START_HOUR * 3600_000).getDay();
  const weekend = dow === 0 || dow === 6;
  return tasks.filter((t) => t.isActive && (t.repeat === 'daily' || (t.repeat === 'weekends' ? weekend : !weekend)));
}
/** その日にやったセルフケアの数（気分記録・睡眠もふくむ） */
export const careCountToday = (s: GameState) => s.completions.filter((c) => c.day === today(s)).length;

// ---------------------------------------------------------------- ごはん・あそぶの回数
export type MealSlot = 'morning' | 'noon' | 'night';
export const MEAL_NAMES: Record<MealSlot, string> = { morning: 'あさ', noon: 'ひる', night: 'よる' };
export function mealSlot(ms: number): MealSlot {
  const h = new Date(ms).getHours();
  return h >= 4 && h < 10 ? 'morning' : h >= 10 && h < 16 ? 'noon' : 'night';
}
export function petDaily(s: GameState) {
  const d = today(s);
  if (!s.pet.daily || s.pet.daily.day !== d) s.pet.daily = { day: d, meals: [], snack: false, plays: 0 };
  return s.pet.daily;
}
/** 読み取り専用（state を書きかえない） */
export function dailyView(s: GameState) {
  const d = today(s);
  return s.pet.daily && s.pet.daily.day === d ? s.pet.daily : { day: d, meals: [] as string[], snack: false, plays: 0 };
}
export const canEatMeal = (s: GameState) => !dailyView(s).meals.includes(mealSlot(nowMs(s)));
export const snacksEaten = (s: GameState) => {
  const v = dailyView(s);
  return v.snacks ?? (v.snack ? 1 : 0);
};
/** おやつの回数（くいしんぼうの子は多め） */
export const snackLimit = (s: GameState) => SNACKS_PER_DAY + (personalityTop(s).main === 'foodie' ? FOODIE_EXTRA_SNACKS : 0);
export const canEatSnack = (s: GameState) => snacksEaten(s) < snackLimit(s);
export const playLimit = (s: GameState) => Math.min(PLAY_MAX, PLAY_BASE + careCountToday(s));
export const playsLeft = (s: GameState) => Math.max(0, playLimit(s) - dailyView(s).plays);
export function nextMeal(s: GameState): string {
  const cur = mealSlot(nowMs(s));
  return MEAL_NAMES[cur === 'morning' ? 'noon' : cur === 'noon' ? 'night' : 'morning'];
}

export function careStarsFor(kind: CareKind) {
  return kind === 'mood' ? STARS.moodFirstOfDay : kind === 'task' ? STARS.task : kind === 'sleep' ? STARS.sleep : STARS.care;
}

// ---------------------------------------------------------------- 季節
export function seasonCheck(s: GameState, f: Feedback) {
  const m = new Date(nowMs(s)).getMonth() + 1;
  const y = new Date(nowMs(s)).getFullYear();
  for (const g of SEASON_GIFTS) {
    // 冬（12〜2月）は年をまたぐので、12月の年で数える
    const sy = g.months.includes(12) && m <= 2 ? y - 1 : y;
    if (g.months.includes(m)) giftOnce(s, f, `gift:season:${sy}:${g.season}`, g.itemId, `${g.season}の季節プレゼント`);
  }
}

export function welcome(s: GameState) {
  if (s.rewardKeys['welcome']) return;
  s.rewardKeys['welcome'] = true;
  s.ledger.push({ id: uid(), at: nowIso(s), day: today(s), action: 'welcome', starsDelta: WELCOME_STARS });
}

// ---------------------------------------------------------------- 冒険
/** 文字列から決定論的な乱数列を作る（同じセッションIDなら同じ結果） */
function rng(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickWeighted<T extends string>(r: () => number, w: Partial<Record<T, number>>): T {
  const e = Object.entries(w) as Array<[T, number]>;
  const tot = e.reduce((a, [, v]) => a + v, 0);
  let x = r() * tot;
  for (const [k, v] of e) {
    x -= v;
    if (x <= 0) return k;
  }
  return e[e.length - 1][0];
}
// 性格ごとに見つけやすいおみやげ（くいしんぼうは種類ではなく、ごはんになるものと食べもの系の見た目のもの）
const BIAS_CAT: Record<Exclude<Personality, 'foodie'>, ItemCategory> = {
  energetic: 'toy',
  calm: 'furniture',
  affectionate: 'outfit',
  adventurous: 'collectible',
};
const likes = (p: Personality, i: ItemDef) => (p === 'foodie' ? !!(i.food || i.tasty) : BIAS_CAT[p] === i.category);
export function unlockedAreas(stage: number): Area[] {
  return Object.keys(AREA_RATES[stage - 1]) as Area[];
}

// ---------------------------------------------------------------- 夜空と星座
/** 星を1つ灯す（1晩1つ）。星座が完成したらお祝い。朝の結果に出す一文を返す */
export function lightStar(s: GameState, f: Feedback, day: string): string | null {
  if (!s.sky) s.sky = { stars: [], names: {} };
  if (s.sky.stars.some((x) => x.d === day)) return null;
  const y = Number(day.slice(0, 4)) || new Date(nowMs(s)).getFullYear();
  s.sky.stars.push({ d: day, y });
  const cs = constellationsOf(s.sky.stars, y);
  const cur = [...cs].reverse().find((c) => c.lit > 0)!;
  if (cur.done) {
    s.album.push({ id: uid(), at: nowIso(s), kind: 'gift', title: `${y}年の星座 その${cur.index + 1}ができた` });
    f.events.push({ kind: 'constellation', title: '星座ができた！', sub: `{you}が続けてきたタスクが、夜空でつながったよ。名前をつけてあげよう`.replace('{you}', s.player?.nickname || 'あなた') });
    return '⭐ {you}がタスクをがんばってくれたから、夜空に星がひとつ灯って……星座が完成したよ！';
  }
  return `⭐ {you}がタスクをがんばってくれたから、夜空に星がひとつ増えたよ（星座まであと${cur.total - cur.lit}こ）。`;
}

/** その日のケアから、冒険かばんに入ったおまもり（ケアした順・3つまで） */
export function charmsFor(s: GameState, day: string): CharmId[] {
  const out: CharmId[] = [];
  [...s.completions]
    .filter((c) => c.day === day)
    .sort((a, b) => a.at.localeCompare(b.at))
    .forEach((c) => {
      const ch = CARE_CHARM[c.kind];
      if (ch && !out.includes(ch) && out.length < MAX_CHARMS) out.push(ch);
    });
  return out;
}

/** その夜に持っていくおまもり。前の夜に冒険へ行かなかったときは、前の日の分も持ちこす */
export function nightCharms(s: GameState, day: string): CharmId[] {
  const out = charmsFor(s, day);
  const prev = dayKey(new Date(day + 'T12:00:00').getTime() - 86400_000 + DAY_START_HOUR * 3600_000);
  const wentPrev = s.sleeps.some((x) => !x.solo && x.adventureId && dayKey(x.startedAt) === prev);
  if (!wentPrev) for (const c of charmsFor(s, prev)) if (!out.includes(c) && out.length < MAX_CHARMS) out.push(c);
  return out;
}

export function rollAdventure(s: GameState, session: SleepSession): AdventureResult {
  const r = rng(session.id);
  const stage = stageOf(s);
  // おやすみした日のおまもり
  const charms = nightCharms(s, dayKey(session.startedAt));
  const has = (c: CharmId) => charms.includes(c);
  const rates: Partial<Record<Area, number>> = { ...AREA_RATES[stage - 1] };
  let farther: Area | null = null;
  // 風：静かな湖へ行きやすい
  if (has('wind') && rates.moonLake) rates.moonLake *= 1.8;
  // くつ：まだ行けないエリアへ足をのばせることがある。全部行けるなら遠い丘へ
  if (has('shoes')) {
    const next = (['moonLake', 'starHill'] as Area[]).find((a) => rates[a] === undefined);
    if (next) {
      rates[next] = 0.35;
      farther = next;
    } else if (rates.starHill) rates.starHill *= 1.6;
  }
  const area = pickWeighted<Area>(r, rates);
  let rarity: Rarity = pickWeighted<Rarity>(r, RARITY_RATES);
  if (s.pity >= SECRET_PITY) rarity = 'secret';
  if (s.debug.enabled && s.debug.forceRarity) rarity = s.debug.forceRarity;
  const { main } = personalityTop(s);
  // まれに「その子の色シリーズ」や「季節限定」から選ぶ（天井・レア固定のときは通常どおり）
  const special = r();
  const forced = s.pity >= SECRET_PITY || (s.debug.enabled && !!s.debug.forceRarity);
  const season = seasonOf(nowMs(s));
  const live = ITEMS.filter((i) => !i.resting);
  let base: ItemDef[] = live.filter((i) => i.area === area && !i.giftOnly);
  if (!forced && special < SERIES_RATE) base = live.filter((i) => i.series === s.pet.color);
  else if (!forced && special < SERIES_RATE + SEASON_RATE && live.some((i) => i.season === season)) base = live.filter((i) => i.season === season);
  let pool = base.filter((i) => i.rarity === rarity);
  if (pool.length === 0) pool = base.filter((i) => i.rarity === 'common');
  if (pool.length === 0) pool = base;
  const weights: Record<string, number> = {};
  pool.forEach((i) => {
    weights[i.id] = main && likes(main, i) ? PERSONALITY_BIAS : 1;
  });
  const itemId = pickWeighted<string>(r, weights);
  const it = item(itemId);
  // おまもりのおかげで起きたこと（朝の結果に出す）
  const you = s.player?.nickname ?? '';
  const me = s.pet.name;
  const areaName = AREA_INFO[area].name;
  const notes: string[] = [];
  if (has('wind')) notes.push(area === 'moonLake' ? `🍃 ${you}の深呼吸のおかげで、静かな${areaName}でゆっくりできたよ。` : `🍃 ${you}の深呼吸のおかげで、心地いい風の中を歩けたよ。`);
  if (has('shoes')) notes.push(farther === area ? `👟 くつのおまもりで、いつもは行けない${areaName}まで足をのばせたよ！` : `👟 ${you}が体を動かしてくれたから、${me}もいつもより遠くまで歩けたよ。`);
  if (has('words')) notes.push(`📜 ${you}の日記のことばを、${me}も持っていったよ。`);
  if (has('heart')) notes.push(`💗 ${heartLine(s.moods.filter((m) => dayKey(m.at) === dayKey(session.startedAt)).pop()?.value ?? null)}`);
  let story = storyFor(area, main, s.pet.name, it.title, s.player?.nickname);
  if (has('words')) story += '\n' + (WORDS_LINES[area] ?? WORDS_LINES.flowerForest);
  return {
    charms,
    charmNotes: notes.map((n) => withYou(n, you, me)),
    id: 'adv_' + session.id,
    sleepSessionId: session.id,
    area,
    rarity: it.rarity,
    itemId,
    personality: main,
    storyText: withYou(story, you, me),
    stars: ADVENTURE_STARS[it.rarity],
    createdAt: nowIso(s),
    claimed: false,
  };
}

/** 眠っているあいだに見ている夢（冒険のヒント）。今日の冒険がもう済んでいれば null */
export function dreamPreview(s: GameState) {
  const sess = currentSleep(s);
  if (!sess) return null;
  if (s.adventures.some((a) => dayKey(a.createdAt) === today(s))) return null;
  const a = rollAdventure(s, sess); // 同じセッションなら同じ結果（決定論的）。state は書きかえない
  return { area: a.area, rarity: a.rarity, charms: a.charms ?? [], seed: sess.id };
}

export function goToSleep(s: GameState) {
  if (currentSleep(s)) return;
  s.sleeps.push({ id: uid(), startedAt: nowIso(s) });
}

/** おはよう：睡眠を確定し、そのセッションの冒険結果を1回だけ確定する */
export function wakeUp(s: GameState, f: Feedback, endedAt?: string): AdventureResult | null {
  const sess = currentSleep(s);
  if (!sess) return null;
  sess.endedAt = endedAt ?? nowIso(s);
  if (endedAt) sess.approx = true;
  let adv: AdventureResult | null = null;
  // 冒険は1晩（=1日）1回まで。同じ日に何度おやすみ/おはようしても増えない
  const already = s.adventures.some((a) => dayKey(a.createdAt) === today(s));
  if (already && !sess.adventureId) f.messages.push('今日の冒険はもう終わっているよ。また今夜ね');
  if (!sess.adventureId && !already) {
    adv = rollAdventure(s, sess);
    s.adventures.push(adv);
    sess.adventureId = adv.id;
    s.pity = adv.rarity === 'secret' ? 0 : s.pity + 1;
    const first = !s.discovered[adv.itemId];
    adv.firstForPet = !s.pet.found[adv.itemId];
    adv.petId = s.pet.id;
    addItem(s, null, adv.itemId);
    craftNotice(s, f, adv.itemId);
    // 夢の冒険から帰ってくると、こうきしんがすこし育つ
    addPersonality(s, 'adventurous', 1);
    if (first) s.album.push({ id: uid(), at: nowIso(s), kind: 'discovery', title: `はじめての発見「${item(adv.itemId).title}」`, detail: `${adv.area}` });
    grantStars(s, f, `adv:${sess.id}`, 'adventure', adv.stars, false, adv.id);
    // ほしのおまもり：夜空に星をひとつ灯す
    if (adv.charms?.includes('star') && skyOpen(s)) {
      const note = lightStar(s, f, dayKey(sess.startedAt));
      if (note) (adv.charmNotes = adv.charmNotes ?? []).push(withYou(note, s.player?.nickname ?? '', s.pet.name));
    }
  }
  onCare(s, f, 'sleep', { starKey: `care:sleep:${today(s)}`, stars: STARS.sleep });
  addBond(s, f, 'sleep', BOND_POINTS.sleep);
  eggNight(s, f);
  seasonCheck(s, f);
  return adv;
}

export function exchangeDuplicate(s: GameState, f: Feedback, itemId: string, n: number, key?: string) {
  const have = s.inventory[itemId] ?? 0;
  const k = Math.min(n, have - 1);
  if (k <= 0) return 0;
  if (key) {
    if (s.rewardKeys[key]) return 0;
    s.rewardKeys[key] = true;
  }
  s.inventory[itemId] = have - k;
  const it = item(itemId);
  const stars = EXCHANGE_STARS[it.rarity] * k;
  s.ledger.push({ id: uid(), at: nowIso(s), day: today(s), action: 'exchange', starsDelta: stars, relatedId: itemId });
  f.stars += stars;
  // 装備中で個数0にはならない（最低1個残す）
  return stars;
}

/** 工作：素材を need-1 個つかって result をつくる（1個は残る） */
export function craft(s: GameState, f: Feedback, recipeId: string) {
  const r = RECIPES.find((x) => x.id === recipeId);
  if (!r) return false;
  const have = s.inventory[r.material] ?? 0;
  if (have < r.need || (s.inventory[r.result] ?? 0) > 0) return false;
  s.inventory[r.material] = have - (r.need - 1);
  addItem(s, null, r.result);
  const res = item(r.result);
  s.album.push({ id: uid(), at: nowIso(s), kind: 'gift', title: `「${res.title}」をつくった`, detail: `「${item(r.material).title}」${r.need}個から` });
  f.events.push({ kind: 'gift', title: `「${res.title}」ができた！`, sub: `「${item(r.material).title}」を${r.need}個あつめてつくったよ`, itemId: r.result });
  return true;
}
/** あつめた結果、つくれるようになったら知らせる */
export function craftNotice(s: GameState, f: Feedback, material: string) {
  if (!craftOpen(s)) return;
  const r = recipeFor(material, s.inventory);
  if (r && (s.inventory[material] ?? 0) === r.need) f.messages.push(`🛠 「${item(r.result).title}」がつくれるようになったよ（ぼうけん →つくる）`);
}

export function sleepHours(sess: SleepSession) {
  if (!sess.endedAt) return null;
  return (new Date(sess.endedAt).getTime() - new Date(sess.startedAt).getTime()) / 3600_000;
}
export const fmtDur = (h: number | null) => {
  if (h === null || isNaN(h)) return '—';
  if (h < 0) return '時刻を確認してね';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}時間${mm}分`;
};

// ---------------------------------------------------------------- いっしょにおでかけ
const STARS_CARE = 10; // config の STARS.care と同じ
const OUTING_LABEL: Record<OutingKind, string> = { walk: '散歩', stretch: 'ストレッチ', exercise: '軽い運動' };
export const OUTING_AUTO_RETURN_H = 3;
export function startOuting(s: GameState, kind: OutingKind) {
  s.outing = { kind, startedAt: nowIso(s) };
}
/** ただいま：記録して、頭に季節の葉っぱをつけて帰ってくる。戻り値は出かけていた分数 */
export function returnHome(s: GameState, f: Feedback) {
  const o = s.outing;
  if (!o) return null;
  const start = new Date(o.startedAt).getTime();
  const auto = nowMs(s) - start >= OUTING_AUTO_RETURN_H * 3600_000;
  const min = Math.max(1, Math.round((Math.min(nowMs(s), start + OUTING_AUTO_RETURN_H * 3600_000) - start) / 60_000));
  s.outing = null;
  // 押し忘れで先に帰ってきたときは、時間はわからないことにする（あとで目安を選べる）
  onCare(s, f, 'walk', { detail: OUTING_LABEL[o.kind], starKey: `care:walk:${today(s)}`, stars: STARS_CARE, minutes: auto ? undefined : min, approx: true });
  const compId = s.completions[s.completions.length - 1].id;
  if (s.lastCare) s.lastCare.seen = true;
  const LEAF: Record<Season, string> = { spring: '🌸', summer: '🍃', autumn: '🍁', winter: '❄️' };
  s.leaf = { icon: LEAF[seasonOf(nowMs(s))], until: new Date(nowMs(s) + 90 * 60_000).toISOString() };
  return { kind: o.kind, min, auto, compId };
}

/** 散歩などの時間の目安 */
export const TIME_RANGES: Array<{ label: string; minutes: number }> = [
  { label: '〜10分', minutes: 5 },
  { label: '10〜30分', minutes: 20 },
  { label: '30分〜1時間', minutes: 45 },
  { label: '1時間以上', minutes: 75 },
];
export function setCompletionTime(s: GameState, id: string, r: { minutes?: number; range?: string } | null) {
  const c = s.completions.find((x) => x.id === id);
  if (!c) return;
  c.minutes = r?.minutes;
  c.range = r?.range;
  c.approx = true;
}
/** きろくでの表示（「約20分」「10〜30分」など） */
export function timeLabel(c: { minutes?: number; approx?: boolean; range?: string }) {
  if (c.range) return c.range;
  if (c.minutes == null) return '';
  return c.approx ? `約${c.minutes}分` : `${c.minutes}分`;
}

// ---------------------------------------------------------------- 押し忘れ・まちがい
export const SLEEP_CANCEL_MIN = 30;
export const AUTO_WAKE_HOUR = 11;
export const SOLO_SLEEP_HOUR = 2;
const hourOf = (ms: number) => new Date(ms).getHours();
/** おやすみを押してすぐなら取り消せる */
export function canCancelSleep(s: GameState) {
  const sess = currentSleep(s);
  return !!sess && nowMs(s) - new Date(sess.startedAt).getTime() < SLEEP_CANCEL_MIN * 60_000;
}
export function cancelSleep(s: GameState) {
  const sess = currentSleep(s);
  if (sess) s.sleeps = s.sleeps.filter((x) => x.id !== sess.id);
}
/** まちがえて押した睡眠の記録を消す。冒険の結果・おみやげ・星はそのまま（取り上げない） */
export function deleteSleep(s: GameState, sessId: string) {
  s.sleeps = s.sleeps.filter((x) => x.id !== sessId);
}
/**
 * るうが先に起きる時刻：おやすみから6時間以上たったあとの、最初のお昼前（11時）。
 * アプリを何日か開かなかったときも「開いた日の11時」ではなく、その晩の次の朝で区切る
 */
function autoWakeMs(startedAt: string) {
  const t0 = new Date(startedAt).getTime() + 6 * 3600_000;
  const d = new Date(t0);
  if (d.getHours() >= AUTO_WAKE_HOUR) return t0; // 昼寝など：6時間たったところで起きる
  d.setHours(AUTO_WAKE_HOUR, 0, 0, 0);
  return d.getTime();
}
/** お昼前になっても「おはよう」が押されていなければ、るうは先に起きる */
export function shouldAutoWake(s: GameState) {
  const sess = currentSleep(s);
  return !!sess && nowMs(s) >= autoWakeMs(sess.startedAt);
}
export function autoWakeAt(s: GameState) {
  const sess = currentSleep(s);
  const now = nowMs(s);
  return new Date(sess ? Math.min(autoWakeMs(sess.startedAt), now) : now).toISOString();
}
/** 寝ていた時間が長いときは「何時ごろ起きた？」を聞く */
export const ASK_WAKE_HOURS = 12;
/** 何時ごろ起きた？の答え（hour=null は「おぼえてない」、'keep' はそのまま） */
export function setWakeTime(s: GameState, sessId: string, hour: number | null | 'keep') {
  const x = s.sleeps.find((y) => y.id === sessId);
  if (!x || !x.endedAt) return;
  if (hour === 'keep') return void (x.approx = true);
  if (hour === null) return void (x.unknown = true);
  // おやすみのあと、はじめてその時刻になったとき（何日も開かなかったときも、その晩の次の朝にする）
  const st = new Date(x.startedAt).getTime();
  const d = new Date(st);
  d.setHours(hour, 30, 0, 0);
  if (d.getTime() <= st) d.setDate(d.getDate() + 1);
  if (d.getTime() <= new Date(x.endedAt).getTime()) {
    x.endedAt = d.toISOString();
    x.approx = true;
  }
}
/** 夜中（2時〜5時）におやすみが押されていなければ、るうはひとりで先に寝ている */
export function soloSleeping(s: GameState) {
  if (currentSleep(s)) return false;
  const now = nowMs(s);
  const h = hourOf(now);
  if (h < SOLO_SLEEP_HOUR || h >= 5) return false;
  return !s.sleeps.some((x) => now - new Date(x.endedAt ?? x.startedAt).getTime() < 4 * 3600_000);
}
/** ゆうべ、るうが先に寝た（＝おやすみが押されなかった）か。朝のひとことと、あとからの記録に使う */
export function lastNightSolo(s: GameState) {
  const now = nowMs(s);
  if (hourOf(now) < 5) return false;
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(18, 0, 0, 0);
  const created = s.player?.createdAt ? new Date(s.player.createdAt).getTime() : now;
  if (created > start.getTime()) return false;
  const end = new Date(now);
  end.setHours(5, 0, 0, 0);
  return !s.sleeps.some((x) => {
    const t = new Date(x.startedAt).getTime();
    const e = x.endedAt ? new Date(x.endedAt).getTime() : now;
    return e >= start.getTime() && t <= end.getTime() + 6 * 3600_000;
  });
}
/** るうが先に寝た夜を、あとから記録する（冒険はなし） */
export function recordSoloNight(s: GameState, bed: number | null, wake: number | null) {
  const now = new Date(nowMs(s));
  const st = new Date(now);
  if (bed !== null && bed >= 12) st.setDate(st.getDate() - 1);
  st.setHours(bed ?? 0, 0, 0, 0);
  const en = new Date(now);
  en.setHours(wake ?? 7, 30, 0, 0);
  if (en.getTime() > now.getTime()) en.setTime(now.getTime());
  s.sleeps.push({ id: uid(), startedAt: st.toISOString(), endedAt: en.toISOString(), solo: true, approx: true, unknown: bed === null || wake === null });
  s.rewardKeys[`solo:${today(s)}`] = true;
}

// ---------------------------------------------------------------- はじめての1週間・少しずつひらく機能
/** はじめてから何日目か（1日目＝はじめた日） */
export function dayNumber(s: GameState) {
  const start = s.player?.createdAt ? dayKey(s.player.createdAt) : today(s);
  const a = new Date(start + 'T12:00:00').getTime();
  const b = new Date(today(s) + 'T12:00:00').getTime();
  return Math.max(1, Math.round((b - a) / 86400_000) + 1);
}
export const UNLOCK_DAY = { craft: 28, sky: 14 };
export const skyOpen = (s: GameState) => dayNumber(s) >= UNLOCK_DAY.sky || s.debug.enabled;
export const craftOpen = (s: GameState) => dayNumber(s) >= UNLOCK_DAY.craft || s.debug.enabled;
/** ここ5日のうち、つらい気分（2以下）を記録した日が3日以上 */
export function lowStreak(s: GameState) {
  const days = new Set<string>();
  const now = nowMs(s);
  for (const m of s.moods) if (m.value <= 2 && now - new Date(m.at).getTime() < 5 * 86400_000) days.add(dayKey(m.at));
  return days.size >= 3;
}

// ---------------------------------------------------------------- とくい（性格が見える）
export const TOKUI: Record<Personality, string> = { energetic: 'からだを動かすこと', calm: '本を読むこと', affectionate: 'そばにいること', adventurous: '知らない場所を想像すること', foodie: 'おいしいものをさがすこと' };
/** とくいのしぐさ（こども以上）。prop は横に出す小物の絵 */
export const TOKUI_ACTS: Record<Personality, { pose: string; anim: 'hop' | 'sway' | 'tilt'; prop?: string; lines: string[] }> = {
  energetic: { pose: 'd_stretch', anim: 'hop', lines: ['いち、に！たいそうしてるの', 'からだを動かすと、きもちいいね', 'まだまだ、げんきだよ！'] },
  calm: { pose: 'g_think', anim: 'tilt', prop: 'it2_ehon', lines: ['ふむふむ…この本、すき', 'しずかな時間って、いいね', 'つづきが気になる…'] },
  affectionate: { pose: 'p_amae', anim: 'sway', prop: 'it2_bowbunny', lines: ['{you}のそば、おちつく', 'ぎゅってしてもいい？', 'いっしょにいられて、うれしいな'] },
  adventurous: { pose: 'g_lookup', anim: 'tilt', prop: 'it2_book_adv', lines: ['つぎは、どこへいこうかな', 'ぼうけん手帳に、かいておこう', 'あの雲の向こう、なにがあるんだろう'] },
  foodie: { pose: 'ureshii', anim: 'hop', prop: 'it2_carrot', lines: ['おなか、ぐぅってなった…', 'つぎのごはん、なにかな？', 'おいしいものって、しあわせだね'] },
};
/** つぎの成長まであと何日か（おとななら null） */
export function daysToNextStage(s: GameState) {
  const st = stageOf(s);
  if (st >= STAGE_DAYS.length) return null;
  return STAGE_DAYS[st] - s.pet.activeDays.length;
}
