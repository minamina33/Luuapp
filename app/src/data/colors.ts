import type { ColorId } from '../types';

/**
 * 色違いのるう（企画書のカラーバリエーション）
 * 耳の色だけを、元の原画からその場で塗り替えて表示する（src/recolor.ts）
 * hue: 耳の色相 / sat・val: 元の彩度・明度にかける倍率 / egg: たまごの模様の色
 */
export interface LuuColor {
  id: ColorId;
  name: string;
  hue: number;
  sat: number;
  val: number;
  egg: string;
  pattern: 'dots' | 'stripes' | 'stars' | 'hearts' | 'waves';
  secret?: boolean;
}
export const COLORS: LuuColor[] = [
  { id: 'milk', name: 'ミルク', hue: 0, sat: 1, val: 1, egg: '#c9a487', pattern: 'dots' },
  { id: 'caramel', name: 'キャラメル', hue: 37, sat: 1.55, val: 1.12, egg: '#e9b874', pattern: 'stripes' },
  { id: 'lavender', name: 'ラベンダー', hue: 265, sat: 0.75, val: 1.0, egg: '#b7a6e6', pattern: 'dots' },
  { id: 'mint', name: 'ミント', hue: 145, sat: 0.65, val: 0.98, egg: '#9fd6b8', pattern: 'waves' },
  { id: 'cocoa', name: 'ココア', hue: 22, sat: 1.1, val: 0.8, egg: '#9b7158', pattern: 'stripes' },
  { id: 'gray', name: 'グレー', hue: 30, sat: 0.12, val: 0.92, egg: '#b9b6b3', pattern: 'waves' },
  { id: 'sakura', name: 'さくら', hue: 345, sat: 0.95, val: 1.04, egg: '#f0a7bf', pattern: 'hearts' },
  { id: 'sora', name: 'ソラ', hue: 212, sat: 0.8, val: 1.02, egg: '#9fc4ef', pattern: 'dots' },
  { id: 'yuki', name: 'ゆきいろ', hue: 210, sat: 0.25, val: 1.05, egg: '#dfe9f7', pattern: 'stars', secret: true },
];
export const COLOR_MAP = Object.fromEntries(COLORS.map((c) => [c.id, c])) as Record<ColorId, LuuColor>;
