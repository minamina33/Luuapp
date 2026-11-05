import React from 'react';
import { LuuImg } from './LuuImg';
import { asset, PCT_PER_PX, SPRITES } from '../assets';
import { item } from '../data/items';
import type { GameState, ItemDef, RoomSlot } from '../types';
import { ConstellationSvg } from './Sky';
import { constellationsOf } from '../data/sky';
import type { TimeOfDay } from '../game/logic';

export type Anim = 'idle' | 'hop' | 'sway' | 'tilt' | 'walk' | 'wiggle' | 'none' | 'chew' | 'sip';
/** 手に持っている食べもの・飲みもの */
export interface Hold {
  motion: 'eat' | 'drink';
  icon?: string;
  cup?: 'milk' | 'tea';
}

/** マグカップ（飲みもの用の仮イラスト） */
function Cup({ kind }: { kind: 'milk' | 'tea' }) {
  const liquid = kind === 'milk' ? '#fffaf2' : '#e9d79a';
  return (
    <svg viewBox="0 0 60 56" aria-hidden>
      <path d="M44 20 q12 0 12 11 t-12 11" fill="none" stroke="#f3dccd" strokeWidth="6" strokeLinecap="round" />
      <path d="M6 12 h40 v28 q0 12 -12 12 h-16 q-12 0 -12 -12 z" fill="#fff7ee" stroke="#ecd3c2" strokeWidth="2" />
      <ellipse cx="26" cy="13" rx="19" ry="4.5" fill={liquid} stroke="#ecd3c2" strokeWidth="1.5" />
      <path d="M26 33 c-4 -4 -9 1 0 7 c9 -6 4 -11 0 -7z" fill="#f6b6c4" />
      <g className="steam" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".8">
        <path d="M18 6 q-3 -3 0 -6" />
        <path d="M30 5 q-3 -3 0 -6" />
      </g>
    </svg>
  );
}

type Box = { left: number; top: number; w: number; h: number };
type Pt = { left: number; top: number };
export interface RoomLayout {
  /** るうが座る位置（x=中心の%, bottom=足もとの%）と大きさの倍率 */
  luu: { x: number; bottom: number; scale: number };
  /** 眠っているるう（ベッドの上） */
  sleep: { x: number; bottom: number; scale: number };
  bed: Box;
  rug: Box;
  curL: Box;
  curR: Box;
  wall: Pt;
  wall2: Pt;
  /** ベッドの上：x=中心、bottom=ふとんに乗る高さ（どの大きさの絵でも沈まず浮かないように下端で合わせる） */
  plush: { x: number; bottom: number };
  chest: { left: number; top: number; w: number };
  /** ゆか：x=中心、bottom=床に接する高さ、w=幅（奥はちいさく・手前は大きく） */
  floor: { x: number; bottom: number; w: number };
  floor2: { x: number; bottom: number; w: number };
  egg: Pt;
}
/**
 * 描いてもらった部屋の絵（昼・夜）に合わせた配置。数字は絵の幅・高さに対する%
 * 夜の絵は少し寄った構図なので、昼とは別に測っている
 */
export const LAYOUTS: Record<'day' | 'night', RoomLayout> = {
  day: {
    luu: { x: 54, bottom: 16.5, scale: 0.9 },
    sleep: { x: 17, bottom: 41, scale: 0.78 },
    bed: { left: -1, top: 49.5, w: 35, h: 25 },
    rug: { left: 19.5, top: 70.5, w: 69, h: 20 },
    curL: { left: 26.5, top: 9, w: 14.5, h: 47 },
    curR: { left: 72, top: 9, w: 15, h: 49 },
    wall: { left: 9, top: 15 },
    wall2: { left: 10, top: 29.5 },
    floor: { x: 41.5, bottom: 35.5, w: 11 },
    floor2: { x: 89, bottom: 2.5, w: 19 },
    plush: { x: 19, bottom: 38.5 },
    chest: { left: 75, top: 54.5, w: 18 },
    egg: { left: 26, top: 80 },
  },
  night: {
    luu: { x: 57.5, bottom: 16, scale: 0.88 },
    sleep: { x: 19, bottom: 39, scale: 0.8 },
    bed: { left: -1, top: 52, w: 39, h: 26 },
    rug: { left: 24, top: 72, w: 67, h: 19.5 },
    curL: { left: 32, top: 9, w: 15, h: 49 },
    curR: { left: 77, top: 9, w: 15, h: 50 },
    wall: { left: 11.5, top: 17 },
    wall2: { left: 12.5, top: 31.5 },
    floor: { x: 47, bottom: 33, w: 12 },
    floor2: { x: 87.5, bottom: 2, w: 19 },
    plush: { x: 22, bottom: 36.5 },
    chest: { left: 78, top: 56.2, w: 17 },
    egg: { left: 30, top: 81 },
  },
};
export const layoutFor = (tod: TimeOfDay, sleeping?: boolean) => LAYOUTS[sleeping || tod === 'night' ? 'night' : 'day'];

