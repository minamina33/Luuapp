import type { CareKind } from '../types';

/**
 * おまもり：その日のケアで冒険かばんに入り、その夜の冒険の「質」を変える（量は増やさない）
 * 1晩3つまで。同じ種類のケアを何回しても1つ。ケアをしなかった日も冒険はいつも通り。
 */
export type CharmId = 'wind' | 'words' | 'shoes' | 'star' | 'heart';
export const MAX_CHARMS = 3;

export const CHARMS: Record<CharmId, { name: string; icon: string; care: string; effect: string }> = {
  wind: { name: '風のおまもり', icon: '🍃', care: '呼吸法', effect: '静かな場所へ行きやすくなる' },
  words: { name: 'ことばのおまもり', icon: '📜', care: '日記', effect: '冒険のお話が少し長く、特別になる' },
  shoes: { name: 'くつのおまもり', icon: '👟', care: '散歩・運動', effect: 'いつもより遠くへ行ける' },
  star: { name: 'ほしのおまもり', icon: '⭐', care: 'タスク', effect: 'その夜、窓の夜空に星がひとつ灯る（星座ができていく）' },
  heart: { name: 'ハートのおまもり', icon: '💗', care: '気分の記録', effect: '帰ってきたときのるうの言葉が増える' },
};
export const CARE_CHARM: Partial<Record<CareKind, CharmId>> = {
  breathing: 'wind',
  meditation: 'wind',
  journal: 'words',
  walk: 'shoes',
  task: 'star',
  mood: 'heart',
};

/** ことばのおまもり：お話に足す一文（エリアごと） */
export const WORDS_LINES: Record<string, string> = {
  flowerForest: '木の下で、{you}が書いてくれた言葉を思い出しながら、ひと休みしたよ。花たちも、うんうんってゆれてた。',
  moonLake: '湖に、{you}の今日のことを、そっと話しかけてみたよ。水面がきらきら光って、聞いてくれてるみたいだった。',
  starHill: '星にむかって、{you}の今日のことを話してあげたよ。ひとつの星が、ぱちってまたたいたんだ。',
};
/** ハートのおまもり：その日の気分に合わせた、おかえりの言葉 */
export function heartLine(mood: number | null) {
  if (mood === null) return '{you}の今日の気持ち、ちゃんと覚えてるよ。';
  if (mood <= 2) return '今日はちょっとつらい日だったね。{me}、帰ってきたから、そばにいるよ。';
  if (mood === 3) return '{you}の今日の気持ち、ちゃんと覚えてるよ。教えてくれてありがとう。';
  return '{you}がうれしい日だったから、{me}も夢の中でずっとにこにこしてたよ。';
}
