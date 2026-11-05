import type { Area, MoodValue, Personality } from '../types';

/** セリフ中の {you} を登録した名前に置きかえる */
/** セリフの {me} は、るう自身の名前（一人称に名前を使う） */
export const withYou = (text: string, you: string, me = 'るう') => text.replace(/\{you\}/g, you || 'あなた').replace(/\{me\}/g, me);

export const GOALS = [
  { id: 'calm', label: '気持ちをおちつけたい', emoji: '🍵' },
  { id: 'sleep', label: 'よく眠りたい', emoji: '🌙' },
  { id: 'move', label: '体を少し動かしたい', emoji: '🚶' },
  { id: 'rhythm', label: '生活リズムを整えたい', emoji: '⏰' },
  { id: 'self', label: '自分をいたわりたい', emoji: '🤍' },
];

/**
 * セルフケアの習慣ライブラリ
 * goal: どの目的に合うか / small・normal: 小さい版とふつう版 / when: やる時間帯 / reason: すすめる理由（るうの言葉）
 * moodReason: 気分の「関係していそうなこと」と結びつける
 */
export interface HabitDef {
  id: string;
  goal: string;
  small: string;
  normal: string;
  when: 'morning' | 'day' | 'night' | 'any';
  reason: string;
  moodReason?: string;
}
export const HABITS: HabitDef[] = [
  { id: 'water', goal: 'rhythm', small: 'コップ1杯の水を飲む', normal: '水を1日5杯飲む', when: 'morning', reason: '起きてすぐの1杯で、からだが目をさますよ' },
  { id: 'curtain', goal: 'rhythm', small: '朝カーテンをあける', normal: '朝の光を5分あびる', when: 'morning', reason: '朝の光をあびると、夜に眠くなりやすくなるんだって' },
  { id: 'meal', goal: 'rhythm', small: '朝ごはんをひと口食べる', normal: '同じ時間にごはんを食べる', when: 'morning', reason: 'ごはんの時間がそろうと、1日のリズムが整うよ' },
  { id: 'breath', goal: 'calm', small: '深呼吸を3回する', normal: '1分の呼吸法をする', when: 'any', reason: 'ゆっくり吐くと、気持ちがすこし落ちつくよ', moodReason: '仕事' },
  { id: 'tea', goal: 'calm', small: 'あたたかい飲み物をひと口', normal: 'あたたかい飲み物をゆっくり飲む', when: 'day', reason: 'あたたかいものは、ほっとする時間をつくってくれるよ' },
  { id: 'break', goal: 'calm', small: '1分だけ目をとじる', normal: '休けいを5分とる', when: 'day', reason: 'こまめに休むと、つかれがたまりにくいよ', moodReason: '仕事' },
  { id: 'phone', goal: 'sleep', small: '寝る直前はスマホを置く', normal: '寝る30分前にスマホを置く', when: 'night', reason: '画面の光から離れると、ねむりに入りやすくなるよ', moodReason: '睡眠' },
  { id: 'bath', goal: 'sleep', small: '足をあたためる', normal: 'お風呂につかる', when: 'night', reason: 'からだがあたたまると、ぐっすり眠りやすいよ', moodReason: '睡眠' },
  { id: 'bedtime', goal: 'sleep', small: '寝る時間を決めてみる', normal: '決めた時間にふとんに入る', when: 'night', reason: '毎日おなじ時間に寝ると、朝がらくになるよ', moodReason: '睡眠' },
  { id: 'air', goal: 'move', small: '外の空気を1分吸う', normal: '外を5分歩く', when: 'day', reason: '外に出るだけでも、気分が切りかわるよ' },
  { id: 'shoulder', goal: 'move', small: '肩をぐるっと回す', normal: '3分ストレッチする', when: 'any', reason: 'かたまったからだをほぐすと、気持ちもほぐれるよ', moodReason: '体調' },
  { id: 'stairs', goal: 'move', small: '1階分だけ階段を使う', normal: '10分歩く', when: 'day', reason: 'すこし動くと、夜のねむりも深くなりやすいよ' },
  { id: 'goodthing', goal: 'self', small: '今日できたことを1つ思い出す', normal: '良かったことを3つ書く', when: 'night', reason: 'できたことに目をむけると、自分にやさしくなれるよ', moodReason: '将来' },
  { id: 'music', goal: 'self', small: 'すきな音楽を1曲聴く', normal: 'すきなことを15分する', when: 'any', reason: 'すきなものにふれる時間は、心の栄養になるよ' },
  { id: 'kind', goal: 'self', small: '自分に「おつかれさま」と言う', normal: '自分をほめる言葉を書く', when: 'night', reason: '自分にかける言葉は、いちばん近くでとどくよ', moodReason: '人間関係' },
];
export const HABIT_MAP = Object.fromEntries(HABITS.map((h) => [h.id, h]));
export const WHEN_NAMES: Record<string, string> = { morning: '朝', day: '昼', night: '夜', any: 'いつでも' };
/** 目的と最近の気分から、まだ入れていない習慣を提案する */
export function suggestHabits(goals: string[], moodReasons: string[], have: string[], n = 4): HabitDef[] {
  const score = (h: HabitDef) => (goals.includes(h.goal) ? 2 : 0) + (h.moodReason && moodReasons.includes(h.moodReason) ? 3 : 0) + (h.id === 'water' || h.id === 'breath' ? 0.5 : 0);
  return HABITS.filter((h) => !have.includes(h.id))
    .map((h, i) => ({ h, sc: score(h) - i * 0.01 }))
    .sort((a, b) => b.sc - a.sc)
    .slice(0, n)
    .map((x) => x.h);
}

