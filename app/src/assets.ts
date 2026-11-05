import sprites from './data/sprites.json';

const BASE = import.meta.env.BASE_URL;
export const asset = (f: string) => `${BASE}assets/${f}`;
export const spriteUrl = (key: string) => asset(`${key}.webp`);
export const SPRITES = sprites as unknown as Record<string, [number, number]>;

/**
 * るうの表示サイズ計算
 * 原画の部屋に座っているるう（sit：高さ292px）が、部屋の幅に対して高さ37%になる比率。
 * スプライトはすべて同じ縮尺に正規化済みなので、この1つの係数で大きさがそろう。
 */
export const PCT_PER_PX = 37.1 / 292;

/** 部屋画像の中で、るうが座る位置（初期のお部屋の原画に合わせた値） */
export const ROOM_ANCHOR = { x: 62.9, bottom: 12.6 };
export const ROOM_ASPECT = 445 / 556;
