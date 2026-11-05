import { useEffect, useMemo, useRef, useState } from 'react';
import { LuuImg } from './LuuImg';
import { useGame } from '../game/store';
import { asset, spriteUrl } from '../assets';
import { STAGE_SCALE } from '../config';
import { item } from '../data/items';
import { sound } from '../sound';
import type { Celebration, Rarity } from '../types';
import { RarityBadge } from '../sheets/Game';
import { Egg } from './Egg';
import { ConstellationSvg } from './Sky';
import { constellationsOf } from '../data/sky';
import { useNav } from '../nav';

const COLORS = ['#f6b3a1', '#f7c96b', '#f4a8bd', '#b9b0e6', '#9fd3b9', '#a9cdef', '#fff1b8'];

/** 紙吹雪（n個のパーツをランダムに降らせる） */
export function Confetti({ n = 42, hearts }: { n?: number; hearts?: boolean }) {
  const { s } = useGame();
  const reduce = s.settings.reduceMotion;
  const pieces = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        dur: 2.2 + Math.random() * 1.8,
        size: 6 + Math.random() * 8,
        rot: Math.random() * 360,
        drift: (Math.random() - 0.5) * 80,
        color: COLORS[i % COLORS.length],
        shape: hearts && i % 3 === 0 ? 'heart' : i % 4 === 0 ? 'star' : i % 2 ? 'dot' : 'rect',
      })),
    [n, hearts]
  );
  if (reduce) return null;
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`cf cf-${p.shape}`}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.5 : p.size,
            background: p.shape === 'rect' || p.shape === 'dot' ? p.color : undefined,
            color: p.color,
            ['--rot' as string]: `${p.rot}deg`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        >
          {p.shape === 'star' ? '✦' : p.shape === 'heart' ? '♥' : ''}
        </span>
      ))}
    </div>
  );
}

/** 光の放射＋きらきら（レア度で色が変わる） */
export function Rays({ rarity }: { rarity?: Rarity }) {
  return (
    <div className={`rays ${rarity ? `rays-${rarity}` : ''}`} aria-hidden>
      <div className="rays-spin" />
      <div className="rays-glow" />
    </div>
  );
}

