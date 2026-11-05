import { useEffect, useState } from 'react';
import { GameProvider, useGame } from './game/store';
import { NavCtx, useNav, type SheetState, type Tab } from './nav';
import { Sheet } from './components/ui';
import { LockScreen } from './components/Lock';
import { Toasts } from './components/ui';
import { LuuImg } from './components/LuuImg';
import { preload } from './recolor';
import { CelebrationHost } from './components/Celebrate';
import { sound } from './sound';
import { asset } from './assets';
import { BOND_NAMES, STAGE_NAMES } from './config';
import { bondLevel, stageOf, starsBalance } from './game/logic';
import Home from './screens/Home';
import Kokoro from './screens/Kokoro';
import Kiroku from './screens/Kiroku';
import Shop from './screens/Shop';
import Bouken from './screens/Bouken';
import Onboarding from './screens/Onboarding';
import { MorningMoodSheet, BreathingSheet, JournalSheet, MoodSheet, RecsSheet, RestSheet, SleepInfoSheet, TasksSheet, WalkSheet, OutingBackSheet, WakeAskSheet, SoloNightSheet, HelpSheet } from './sheets/Care';
import { CharmsSheet, EggsSheet, NewPetSheet, PetsSheet, SkySheet } from './sheets/Pets';
import { LetterSheet, BackupSheet, TestSheet } from './sheets/Letter';
import { AdventureSheet, BuySheet, ExchangeSheet, RoomEditSheet, SettingsSheet, SleepEditSheet, WardrobeSheet } from './sheets/Game';

// タブは3つだけ。こころ（セルフケア）はおへやの「今日のケア」から、おみせはぼうけんの中から開く
const TABS: Array<[Tab, string, string]> = [
  ['home', 'おへや', '🏠'],
  ['kiroku', 'きろく', '📖'],
  ['bouken', 'ぼうけん', '🗺️'],
];

function Header({ onSettings, onPets }: { onSettings: () => void; onPets: () => void }) {
  const { s, update, toast } = useGame();
  const silent = s.settings.muted || (!s.settings.se && !s.settings.bgm);
  const st = stageOf(s);
  const lv = bondLevel(s.pet.totalBondPoints);
  return (
    <header className="hdr">
      <button className="hdr-pet" onClick={onPets} aria-label="なかまたち">
        <LuuImg sprite="avatar" />
        <div>
          <div className="hdr-name">
            {s.pet.name} <span className="leaf">🌱</span>
          </div>
          <div className="hdr-sub">
            <span className="mini-chip">{STAGE_NAMES[st - 1]}</span>
            <span className="mini-chip pink" title={BOND_NAMES[lv - 1]}>
              {'♥'.repeat(lv)}
              <span className="faint">{'♥'.repeat(5 - lv)}</span>
            </span>
          </div>
        </div>
      </button>
      <div className="hdr-right">
        <span className="star-pill">
          <span className="star-ico">★</span>
          <b>{starsBalance(s)}</b>
        </span>
        <button
          className="icon-btn"
          aria-label={silent ? '音をオンにする' : '音をオフにする'}
          onClick={() => {
            if (silent) {
              update((d) => void (d.settings = { ...d.settings, se: true, muted: false }));
              toast('音をオンにしました');
              setTimeout(() => sound.se('chime'), 50);
            } else {
              update((d) => void (d.settings = { ...d.settings, muted: true }));
              toast('音をオフにしました');
            }
          }}
        >
          {silent ? '🔇' : '🔊'}
        </button>
        <button className="icon-btn gear" onClick={onSettings} aria-label="せってい">
          ⚙︎
        </button>
      </div>
    </header>
  );
}

function CareSheet() {
  const nav = useNav();
  return (
    <Sheet title="今日のケア" onClose={nav.close} full>
      <Kokoro embedded />
    </Sheet>
  );
}

