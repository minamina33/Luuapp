import { useState } from 'react';
import { PageSwitch } from '../components/PageSwitch';
import { useGame } from '../game/store';
import { useNav } from '../nav';
import { Segmented, Star } from '../components/ui';
import { ITEMS, KIND_NAMES } from '../data/items';
import { PREMIUM_NAME } from '../config';
import { starsBalance } from '../game/logic';
import { ItemIcon } from '../sheets/Game';
import type { ItemCategory } from '../types';

export default function Shop() {
  const { s } = useGame();
  const nav = useNav();
  const [cat, setCat] = useState<ItemCategory>('furniture');
  const bal = starsBalance(s);
  const list = ITEMS.filter((i) => i.category === cat && !i.resting && (i.shopPrice !== undefined || i.premium));
  return (
    <div className="page">
      <PageSwitch cur="shop" />
      <div className="row between">
        <span className="muted small">もっている星</span>
        <Star n={bal} />
      </div>
      <p className="muted small">星はセルフケアや夜の冒険で手に入るよ。お金で星を買う仕組みはありません。</p>
      <Segmented
        value={cat}
        onChange={setCat}
        options={[
          ['furniture', '家具'],
          ['outfit', '衣装'],
          ['toy', 'おもちゃ'],
        ]}
      />
      <div className="shop-grid">
        {list.map((it) => {
          const owned = (s.inventory[it.id] ?? 0) > 0;
          const afford = bal >= (it.shopPrice ?? 0);
          return (
            <button key={it.id} className={`shop-card ${owned ? 'owned' : ''}`} onClick={() => nav.open({ k: 'buy', itemId: it.id })}>
              {it.premium && <span className="badge plus">{PREMIUM_NAME}</span>}
              <ItemIcon it={it} />
              <b>{it.title}</b>
              {it.slot && <small className="muted">{KIND_NAMES[it.slot]}</small>}
              <span className="price">
                {owned ? <span className="owned-tag">もってる</span> : it.premium ? <small>会員特典</small> : <span className={afford ? '' : 'muted'}>★ {it.shopPrice}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