/** 目的ごとの小さな習慣（古い形。互換のため残す） */
export const TASK_SUGGESTIONS: Record<string, string[]> = {
  calm: ['深呼吸を3回する', 'あたたかい飲み物をゆっくり飲む'],
  sleep: ['寝る30分前にスマホを置く', 'お風呂につかる'],
  move: ['外の空気を5分吸う', '肩をぐるっと回す'],
  rhythm: ['朝カーテンをあける', '同じ時間にごはんを食べる'],
  self: ['今日できたことを1つ思い出す', 'お気に入りの音楽を1曲聴く'],
};
export const DEFAULT_TASKS = ['コップ1杯の水を飲む', '朝カーテンをあける', '深呼吸を3回する'];

export const MOODS: Array<{ value: MoodValue; label: string }> = [
  { value: 5, label: 'とてもよい' },
  { value: 4, label: 'よい' },
  { value: 3, label: 'ふつう' },
  { value: 2, label: '少しつらい' },
  { value: 1, label: 'つらい' },
];
export const MOOD_REASONS = ['仕事', '人間関係', '体調', '睡眠', '将来', 'その他'];

/** 気分記録のあとにるうがかける言葉（励ましを強制しない） */
export const MOOD_REPLIES: Record<MoodValue, string[]> = {
  5: ['いい日なんだね。いっしょにうれしいな', 'その気持ち、すこし分けてね'],
  4: ['教えてくれてありがとう', 'おだやかな日だといいね'],
  3: ['ふつうの日も大事な一日だよ', '記録してくれてありがとう'],
  2: ['そっか。教えてくれてありがとう', 'むりしなくて大丈夫だよ'],
  1: ['つらいんだね。ここにいるよ', 'なにもしなくても大丈夫。そばにいるね'],
};

export type RecId = 'breath1' | 'breath3' | 'journal' | 'goodthing' | 'walk' | 'tasks' | 'play' | 'rest' | 'sleepNote';
export const RECS: Record<RecId, { title: string; sub: string; emoji: string }> = {
  breath1: { title: '1分の呼吸', sub: 'ゆっくり吸って、はいて', emoji: '🌬️' },
  breath3: { title: '3分の呼吸', sub: 'すこし長めにおちつく', emoji: '🌬️' },
  journal: { title: '日記をかく', sub: 'ひとことでもOK', emoji: '📓' },
  goodthing: { title: '良かったことを書く', sub: '小さなことでOK', emoji: '✏️' },
  walk: { title: '散歩・ストレッチ', sub: 'できる範囲で', emoji: '🚶' },
  tasks: { title: 'セルフケアタスク', sub: '今日の小さな習慣', emoji: '✅' },
  play: { title: 'るうとあそぶ', sub: 'ちょっとひと息', emoji: '🐰' },
  rest: { title: 'ひと休み', sub: '何もしない時間をつくる', emoji: '☕' },
  sleepNote: { title: '今夜はおやすみを記録', sub: '夜に「おやすみ」を押してね', emoji: '🌙' },
};

