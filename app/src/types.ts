export type MoodValue = 1 | 2 | 3 | 4 | 5;
export type CareKind =
  | 'mood'
  | 'task'
  | 'breathing'
  | 'journal'
  | 'walk'
  | 'sleep'
  | 'meditation'
  | 'compassion'
  | 'connection';
export type Personality = 'energetic' | 'calm' | 'affectionate' | 'adventurous';
export type ItemCategory = 'furniture' | 'outfit' | 'toy' | 'collectible';
export type Rarity = 'common' | 'rare' | 'superRare' | 'secret';
export type Area = 'flowerForest' | 'moonLake' | 'starHill' | 'premiumArea';
export type RoomSlot = 'bed' | 'rug' | 'curtain' | 'wall' | 'wall2' | 'chest' | 'top' | 'top2' | 'plush' | 'floor' | 'floor2';
/** アイテムが置ける場所の種類（壁は左右2か所、タンスの上は2つまで） */
export type SlotKind = Exclude<RoomSlot, 'wall2' | 'top2' | 'floor2'>;

export interface Player {
  id: string;
  nickname: string;
  createdAt: string;
  goals: string[];
  premiumDemo: boolean;
}

export type ColorId = 'milk' | 'caramel' | 'lavender' | 'mint' | 'cocoa' | 'gray' | 'sakura' | 'sora' | 'yuki';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Pet {
  id: string;
  color: ColorId;
  createdAt: string;
  /** この子が見つけたもの（itemId → 初めて見つけた日時）。みんなの図鑑とは別 */
  found: Record<string, string>;
  name: string;
  /** その日のごはん・おやつ・あそんだ回数 */
  daily?: { day: string; meals: string[]; snack: boolean; plays: number };
  totalBondPoints: number;
  /** ふれあいがあった日（YYYY-MM-DD）。Stageはこの件数から導出 */
  activeDays: string[];
  personalityScores: Record<Personality, number>;
  outfit: string | null;
  roomSlots: Record<RoomSlot, string | null>;
}

export interface MoodEntry {
  id: string;
  at: string;
  value: MoodValue;
  reasons: string[];
  note?: string;
}
export interface CareTask {
  id: string;
  title: string;
  source: 'suggested' | 'custom';
  repeat: 'daily' | 'weekdays' | 'weekends';
  /** false = おやすみ中（一時停止） */
  isActive: boolean;
  /** 提案から追加した習慣：ライブラリのID・大きさ */
  libId?: string;
  size?: 'small' | 'normal';
  /** いつやるか */
  when?: 'morning' | 'day' | 'night' | 'any';
  createdAt?: string;
}
export interface CareCompletion {
  id: string;
  at: string;
  day: string;
  kind: CareKind;
  taskId?: string;
  detail?: string;
  rewardGranted: boolean;
  /** かかった時間（呼吸法・散歩など）。approx=だいたい、range=選んだ目安 */
  minutes?: number;
  approx?: boolean;
  range?: string;
}
export interface JournalEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  content: string;
}
export interface SleepSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  edited?: boolean;
  adventureId?: string;
  /** 起きた・寝た時刻が「だいたい」 */
  approx?: boolean;
  /** 時刻がわからない（平均に入れない） */
  unknown?: boolean;
  /** るうが先に寝た夜（あとから記録・冒険なし） */
  solo?: boolean;
}
export interface AdventureResult {
  id: string;
  sleepSessionId: string;
  area: Area;
  rarity: Rarity;
  itemId: string;
  personality: Personality | null;
  storyText: string;
  stars: number;
  createdAt: string;
  claimed: boolean;
  exchanged?: boolean;
  /** 冒険に行った子と、その子にとって初めてだったか */
  petId?: string;
  firstForPet?: boolean;
  /** その夜持っていったおまもりと、そのおかげで起きたこと */
  charms?: string[];
  charmNotes?: string[];
}
export interface ItemDef {
  id: string;
  title: string;
  category: ItemCategory;
  rarity: Rarity;
  icon: string; // 絵がないときの仮アイコン（絵文字）
  img?: string; // 描いてもらった絵（public/assets/<img>.webp）
  chestFilter?: string; // タンスの色違い（絵にかけるフィルター）
  area?: Area;
  shopPrice?: number;
  premium?: boolean;
  slot?: SlotKind; // 家具の置き場所
  tint?: string; // ベッド・ラグの色替え
  chestColors?: [string, string, string]; // タンスの色（本体・影・取っ手）
  sprite?: string; // 衣装の差分画像
  playPersonality?: Personality; // おもちゃで遊ぶと伸びる性格
  desc?: string;
  /** 色シリーズ：その色の子の冒険でだけ見つかる */
  series?: ColorId;
  /** 季節限定：その季節の冒険でだけ見つかる */
  season?: Season;
  /** ごはんメニューに加わる特別なごはん */
  food?: { pose: string; line: string; motion?: 'eat' | 'drink'; cup?: 'milk' | 'tea' };
  /** 冒険・ショップでは手に入らない（記念品など） */
  giftOnly?: boolean;
  /** 絵の準備中：持っている人はそのまま使えるが、新しくは手に入らない */
  resting?: boolean;
}
export type Inventory = Record<string, number>;
export interface RewardLedger {
  id: string;
  at: string;
  day: string;
  action: string;
  starsDelta: number;
  care?: boolean;
  relatedId?: string;
}
export interface AlbumEvent {
  id: string;
  at: string;
  kind: 'growth' | 'bond' | 'gift' | 'discovery' | 'start';
  title: string;
  detail?: string;
}

