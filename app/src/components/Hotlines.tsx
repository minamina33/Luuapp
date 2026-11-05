import { HOTLINES, SUPPORT_LINK } from '../data/content';

/** 相談先の一覧（相談先の画面とロック画面の両方で使う） */
export function Hotlines() {
  return (
    <>
      <p className="small">
        いますぐ誰かと話したいときは、ここに電話できます。名前を言わなくても大丈夫です。
      </p>
      <div className="hotlines">
        {HOTLINES.map((h) => (
          <a key={h.tel} className="hotline" href={`tel:${h.tel.replace(/-/g, '')}`}>
            <span className="hl-name">{h.name}</span>
            <span className="hl-tel">📞 {h.tel}</span>
            <span className="muted tiny">{h.note}</span>
          </a>
        ))}
      </div>
      <div className="card">
        <b>電話がにがてなときは</b>
        <p className="small">LINEやチャットで相談できる窓口もあります。</p>
        <a href={SUPPORT_LINK.url} target="_blank" rel="noreferrer">
          {SUPPORT_LINK.label}
        </a>
      </div>
      <p className="small">身近な人に「ちょっと話を聞いて」と送るだけでも大丈夫。命の危険を感じるときは、迷わず 119 に電話してください。</p>
    </>
  );
}
