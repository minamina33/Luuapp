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
  // ---- ここから、分野ごとにえらべる追加の習慣（おすすめの並びでは上の15個が先に出る）
  // 気持ちをおちつけたい
  { id: 'window', goal: 'calm', small: '窓の外を30秒ながめる', normal: '遠くの景色を3分ながめる', when: 'day', reason: '遠くを見ると、目も気持ちもひと休みできるよ' },
  { id: 'hands', goal: 'calm', small: '手をぎゅっとにぎって、ゆるめる', normal: '体を順番にゆるめる（3分）', when: 'any', reason: '力を入れてからぬくと、こわばりに気づきやすいよ', moodReason: '仕事' },
  { id: 'notify', goal: 'calm', small: '通知を1つオフにする', normal: '1時間、通知をオフにする', when: 'day', reason: '通知がへると、気持ちがあちこちに引っぱられにくいよ', moodReason: '仕事' },
  { id: 'worry', goal: 'calm', small: '気になることを1行書き出す', normal: '気になることを全部書き出す', when: 'night', reason: '頭の中を紙に出すと、すこし軽くなることがあるよ', moodReason: '将来' },
  { id: 'aroma', goal: 'calm', small: 'すきな香りをかぐ', normal: '香りのある時間を10分つくる', when: 'any', reason: 'すきな香りは、気持ちを切りかえる合図になるよ' },
  { id: 'sky', goal: 'calm', small: '空を見上げる', normal: '外で空を5分ながめる', when: 'day', reason: '空を見上げるだけでも、視界がひらけるよ' },
  { id: 'single', goal: 'calm', small: '1分だけ、ひとつのことに集中する', normal: '5分、ひとつのことだけをする', when: 'day', reason: 'ながら作業をやめると、頭がすこし静かになるよ', moodReason: '仕事' },
  { id: 'sns', goal: 'calm', small: 'SNSを開く前にひと呼吸', normal: '寝る前の1時間はSNSを見ない', when: 'night', reason: 'ほかの人の情報から離れる時間も大事だよ', moodReason: '人間関係' },
  { id: 'sound', goal: 'calm', small: '雨や波の音を1分聴く', normal: '自然の音を10分聴く', when: 'any', reason: 'やさしい音は、まわりの音をやわらげてくれるよ' },
  // よく眠りたい
  { id: 'dim', goal: 'sleep', small: '寝る前に明かりを少し落とす', normal: '寝る1時間前から照明を暗めにする', when: 'night', reason: '暗くなると、からだが夜だと気づきやすいよ', moodReason: '睡眠' },
  { id: 'caffeine', goal: 'sleep', small: '夕方からはカフェインをひかえる', normal: '午後2時からはカフェインをとらない', when: 'day', reason: 'カフェインは長く残るから、早めにやめると眠りやすいよ', moodReason: '睡眠' },
  { id: 'wakeup', goal: 'sleep', small: '起きる時間を決めてみる', normal: '休みの日も同じ時間に起きる', when: 'morning', reason: '起きる時間がそろうと、夜も自然に眠くなりやすいよ', moodReason: '睡眠' },
  { id: 'stretchbed', goal: 'sleep', small: 'ふとんの上でのびをする', normal: '寝る前に3分ストレッチする', when: 'night', reason: 'からだをのばすと、ねむる準備がととのうよ' },
  { id: 'tomorrow', goal: 'sleep', small: '明日やることを1つメモする', normal: '明日の予定を書き出してから寝る', when: 'night', reason: '書いておくと、ふとんで考えごとをしにくくなるよ', moodReason: '将来' },
  { id: 'bedonly', goal: 'sleep', small: 'ふとんではスマホを見ない', normal: 'ふとんは眠るためだけに使う', when: 'night', reason: 'ふとん＝眠る場所、とからだが覚えてくれるよ', moodReason: '睡眠' },
  { id: 'nap', goal: 'sleep', small: '昼に5分、目をとじて休む', normal: '20分までの昼寝をする', when: 'day', reason: '短いお昼寝は、午後をらくにしてくれるよ' },
  { id: 'cool', goal: 'sleep', small: '寝る部屋の空気を入れかえる', normal: '寝る部屋の温度をちょうどよくする', when: 'night', reason: 'すずしくて静かな部屋は、ねむりやすいよ' },
  { id: 'pajama', goal: 'sleep', small: 'パジャマに着がえる', normal: '寝る前の流れを決めて、毎晩そのとおりにする', when: 'night', reason: '毎晩おなじ流れがあると、自然と眠くなってくるよ' },
  // 体を少し動かしたい
  { id: 'standup', goal: 'move', small: '1回立ち上がって、のびをする', normal: '1時間に1回立ち上がる', when: 'day', reason: '座りっぱなしをくずすだけでも、からだが軽くなるよ', moodReason: '仕事' },
  { id: 'neck', goal: 'move', small: '首をゆっくり回す', normal: '首と肩を3分ほぐす', when: 'any', reason: '画面を見たあとは、首がかたまりやすいよ', moodReason: '体調' },
  { id: 'squat', goal: 'move', small: 'スクワットを3回', normal: 'スクワットを15回', when: 'any', reason: '大きな筋肉を動かすと、からだがぽかぽかするよ' },
  { id: 'radio', goal: 'move', small: '音楽1曲ぶん、体を動かす', normal: '10分、体操をする', when: 'morning', reason: '音楽に合わせると、気軽に動けるよ' },
  { id: 'detour', goal: 'move', small: 'いつもより少し遠回りする', normal: 'ひと駅ぶん歩く', when: 'day', reason: 'いつもとちがう道は、気分転換にもなるよ' },
  { id: 'toes', goal: 'move', small: 'つま先立ちを10回', normal: 'つま先立ちを30回', when: 'any', reason: 'ふくらはぎを動かすと、足がすっきりしやすいよ', moodReason: '体調' },
  { id: 'dance', goal: 'move', small: 'すきな曲で、すこしゆれる', normal: 'すきな曲で1曲おどる', when: 'any', reason: '楽しく動くのが、いちばん続くよ' },
  { id: 'yoga', goal: 'move', small: 'ゆっくり前屈する', normal: '10分ヨガをする', when: 'morning', reason: 'ゆっくりのばすと、呼吸も深くなるよ' },
  { id: 'posture', goal: 'move', small: '背すじをのばす', normal: '1時間ごとに姿勢をなおす', when: 'day', reason: '背すじがのびると、呼吸もしやすくなるよ', moodReason: '体調' },
  // 生活リズムを整えたい
  { id: 'bedmake', goal: 'rhythm', small: 'まくらをととのえる', normal: '起きたらふとんをととのえる', when: 'morning', reason: '朝いちばんの「できた」が、1日をはじめてくれるよ' },
  { id: 'teeth', goal: 'rhythm', small: '歯をみがく', normal: '朝と夜に歯をみがく', when: 'any', reason: '毎日の小さなことが、リズムの土台になるよ' },
  { id: 'face', goal: 'rhythm', small: '顔を洗う', normal: '朝のしたくを決まった順にする', when: 'morning', reason: '顔を洗うと、1日のスイッチが入るよ' },
  { id: 'veg', goal: 'rhythm', small: '野菜をひと口食べる', normal: '毎食、野菜を食べる', when: 'day', reason: 'いろいろ食べると、からだが喜ぶよ', moodReason: '体調' },
  { id: 'tidy', goal: 'rhythm', small: 'ものを1つだけ片づける', normal: '5分だけ片づける', when: 'any', reason: 'まわりがすっきりすると、頭もすっきりしやすいよ' },
  { id: 'plan', goal: 'rhythm', small: '今日やることを1つ決める', normal: '今日の予定を3つ書く', when: 'morning', reason: 'やることが見えると、1日がらくになるよ', moodReason: '仕事' },
  { id: 'lunch', goal: 'rhythm', small: 'お昼ごはんを食べる', normal: 'お昼休みをちゃんととる', when: 'day', reason: '休み時間をとると、午後の元気がのこるよ', moodReason: '仕事' },
  { id: 'laundry', goal: 'rhythm', small: '洗濯物を1つたたむ', normal: '家事を1つ終わらせる', when: 'any', reason: '小さく終わらせると、気持ちが軽くなるよ' },
  { id: 'nightend', goal: 'rhythm', small: '「今日はおしまい」と区切る', normal: '決めた時間に仕事を終える', when: 'night', reason: '区切りをつけると、休む時間を守れるよ', moodReason: '仕事' },
  // 自分をいたわりたい
  { id: 'mirror', goal: 'self', small: '鏡の自分にほほえむ', normal: '自分のいいところを1つ書く', when: 'morning', reason: '自分にむけた笑顔も、ちゃんととどくよ' },
  { id: 'treat', goal: 'self', small: '小さなごほうびを用意する', normal: '自分だけの楽しみの時間をつくる', when: 'any', reason: 'ごほうびがあると、1日がすこし楽しみになるよ' },
  { id: 'no', goal: 'self', small: '「やらない」ことを1つ決める', normal: 'むりな頼まれごとをことわる', when: 'day', reason: 'やらないことを決めるのも、自分を守るやり方だよ', moodReason: '人間関係' },
  { id: 'thanks', goal: 'self', small: '「ありがとう」を1つ思い出す', normal: '感謝したいことを3つ書く', when: 'night', reason: 'ありがたいことに目をむけると、気持ちがあたたかくなるよ' },
  { id: 'photo', goal: 'self', small: 'すきなものの写真を1枚とる', normal: '趣味の時間を30分とる', when: 'any', reason: 'すきなものにふれる時間は、自分をとりもどす時間だよ' },
  { id: 'cozy', goal: 'self', small: 'お気に入りのものを1つ使う', normal: 'お気に入りのものにかこまれて過ごす', when: 'any', reason: 'すきなものがそばにあると、ほっとできるよ' },
  { id: 'message', goal: 'self', small: '大切な人を思いうかべる', normal: '大切な人に連絡してみる', when: 'any', reason: 'だれかを思うと、ひとりじゃないって感じられるよ', moodReason: '人間関係' },
  { id: 'nothing', goal: 'self', small: '何もしない時間を1分つくる', normal: '何もしない時間を15分つくる', when: 'any', reason: '何もしないのも、りっぱな休み方だよ' },
  { id: 'read', goal: 'self', small: '本を1ページ読む', normal: '本を15分読む', when: 'night', reason: 'ことばの世界にいると、気持ちが落ちつくよ' },
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
  toy_cushion: { pose: 'tereru', anim: 'sway', line: 'ふかふか…{you}のにおいがする' },
  toy_letterset: { pose: 'p_amae', anim: 'tilt', line: '{you}に、おてがみかいてるの' },
  toy_loupe: { pose: 'kangae', anim: 'tilt', line: 'むむっ…ちいさな模様が見える！' },
  toy_globe: { pose: 'g_lookup', anim: 'tilt', line: 'くるくる…つぎは、ここに行ってみたいな' },
  toy_mamagoto: { pose: 'ureshii', anim: 'hop', line: 'いらっしゃいませ〜！にんじんスープです' },
  toy_cookie: { pose: 'eat', anim: 'tilt', line: 'うさぎのかたち！…たべちゃだめ？' },
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
  foodie: ['なんだか、いいにおいがする…', 'おやつの時間、まだかな？', 'いっしょに、もぐもぐしたいな'],
};
/** くいしんぼうの子が、ごはんのときにときどき言うこと */
/** くいしんぼうの子の、ふえた分のおやつのとき */
export const FOODIE_SNACK_LINES = ['えへへ、もう1こ…いいの？', 'おやつのおかわり、しあわせ〜', 'ないしょのおやつだね'];
export const FOODIE_EAT_LINES = ['もぐもぐ…おかわり、ある？', 'これ、だいすき！しあわせ〜', 'ごちそうさま…でも、まだ入るかも'];
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
  foodie: [{ pose: 'ureshii', anim: 'hop' }, { pose: 'smile', anim: 'tilt' }],
};

