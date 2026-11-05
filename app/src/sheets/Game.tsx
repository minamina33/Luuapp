import { useState } from 'react';
import { LuuImg } from '../components/LuuImg';
import { useGame } from '../game/store';
import { useNav } from '../nav';
import { Confirm, Sheet, Star, toLocalInput } from '../components/ui';
import { layoutFor, Luu, Room } from '../components/Room';
import { asset, spriteUrl } from '../assets';
import { Confetti, GiftReveal, Rays } from '../components/Celebrate';
import { sound } from '../sound';
import { AREA_INFO, BOND_THRESHOLDS, EXCHANGE_STARS, PERSONALITY_NAMES, PREMIUM_NAME, PREMIUM_PRICE_LABEL, RARITY_NAMES, SECRET_PITY, STAGE_SCALE, STAGE_DAYS } from '../config';
import { CATEGORY_NAMES, item, ITEMS, KIND_NAMES, SLOT_NAMES } from '../data/items';
import { recipeFor, RECIPES } from '../data/recipes';
import { SUPPORT_LINK } from '../data/content';
import {
  addBond,
  currentSleep,
  dayKey,
  deleteSleep,
  devAddDays,
  lightStar,
  goToSleep,
  wakeUp,
  exchangeDuplicate,
  craftOpen,
  fmtDur,
  nowMs,
  sleepHours,
  spendStars,
  stageOf,
  starsBalance,
  timeOfDay,
} from '../game/logic';
import type { ItemDef, Personality, Rarity, RoomSlot, SlotKind } from '../types';
import { PinPad } from '../components/Lock';
import { checkPin, hashPin } from '../secure';

/** 布団・カーテン・ラグの「色だけちがう」アイテムは、素材の絵に色を重ねて見せる */
const TINT_BASE: Partial<Record<string, string>> = { bed: 'it2_base_bed', curtain: 'it2_base_curtain', rug: 'it2_base_rug' };
export function ItemIcon({ it, size = 'md' }: { it: ItemDef; size?: 'sm' | 'md' | 'lg' }) {
  const base = !it.img && !it.sprite && it.slot ? TINT_BASE[it.slot] : undefined;
  if (base) {
    const url = `url(${asset(`${base}.webp`)})`;
    return (
      <span className={`item-icon ${size} r-${it.rarity}`}>
        <span className="tinted">
          <img src={asset(`${base}.webp`)} alt="" />
          {it.tint && <span className="tint-mask" style={{ background: it.tint, maskImage: url, WebkitMaskImage: url }} />}
        </span>
      </span>
    );
  }
  return (
    <span className={`item-icon ${size} r-${it.rarity}`}>
      {/* アクセは小物だけの絵、衣装はるうが着た絵 */}
      {it.img ? <img src={asset(`${it.img}.webp`)} alt="" style={{ filter: it.chestFilter }} /> : it.sprite ? <LuuImg sprite={it.sprite} alt="" /> : <span>{it.icon}</span>}
    </span>
  );
}
export const RarityBadge = ({ r }: { r: Rarity }) => <span className={`rarity r-${r}`}>{RARITY_NAMES[r]}</span>;