export type OutingKind = 'walk' | 'stretch' | 'exercise';

export interface GameState {
  version: 1;
  player: Player | null;
  pet: Pet;
  moods: MoodEntry[];
  tasks: CareTask[];
  completions: CareCompletion[];
  journals: JournalEntry[];
  sleeps: SleepSession[];
  adventures: AdventureResult[];
  inventory: Inventory;
  /** 図鑑：itemId → 初めて見つけた日時（消えない） */
  discovered: Record<string, string>;
  ledger: RewardLedger[];
  /** 二重付与防止用の一意キー */
  rewardKeys: Record<string, true>;
  album: AlbumEvent[];
  /** シークレットが出ていない連続冒険回数 */
  pity: number;
  personalityDaily: { day: string; total: number };
  usedToys: string[];
  debug: { enabled: boolean; timeOffsetMs: number; forceRarity: Rarity | null };
  settings: { se: boolean; bgm: boolean; muted: boolean; reduceMotion: boolean; /** アプリのロック番号（ソルト付きハッシュ） */ lockHash?: string };
  /** おへやに出ていない、ほかのるうたち */
  otherPets: Pet[];
  /** おとなになったときに見つけた、選べるたまご */
  eggOffer: { petId: string; choices: ColorId[] } | null;
  /** 温めているたまご */
  egg: { color: ColorId; nightsLeft: number; startedAt: string; lastNight?: string } | null;
  /** 直近のセルフケア（おへやに戻ったとき、るうが喜ぶため） */
  lastCare?: { id: string; kind: CareKind; detail?: string; at: string; seen?: boolean } | null;
  /** るうといっしょにおでかけ中（散歩・ストレッチ・運動） */
  outing?: { kind: OutingKind; startedAt: string } | null;
  /** おでかけから帰ってきたとき頭についている葉っぱなど（タップで払う） */
  leaf?: { icon: string; until: string } | null;
  /** 夜空：灯した星と、星座につけた名前 */
  sky: { stars: Array<{ d: string; y: number }>; names: Record<string, string> };
  /** 読んだ月のふりかえり（YYYY-MM） */
  lettersSeen: string[];
  /** その月の手紙を書いた子（一度決まったら変わらない） */
  letterAuthors: Record<string, string>;
}

/** お祝い演出（成長・親密度・プレゼント） */
export interface Celebration {
  id?: number;
  kind: 'stage' | 'bond' | 'gift' | 'eggs' | 'hatch' | 'cheer' | 'constellation';
  color?: ColorId;
  petId?: string;
  title: string;
  sub?: string;
  /** 成長でふえたこと（あたらしいごはん・あそび） */
  note?: string;
  /** 成長の朝のできごと */
  story?: string;
  itemId?: string;
  stage?: number;
  level?: number;
}
