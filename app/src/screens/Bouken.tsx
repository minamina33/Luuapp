import { useGame } from '../game/store';
import { LuuImg } from '../components/LuuImg';
import { useNav } from '../nav';
import { Empty, fmtDate, Segmented } from '../components/ui';
import { spriteUrl } from '../assets';
import { AREA_INFO, AREA_RATES, EXCHANGE_STARS, PREMIUM_NAME } from '../config';
import { CATEGORY_NAMES, item, ITEMS } from '../data/items';
import { PageSwitch } from '../components/PageSwitch';
import { craft, craftOpen, currentSleep, seasonOf, skyOpen, stageOf } from '../game/logic';
import type { ItemDef } from '../types';
import { COLOR_MAP } from '../data/colors';
import { SEASON_NAMES } from '../data/items';
import { ACTIVE_RECIPES as RECIPES } from '../data/recipes';
import { sound } from '../sound';
import { ItemIcon, RarityBadge } from '../sheets/Game';
import type { Area } from '../types';

export default function Bouken() {
  const { s, update } = useGame();
  const nav = useNav();
  const view = nav.boukenView;
  const sleeping = currentSleep(s);
  const st = stageOf(s);
  const unclaimed = s.adventures.find((a) => !a.claimed);
  const AREA_ORDER = ['flowerForest', 'moonLake', 'starHill'];
  const myColors = new Set([s.pet, ...s.otherPets].map((p) => p.color));
  const season = seasonOf(Date.now() + s.debug.timeOffsetMs);
  const group = (i: ItemDef) => (i.series ? 20 : i.season ? 10 : i.area ? AREA_ORDER.indexOf(i.area) : 9);
  // 色シリーズはなかまにいる色だけ、季節限定はいまの季節か見つけたものだけ
  const zukan = ITEMS.filter(
    (i) => s.discovered[i.id] || (!i.giftOnly && !i.resting && (!i.series || myColors.has(i.series)) && (!i.season || i.season === season))
  ).sort((a, b) => group(a) - group(b));
  const mine = zukan.filter((i) => s.pet.found[i.id]).length;
  const found = zukan.filter((i) => s.discovered[i.id]).length;
  const owned = ITEMS.filter((i) => (s.inventory[i.id] ?? 0) > 0);
  const rates = AREA_RATES[st - 1];
  const canCraft = RECIPES.some((r) => (s.inventory[r.material] ?? 0) >= r.need && !(s.inventory[r.result] > 0));

  return (
    <div className="page">
      <PageSwitch cur="bouken" />
      <section className="tonight">
        <LuuImg sprite={sleeping ? 'g_sleep' : 'g_lookup'} alt="" />
        <div>
          {sleeping ? (
            <>
              <b>いま冒険中…</b>
              <div className="muted small">起きたら、おへやで「おはよう」を押してね。</div>
            </>
          ) : unclaimed ? (
            <>
              <b>{s.pet.name}が帰ってきたよ！</b>
              <button className="btn tiny primary" onClick={() => nav.open({ k: 'adventure', id: unclaimed.id })}>
                結果を見る
              </button>
            </>
          ) : (
            <>
              <b>今夜の冒険</b>
              <div className="muted small">
                おへやで「おやすみ」すると、{s.pet.name}が夢の中で冒険に出かけます。行き先は{s.pet.name}が決めるよ（1晩1回）。
              </div>
            </>
          )}
        </div>
      </section>

      {skyOpen(s) && <button className="sky-entry" onClick={() => nav.open({ k: 'sky' })}>
        <span className="se-ico">🌌</span>
        <span className="grow">
          <b>星座帳</b>
          <small>
            星 {s.sky.stars.filter((x) => x.y === new Date(Date.now() + s.debug.timeOffsetMs).getFullYear()).length}こ（今年）・タスクをした夜に星が灯るよ
          </small>
        </span>
        <span className="chev">›</span>
      </button>}

      <section>
        <h2>エリア</h2>
        <div className="areas">
          {(Object.keys(AREA_INFO) as Area[]).map((a) => {
            const info = AREA_INFO[a];
            const open = rates[a] !== undefined;
            return (
              <div key={a} className={`area ${open ? '' : 'locked'}`}>
                <span className="area-ico">{info.emoji}</span>
                <span className="grow">
                  <b>{info.name}</b>
                  <small className="muted">{info.desc}</small>
                </span>
                <small>{open ? `${Math.round((rates[a] ?? 0) * 100)}%` : a === 'premiumArea' ? PREMIUM_NAME : `Stage${info.stage}で解放`}</small>
              </div>
            );
          })}
        </div>
      </section>

      <Segmented
        value={view}
        onChange={nav.setBoukenView}
        options={[
          ['zukan', `図鑑 ${found}/${zukan.length}`],
          // 「つくる」は1週間たってから（最初は覚えることを少なく）
          ...(craftOpen(s) ? ([['craft', canCraft ? 'つくる●' : 'つくる']] as Array<['craft', string]>) : []),
          ['items', 'もちもの'],
          ['history', 'これまで'],
        ]}
      />

      {view === 'zukan' && (
        <div className="zukan-head muted small">
          🐾 {s.pet.name}がみつけたもの {mine}種 ／ みんなで {found}種
        </div>
      )}
      {view === 'zukan' && (
        <div className="zukan">
          {zukan.map((i) =>
            s.discovered[i.id] ? (
              <div key={i.id} className={`z-cell ${s.pet.found[i.id] ? 'mine' : ''}`} title={i.title}>
                <ItemIcon it={i} size="sm" />
                <small>{i.title}</small>
                <RarityBadge r={i.rarity} />
              </div>
            ) : (
              <div key={i.id} className="z-cell unknown">
                <span className="item-icon sm">
                  <span>？</span>
                </span>
                <small>{i.series ? `${COLOR_MAP[i.series].name}の子` : i.season ? `${SEASON_NAMES[i.season]}限定` : i.area ? AREA_INFO[i.area].name : 'おみせ'}</small>
              </div>
            )
          )}
        </div>
      )}

      {view === 'craft' && craftOpen(s) && (
        <div className="list craft-list">
          <p className="muted small">同じものをあつめると、新しいものがつくれるよ。つくると1個は手もとに残ります。</p>
          {RECIPES.map((r) => {
            const mat = item(r.material);
            const res = item(r.result);
            const known = !!s.discovered[r.material];
            const have = s.inventory[r.material] ?? 0;
            const made = (s.inventory[r.result] ?? 0) > 0 || !!s.discovered[r.result];
            const ready = have >= r.need && !(s.inventory[r.result] > 0);
            return (
              <div key={r.id} className={`craft-row ${ready ? 'ready' : ''} ${made ? 'made' : ''}`}>
                <span className={`item-icon sm ${known ? '' : 'unknown-ico'}`}>{known ? mat.icon : '？'}</span>
                <span className="grow">
                  <small className="muted">
                    {known ? mat.title : '？？？'} ×{r.need}
                  </small>
                  <div className="craft-res">
                    → <b>{made || ready ? res.title : known ? res.title : '？？？'}</b> {res.icon && (made || known) ? res.icon : ''}
                  </div>
                  {!made && (
                    <div className="progress">
                      <div style={{ width: `${Math.min(1, have / r.need) * 100}%` }} />
                    </div>
                  )}
                </span>
                {made && !ready ? (
                  <span className="owned-tag">つくった</span>
                ) : (
                  <button
                    className="btn tiny primary"
                    disabled={!ready}
                    onClick={() => {
                      sound.se('pop');
                      update((d, f) => void craft(d, f, r.id));
                    }}
                  >
                    {ready ? 'つくる' : `${Math.min(have, r.need)}/${r.need}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'items' && (
        <div className="list">
          {owned.length === 0 && <Empty>まだ何も持っていません</Empty>}
          {owned.map((i) => {
            const n = s.inventory[i.id];
            return (
              <div key={i.id} className="list-row">
                <ItemIcon it={i} size="sm" />
                <span className="grow">
                  <b>{i.title}</b> <small className="muted">×{n}</small>
                  <br />
                  <small className="muted">{CATEGORY_NAMES[i.category]}</small>
                </span>
                {n >= 2 && craftOpen(s) && (
                  <button className="btn tiny soft" onClick={() => nav.open({ k: 'exchange', itemId: i.id })}>
                    星に交換（{EXCHANGE_STARS[i.rarity]}/個）
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'history' && (
        <div className="list">
          {s.adventures.length === 0 && <Empty>まだ冒険していません</Empty>}
          {[...s.adventures].reverse().map((a) => (
            <button key={a.id} className="list-row" onClick={() => nav.open({ k: 'adventure', id: a.id })}>
              <span className="date-badge">{fmtDate(a.createdAt)}</span>
              <span className="grow">
                {AREA_INFO[a.area].name}
                <br />
                <small>
                  {item(a.itemId).icon} {item(a.itemId).title}
                </small>
              </span>
              <RarityBadge r={a.rarity} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