/** 気分・理由に応じた簡易レコメンド（診断ではない） */
export function recommend(value: MoodValue | null, reasons: string[] = []): RecId[] {
  let list: RecId[];
  if (value === null) list = ['breath1', 'journal', 'tasks'];
  else if (value >= 4) list = ['walk', 'goodthing', 'play'];
  else if (value === 3) list = ['breath1', 'journal', 'tasks'];
  else list = ['breath1', 'journal', 'rest'];
  if (reasons.includes('仕事')) list = uniq(['rest', ...list, 'walk']);
  if (reasons.includes('睡眠')) list = uniq([...list.slice(0, 2), 'sleepNote', ...list]);
  return list.slice(0, 3);
}
const uniq = <T,>(a: T[]) => Array.from(new Set(a));

// ---------- ふれあい ----------
export const FOODS: Array<{ id: string; label: string; emoji: string; pose: string; line: string; motion: 'eat' | 'drink'; cup?: 'milk' | 'tea'; stage?: number }> = [
  { id: 'carrot', label: 'にんじん', emoji: '🥕', pose: 'eat', line: 'ぽりぽり…おいしい！', motion: 'eat' as const },
  { id: 'apple', label: 'りんご', emoji: '🍎', pose: 'eat_base', line: 'しゃくしゃく…あまくてしあわせ〜', motion: 'eat' as const },
  { id: 'clover', label: 'クローバー', emoji: '☘️', pose: 'eat_base', line: 'もぐもぐ…いいにおい', motion: 'eat' as const },
  { id: 'milk', label: 'ほっとミルク', emoji: '🥛', pose: 'eat_base', line: 'ごくごく…ぽかぽかしてきた', motion: 'drink' as const, cup: 'milk' as const },
  // 成長するとふえるごはん
  { id: 'berry', label: 'いちご', emoji: '🍓', pose: 'eat_base', line: 'あまずっぱ〜い！もういっこ！', motion: 'eat' as const, stage: 2 },
  { id: 'pancake', label: 'ホットケーキ', emoji: '🥞', pose: 'eat_base', line: 'ふわふわ…はちみつもかかってる！', motion: 'eat' as const, stage: 3 },
  { id: 'cake', label: 'にんじんケーキ', emoji: '🍰', pose: 'eat_base', line: 'おとなの味…？ううん、あまくておいしい！', motion: 'eat' as const, stage: 4 },
];
export const BASIC_PLAYS: Array<{ id: string; label: string; emoji: string; pose: string; anim: string; personality: Personality; line: string }> = [
  { id: 'run', label: 'かけっこ', emoji: '💨', pose: 'd_jump', anim: 'hop', personality: 'energetic', line: 'まてまて〜！' },
  { id: 'lazy', label: 'のんびりごっこ', emoji: '☁️', pose: 'kutsurogi', anim: 'sway', personality: 'calm', line: 'ふぁ〜…のんびりっていいね' },
];
export const TOY_PLAY: Record<string, { pose: string; anim: string; line: string }> = {
  toy_ball: { pose: 'g_toy', anim: 'hop', line: 'ころころ〜！もういっかい！' },
  toy_plush: { pose: 'p_amae', anim: 'sway', line: 'ぎゅってするの、すき' },
  toy_blocks: { pose: 'kangae', anim: 'tilt', line: 'どこにのせようかな…？' },
  toy_chime: { pose: 'd_stretch', anim: 'sway', line: 'ちりん…いい音だね' },
  toy_kite: { pose: 'p_genki', anim: 'hop', line: 'たかーくとんだ！' },
  toy_yarn: { pose: 'g_toy', anim: 'hop', line: 'ころころ〜…まてまて〜！' },
  toy_carrot: { pose: 'p_amae', anim: 'sway', line: 'かみかみ…これ、たべられないの？' },
  toy_bubbles: { pose: 'g_lookup', anim: 'tilt', line: 'ふわふわ〜…きれいだね' },
  toy_ehon: { pose: 'g_think', anim: 'tilt', line: 'つぎのページは…どうなるのかな' },
  toy_horse: { pose: 'g_happy', anim: 'sway', line: 'ゆーらゆーら♪ たのしい！' },
  toy_piano: { pose: 'd_spin', anim: 'hop', line: 'ぽろろん♪ じょうずにひけたかな？' },
};
export const PET_LINES = [
  ['…（じっとしている）', 'ちょっとくすぐったい'],
  ['えへへ', 'もっとなでて〜'],
  ['なでてもらうの、だいすき', 'あったかい手だね'],
  ['ずっとこうしていたいな', '{you}の手、安心する'],
  ['{you}がいてくれてよかった', 'いつもありがとう、{you}'],
];