/** 部屋の中のるう */
export function Luu({
  pose,
  outfitSprite,
  scale,
  anim = 'idle',
  night,
  onClick,
  x,
  bottom,
  hold,
}: {
  pose: string;
  outfitSprite?: string | null;
  scale: number;
  anim?: Anim;
  night?: boolean;
  onClick?: () => void;
  x: number;
  bottom: number;
  hold?: Hold | null;
}) {
  // 衣装を着ているときは衣装の原画を表示し、動きはアニメーションで表現する
  const key = outfitSprite ?? pose;
  // 着せかえ中も、口もとに食べ物・コップを重ねて「着たまま食べる」
  const showHold = !!hold && (key === 'eat_base' || !!outfitSprite);
  const [w, h] = SPRITES[key] ?? SPRITES.sit;
  // 口の高さ（絵の下からの距離）：いつもの座った絵とアクセは157、2回目の衣装は足もとの影のぶん少し高い
  const mouthFromBottom = key.startsWith('w_') ? 165 : key.startsWith('a_') ? 157 : 160;
  const mouthTop = ((h - mouthFromBottom) / h) * 100;
  const holdStyle = outfitSprite ? (hold?.motion === 'drink' ? { left: '55%', top: `${mouthTop + 4}%` } : { left: '57%', top: `${mouthTop + 9}%` }) : undefined;
  const wPct = w * PCT_PER_PX * scale;
  return (
    <div className="luu-wrap" style={{ left: `${x - wPct / 2}%`, bottom: `${bottom}%`, width: `${wPct}%` }}>
      {/* 2回目の衣装原画は足もとの影も描かれているので、重ねない */}
      {!key.startsWith('w_') && <div className="luu-shadow" />}
      <button
        className={`luu anim-${anim} ${night ? 'night' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        aria-label="るうにさわる"
      >
        <LuuImg sprite={key} alt="るう" draggable={false} />
        {showHold && hold!.motion === 'eat' && (
          <span className="hold hold-eat" style={holdStyle}>
            <span className="hold-food">{hold!.icon}</span>
            <span className="crumb c1" />
            <span className="crumb c2" />
            <span className="crumb c3" />
          </span>
        )}
        {showHold && hold!.motion === 'drink' && (
          <span className="hold hold-drink" style={holdStyle}>
            <Cup kind={hold!.cup ?? 'milk'} />
          </span>
        )}
      </button>
    </div>
  );
}

/** るうの頭のてっぺん（部屋の高さに対する%） */
export function luuTopPct(pose: string, scale: number, aspect: number, bottom: number) {
  const [, h] = SPRITES[pose] ?? SPRITES.sit;
  return 100 - bottom - h * PCT_PER_PX * scale * aspect;
}

/** 飾りもの：絵があれば絵、なければ仮アイコン */
function Deco({ it, className, style }: { it: ItemDef; className: string; style: React.CSSProperties }) {
  return (
    <div className={`deco ${className} ${it.img ? 'has-img' : ''}`} style={style} title={it.title}>
      {it.img ? <img src={asset(`${it.img}.webp`)} alt="" draggable={false} /> : it.icon}
    </div>
  );
}
const pos = (p: Pt) => ({ left: `${p.left}%`, top: `${p.top}%` });
const box = (b: Box) => ({ left: `${b.left}%`, top: `${b.top}%`, width: `${b.w}%`, height: `${b.h}%` });

/** 部屋（背景＋家具の差分＋子要素） */
export function Room({
  tod,
  sleeping,
  slots,
  children,
  className = '',
  onBackgroundClick,
  sky,
  onSkyClick,
}: {
  sky?: GameState['sky'];
  onSkyClick?: () => void;
  tod: TimeOfDay;
  sleeping?: boolean;
  slots: Record<RoomSlot, string | null>;
  children?: React.ReactNode;
  className?: string;
  onBackgroundClick?: () => void;
}) {
  const night = tod === 'night' || !!sleeping;
  const L = layoutFor(tod, sleeping);
  const bg = night ? 'room_night.jpg' : 'room_day.jpg';
  const g = (k: RoomSlot) => (slots[k] ? item(slots[k]!) : null);
  const bed = g('bed');
  const rug = g('rug');
  const curtain = g('curtain');
  const wall = g('wall');
  const wall2 = g('wall2');
  const plush = g('plush');
  const chest = g('chest');
  const top = chest ? g('top') : null;
  const top2 = chest ? g('top2') : null;
  const floor = g('floor');
  const floor2 = g('floor2');
  return (
    <div className={`room ${className} ${night ? 'is-night' : ''}`} onClick={onBackgroundClick}>
      <img className="room-bg" src={asset(bg)} alt="" draggable={false} />
      {bed?.tint && <div className="tint tint-bed" style={{ ...box(L.bed), background: bed.tint }} />}
      {rug?.img && rug.id !== 'rug_default' && <img className="rug-img" src={asset(`${rug.img}.webp`)} alt="" draggable={false} style={{ left: `${L.rug.left - 2}%`, top: `${L.rug.top - 1.5}%`, width: `${L.rug.w + 4}%`, height: `${L.rug.h + 3.5}%` }} />}
      {rug?.tint && !rug.img && <div className="tint tint-rug" style={{ ...box(L.rug), background: `radial-gradient(closest-side, ${rug.tint} 75%, transparent 100%)` }} />}
      {curtain?.tint && (
        <>
          <div className="tint tint-curtain" style={{ ...box(L.curL), background: curtain.tint }} />
          <div className="tint tint-curtain" style={{ ...box(L.curR), background: curtain.tint }} />
        </>
      )}
      {wall && <Deco it={wall} className="deco-wall" style={pos(L.wall)} />}
      {wall2 && <Deco it={wall2} className="deco-wall" style={pos(L.wall2)} />}
      {plush && !sleeping && <Deco it={plush} className="deco-plush" style={{ left: `${L.plush.x}%`, bottom: `${L.plush.bottom}%`, transform: 'translateX(-50%)' }} />}
      {chest && (
        <div className="chest" style={{ left: `${L.chest.left}%`, top: `${L.chest.top}%`, width: `${L.chest.w}%` }} title={chest.title}>
          <img className="dresser-img" src={asset(`${chest.img ?? 'it_dresser'}.webp`)} alt="" draggable={false} style={{ filter: chest.chestFilter }} />
          {top && <Deco it={top} className={`chest-top ${top2 ? 'l' : ''}`} style={{}} />}
          {top2 && <Deco it={top2} className={`chest-top ${top ? 'r' : ''}`} style={{}} />}
        </div>
      )}
      {floor && <Deco it={floor} className="deco-floor" style={{ left: `${L.floor.x}%`, bottom: `${L.floor.bottom}%`, width: `${L.floor.w}%` }} />}
      {floor2 && <Deco it={floor2} className="deco-floor front" style={{ left: `${L.floor2.x}%`, bottom: `${L.floor2.bottom}%`, width: `${L.floor2.w}%` }} />}
      {night && sky && <WindowSky sky={sky} onClick={onSkyClick} />}
      {tod === 'evening' && !sleeping && <div className="overlay-evening" />}
      {tod === 'morning' && !sleeping && <div className="overlay-morning" />}
      {children}
    </div>
  );
}

/** 夜の窓に見える星座（今つくっている星座と、最近の2つ） */
function WindowSky({ sky, onClick }: { sky: GameState['sky']; onClick?: () => void }) {
  if (!sky.stars.length) return null;
  const y = Math.max(...sky.stars.map((x) => x.y));
  const cs = constellationsOf(sky.stars, y).filter((c) => c.lit > 0);
  const cur = cs[cs.length - 1];
  const prev = cs.slice(0, -1).slice(-2).reverse();
  const SLOTS = [
    { left: 61.5, top: 27, w: 13 },
    { left: 48, top: 31.5, w: 10 },
  ];
  return (
    <button
      className="window-sky"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label="夜空を見る"
    >
      {prev.map((c, i) => (
        <span key={c.key} className="ws" style={{ left: `${SLOTS[i].left}%`, top: `${SLOTS[i].top}%`, width: `${SLOTS[i].w}%` }}>
          <ConstellationSvg c={c} faint showNext={false} size={100} />
        </span>
      ))}
      {cur && (
        <span className="ws cur" style={{ left: '46.5%', top: '14.5%', width: '17%' }}>
          <ConstellationSvg c={cur} size={100} />
        </span>
      )}
    </button>
  );
}
