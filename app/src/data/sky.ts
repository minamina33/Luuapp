/**
 * 夜空と星座
 * ほしのおまもり（タスク）を持って眠った夜に、星が1つ灯る（1晩1つ）。
 * 星座は12の形を順に使い回し、1年ごとに1枚の「星空」として区切る。
 * 座標は星座の箱（0〜1）の中の位置。lines は星の番号どうしをつなぐ線。
 */
export interface Pattern {
  pts: Array<[number, number]>;
  lines: Array<[number, number]>;
  hint: string; // 名前をつけるときのヒント
}
const chain = (n: number): Array<[number, number]> => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);

export const PATTERNS: Pattern[] = [
  // 春
  { hint: 'おはなのかたち', pts: [[0.5, 0.15], [0.8, 0.4], [0.68, 0.8], [0.32, 0.8], [0.2, 0.4], [0.5, 0.5]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5]] },
  { hint: 'ちょうちょ', pts: [[0.5, 0.2], [0.5, 0.75], [0.15, 0.25], [0.2, 0.6], [0.85, 0.25], [0.8, 0.6]], lines: [[0, 1], [0, 2], [2, 3], [3, 1], [0, 4], [4, 5], [5, 1]] },
  { hint: 'うさぎのみみ', pts: [[0.35, 0.1], [0.4, 0.45], [0.65, 0.1], [0.6, 0.45], [0.5, 0.65], [0.3, 0.9], [0.7, 0.9]], lines: [[0, 1], [2, 3], [1, 4], [3, 4], [4, 5], [4, 6]] },
  // 夏
  { hint: 'かき氷のスプーン', pts: [[0.2, 0.2], [0.35, 0.35], [0.5, 0.5], [0.65, 0.65], [0.8, 0.8], [0.15, 0.4]], lines: [...chain(5), [0, 5]] },
  { hint: 'くじら', pts: [[0.1, 0.55], [0.3, 0.4], [0.55, 0.35], [0.8, 0.45], [0.9, 0.25], [0.95, 0.6], [0.5, 0.7]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [0, 6], [6, 3]] },
  { hint: 'ひまわり', pts: [[0.5, 0.3], [0.7, 0.45], [0.5, 0.6], [0.3, 0.45], [0.5, 0.95]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4]] },
  // 秋
  { hint: 'どんぐり', pts: [[0.5, 0.1], [0.25, 0.35], [0.75, 0.35], [0.3, 0.7], [0.7, 0.7], [0.5, 0.9]], lines: [[1, 0], [0, 2], [1, 2], [1, 3], [2, 4], [3, 5], [4, 5]] },
  { hint: 'おつきみのうさぎ', pts: [[0.2, 0.3], [0.3, 0.55], [0.5, 0.6], [0.7, 0.5], [0.8, 0.25], [0.5, 0.85]], lines: [...chain(5), [2, 5]] },
  { hint: 'もみじ', pts: [[0.5, 0.1], [0.2, 0.35], [0.8, 0.35], [0.3, 0.7], [0.7, 0.7], [0.5, 0.5], [0.5, 0.95]], lines: [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 6]] },
  // 冬
  { hint: 'ゆきだるま', pts: [[0.5, 0.15], [0.35, 0.3], [0.65, 0.3], [0.5, 0.45], [0.25, 0.7], [0.75, 0.7], [0.5, 0.92]], lines: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]] },
  { hint: 'マフラー', pts: [[0.1, 0.3], [0.35, 0.4], [0.6, 0.35], [0.85, 0.45], [0.7, 0.7], [0.75, 0.95]], lines: chain(6) },
  { hint: 'ゆきのけっしょう', pts: [[0.5, 0.5], [0.5, 0.1], [0.85, 0.3], [0.85, 0.7], [0.5, 0.9], [0.15, 0.7], [0.15, 0.3]], lines: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] },
];

export interface Star {
  d: string; // 灯った日（YYYY-MM-DD）
  y: number; // 星空の年
}
export interface Constellation {
  year: number;
  index: number; // その年の何番目か
  pattern: Pattern;
  lit: number; // 灯っている星の数
  total: number;
  done: boolean;
  key: string; // 名前の保存用
}

/** その年の星を、順番に星座へ割り当てる */
export function constellationsOf(stars: Star[], year: number): Constellation[] {
  const n = stars.filter((s) => s.y === year).length;
  const out: Constellation[] = [];
  let used = 0;
  let i = 0;
  while (used < n || i === 0) {
    const pattern = PATTERNS[i % PATTERNS.length];
    const total = pattern.pts.length;
    const lit = Math.max(0, Math.min(total, n - used));
    out.push({ year, index: i, pattern, lit, total, done: lit === total, key: `${year}-${i}` });
    used += total;
    i++;
    if (used >= n) {
      // 最後が完成していたら、次の（まだ灯っていない）星座も見せる
      if (lit === total) out.push({ year, index: i, pattern: PATTERNS[i % PATTERNS.length], lit: 0, total: PATTERNS[i % PATTERNS.length].pts.length, done: false, key: `${year}-${i}` });
      break;
    }
  }
  return out;
}
export const yearsOf = (stars: Star[]) => Array.from(new Set(stars.map((s) => s.y))).sort((a, b) => b - a);