/** 包みが揺れて、タップ（または自動）で開いて中身が出てくる */
export function GiftReveal({ itemId, onOpen, label }: { itemId: string; onOpen?: () => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const opened = useRef(false);
  const it = item(itemId);
  useEffect(() => {
    const t = window.setTimeout(() => doOpen(), 1700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function doOpen() {
    if (opened.current) return;
    opened.current = true;
    setOpen(true);
    sound.se('open');
    window.setTimeout(() => sound.se('sparkle'), 250);
    onOpen?.();
  }
  return (
    <div className="gift-reveal" onClick={doOpen}>
      {!open ? (
        <>
          <div className="gift-box">
            <img src={asset('it_gift.webp')} alt="" />
          </div>
          <div className="gift-hint">{label ?? 'タップしてあけてみよう'}</div>
        </>
      ) : (
        <div className="gift-item">
          <Rays rarity={it.rarity} />
          <div className="burst" />
          <span className={`item-icon xl r-${it.rarity}`}>{it.img ? <img src={asset(`${it.img}.webp`)} alt="" /> : it.sprite ? <LuuImg sprite={it.sprite} alt="" /> : <span>{it.icon}</span>}</span>
        </div>
      )}
    </div>
  );
}

/** 全画面のお祝い（成長・親密度アップ・プレゼント） */
function CelebrateView({ c, onDone }: { c: Celebration; onDone: () => void }) {
  const { s } = useGame();
  const nav = useNav();
  const [phase, setPhase] = useState<'pre' | 'main'>(c.kind === 'stage' || c.kind === 'hatch' ? 'pre' : 'main');
  const [crack, setCrack] = useState<0 | 1 | 2>(0);
  const [revealed, setRevealed] = useState(c.kind !== 'gift');
  const outfit = s.pet.outfit ? item(s.pet.outfit).sprite : null;

  useEffect(() => {
    if (c.kind === 'stage') {
      sound.se('sparkle');
      const t = window.setTimeout(() => {
        setPhase('main');
        sound.se('fanfare');
      }, 1300);
      return () => clearTimeout(t);
    }
    if (c.kind === 'bond') sound.se('levelup');
    if (c.kind === 'eggs') sound.se('sparkle');
    if (c.kind === 'cheer') sound.se('fanfare');
    if (c.kind === 'constellation') sound.se('sparkle');
    if (c.kind === 'hatch') {
      // たまごがゆれて、ひびが入って、ぱかっと割れる
      const t1 = window.setTimeout(() => (setCrack(1), sound.se('pop')), 700);
      const t2 = window.setTimeout(() => (setCrack(2), sound.se('pop')), 1400);
      const t3 = window.setTimeout(() => {
        setPhase('main');
        sound.se('fanfare');
      }, 2100);
      return () => [t1, t2, t3].forEach(clearTimeout);
    }
  }, [c.kind]);
  const done = () => {
    onDone();
    if (c.kind === 'eggs') nav.open({ k: 'eggs' });
    if (c.kind === 'hatch' && c.petId) nav.open({ k: 'newPet', id: c.petId });
    if (c.kind === 'constellation') nav.open({ k: 'sky' });
  };

  const st = c.stage ?? 1;
  const from = STAGE_SCALE[Math.max(0, st - 2)];
  const to = STAGE_SCALE[st - 1];
  const it = c.itemId ? item(c.itemId) : null;
  const lastDone = s.sky?.stars.length ? [...constellationsOf(s.sky.stars, Math.max(...s.sky.stars.map((x) => x.y)))].reverse().find((x) => x.done) : undefined;

  return (
    <div className={`celebrate cel-${c.kind}`} onClick={() => revealed && phase === 'main' && done()}>
      {phase === 'main' && revealed && <Confetti hearts={c.kind === 'bond'} />}
      <div className="cel-card" onClick={(e) => e.stopPropagation()}>
        {c.kind === 'stage' && (
          <div className="cel-visual">
            <Rays />
            {phase === 'main' && <div className="flash" />}
            <LuuImg
              className={`cel-luu ${phase === 'pre' ? 'charging' : 'grown'}`}
              style={{ ['--from' as string]: from / to, ['--to' as string]: 1 }}
              sprite={outfit ?? (phase === 'pre' ? 'sit' : 'ureshii')}
              alt=""
            />
          </div>
        )}
        {c.kind === 'bond' && (
          <div className="cel-visual">
            <Rays />
            <div className="hearts-burst">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} style={{ ['--a' as string]: `${i * 36}deg`, animationDelay: `${(i % 3) * 0.12}s` }}>
                  ♥
                </span>
              ))}
            </div>
            <LuuImg className="cel-luu grown" sprite={outfit ?? 'p_amae'} alt="" />
          </div>
        )}
        {c.kind === 'constellation' && lastDone && (
          <div className="cel-visual cel-night">
            <ConstellationSvg c={lastDone} size={220} />
          </div>
        )}
        {c.kind === 'cheer' && (
          <div className="cel-visual">
            <Rays />
            <div className="hearts-burst stars">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} style={{ ['--a' as string]: `${i * 30}deg`, animationDelay: `${(i % 4) * 0.1}s` }}>
                  ✦
                </span>
              ))}
            </div>
            <LuuImg className="cel-luu cheer-hop" sprite={outfit ?? 'p_genki'} alt="" />
          </div>
        )}
        {c.kind === 'eggs' && (
          <div className="cel-visual">
            <Rays />
            <div className="eggs-trio">
              {(s.eggOffer?.choices ?? []).map((col, i) => (
                <span key={col} style={{ animationDelay: `${i * 0.15}s` }}>
                  <Egg color={col} size={70} />
                </span>
              ))}
            </div>
          </div>
        )}
        {c.kind === 'hatch' && c.color && (
          <div className="cel-visual">
            <Rays />
            {phase === 'pre' ? (
              <Egg color={c.color} size={120} crack={crack} wobble className="hatching" />
            ) : (
              <>
                <div className="flash" />
                <div className="burst" />
                <LuuImg className="hatch-img grown" sprite="hatch_art" color={c.color} alt="" />
              </>
            )}
          </div>
        )}
        {c.kind === 'gift' && it && (
          <div className="cel-visual">
            <GiftReveal itemId={it.id} onOpen={() => setRevealed(true)} />
          </div>
        )}

        <div className={`cel-text ${phase === 'main' && revealed ? 'show' : ''}`}>
          <div className="cel-title">{c.title}</div>
          {c.sub && <div className="cel-sub">{c.sub}</div>}
          {it && revealed && (
            <div className="cel-item">
              <RarityBadge r={it.rarity} /> <b>{it.title}</b>
            </div>
          )}
          {c.kind === 'stage' && phase === 'main' && c.story && <div className="cel-story">{c.story}</div>}
          {c.kind === 'stage' && phase === 'main' && <div className="muted small">{c.note ? `✦ ${c.note}` : 'できることや表情が、少しずつ増えていくよ'}</div>}
        </div>
        <button className="btn primary block" disabled={!(phase === 'main' && revealed)} onClick={done} style={{ opacity: phase === 'main' && revealed ? 1 : 0 }}>
          {c.kind === 'gift' ? 'うけとる' : c.kind === 'eggs' ? 'たまごを見る' : c.kind === 'hatch' ? '名前をつける' : c.kind === 'cheer' ? 'ありがとう、' + s.pet.name : c.kind === 'constellation' ? '名前をつける' : 'やったね！'}
        </button>
      </div>
    </div>
  );
}

export function CelebrationHost() {
  const { celebrations, popCelebration } = useGame();
  const nav = useNav();
  const c = celebrations[0];
  if (!c) return null;
  // たまごがかえる演出は、冒険の結果を読み終えてから
  if ((c.kind === 'hatch' || c.kind === 'constellation') && (nav.sheetKind === 'adventure' || nav.sheetKind === 'morningMood')) return null;
  return <CelebrateView key={c.id} c={c} onDone={popCelebration} />;
}