/** 親密度Lvごとのひとこと（タップしていないときの吹き出し） */
export const IDLE_LINES = [
  ['こんにちは…', '{you}っていうんだね', 'よろしくね、{you}'],
  ['今日はどんな一日にする？', '{me}はここにいるよ', '{you}、おかえり'],
  ['{you}とすごすの、たのしい', '{you}、今日もおつかれさま', 'ゆっくりでいいよ'],
  ['{you}の話、もっと聞かせて', 'つかれたら休もうね', 'いつでもそばにいるよ'],
  ['{me}とずっといっしょだよ、{you}', '{you}はがんばってるよ', 'きょうもありがとう'],
];
export const NIGHT_LINES = ['そろそろおやすみの時間かな？', 'ねむくなってきた…', '今日もおつかれさま'];
export const MORNING_LINES = ['おはよう！', 'よくねむれた？', 'あさのひかり、きもちいいね'];

// ---------- セリフのバリエーション ----------
const SEASON_LINES: Record<string, string[]> = {
  spring: ['お花のにおいがする！', 'ぽかぽかしてきたね', 'さくら、きれいかな'],
  summer: ['あついね。お水のんでね', '夏の夜は星がきれいだね', 'かき氷ってつめたいの？'],
  autumn: ['秋のにおいがするね', 'どんぐり、どこかにないかな', '夜がながくなってきたね', 'おいもの季節だね'],
  winter: ['さむいね。あったかくしてね', 'ゆきってふわふわなのかな', 'おふとんから出たくないね'],
};
const PERSONALITY_LINES: Record<string, string[]> = {
  energetic: ['あそぼあそぼ！', '今日はどこに行こうかな', 'からだ、うずうずする！'],
  calm: ['ふぁ…ひなたぼっこしたいな', 'のんびりもいいよね', 'ゆっくりしよ〜'],
  affectionate: ['ぎゅってしていい？', '{you}のそばがすき', 'なでてくれる？'],
  adventurous: ['あのね、このあいだ不思議なものを見たんだ', '窓の外、なにがあるのかな', 'つぎはどこに行こうかな'],
};
const LOW_MOOD_LINES = ['今日はゆっくりしようね', '{me}がそばにいるよ', '{you}のペースで大丈夫', 'なにもしなくてもいいんだよ', 'あったかいもの、のむ？', 'ここにいるからね'];
const GOOD_MOOD_LINES = ['{you}、なんだかうれしそう！', 'いい日だね', '{me}もうれしいな'];
const AFTER_CARE_LINES = ['さっきの、すてきだったね', '自分のこと、大事にしてるね', 'ちょっとひと息つけた？'];
const AWAY_LINES = ['{you}、また会えてうれしい！', 'おかえり！まってたよ', 'きてくれてありがとう'];

/** その時の状況に合わせたセリフの候補 */
export function linePool(o: { lv: number; tod: string; season: string; main: string | null; mood: number | null; caredToday: boolean; away: boolean }) {
  if (o.away) return AWAY_LINES;
  if (o.mood !== null && o.mood <= 2) return [...LOW_MOOD_LINES, ...LOW_MOOD_LINES, ...IDLE_LINES[o.lv - 1].filter((l) => !l.includes('？'))];
  const pool = [...IDLE_LINES[o.lv - 1], ...(SEASON_LINES[o.season] ?? [])];
  if (o.tod === 'night') pool.push(...NIGHT_LINES, ...NIGHT_LINES);
  if (o.tod === 'morning') pool.push(...MORNING_LINES, ...MORNING_LINES);
  if (o.main) pool.push(...PERSONALITY_LINES[o.main]);
  if (o.mood !== null && o.mood >= 4) pool.push(...GOOD_MOOD_LINES);
  if (o.caredToday) pool.push(...AFTER_CARE_LINES);
  return pool;
}

