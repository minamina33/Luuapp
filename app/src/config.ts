/**
 * 調整用の定数ファイル
 * ------------------------------------------------------------
 * 仕様書で「確定」となっている挙動は game/logic.ts に実装し、
 * 「仮」の数値（ポイント・確率・価格など）はすべてここに集めている。
 * 数値を変えるときはこのファイルだけを編集すればよい。
 */
import type { Area, Personality, Rarity } from './types';

/** 1日の切り替わり時刻（深夜0時ではなく朝4時で日付が変わる扱い） */
export const DAY_START_HOUR = 4; // 仮

/** 初回の歓迎ボーナス星 */
export const WELCOME_STARS = 30; // 仮

// ---- 星（セルフケア関連の定常報酬） -------------------------
export const STARS = {
  moodFirstOfDay: 5, // 気分記録（1日初回のみ）
  task: 10, // セルフケアタスク1件
  taskMaxPerDay: 3, // タスク報酬は1日3件まで
  care: 10, // 呼吸・日記・運動など（同種は1日1回）
  sleep: 10, // 睡眠記録
};
/** セルフケア関連の定常報酬の1日上限（冒険の星・重複交換は別枠） */
export const DAILY_CARE_STAR_CAP = 50;

// ---- 冒険の星 ---------------------------------------------------
export const ADVENTURE_STARS: Record<Rarity, number> = {
  common: 10,
  rare: 15,
  superRare: 20,
  secret: 30,
};

// ---- 親密度 -----------------------------------------------------
export const BOND_POINTS = {
  firstCareOfDay: 10,
  play: 5,
  feed: 3,
  pet: 2, // 仕様書に記載なし。なでるにも小さく付与（仮）
  sleep: 5,
};
/** 親密度Lvの累積閾値（Lv1〜Lv5） */
export const BOND_THRESHOLDS = [0, 50, 150, 350, 700];
export const BOND_NAMES = ['はじめまして', 'なかよし', 'だいすき', 'ずっといっしょ', 'たいせつな相棒'];

// ---- 体の成長（ふれあい日数） -----------------------------------
/** Stageに入るのに必要なふれあい日数（Stage1〜4） */
export const STAGE_DAYS = [0, 4, 25, 60];
export const STAGE_NAMES = ['あかちゃん', 'こども', '成長期', 'おとな'];
/** Stageごとのるうの表示サイズ（おとな=1.0） */
export const STAGE_SCALE = [0.66, 0.78, 0.9, 1.0];

// ---- セルフケアの習慣 ------------------------------------------
/** 習慣は5つまで（多すぎると負担になるため。数を増やすのは有料にしない） */
export const MAX_TASKS = 5;
/** この日数続けてできなかった習慣に「小さい版にしてみる？」と聞く */
export const SHRINK_AFTER_DAYS = 3;
/** 感想フォームのURL（Googleフォームなど）。空なら感想ボタンは「準備中」 */
export const FEEDBACK_URL = '';

// ---- ごはん・あそぶの回数 -------------------------------------
/** ごはんは「朝・昼・夜」の時間帯ごとに1回。おやつ（特別なごはん）は1日1回 */
export const SNACKS_PER_DAY = 1;
/** くいしんぼうの子は、おやつをこの回数ぶん多く食べられる（ふえた分は親密度なし。楽しさだけ） */
export const FOODIE_EXTRA_SNACKS = 1;
/** あそべる回数＝基本＋その日のセルフケアの数（上限あり） */
export const PLAY_BASE = 2;
export const PLAY_MAX = 5;
/** その日のケアがこの数になったら、るうがお祝いする */
export const CHEER_AT = 3;

// ---- たまご・色違い --------------------------------------------
/** たまごが孵るまでの「おやすみ→おはよう」の回数 */
export const EGG_NIGHTS = 3;
/** たまごの選択肢の数 */
export const EGG_CHOICES = 3;
/** 選択肢の1つが特別な色（ゆきいろ）になる確率 */
export const EGG_SECRET_RATE = 0.05;
/** 冒険で「その子の色シリーズ」が選ばれる確率 */
export const SERIES_RATE = 0.22;
/** 冒険で「季節限定アイテム」が選ばれる確率（その季節のあいだだけ） */
export const SEASON_RATE = 0.2;

// ---- 性格 -------------------------------------------------------
export const PERSONALITY_NAMES: Record<Personality, string> = {
  energetic: 'げんき',
  calm: 'おっとり',
  affectionate: 'あまえんぼ',
  adventurous: 'こうきしん',
  foodie: 'くいしんぼう',
};
export const PERSONALITY_POINT = 2;
/** 1日に加算できる性格ポイントの上限（性格ごと。なでるだけで他の性格の分を使い切らないように） */
export const PERSONALITY_DAILY_CAP = 3;
/** 性格が見えてくるのに必要な点数の合計（これより少ないうちは「まだわからない」） */
export const PERSONALITY_REVEAL_POINTS = 20;
/** くいしんぼうの点が入るのは1日このごはんの回数まで（ほぼ毎日あげるので、伸びすぎないように） */
export const FOODIE_MEALS_PER_DAY = 2;

// ---- 冒険 -------------------------------------------------------
export const RARITY_RATES: Record<Rarity, number> = {
  common: 0.6,
  rare: 0.28,
  superRare: 0.1,
  secret: 0.02,
};
export const RARITY_NAMES: Record<Rarity, string> = {
  common: 'ノーマル',
  rare: 'レア',
  superRare: 'スーパーレア',
  secret: 'シークレット',
};
/** 重複1個を星に交換したときの星 */
export const EXCHANGE_STARS: Record<Rarity, number> = {
  common: 5,
  rare: 15,
  superRare: 40,
  secret: 100,
};
/** シークレットがこの回数連続で出なければ、次はシークレット確定 */
export const SECRET_PITY = 30;

/** Stageごとの行き先確率（Stage1〜4） */
export const AREA_RATES: Array<Partial<Record<Area, number>>> = [
  { flowerForest: 1 },
  { flowerForest: 0.6, moonLake: 0.4 },
  { flowerForest: 0.45, moonLake: 0.35, starHill: 0.2 },
  { flowerForest: 0.45, moonLake: 0.35, starHill: 0.2 },
];
export const AREA_INFO: Record<Area, { name: string; stage: number; desc: string; emoji: string }> = {
  flowerForest: { name: '花の森', stage: 1, desc: '花・木の実・小さな家具', emoji: '🌸' },
  moonLake: { name: '月あかりの湖', stage: 2, desc: '貝殻・水辺の家具・衣装', emoji: '🌙' },
  starHill: { name: '星空の丘', stage: 3, desc: '星の小物・おもちゃ・宝物', emoji: '⭐' },
  premiumArea: { name: 'ひみつの雲の島', stage: 99, desc: 'るうプラスの特別エリア（準備中）', emoji: '☁️' },
};
/** 性格ごとに少しだけ出やすくするアイテム分類と倍率 */
export const PERSONALITY_BIAS = 1.5;

// ---- 課金（デモ） -------------------------------------------------
export const PREMIUM_NAME = 'るうプラス';
export const PREMIUM_PRICE_LABEL = '月額680円（仮）';

/** 1日に記録できる気分の回数（それ以上は最後の記録を書きかえる） */
export const MOOD_PER_DAY = 5;
/** 文字数の上限 */
export const LIMITS = { moodNote: 100, journal: 800, task: 30 };
