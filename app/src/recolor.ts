/**
 * 色違いのるう：原画の「耳の色」だけをその場で塗り替える
 * 茶色〜ベージュで、ある程度あざやかな画素を耳とみなし、色相・彩度・明度を置きかえる。
 * 目（暗い）・ほっぺ（赤み）・体（白に近い）は残る。結果はブラウザ内でキャッシュする。
 * 本番で色ごとの原画が届いたら、ここを「色ごとの画像を読むだけ」に差し替えればよい。
 */
import { useEffect, useState } from 'react';
import { spriteUrl } from './assets';
import { COLOR_MAP } from './data/colors';
import ACC_REGIONS from './data/accRegions.json';
import type { ColorId } from './types';

const done = new Map<string, string>();
/** 背景のある絵は、耳のあたりだけを塗り替える（幅・高さに対する割合 [x0, y0, x1, y1]） */
const REGIONS: Record<string, Array<[number, number, number, number]>> = {
  // バッグ（茶色）まで塗らないように、耳のあたりだけ
  o_go: [
    [0, 0.1, 0.4, 0.5],
    [0, 0.5, 0.17, 0.7],
    [0.74, 0.08, 1, 0.66],
  ],
  o_back: [
    [0, 0.08, 0.33, 0.53],
    [0.75, 0.08, 0.86, 0.48],
    [0.86, 0.08, 1, 0.66],
  ],
  hatch_art: [
    [0.25, 0.34, 0.42, 0.58],
    [0.57, 0.34, 0.75, 0.58],
  ],
};
// アクセをつけたるう：アクセ（茶色のベレーやバッグ）まで塗らないよう、耳のあたりだけ
Object.assign(REGIONS, ACC_REGIONS as unknown as Record<string, Array<[number, number, number, number]>>);
const working = new Map<string, Promise<string>>();

const smooth = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function rgb2hsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}
function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m];
}

function load(src: string) {
  return new Promise<HTMLImageElement>((ok, ng) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = ng;
    im.src = src;
  });
}

export function recolor(sprite: string, color: ColorId): Promise<string> {
  const src = spriteUrl(sprite);
  if (color === 'milk') return Promise.resolve(src);
  const key = `${sprite}:${color}`;
  const hit = done.get(key);
  if (hit) return Promise.resolve(hit);
  const w = working.get(key);
  if (w) return w;
  const p = (async () => {
    try {
      const im = await load(src);
      const cv = document.createElement('canvas');
      cv.width = im.naturalWidth;
      cv.height = im.naturalHeight;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx) return src;
      ctx.drawImage(im, 0, 0);
      const img = ctx.getImageData(0, 0, cv.width, cv.height);
      const d = img.data;
      const c = COLOR_MAP[color];
      const W = cv.width;
      const H = cv.height;
      const regions = REGIONS[sprite]?.map(([a, b, e, f]) => [a * W, b * H, e * W, f * H]);
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        if (regions) {
          const px = (i / 4) % W;
          const py = Math.floor(i / 4 / W);
          if (!regions.some(([a, b, e, f]) => px >= a && px <= e && py >= b && py <= f)) continue;
        }
        const r = d[i] / 255;
        const g = d[i + 1] / 255;
        const b = d[i + 2] / 255;
        const [h, s, v] = rgb2hsv(r, g, b);
        const wgt = smooth(s, 0.16, 0.27) * smooth(h, 17, 21) * (1 - smooth(h, 40, 46)) * smooth(v, 0.42, 0.56);
        if (wgt <= 0.001) continue;
        const [nr, ng, nb] = hsv2rgb(c.hue, Math.min(1, s * c.sat), Math.min(1, v * c.val));
        d[i] = (r * (1 - wgt) + nr * wgt) * 255;
        d[i + 1] = (g * (1 - wgt) + ng * wgt) * 255;
        d[i + 2] = (b * (1 - wgt) + nb * wgt) * 255;
      }
      ctx.putImageData(img, 0, 0);
      const url = cv.toDataURL('image/png');
      done.set(key, url);
      return url;
    } catch {
      return src; // 失敗したら元の色で表示
    }
  })();
  working.set(key, p);
  return p;
}

/** よく使う絵を先に塗り替えておく（切り替えたときにちらつかないように） */
const COMMON = ['sit', 'walk', 'pet', 'ureshii', 'tereru', 'g_lookup', 'g_happy', 'avatar', 'p_amae', 'kutsurogi', 'g_yawn', 'g_jump', 'd_jump'];
export function preload(color: ColorId) {
  if (color === 'milk') return;
  COMMON.forEach((k) => void recolor(k, color));
}

/** 色違いの絵のURL。塗り替えが終わるまでは null */
export function useLuuSrc(sprite: string, color: ColorId): string | null {
  const key = `${sprite}:${color}`;
  const [url, setUrl] = useState<string | null>(color === 'milk' ? spriteUrl(sprite) : done.get(key) ?? null);
  useEffect(() => {
    let alive = true;
    if (color === 'milk') {
      setUrl(spriteUrl(sprite));
      return;
    }
    const hit = done.get(key);
    if (hit) setUrl(hit);
    else {
      setUrl((u) => u); // 前の絵を表示したまま待つ
      recolor(sprite, color).then((u) => alive && setUrl(u));
    }
    return () => {
      alive = false;
    };
  }, [sprite, color, key]);
  return url;
}