// ---------- 寝言（夢のヒント） ----------
const SLEEP_TALK: Record<string, string[]> = {
  flowerForest: ['むにゃ…おはなの…いいにおい…', 'すぅ…どんぐり、ころころ…', 'むにゃむにゃ…ちょうちょ、まって…'],
  moonLake: ['…みずうみ、きらきら…', 'すぅ…おつきさま、ゆれてる…', 'むにゃ…かいがら、みーつけ…'],
  starHill: ['…ほし、とれるかな…', 'むにゃ…ながれぼし…はやい…', 'すぅ…おか、たかーい…'],
};
const CHARM_TALK: Record<string, string> = {
  wind: '…かぜ、きもちいい…',
  shoes: '…まだまだ、あるけるよ…',
  words: '…{you}のことば、もってきたよ…',
  star: '…ほしのおまもり、あったかい…',
  heart: '…{you}、だいじょうぶかな…',
};
export function sleepTalk(area: string, charms: string[], seed: string, minute: number) {
  const pool = [...(SLEEP_TALK[area] ?? SLEEP_TALK.flowerForest), ...charms.map((c) => CHARM_TALK[c]).filter(Boolean)];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  // 寝言は「ときどき」。だいたい3回に1回だけしゃべって、あとはすやすや
  const r = ((h ^ (minute * 2654435761)) >>> 0) % 100;
  if (r >= 35) return '';
  return pool[(h + minute) % pool.length];
}

/** 性格ごとのふだんのしぐさ（ときどき差しはさむポーズ） */
export const IDLE_POSES: Record<Personality | 'none', Array<{ pose: string; anim: string }>> = {
  none: [{ pose: 'smile', anim: 'tilt' }, { pose: 'g_lookup', anim: 'tilt' }, { pose: 'walk', anim: 'walk' }],
  energetic: [{ pose: 'g_jump', anim: 'hop' }, { pose: 'd_walk', anim: 'walk' }],
  calm: [{ pose: 'kutsurogi', anim: 'sway' }, { pose: 'g_yawn', anim: 'tilt' }],
  affectionate: [{ pose: 'tereru', anim: 'tilt' }, { pose: 'p_amae', anim: 'sway' }],
  adventurous: [{ pose: 'kangae', anim: 'tilt' }, { pose: 'g_lookup', anim: 'tilt' }],
};

// ---------- 冒険の物語 ----------
const STORY: Record<Exclude<Area, 'premiumArea'>, Record<Personality | 'none', string>> = {
  flowerForest: {
    none: '{name}は花の森をゆっくりお散歩。木の下で「{item}」を見つけたよ。',
    energetic: '{name}は花の森をぴょんぴょん駆けまわって、草むらから「{item}」を見つけたよ！',
    calm: '{name}は花の森の木かげでひと休み。目をさますと、そばに「{item}」がおちていたよ。',
    affectionate: '{name}は花の森で、{you}へのおみやげをさがしたよ。「{item}」、よろこんでくれるかな？',
    adventurous: '{name}は花の森のまだ行ったことのない小道へ。その先で「{item}」を見つけたよ！',
  },
  moonLake: {
    none: '{name}は月あかりの湖のほとりを歩いたよ。水ぎわで「{item}」がきらりと光ったんだ。',
    energetic: '{name}は湖のまわりをかけっこ。ひとやすみした岩のうえに「{item}」があったよ！',
    calm: '{name}は湖にうつる月をしずかにながめていたよ。気がつくと足もとに「{item}」が。',
    affectionate: '{name}は湖の水面に{you}の顔を思いうかべたよ。そのとき見つけたのが「{item}」。',
    adventurous: '{name}は湖のむこう岸までいってみたよ。そこでひろったのは「{item}」！',
  },
  starHill: {
    none: '{name}は星空の丘にのぼって、夜空を見上げたよ。草のあいだに「{item}」がひかっていたんだ。',
    energetic: '{name}は丘のてっぺんまで一気にかけのぼったよ！そこで「{item}」を見つけたんだ。',
    calm: '{name}は丘でごろんと寝ころんで星をかぞえたよ。そっと「{item}」がふってきたんだ。',
    affectionate: '{name}は流れ星に「{you}が元気でいますように」っておねがいしたよ。そしたら「{item}」が！',
    adventurous: '{name}は丘のひみつのほら穴をのぞいてみたよ。おくにあったのは「{item}」！',
  },
};
export function storyFor(area: Area, p: Personality | null, name: string, itemTitle: string, you = 'あなた') {
  const a = (area === 'premiumArea' ? 'starHill' : area) as Exclude<Area, 'premiumArea'>;
  return withYou(STORY[a][p ?? 'none'].replace('{name}', name).replace('{item}', itemTitle), you);
}