// ------------------------------------------------------------ 冒険の結果
export function AdventureSheet({ id }: { id: string }) {
  const { s, update } = useGame();
  const nav = useNav();
  const adv = s.adventures.find((a) => a.id === id);
  // はじめて見るときだけ「包みを開ける」演出をする
  const [revealed, setRevealed] = useState(!!adv?.claimed);
  if (!adv) return null;
  const it = item(adv.itemId);
  const count = s.inventory[adv.itemId] ?? 0;
  const dup = count >= 2 && !adv.exchanged && craftOpen(s);
  const claim = () =>
    update((d) => {
      const a = d.adventures.find((x) => x.id === id);
      if (a) a.claimed = true;
    });
  const close = () => {
    claim();
    nav.close();
  };
  const canPlace = it.category === 'furniture' || it.category === 'outfit';
  const big = it.rarity !== 'common';
  return (
    <Sheet title="冒険の結果" onClose={close} full>
      {revealed && !adv.claimed && <Confetti n={big ? 60 : 36} />}
      <div className="adv-result">
        {!revealed ? (
          <>
            <h2>{s.pet.name}がおかえり！</h2>
            <div className="adv-area">
              {AREA_INFO[adv.area].emoji} {AREA_INFO[adv.area].name}へ行ってきたよ
            </div>
            <div className="adv-bring">
              <LuuImg sprite={'walk'} alt="" />
              <GiftReveal itemId={adv.itemId} label="なにか持って帰ってきたみたい…（タップ）" onOpen={() => setRevealed(true)} />
            </div>
          </>
        ) : (
          <>
            <div className="adv-hero">
              <Rays rarity={it.rarity} />
              <LuuImg sprite={'ureshii'} alt="" />
            </div>
            <h2>{s.pet.name}がおかえり！</h2>
            <div className="adv-area">
              {AREA_INFO[adv.area].emoji} {AREA_INFO[adv.area].name}へ行ってきたよ
            </div>
            <p className="adv-story">{adv.storyText}</p>
            {adv.charmNotes && adv.charmNotes.length > 0 && (
              <div className="charm-notes">
                <div className="cn-title">おまもりのおかげ</div>
                {adv.charmNotes.map((n, i) => (
                  <p key={i}>{n}</p>
                ))}
              </div>
            )}
            <div className={`adv-item glow-${it.rarity}`}>
              <ItemIcon it={it} size="lg" />
              <div>
                <RarityBadge r={it.rarity} />
                <div className="adv-item-name">{it.title}</div>
                <div className="muted small">
                  {CATEGORY_NAMES[it.category]}
                  {count >= 2 ? `・${count}個目` : '・はじめて見つけた！'}
                  {count >= 2 && adv.firstForPet && <span className="first-pet">{s.pet.name}にとっては、はじめて！</span>}
                </div>
              </div>
            </div>
            <div className="adv-stars">
              <Star /> +{adv.stars}
            </div>
            {dup && (() => {
              const r = recipeFor(adv.itemId, s.inventory);
              const res = r ? item(r.result) : null;
              return (
                <div className="dup-box">
                  <div className="small">同じものを持っているよ（{count}個）。どうする？</div>
                  {r && res && (
                    <div className="craft-mini">
                      <span className="item-icon sm">{res.icon}</span>
                      <span className="grow">
                        <b>{res.title}</b>
                        <small className="muted"> まで {Math.min(count, r.need)}/{r.need}</small>
                        <div className="progress">
                          <div style={{ width: `${Math.min(1, count / r.need) * 100}%` }} />
                        </div>
                      </span>
                    </div>
                  )}
                  <div className="row gap">
                    <button
                      className="btn soft grow"
                      onClick={() => {
                        sound.se('pop');
                        update((d) => void (d.adventures.find((a) => a.id === id)!.exchanged = true));
                      }}
                    >
                      {r ? (count >= r.need ? 'あつめる（つくれるよ！）' : `あつめる（あと${r.need - count}個）`) : '保管する'}
                    </button>
                    <button
                      className="btn primary grow"
                      onClick={() =>
                        update((d, f) => {
                          exchangeDuplicate(d, f, adv.itemId, 1, `exch:${adv.id}`);
                          d.adventures.find((a) => a.id === id)!.exchanged = true;
                        })
                      }
                    >
                      星に交換（+{EXCHANGE_STARS[it.rarity]}）
                    </button>
                  </div>
                  {r && count >= r.need && (
                    <button
                      className="btn ghost block"
                      onClick={() => {
                        update((d) => {
                          const a = d.adventures.find((x) => x.id === id);
                          if (a) Object.assign(a, { claimed: true, exchanged: true });
                        });
                        nav.close();
                        nav.setBoukenView('craft');
                        nav.setTab('bouken');
                      }}
                    >
                      🛠 さっそくつくりに行く
                    </button>
                  )}
                </div>
              );
            })()}
            <div className="stack">
              {canPlace && (
                <button
                  className="btn soft block"
                  onClick={() => {
                    update((d) => {
                      if (it.category === 'outfit') d.pet.outfit = it.id;
                      else if (it.slot) d.pet.roomSlots[it.slot] = it.id;
                      const a = d.adventures.find((x) => x.id === id);
                      if (a) a.claimed = true;
                    });
                    sound.se('pop');
                    nav.close();
                    nav.setTab('home');
                  }}
                >
                  {it.category === 'outfit' ? 'さっそく着てみる' : '部屋に飾る'}
                </button>
              )}
              <button
                className="btn ghost block"
                onClick={() => {
                  claim();
                  nav.close();
                  nav.setBoukenView('zukan');
                  nav.setTab('bouken');
                }}
              >
                図鑑を見る
              </button>
              <button className="btn primary block" onClick={close}>
                とじる
              </button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------ 着せ替え
export function WardrobeSheet() {
  const { s, update } = useGame();
  const nav = useNav();
  const [sel, setSel] = useState<string | null>(s.pet.outfit);
  const owned = ITEMS.filter((i) => i.category === 'outfit' && (s.inventory[i.id] ?? 0) > 0);
  const st = stageOf(s);
  const tod = timeOfDay(nowMs(s));
  return (
    <Sheet
      title="きせかえ"
      onClose={nav.close}
      full
      footer={
        <button
          className="btn primary block"
          onClick={() => {
            update((d) => void (d.pet.outfit = sel));
            nav.close();
          }}
        >
          これにする
        </button>
      }
    >
      <div className="preview-room">
        <Room tod={tod === 'night' ? 'night' : 'day'} slots={s.pet.roomSlots}>
          <Luu pose="sit" outfitSprite={sel ? item(sel).sprite : null} scale={STAGE_SCALE[st - 1] * layoutFor(tod).luu.scale} x={layoutFor(tod).luu.x} bottom={layoutFor(tod).luu.bottom} anim="idle" night={tod === 'night'} />
        </Room>
      </div>
      <div className="grid4">
        <button className={`pick ${sel === null ? 'on' : ''}`} onClick={() => setSel(null)}>
          <span className="item-icon md">
            <LuuImg sprite={'sit'} alt="" />
          </span>
          <small>いつもの</small>
        </button>
        {owned.map((o) => (
          <button key={o.id} className={`pick ${sel === o.id ? 'on' : ''}`} onClick={() => setSel(o.id)}>
            <ItemIcon it={o} />
            <small>{o.title}</small>
          </button>
        ))}
      </div>
      {owned.length === 0 && <p className="muted small center">衣装は「おみせ」や夜の冒険で手に入るよ。</p>}
      <p className="muted tiny center">衣装とアクセは、どちらか1つを選んで着られるよ。</p>
    </Sheet>
  );
}

// ------------------------------------------------------------ 模様替え
export function RoomEditSheet() {
  const { s, update } = useGame();
  const nav = useNav();
  const [slot, setSlot] = useState<RoomSlot>('bed');
  const [draft, setDraft] = useState({ ...s.pet.roomSlots });
  const kind: SlotKind = slot === 'wall2' ? 'wall' : slot === 'top2' ? 'top' : slot === 'floor2' ? 'floor' : slot;
  const owned = ITEMS.filter((i) => (i.category === 'furniture' || i.category === 'toy') && i.slot === kind && (s.inventory[i.id] ?? 0) > 0);
  const st = stageOf(s);
  const tod = timeOfDay(nowMs(s));
  const canEmpty = !['bed', 'rug', 'curtain'].includes(slot);
  // 置き場所は、その場所に置けるものを持ったら増える（最初はベッド・ラグ・カーテン・壁）
  const ownN = (k: SlotKind) => ITEMS.filter((i) => (i.category === 'furniture' || i.category === 'toy') && i.slot === k && (s.inventory[i.id] ?? 0) > 0).length;
  const slotVisible = (k: RoomSlot) => {
    if (['bed', 'rug', 'curtain', 'wall'].includes(k) || draft[k]) return true;
    if (k === 'wall2') return ownN('wall') >= 2;
    if (k === 'floor2') return ownN('floor') >= 2;
    if (k === 'top') return !!draft.chest;
    return ownN(k as SlotKind) > 0;
  };
  // 壁は左右2か所。同じかざりを両方には置けないので、反対側から外す
  const choose = (id: string | null) => {
    // タンスの上は2つまで：選ぶと空いている方に置き、もう一度押すと外す。3つ目は古い方と入れかえ
    if (slot === 'top') {
      if (id === null) return setDraft({ ...draft, top: null, top2: null });
      if (draft.top === id) return setDraft({ ...draft, top: draft.top2, top2: null });
      if (draft.top2 === id) return setDraft({ ...draft, top2: null });
      if (!draft.top) return setDraft({ ...draft, top: id });
      if (!draft.top2) return setDraft({ ...draft, top2: id });
      return setDraft({ ...draft, top: draft.top2, top2: id });
    }
    const other: RoomSlot | null = slot === 'wall' ? 'wall2' : slot === 'wall2' ? 'wall' : slot === 'floor' ? 'floor2' : slot === 'floor2' ? 'floor' : null;
    const next = { ...draft, [slot]: id };
    if (other && id && next[other] === id) next[other] = null;
    setDraft(next);
  };
  return (
    <Sheet
      title="もようがえ"
      onClose={nav.close}
      full
      footer={
        <button
          className="btn primary block"
          onClick={() => {
            update((d) => void (d.pet.roomSlots = draft));
            nav.close();
          }}
        >
          この部屋にする
        </button>
      }
    >
      <div className="preview-room">
        <Room tod={tod === 'night' ? 'night' : 'day'} slots={draft}>
          <Luu pose="sit" outfitSprite={s.pet.outfit ? item(s.pet.outfit).sprite : null} scale={STAGE_SCALE[st - 1] * layoutFor(tod).luu.scale} x={layoutFor(tod).luu.x} bottom={layoutFor(tod).luu.bottom} anim="none" night={tod === 'night'} />
        </Room>
      </div>
      <div className="slot-tabs">
        {(['bed', 'plush', 'rug', 'curtain', 'wall', 'wall2', 'floor', 'floor2', 'chest', 'top'] as RoomSlot[]).filter((k) => slotVisible(k)).map((k) => (
          <button key={k} className={slot === k ? 'on' : ''} onClick={() => setSlot(k)}>
            {SLOT_NAMES[k]}
          </button>
        ))}
      </div>
      <div className="grid4">
        {canEmpty && (
          <button className={`pick ${draft[slot] === null && (slot !== 'top' || draft.top2 === null) ? 'on' : ''}`} onClick={() => choose(null)}>
            <span className="item-icon md">
              <span>－</span>
            </span>
            <small>なし</small>
          </button>
        )}
        {owned.map((o) => {
          const on = slot === 'top' ? draft.top === o.id || draft.top2 === o.id : draft[slot] === o.id;
          return (
            <button key={o.id} className={`pick ${on ? 'on' : ''}`} onClick={() => choose(o.id)}>
              <ItemIcon it={o} />
              <small>{o.title}</small>
            </button>
          );
        })}
      </div>
      {slot === 'top' && draft.chest && <p className="muted small center">2つまで置けるよ。もう一度押すと外せます。</p>}
      {slot === 'top' && !draft.chest && <p className="small center top-hint">先に「タンス」を置くと、その上に植物や小物を飾れるよ（タンスは「おみせ」で手に入るよ）。</p>}
      {owned.length <= 1 && <p className="muted small center">家具は「おみせ」や夜の冒険で少しずつ増えていくよ。</p>}
      
    </Sheet>
  );
}

// ------------------------------------------------------------ 購入
export function BuySheet({ itemId }: { itemId: string }) {
  const { s, update } = useGame();
  const nav = useNav();
  const it = item(itemId);
  const bal = starsBalance(s);
  const owned = (s.inventory[itemId] ?? 0) > 0;
  const price = it.shopPrice ?? 0;
  const premium = !!it.premium;
  const premiumOk = premium && s.player?.premiumDemo;
  const short = price - bal;
  const [bought, setBought] = useState(false);

  function buy() {
    update((d, f) => {
      if (!premium) spendStars(d, `buy:${itemId}`, price, itemId);
      d.inventory[itemId] = (d.inventory[itemId] ?? 0) + 1;
      if (!d.discovered[itemId]) d.discovered[itemId] = new Date().toISOString();
      f.messages.push(`「${it.title}」を手に入れた`);
    });
    sound.se('coin');
    setBought(true);
  }
  const equip = () => {
    update((d) => {
      if (it.category === 'outfit') d.pet.outfit = it.id;
      else if (it.slot) d.pet.roomSlots[it.slot] = it.id;
    });
    nav.close();
    nav.setTab('home');
  };
  return (
    <Sheet title={premium ? `${PREMIUM_NAME}の特典` : 'おみせ'} onClose={nav.close}>
      <div className="buy">
        <ItemIcon it={it} size="lg" />
        <div className="buy-name">{it.title}</div>
        <div className="muted small">
          {CATEGORY_NAMES[it.category]}
          {it.slot ? `（${KIND_NAMES[it.slot]}）` : ''}
          {it.desc ? `・${it.desc}` : ''}
        </div>
        {bought || (owned && it.category !== 'collectible') ? (
          <>
            <p>{bought ? '手に入れたよ！' : 'もう持っているよ'}</p>
            {(it.category === 'outfit' || it.category === 'furniture') && (
              <button className="btn primary block" onClick={equip}>
                {it.category === 'outfit' ? '着てみる' : '部屋に置く'}
              </button>
            )}
            {it.category === 'toy' && <p className="muted small">おへやで{s.pet.name}をタップ →「あそぶ」から使えるよ。</p>}
            <button className="btn ghost block" onClick={nav.close}>
              とじる
            </button>
          </>
        ) : premium ? (
          premiumOk ? (
            <button className="btn primary block" onClick={buy}>
              受け取る（{PREMIUM_NAME}・デモ）
            </button>
          ) : (
            <div className="premium-box">
              <b>{PREMIUM_NAME}</b>（{PREMIUM_PRICE_LABEL}）の会員向けアイテムです。
              <br />
              <span className="muted small">試作版では決済はありません。設定の「デモ用有料会員モード」をオンにすると確認できます。</span>
            </div>
          )
        ) : (
          <>
            <div className="price-line">
              <Star n={price} />
              <span className="muted small">いまの星：{bal}</span>
            </div>
            <button className="btn primary block" disabled={short > 0} onClick={buy}>
              {short > 0 ? `星があと${short}たりないよ` : '星で交換する'}
            </button>
            <button className="btn ghost block" onClick={nav.close}>
              やめる
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------ 重複交換
export function ExchangeSheet({ itemId }: { itemId: string }) {
  const { s, update } = useGame();
  const nav = useNav();
  const it = item(itemId);
  const have = s.inventory[itemId] ?? 0;
  const max = Math.max(0, have - 1);
  const [n, setN] = useState(Math.min(1, max));
  return (
    <Sheet title="星に交換" onClose={nav.close}>
      <div className="buy">
        <ItemIcon it={it} size="lg" />
        <div className="buy-name">
          {it.title} ×{have}
        </div>
        <p className="muted small">1個は手元に残ります。図鑑の記録は消えません。</p>
        <div className="stepper">
          <button onClick={() => setN(Math.max(1, n - 1))}>－</button>
          <b>{n}</b>
          <button onClick={() => setN(Math.min(max, n + 1))}>＋</button>
        </div>
        <button
          className="btn primary block"
          disabled={n < 1}
          onClick={() => {
            update((d, f) => void exchangeDuplicate(d, f, itemId, n));
            nav.close();
          }}
        >
          {n}個を交換（+{EXCHANGE_STARS[it.rarity] * n}★）
        </button>
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------ 睡眠の編集
export function SleepEditSheet({ id }: { id: string }) {
  const { s, update } = useGame();
  const nav = useNav();
  const sess = s.sleeps.find((x) => x.id === id);
  const [start, setStart] = useState(sess ? toLocalInput(sess.startedAt) : '');
  const [end, setEnd] = useState(sess?.endedAt ? toLocalInput(sess.endedAt) : '');
  const [askDelete, setAskDelete] = useState(false);
  if (!sess) return null;
  const h = end ? (new Date(end).getTime() - new Date(start).getTime()) / 3600_000 : null;
  const bad = h !== null && h < 0;
  return (
    <Sheet title="睡眠の記録を直す" onClose={nav.close}>
      <p className="muted small">押し忘れたときは、ここで時刻を直せます。まちがえて押した記録は、いちばん下から消せます。冒険の結果や星は変わりません。</p>
      <div className="field">
        <div className="label">おやすみ</div>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
      <div className="field">
        <div className="label">おはよう</div>
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} disabled={!sess.endedAt} />
        {!sess.endedAt && <div className="muted tiny">まだ眠っている記録です。おへやの「おはよう」で終わります。</div>}
      </div>
      <p>
        ボタン間の経過時間（睡眠の目安）：<b>{bad ? '時刻の順番を確認してね' : fmtDur(h)}</b>
      </p>
      <button
        className="btn primary block"
        disabled={bad || !start}
        onClick={() => {
          update((d) => {
            const x = d.sleeps.find((y) => y.id === id)!;
            x.startedAt = new Date(start).toISOString();
            if (x.endedAt && end) x.endedAt = new Date(end).toISOString();
            x.edited = true;
          });
          nav.close();
        }}
      >
        保存する
      </button>
      <button className="btn ghost block danger-text" onClick={() => setAskDelete(true)}>
        この記録を消す
      </button>
      {askDelete && (
        <Confirm
          text={
            <>
              この睡眠の記録を消しますか？
              <br />
              <span className="muted small">まちがえて押したときに使ってね。冒険のおみやげや星はそのまま残ります。</span>
            </>
          }
          okLabel="消す"
          danger
          cancel={() => setAskDelete(false)}
          ok={() => {
            update((d) => void deleteSleep(d, id));
            nav.close();
          }}
        />
      )}
    </Sheet>
  );
}

// ------------------------------------------------------------ 設定・開発者メニュー
export function SettingsSheet() {
  const { s, update, reset, toast, storageOk } = useGame();
  const nav = useNav();
  const [nick, setNick] = useState(s.player?.nickname ?? '');
  const [name, setName] = useState(s.pet.name);
  const [taps, setTaps] = useState(0);
  const [wipe, setWipe] = useState(false);
  const st = stageOf(s);
  return (
    <Sheet title="せってい" onClose={nav.close} full>
      <div className="field">
        <div className="label">あなたのニックネーム</div>
        <input value={nick} maxLength={12} onChange={(e) => setNick(e.target.value)} />
      </div>
      <div className="field">
        <div className="label">るうの名前</div>
        <input value={name} maxLength={10} onChange={(e) => setName(e.target.value)} />
      </div>
      <button
        className="btn soft block"
        onClick={() => {
          update((d) => {
            if (d.player) d.player.nickname = nick.trim() || d.player.nickname;
            d.pet.name = name.trim() || d.pet.name;
          });
          toast('保存したよ');
        }}
      >
        名前を保存
      </button>

      <button className="btn primary block" onClick={() => nav.open({ k: 'test' })}>
        🧪 テストの記録・感想を送る
      </button>

      <LockCard />

      <button className="btn soft block" onClick={() => nav.open({ k: 'help' })}>
        📞 つらいときの相談先
      </button>

      <div className="card">
        <b>サウンド</b>
        <div className="row between toggle-row">
          <span>効果音</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={s.settings.se}
              onChange={(e) => {
                const v = e.target.checked;
                update((d) => void (d.settings = { ...d.settings, se: v, muted: false }));
                if (v) setTimeout(() => sound.se('chime'), 50);
              }}
            />
            <span />
          </label>
        </div>
        <div className="row between toggle-row">
          <span>
            BGM（オルゴール）
            <br />
            <small className="muted">試作用に自動生成した仮の曲です</small>
          </span>
          <label className="switch">
            <input type="checkbox" checked={s.settings.bgm} onChange={(e) => update((d) => void (d.settings = { ...d.settings, bgm: e.target.checked, muted: false }))} />
            <span />
          </label>
        </div>
        <div className="muted tiny">右上のスピーカーボタンで、すべての音をまとめてオン・オフできます。</div>
      </div>

      <div className="card">
        <div className="row between">
          <div>
            <b>演出をひかえめにする</b>
            <div className="muted tiny">紙吹雪・フラッシュ・ゆれる動きを減らします。光や動きがつらいときに。</div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={s.settings.reduceMotion} onChange={(e) => update((d) => void (d.settings = { ...d.settings, reduceMotion: e.target.checked }))} />
            <span />
          </label>
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <div>
            <b>デモ用有料会員モード</b>
            <div className="muted tiny">
              {PREMIUM_NAME}（{PREMIUM_PRICE_LABEL}）の表示確認用。実際の決済はありません。
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" checked={!!s.player?.premiumDemo} onChange={(e) => update((d) => void (d.player && (d.player.premiumDemo = e.target.checked)))} />
            <span />
          </label>
        </div>
      </div>

      <div className="card">
        <b>データについて</b>
        <p className="muted small">気分・日記・睡眠などの記録は、この端末のブラウザの中だけに保存されます。外部への送信はしていません。{!storageOk && '（いまの環境では保存できていません。ページを閉じると消えます）'}</p>
        <button className="btn soft block" onClick={() => nav.open({ k: 'backup' })}>
          データの引き継ぎ（コピー／貼りつけ）
        </button>
        <button className="btn ghost block danger-text" onClick={() => setWipe(true)}>
          すべてのデータを消去
        </button>
      </div>

      <div className="card">
        <b>このアプリについて</b>
        <p className="muted small">セルフケアの習慣づくりを手助けするアプリです。医療・診断・治療を目的としたものではありません。つらい状態が続くときは、身近な人や専門の窓口に相談してください。</p>
        <a className="small" href={SUPPORT_LINK.url} target="_blank" rel="noreferrer">
          {SUPPORT_LINK.label}
        </a>
      </div>

      <button
        className="version-btn"
        onClick={() => {
          const n = taps + 1;
          setTaps(n);
          if (n >= 5 && !s.debug.enabled) {
            update((d) => void (d.debug.enabled = true));
            toast('開発者メニューを表示しました');
            setTimeout(() => {
              // シートの中だけをスクロール（scrollIntoView は外枠まで動かしてしまうため使わない）
              const el = document.querySelector<HTMLElement>('.card.dev');
              const box = el?.closest<HTMLElement>('.sheet-body');
              if (el && box) box.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
            }, 100);
          }
        }}
      >
        るう 試作版 v0.1{!s.debug.enabled && taps >= 2 && taps < 5 ? `（あと${5 - taps}回）` : ''}
      </button>

      {s.debug.enabled && (
        <div className="card dev">
          <b>🛠 開発者メニュー（一般ユーザーには非表示）</b>
          <div className="muted tiny">
            Stage {st}（ふれあい{s.pet.activeDays.length}日）／ 親密度 {s.pet.totalBondPoints}pt ／ 星 {starsBalance(s)} ／ シークレット天井まで {Math.max(0, SECRET_PITY - s.pity)}回 ／ 時刻ずらし {Math.round(s.debug.timeOffsetMs / 3600_000)}時間
          </div>
          <div className="dev-grid">
            <button onClick={() => update((d) => void d.ledger.push({ id: 'dev' + Math.random(), at: new Date().toISOString(), day: 'dev', action: 'dev', starsDelta: 100 }))}>★ +100</button>
            <button onClick={() => update((d, f) => devAddDays(d, f, 1))}>ふれあい日数 +1</button>
            {[2, 3, 4].map((t) => (
              <button key={t} disabled={st >= t} onClick={() => update((d, f) => devAddDays(d, f, Math.max(0, STAGE_DAYS[t - 1] - d.pet.activeDays.length)))}>
                Stage{t}へ
              </button>
            ))}
            <button onClick={() => update((d, f) => void addBond(d, f, 'debug', 50, false))}>親密度 +50</button>
            <button onClick={() => update((d, f) => void addBond(d, f, 'debug', Math.max(0, BOND_THRESHOLDS[4] - d.pet.totalBondPoints), false))}>親密度 Lv5へ</button>
            {(Object.keys(PERSONALITY_NAMES) as Personality[]).map((p) => (
              <button key={p} onClick={() => update((d) => void (d.pet.personalityScores[p] += 10))}>
                {PERSONALITY_NAMES[p]} +10
              </button>
            ))}
            <button onClick={() => update((d) => void (d.debug.timeOffsetMs += 8 * 3600_000))}>時刻を +8時間（翌朝を模擬）</button>
            <button onClick={() => update((d) => void (d.debug.timeOffsetMs += 24 * 3600_000))}>時刻を +1日</button>
            <button onClick={() => update((d) => void (d.debug.timeOffsetMs = 0))}>時刻を現在に戻す</button>
            <button onClick={() => update((d) => void (d.pity = SECRET_PITY))}>次の冒険をシークレット確定に</button>
            <button
              className="dev-hl"
              onClick={() => {
                // 1日進めて「おやすみ→おはよう」をまとめて行い、結果画面を開く
                let advId: string | null = null;
                update((d, f) => {
                  // 今の時刻でおやすみ（今日のおまもりを持っていく）→ 翌日の朝におはよう
                  if (!currentSleep(d)) goToSleep(d);
                  d.debug.timeOffsetMs += 24 * 3600_000;
                  advId = wakeUp(d, f)?.id ?? null;
                });
                if (advId) nav.open({ k: 'adventure', id: advId });
              }}
            >
              🌙 冒険を1回すませる（翌日へ）
            </button>
            <button
              className="dev-hl"
              onClick={() => {
                update((d) => {
                  const now = new Date().toISOString();
                  RECIPES.forEach((r) => {
                    d.inventory[r.material] = (d.inventory[r.material] ?? 0) + 1;
                    if (!d.discovered[r.material]) d.discovered[r.material] = now;
                  });
                });
                toast('工作の素材を1個ずつ追加しました');
              }}
            >
              🛠 工作の素材を全部 +1
            </button>
            <button
              className="dev-hl"
              onClick={() =>
                update((d, f) => {
                  // 今日の日付からさかのぼって、まだ灯っていない日に星を1つ
                  for (let i = 0; i < 400; i++) {
                    const day = dayKey(nowMs(d) - i * 86400_000);
                    if (!d.sky.stars.some((x) => x.d === day)) {
                      lightStar(d, f, day);
                      break;
                    }
                  }
                })
              }
            >
              ⭐ 星を1つ灯す
            </button>
            <button
              className="dev-hl"
              onClick={() =>
                update((d, f) => {
                  const y = new Date(nowMs(d)).getFullYear() - 1;
                  for (let i = 0; i < 40; i++) lightStar(d, f, `${y}-${String(1 + Math.floor(i / 4)).padStart(2, '0')}-${String(1 + (i % 4) * 7).padStart(2, '0')}`);
                  f.events = [];
                })
              }
            >
              🌌 去年の星空をつくる（デモ）
            </button>
          </div>
          <div className="field">
            <div className="label">次の冒険のレア度を固定</div>
            <select value={s.debug.forceRarity ?? ''} onChange={(e) => update((d) => void (d.debug.forceRarity = (e.target.value || null) as Rarity | null))}>
              <option value="">固定しない（通常の確率）</option>
              {(Object.keys(RARITY_NAMES) as Rarity[]).map((r) => (
                <option key={r} value={r}>
                  {RARITY_NAMES[r]}
                </option>
              ))}
            </select>
          </div>
          <button className="btn ghost block" onClick={() => update((d) => void (d.debug.enabled = false))}>
            開発者メニューを隠す
          </button>
        </div>
      )}

      {wipe && (
        <Confirm
          text="すべての記録・るうの成長・アイテムを消去して、最初からやり直しますか？（元に戻せません）"
          okLabel="消去する"
          danger
          cancel={() => setWipe(false)}
          ok={() => {
            setWipe(false);
            nav.close();
            reset();
          }}
        />
      )}
    </Sheet>
  );
}

export { sleepHours };

// ------------------------------------------------------------ アプリのロック
function LockCard() {
  const { s, update, toast } = useGame();
  const [step, setStep] = useState<'idle' | 'new' | 'again' | 'off'>('idle');
  const [first, setFirst] = useState('');
  const [err, setErr] = useState('');
  const on = !!s.settings.lockHash;
  return (
    <div className="card">
      <b>アプリのロック</b>
      <p className="muted small">開くたびに4けたの番号を聞きます。家族や友だちに日記をのぞかれたくないときに。</p>
      {step === 'idle' && (
        <button className="btn soft block" onClick={() => (setErr(''), setStep(on ? 'off' : 'new'))}>
          {on ? 'ロックをはずす' : 'ロックをかける'}
        </button>
      )}
      {step === 'new' && <PinPad title="新しい番号を決めてね" onDone={(p) => (setFirst(p), setStep('again'))} />}
      {step === 'again' && (
        <PinPad
          title="もう一度入れてね"
          error={err}
          onDone={async (p) => {
            if (p !== first) return (setErr('さっきの番号とちがうみたい。はじめからやり直してね'), setStep('new'));
            const h = await hashPin(p);
            update((d) => void (d.settings = { ...d.settings, lockHash: h }));
            setStep('idle');
            toast('ロックをかけました。番号をわすれないでね');
          }}
        />
      )}
      {step === 'off' && (
        <PinPad
          title="いまの番号を入れてね"
          error={err}
          onDone={async (p) => {
            if (!(await checkPin(p, s.settings.lockHash!))) return setErr('番号がちがうみたい');
            update((d) => void (d.settings = { ...d.settings, lockHash: undefined }));
            setStep('idle');
            toast('ロックをはずしました');
          }}
        />
      )}
      {step !== 'idle' && (
        <button className="btn ghost block" onClick={() => setStep('idle')}>
          やめる
        </button>
      )}
    </div>
  );
}