function SheetHost({ sheet }: { sheet: SheetState | null }) {
  if (!sheet) return null;
  switch (sheet.k) {
    case 'mood':
      return <MoodSheet value={sheet.value} />;
    case 'moodEdit':
      return <MoodSheet editId={sheet.id} />;
    case 'recs':
      return <RecsSheet recs={sheet.recs} reply={sheet.reply} low={sheet.low} />;
    case 'breathing':
      return <BreathingSheet minutes={sheet.minutes} />;
    case 'journal':
      return <JournalSheet id={sheet.id} prompt={sheet.prompt} />;
    case 'tasks':
      return <TasksSheet />;
    case 'walk':
      return <WalkSheet />;
    case 'rest':
      return <RestSheet />;
    case 'sleepInfo':
      return <SleepInfoSheet />;
    case 'adventure':
      return <AdventureSheet id={sheet.id} />;
    case 'wardrobe':
      return <WardrobeSheet />;
    case 'room':
      return <RoomEditSheet />;
    case 'buy':
      return <BuySheet itemId={sheet.itemId} />;
    case 'exchange':
      return <ExchangeSheet itemId={sheet.itemId} />;
    case 'sleepEdit':
      return <SleepEditSheet id={sheet.id} />;
    case 'settings':
      return <SettingsSheet />;
    case 'eggs':
      return <EggsSheet />;
    case 'newPet':
      return <NewPetSheet id={sheet.id} />;
    case 'pets':
      return <PetsSheet />;
    case 'letter':
      return <LetterSheet month={sheet.month} />;
    case 'backup':
      return <BackupSheet />;
    case 'charms':
      return <CharmsSheet />;
    case 'sky':
      return <SkySheet />;
    case 'outingBack':
      return <OutingBackSheet kind={sheet.kind} min={sheet.min} auto={sheet.auto} compId={sheet.compId} />;
    case 'help':
      return <HelpSheet crisis={sheet.crisis} />;
    case 'care':
      return <CareSheet />;
    case 'wakeAsk':
      return <WakeAskSheet sessId={sheet.sessId} advId={sheet.advId} auto={sheet.auto} />;
    case 'soloNight':
      return <SoloNightSheet />;
    case 'test':
      return <TestSheet />;
    case 'morningMood':
      return <MorningMoodSheet advId={sheet.advId} />;
  }
}

function Shell() {
  const { s, update } = useGame();
  const [tab, setTab] = useState<Tab>('home');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [interactReq, setInteractReq] = useState(0);
  const [boukenView, setBoukenView] = useState<'zukan' | 'craft' | 'items' | 'history'>('zukan');
  // ロック：開いたとき、または3分以上ほかのアプリにいたあとに番号を聞く
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 3 * 60_000) setUnlocked(false);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  // 色違いの子の絵を先に用意しておく
  useEffect(() => preload(s.pet.color), [s.pet.color]);
  // 演出をひかえめに：端末の「視差効果を減らす」設定が初回のデフォルト
  useEffect(() => {
    if (!s.player) return;
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !s.rewardKeys['rm-init']) update((d) => void ((d.settings.reduceMotion = true), (d.rewardKeys['rm-init'] = true)));
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!s.player]);

  if (!s.player) {
    return (
      <div className="app">
        <Onboarding />
        <Toasts />
      </div>
    );
  }
  if (s.settings.lockHash && !unlocked) {
    return (
      <div className="app">
        <LockScreen hash={s.settings.lockHash} onUnlock={() => setUnlocked(true)} />
      </div>
    );
  }
  const nav = {
    tab,
    setTab: (t: Tab) => {
      if (t !== tab) sound.se('tap');
      setTab(t);
      document.querySelector('.main')?.scrollTo({ top: 0 });
    },
    open: (x: SheetState) => setSheet(x),
    close: () => setSheet(null),
    requestInteract: () => setInteractReq((n) => n + 1),
    interactReq,
    boukenView,
    setBoukenView,
    sheetKind: sheet?.k ?? null,
  };
  return (
    <NavCtx.Provider value={nav}>
      <div className={`app tab-${tab} ${s.settings.reduceMotion ? 'reduce-motion' : ''}`}>
        <Header onSettings={() => setSheet({ k: 'settings' })} onPets={() => setSheet({ k: 'pets' })} />
        <main className="main">
          {tab === 'home' && <Home />}
          {tab === 'kokoro' && <Kokoro />}
          {tab === 'kiroku' && <Kiroku />}
          {tab === 'shop' && <Shop />}
          {tab === 'bouken' && <Bouken />}
        </main>
        <nav className="tabbar">
          {TABS.map(([t, l, e]) => (
            <button key={t} className={tab === t || (t === 'bouken' && tab === 'shop') || (t === 'home' && tab === 'kokoro') ? 'on' : ''} onClick={() => nav.setTab(t)}>
              <span className="tab-ico">{e}</span>
              <span>{l}</span>
              {t === 'bouken' && s.adventures.some((a) => !a.claimed) && <i className="dot-badge" />}
            </button>
          ))}
        </nav>
        <SheetHost sheet={sheet} />
        <CelebrationHost />
        <Toasts />
      </div>
    </NavCtx.Provider>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  );
}