export const WALK_KINDS = [
  { id: 'walk', label: '散歩', emoji: '🚶' },
  { id: 'stretch', label: 'ストレッチ', emoji: '🧘' },
  { id: 'exercise', label: '軽い運動', emoji: '🤸' },
];

export const REST_IDEAS = ['目をとじて、肩の力をぬいてみる', '窓の外をぼんやりながめる', 'あたたかい飲み物をひとくち', 'スマホを置いて、ただ座ってみる'];

/** 24時間つながる窓口（厚生労働省「まもろうよ こころ」掲載の情報。時間が変わることがあるので公開前に再確認） */
export const HOTLINES = [
  { name: '#いのちSOS', tel: '0120-061-338', note: '24時間・無料。「死にたい」「消えたい」気持ちを専門の相談員が受けとめてくれる' },
  { name: 'よりそいホットライン', tel: '0120-279-338', note: '24時間・無料。どんななやみでも' },
  { name: 'こころの健康相談統一ダイヤル', tel: '0570-064-556', note: 'お住まいの地域の公的な相談窓口につながる（受付時間は地域によってちがう）' },
];
export const SUPPORT_LINK = {
  label: '厚生労働省「まもろうよ こころ」（相談窓口の一覧）',
  url: 'https://www.mhlw.go.jp/mamorouyokokoro/',
};

// ---------- いっしょにおでかけ ----------
export const OUTINGS: Record<'walk' | 'stretch' | 'exercise', { label: string; place: string; bg: string; pose: string; anim: 'walk' | 'hop' | 'sway'; lines: string[] }> = {
  walk: { label: '散歩', place: 'こみち', bg: 'out_path.jpg', pose: 'o_go', anim: 'walk', lines: ['てくてく♪', 'かぜがきもちいいね', 'あ、ちょうちょ！', 'となりで歩くの、たのしいな', 'ゆっくりでいいよ'] },
  exercise: { label: '運動', place: 'ひろば', bg: 'out_plaza.jpg', pose: 'g_jump', anim: 'hop', lines: ['いち、に！いち、に！', '{you}、いいかんじ〜！', 'ぴょんぴょん！', 'むりしないでね', 'ちょっと休んでもいいよ'] },
  stretch: { label: 'ストレッチ', place: 'しばふ', bg: 'out_grass.jpg', pose: 'd_stretch', anim: 'sway', lines: ['のび〜…', 'すって…はいて…', 'ふぅ〜', 'からだがぽかぽかしてきた', 'いたくないところまでね'] },
};
export const OUTING_REPLIES: Record<'good' | 'ok' | 'tired', string[]> = {
  good: ['すっきりしたね！{me}もからだがかるいよ', 'いっしょに行けてうれしかった！'],
  ok: ['でかけられただけで、じゅうぶんだよ', 'おつかれさま。ちょっとひと休みしようね'],
  tired: ['がんばったね。ゆっくり休んでね', 'つかれたときは、ごろんとしよう。{me}もいっしょにごろん'],
};
export const LEAF_BY_SEASON: Record<string, string> = { spring: '🌸', summer: '🍃', autumn: '🍁', winter: '❄️' };