// ---------- 冒険の物語 ----------
const STORY: Record<Exclude<Area, 'premiumArea'>, Record<Personality | 'none', string>> = {
  flowerForest: {
    none: '{name}は花の森をゆっくりお散歩。木の下で「{item}」を見つけたよ。',
    energetic: '{name}は花の森をぴょんぴょん駆けまわって、草むらから「{item}」を見つけたよ！',
    calm: '{name}は花の森の木かげでひと休み。目をさますと、そばに「{item}」がおちていたよ。',
    affectionate: '{name}は花の森で、{you}へのおみやげをさがしたよ。「{item}」、よろこんでくれるかな？',
    adventurous: '{name}は花の森のまだ行ったことのない小道へ。その先で「{item}」を見つけたよ！',
    foodie: '{name}は花の森で、あまいにおいのするほうへ…。そこにあったのは「{item}」！',
  },
  moonLake: {
    none: '{name}は月あかりの湖のほとりを歩いたよ。水ぎわで「{item}」がきらりと光ったんだ。',
    energetic: '{name}は湖のまわりをかけっこ。ひとやすみした岩のうえに「{item}」があったよ！',
    calm: '{name}は湖にうつる月をしずかにながめていたよ。気がつくと足もとに「{item}」が。',
    affectionate: '{name}は湖の水面に{you}の顔を思いうかべたよ。そのとき見つけたのが「{item}」。',
    adventurous: '{name}は湖のむこう岸までいってみたよ。そこでひろったのは「{item}」！',
    foodie: '{name}は湖のほとりでおべんとうをひろげたよ。食べおわったら、となりに「{item}」が。',
  },
  starHill: {
    none: '{name}は星空の丘にのぼって、夜空を見上げたよ。草のあいだに「{item}」がひかっていたんだ。',
    energetic: '{name}は丘のてっぺんまで一気にかけのぼったよ！そこで「{item}」を見つけたんだ。',
    calm: '{name}は丘でごろんと寝ころんで星をかぞえたよ。そっと「{item}」がふってきたんだ。',
    affectionate: '{name}は流れ星に「{you}が元気でいますように」っておねがいしたよ。そしたら「{item}」が！',
    adventurous: '{name}は丘のひみつのほら穴をのぞいてみたよ。おくにあったのは「{item}」！',
    foodie: '{name}は丘の上で、星がこんぺいとうに見えてきたよ。手をのばしたら「{item}」が！',
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
