import { useNav } from '../nav';

/** ぼうけんタブの中で「冒険・図鑑」と「おみせ」を切りかえる */
export function PageSwitch({ cur }: { cur: 'bouken' | 'shop' }) {
  const nav = useNav();
  return (
    <div className="page-switch">
      <button className={cur === 'bouken' ? 'on' : ''} onClick={() => nav.setTab('bouken')}>
        🗺️ ぼうけん・図鑑
      </button>
      <button className={cur === 'shop' ? 'on' : ''} onClick={() => nav.setTab('shop')}>
        🛍️ おみせ
      </button>
    </div>
  );
}
