import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../game/store';
import { useNav, runRec } from '../nav';
import { layoutFor, Luu, luuTopPct, Room, type Anim } from '../components/Room';
import { LuuImg } from '../components/LuuImg';
import { SPRITES, PCT_PER_PX } from '../assets';
import { Confirm, MoodFace } from '../components/ui';
import { asset, ROOM_ASPECT } from '../assets';
import { BOND_POINTS, FOODIE_MEALS_PER_DAY, SNACKS_PER_DAY, STAGE_SCALE } from '../config';
import {
  addBond,
  addPersonality,
  bondLevel,
  currentSleep,
  dayKey,
  goToSleep,
  markActive,
  nowMs,
  personalityTop,
  stageOf,
  timeOfDay,
  today,
  wakeUp,
} from '../game/logic';
import { OUTINGS, sleepTalk, linePool, withYou, BASIC_PLAYS, FOODS, IDLE_LINES, IDLE_POSES, MOODS, MORNING_LINES, NIGHT_LINES, PET_LINES, TOY_PLAY, FOODIE_EAT_LINES, FOODIE_SNACK_LINES } from '../data/content';
import { item, ITEMS } from '../data/items';
import type { CareTask, MoodValue } from '../types';
import { sound } from '../sound';
import { Egg } from '../components/Egg';
import { isStandalone, letterAuthor, unreadLetter } from '../sheets/Letter';
import { AREA_INFO } from '../config';
import { dreamPreview, seasonOf, canEatMeal, canEatSnack, snackLimit, snacksEaten, careCountToday, MEAL_NAMES, mealSlot, nextMeal, petDaily, playsLeft, tasksForToday } from '../game/logic';
import { CHEER_AT, MOOD_PER_DAY } from '../config';
import { goHome, toggleTask } from '../sheets/Care';
import { daysToNextStage, TOKUI_ACTS, dayNumber, lowStreak, skyOpen, OUTING_AUTO_RETURN_H, ASK_WAKE_HOURS, autoWakeAt, canCancelSleep, cancelSleep, lastNightSolo, nightCharms, shouldAutoWake, soloSleeping } from '../game/logic';
import { CHARMS, MAX_CHARMS } from '../data/charms';
import { charmsFor } from '../game/logic';
void CHEER_AT;

type Menu = null | 'main' | 'food' | 'play';
interface Reaction {
  hold?: import('../components/Room').Hold | null;
  pose: string;
  anim: Anim;
  line: string;
  fx?: string;
  until: number;
}
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const SOLO_HOUR = 2;
/** おまもりのかばんは、テスト版では見せない（効果は朝の冒険のひとことで伝える） */
const SHOW_BAG = false;

export default function Home() {
  const { s, update, toast } = useGame();
  const nav = useNav();
  const [menu, setMenu] = useState<Menu>(null);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [idle, setIdle] = useState<{ pose: string; anim: Anim } | null>(null);
  const [line, setLine] = useState<string>('');
  const [confirmSleep, setConfirmSleep] = useState(false);
  const [, force] = useState(0);
  const timer = useRef<number>();

  const ms = nowMs(s);
  const tod = timeOfDay(ms);
  const sleeping = !!currentSleep(s);
  // 夜中までおやすみが押されなかったら、るうはひとりで先に寝ている（冒険には行かない）
  const soloNap = soloSleeping(s);
  const showSleep = sleeping || soloNap;
  const stage = stageOf(s);
  const scale = STAGE_SCALE[stage - 1];
  const lv = bondLevel(s.pet.totalBondPoints);
  const { main } = personalityTop(s);
  const outfit = s.pet.outfit ? item(s.pet.outfit).sprite ?? null : null;
  const unclaimed = s.adventures.find((a) => !a.claimed);
  const careN = careCountToday(s);
  const bag = nightCharms(s, today(s));
  void careN;
  // おやすみ前にふりかえる「今日できたこと」
  const KIND_DONE: Record<string, string> = { mood: '気分を記録した', breathing: '深呼吸をした', journal: '日記を書いた', walk: '体を動かした' };
  const todayDone = Array.from(
    new Set(
      s.completions
        .filter((c) => c.day === today(s) && c.kind !== 'sleep')
        .map((c) => (c.kind === 'task' ? `「${c.detail ?? 'タスク'}」` : c.kind === 'walk' && c.detail ? `${c.detail}をした` : KIND_DONE[c.kind] ?? ''))
        .filter(Boolean)
    )
  ).slice(0, 6);
  void tasksForToday;
  const letter = unreadLetter(s, nowMs(s));
  const reduce = s.settings.reduceMotion;
  const todayMoods = s.moods.filter((m) => m.at && today(s) === dayKey(m.at));
  const lastMood = todayMoods[todayMoods.length - 1];
  // おやすみの確認で出す、やさしいひとこと（責めない：「押し忘れ」と「書きたければどうぞ」として聞く）
  // つらい日は出さずに、いつものやさしい言葉だけにする
  const lowToday = !!lastMood && lastMood.value <= 2;
  const nightLeft = tasksForToday(s.tasks, ms).filter((t) => t.when === 'night' && !s.completions.some((c) => c.kind === 'task' && c.taskId === t.id && c.day === today(s)));
  const journaled = s.completions.some((c) => c.kind === 'journal' && c.day === today(s));
  function checkBeforeSleep(t: CareTask) {
    toggleTask(s, update, t);
    // このあとすぐ眠るので、おへやでのひとことは出さない
    update((d) => void (d.lastCare && (d.lastCare.seen = true)));
  }
  // いっしょにおでかけ中
  const outing = !sleeping && s.outing ? s.outing : null; // おでかけ中は先に寝ない
  const outMin = outing ? Math.max(0, Math.floor((ms - new Date(outing.startedAt).getTime()) / 60_000)) : 0;
  const [outLine, setOutLine] = useState(0);
  useEffect(() => {
    if (!outing) return;
    const t = window.setInterval(() => setOutLine((x) => x + 1), 7000);
    return () => clearInterval(t);
  }, [outing]);
  // 押し忘れ：長く出かけたままなら、るうが先に帰ってくる
  useEffect(() => {
    if (outing && outMin >= OUTING_AUTO_RETURN_H * 60) goHome(update, nav, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outing?.startedAt, outMin]);
  const leaf = !sleeping && !outing && s.leaf && new Date(s.leaf.until).getTime() > ms ? s.leaf : null;


  // 1分ごとに再描画（朝昼夜の切り替え）
  useEffect(() => {
    const t = window.setInterval(() => force((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // ふだんの吹き出し（時間帯・季節・性格・今日の気分・ひさしぶりかどうかで変わる）
  const moodToday = lastMood ? lastMood.value : null;
  const caredToday = s.completions.some((c) => c.day === today(s) && c.kind !== 'mood' && c.kind !== 'sleep');
  const realDays = s.pet.activeDays.filter((d) => !d.startsWith('dev-')).sort();
  const lastDay = realDays.filter((d) => d !== today(s)).pop();
  const away = !!lastDay && !realDays.includes(today(s)) && (new Date(today(s)).getTime() - new Date(lastDay).getTime()) / 86400_000 >= 3;
  const season = seasonOf(ms);
  // はじめての1週間：その日にやってみることを1つだけ案内する
  const dayN = dayNumber(s);
  const doneKind = (k: string) => s.completions.some((c) => c.day === today(s) && c.kind === k);
  const GUIDE: Record<number, { text: string; btn: string; go: () => void; done: boolean }> = {
    1: { text: todayMoods.length ? `夜になったら「おやすみ」を押して、${s.pet.name}といっしょに眠ろう。朝、冒険のおみやげが届くよ` : `まずは、いまの気分を下からえらんでみよう`, btn: '', go: () => {}, done: false },
    2: { text: '小さな習慣をひとつだけ、やってみよう', btn: '習慣を見る', go: () => nav.open({ k: 'tasks' }), done: doneKind('task') },
    3: { text: 'おみせをのぞいてみよう。星で家具や服が買えるよ', btn: 'おみせへ', go: () => nav.setTab('shop'), done: false },
    4: { text: `${s.pet.name}のおへやを、もようがえしてみよう`, btn: 'もようがえ', go: () => nav.open({ k: 'room' }), done: false },
    5: { text: '1分だけ、いっしょに深呼吸してみよう', btn: '呼吸法', go: () => nav.open({ k: 'breathing', minutes: 1 }), done: doneKind('breathing') },
    6: { text: `${s.pet.name}といっしょに、少しだけ外へでかけてみよう`, btn: 'でかける', go: () => nav.open({ k: 'walk' }), done: doneKind('walk') },
    7: { text: `1週間ありがとう。これからも、気が向いたときに${s.pet.name}に会いにきてね`, btn: '', go: () => {}, done: false },
  };
  const guide = !showSleep && !outing && dayN <= 7 && !s.rewardKeys[`guide:${today(s)}`] ? GUIDE[dayN] : undefined;
  const showGuide = !!guide && !guide.done;
  // つらい日が続いているとき（3日に1回まで）
  const lowShownRecently = [0, 1, 2].some((i) => s.rewardKeys[`lowcare:${dayKey(ms - i * 86400_000)}`]);
  const showLow = !showSleep && lowStreak(s) && !lowShownRecently;
  // 週に1回、引き継ぎコードの保存をすすめる（1週間たってから）
  const week = Math.floor(dayN / 7);
  const showBackup = !showSleep && dayN >= 7 && !s.rewardKeys[`backup:w${week}`] && !showGuide && !showLow;
  const soloMorning = !showSleep && lastNightSolo(s) && !s.rewardKeys[`solo:${today(s)}`];
  const toNext = daysToNextStage(s);
  const lateNight = !sleeping && new Date(ms).getHours() < SOLO_HOUR;
  useEffect(() => {
    const pool = lateNight
      ? ['ふぁ〜…ねむくなってきた…', 'そろそろ、いっしょにねよう？', 'まぶたがおもたい…', '{you}も、もうおやすみしよ…']
      : [
          ...linePool({ lv, tod, season, main, mood: moodToday, caredToday, away }),
          // 成長がちかいと、そわそわする
          ...(toNext === 1 ? ['あしたは、なにかいいことがありそうな気がする…', 'なんだか、そわそわする…'] : toNext !== null && toNext <= 3 ? ['なんだか、からだがむずむずする…', 'ちょっとだけ、せがのびた気がする？'] : []),
        ];
    setLine(pick(pool));
    const t = window.setInterval(() => setLine(pick(pool)), 14_000);
    return () => clearInterval(t);
  }, [tod, lv, season, main, moodToday, caredToday, away, lateNight, toNext]);

  // とくいのしぐさ：こども以上になると、育て方で好きになったことをときどきしている
  useEffect(() => {
    if (showSleep || stage < 2 || !main) return;
    const t = window.setInterval(() => {
      if (menu || (reaction && reaction.until > Date.now()) || Math.random() > 0.45) return;
      const a = TOKUI_ACTS[main];
      react({ pose: a.pose, anim: a.anim, line: pick(a.lines), fx: a.prop ? `img:${a.prop}` : undefined }, 4200);
    }, 22000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [main, stage, showSleep, menu]);

  // ときどき性格に合わせたしぐさをする
  useEffect(() => {
    if (showSleep) return;
    const t = window.setInterval(() => {
      if (menu || (reaction && reaction.until > Date.now())) return;
      // つらい日は、そばでおだやかに過ごす
      const p = moodToday !== null && moodToday <= 2 ? pick([...IDLE_POSES.affectionate, ...IDLE_POSES.calm]) : pick(IDLE_POSES[main ?? 'none']);
      setIdle(p as { pose: string; anim: Anim });
      window.setTimeout(() => setIdle(null), 2400);
    }, 9000);
    return () => clearInterval(t);
  }, [main, menu, reaction, showSleep, moodToday]);

  // セルフケアのあとにおへやへ戻ったら、るうがその内容を喜ぶ（30分以内・1回だけ）
  const lc = s.lastCare;
  useEffect(() => {
    if (!lc || lc.seen || sleeping) return;
    if (nowMs(s) - new Date(lc.at).getTime() > 30 * 60_000) return;
    if (lc.kind === 'mood' || lc.kind === 'sleep') return;
    // ケアのタブやタスクのシートでもう喜んだときは、跳ねずに、ひとことだけ
    if (lc.cheered) {
      const soft: Partial<Record<string, string>> = {
        task: `さっきの「${lc.detail ?? 'タスク'}」、えらかったね`,
        breathing: 'さっきの深呼吸、きもちよかったね',
        journal: '書いてくれて、ありがとうね',
        walk: `さっきの${lc.detail ?? '運動'}、おつかれさま`,
      };
      const t = window.setTimeout(() => {
        react({ pose: 'smile', anim: 'sway', line: soft[lc.kind] ?? 'さっきはおつかれさま' }, 2800);
        update((d) => void (d.lastCare && (d.lastCare.seen = true)));
      }, 450);
      return () => clearTimeout(t);
    }
    const lines: Partial<Record<string, string>> = {
      task: `「${lc.detail ?? 'タスク'}」できたね！{me}もうれしい`,
      breathing: 'いっしょに深呼吸できたね。ふぅ〜',
      journal: '書いてくれてありがとう。おつかれさま',
      walk: `${lc.detail ?? '運動'}、おつかれさま！えらいね`,
    };
    const t = window.setTimeout(() => {
      sound.se('chime');
      react({ pose: 'ureshii', anim: 'hop', line: lines[lc.kind] ?? 'できたね！', fx: '✨' }, 3200);
      update((d) => void (d.lastCare && (d.lastCare.seen = true)));
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lc?.id, sleeping]);

  // おすすめ「るうとあそぶ」から来たとき
  const lastReq = useRef(nav.interactReq);
  useEffect(() => {
    if (nav.interactReq !== lastReq.current) {
      lastReq.current = nav.interactReq;
      if (!sleeping) setMenu('play');
    }
  }, [nav.interactReq, sleeping]);

  function react(r: Omit<Reaction, 'until'>, ms = 2800) {
    setIdle(null);
    setReaction({ ...r, until: Date.now() + ms });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReaction(null), ms);
  }

  function feed(f: { emoji: string; pose: string; line: string; motion?: 'eat' | 'drink'; cup?: 'milk' | 'tea' }, snack = false) {
    setMenu(null);
    // ごはんは朝・昼・夜に1回ずつ、おやつは1日1回
    if (snack ? !canEatSnack(s) : !canEatMeal(s)) return;
    // くいしんぼうの子の、ふえた分のおやつ（親密度は入れない）
    const extraSnack = snack && snacksEaten(s) >= SNACKS_PER_DAY;
    update((d) => {
      const dd = petDaily(d);
      if (snack) {
        dd.snacks = (dd.snacks ?? (dd.snack ? 1 : 0)) + 1;
        dd.snack = true;
      }
      else {
        dd.meals.push(mealSlot(nowMs(d)));
        // ごはん（おやつはのぞく）で、くいしんぼうがすこし育つ
        if (dd.meals.length <= FOODIE_MEALS_PER_DAY) addPersonality(d, 'foodie', 1);
      }
    });
    sound.se(f.motion === 'drink' ? 'pet' : 'munch');
    update((d, fb) => {
      markActive(d, fb);
      if (!extraSnack) addBond(d, fb, 'feed', BOND_POINTS.feed);
    });
    // くいしんぼうの子は、ときどき「おかわり」したがる
    const line = extraSnack ? pick(FOODIE_SNACK_LINES) : personalityTop(s).main === 'foodie' && Math.random() < 0.5 ? pick(FOODIE_EAT_LINES) : f.line;
    // 食べる・飲むしぐさ（にんじんは専用の絵、ほかは手に持たせる）
    const motion = f.motion ?? 'eat';
    react(
      {
        pose: f.pose,
        anim: motion === 'drink' ? 'sip' : 'chew',
        line,
        fx: motion === 'drink' ? '♪' : undefined,
        hold: f.pose === 'eat_base' || outfit ? { motion, icon: f.emoji, cup: f.cup } : null,
      },
      3400
    );
  }
  function play(id: string) {
    setMenu(null);
    if (playsLeft(s) <= 0) return;
    update((d) => void (petDaily(d).plays += 1));
    sound.se('boing');
    const basic = BASIC_PLAYS.find((p) => p.id === id);
    if (basic) {
      update((d, fb) => {
        markActive(d, fb);
        addBond(d, fb, 'play', BOND_POINTS.play);
        addPersonality(d, basic.personality);
      });
      react({ pose: basic.pose, anim: basic.anim as Anim, line: basic.line, fx: basic.emoji });
      return;
    }
    const it = item(id);
    const tp = TOY_PLAY[id];
    update((d, fb) => {
      markActive(d, fb);
      addBond(d, fb, 'play', BOND_POINTS.play);
      // 初めてのおもちゃは「こうきしん」、2回目以降はおもちゃごとの性格
      if (!d.usedToys.includes(id)) {
        d.usedToys.push(id);
        addPersonality(d, 'adventurous');
      } else if (it.playPersonality) addPersonality(d, it.playPersonality);
    });
    react({ pose: tp?.pose ?? 'g_happy', anim: (tp?.anim as Anim) ?? 'hop', line: tp?.line ?? 'たのしい！', fx: it.img ? `img:${it.img}` : it.icon }, 3200);
  }
  function pet() {
    setMenu(null);
    sound.se('pet');
    update((d, fb) => {
      markActive(d, fb);
      addBond(d, fb, 'pet', BOND_POINTS.pet);
      // なでて「あまえんぼう」が育つのは1日の最初の1回だけ（+1）。
      // なでるのはいちばん手軽なので、毎回入れるとあまえんぼうだけが伸びてしまう
      const k = `petp:${today(d)}`;
      if (!d.rewardKeys[k]) {
        d.rewardKeys[k] = true;
        addPersonality(d, 'affectionate', 1);
      }
    });
    react({ pose: 'pet', anim: 'wiggle', line: pick(PET_LINES[lv - 1]), fx: '💗' });
  }

  function onMood(v: MoodValue) {
    if (todayMoods.length >= MOOD_PER_DAY) return toast(`今日の気分は${MOOD_PER_DAY}回きいたよ。また明日おしえてね`);
    nav.open({ k: 'mood', value: v });
  }
  function doWake(fix = false, auto = false) {
    let advId: string | null = null;
    const sess = currentSleep(s);
    const sessId = sess?.id;
    const long = sess ? (ms - new Date(sess.startedAt).getTime()) / 3600_000 >= ASK_WAKE_HOURS : false;
    sound.se('morning');
    update((d, fb) => {
      const a = wakeUp(d, fb, auto ? autoWakeAt(d) : undefined);
      advId = a?.id ?? null;
    });
    // 押し忘れ：先に時刻を直してもらう（冒険の結果はおへやのカードから見られる）
    if (fix && sessId) nav.open({ k: 'sleepEdit', id: sessId });
    // 長く寝ていたとき・るうが先に起きたときは「何時ごろ起きた？」を1タップで
    else if ((long || auto) && sessId) nav.open({ k: 'wakeAsk', sessId, advId, auto });
    // 起きたついでに、けさの気分をひとこと（そのあと冒険の結果へ）
    else if (todayMoods.length >= MOOD_PER_DAY) advId ? nav.open({ k: 'adventure', id: advId }) : undefined;
    else nav.open({ k: 'morningMood', advId });
  }
  // お昼前になっても「おはよう」が押されていなければ、るうが先に起きている
  useEffect(() => {
    if (shouldAutoWake(s)) doWake(false, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleeping, Math.floor(ms / 60_000)]);
  const sleepStart = currentSleep(s)?.startedAt;
  const sleptHours = sleepStart ? (ms - new Date(sleepStart).getTime()) / 3600_000 : 0;
  const overslept = sleptHours >= 16;
  const dream = sleeping ? dreamPreview(s) : null;
  const talk = dream ? withYou(sleepTalk(dream.area, dream.charms, dream.seed, Math.floor(ms / 20_000)), s.player?.nickname ?? '', s.pet.name) : '';

  const specialFoods = ITEMS.filter((i) => i.food && (s.inventory[i.id] ?? 0) > 0);
  const ownedToys = ITEMS.filter((i) => i.category === 'toy' && (s.inventory[i.id] ?? 0) > 0);
  // おへやの「今日の習慣」ボタン用
  const habits = tasksForToday(s.tasks, ms);
  const habitsDone = habits.filter((t) => s.completions.some((c) => c.kind === 'task' && c.taskId === t.id && c.day === today(s))).length;

  const live = reaction && reaction.until > Date.now() ? reaction : null;
  const pose = live?.pose ?? idle?.pose ?? 'sit';
  const anim: Anim = live?.anim ?? idle?.anim ?? 'idle';
  const showPose = outfit ?? pose;
  const L = layoutFor(tod, showSleep);
  const lscale = scale * L.luu.scale;
  const top = luuTopPct(showPose, lscale, ROOM_ASPECT, L.luu.bottom);
  const sleepW = (SPRITES.g_sleep?.[0] ?? 400) * PCT_PER_PX * scale * L.sleep.scale;
  // あかちゃんのうちは、まだことばにならない（成長の朝に、はじめて名前を呼ぶ）
  const BABY = ['るぅ…', '…！', 'ぽわぁ', 'るぅ♪', 'ん〜…', 'きゅっ', 'ふぁ…', '♪'];
  const rawBubble = withYou(live?.line ?? line, s.player?.nickname ?? '', s.pet.name);
  const bubbleText = stage === 1 && rawBubble ? BABY[[...rawBubble].reduce((a, ch) => a + ch.charCodeAt(0), 0) % BABY.length] : rawBubble;

  return (
    <div className="home">
      <div className="room-frame">
        {outing ? (
          <div className={`room outing ${tod === 'night' ? 'is-night' : ''} tod-${tod}`}>
            <img className="room-bg" src={asset(OUTINGS[outing.kind].bg)} alt="" draggable={false} />
            {tod === 'evening' && <div className="overlay-evening" />}
            <Luu
              pose={OUTINGS[outing.kind].pose}
              scale={scale * 1.05}
              x={50}
              bottom={24}
              anim={reduce ? 'idle' : OUTINGS[outing.kind].anim}
              night={tod === 'night'}
              onClick={() => {
                sound.se('tap');
                react({ pose: 'ureshii', anim: 'hop', line: 'いっしょだと、たのしいね！' }, 1800);
              }}
            />
            <div className="bubble" style={{ top: '30%', left: '50%' }} key={outLine}>
              {withYou(live?.line ?? OUTINGS[outing.kind].lines[outLine % OUTINGS[outing.kind].lines.length], s.player?.nickname ?? '', s.pet.name)}
            </div>
            <div className="out-tag">
              🎒 {OUTINGS[outing.kind].place}で{OUTINGS[outing.kind].label}中・{outMin}分
            </div>
            <div className="sleep-panel">
              <button className="btn primary big" onClick={() => goHome(update, nav)}>
                🏠 ただいま
              </button>
            </div>
          </div>
        ) : (
        <Room tod={tod} sleeping={showSleep} slots={s.pet.roomSlots} sky={skyOpen(s) ? s.sky : undefined} onSkyClick={() => nav.open({ k: 'sky' })} onBackgroundClick={() => setMenu(null)}>
          {soloNap ? (
            <>
              <div className="sleeper" style={{ left: `${L.sleep.x - sleepW / 2}%`, bottom: `${L.sleep.bottom}%`, width: `${sleepW}%` }}>
                <LuuImg sprite="g_sleep" />
              </div>
              <div className="zzz" style={{ left: `${L.sleep.x + sleepW / 3}%`, bottom: `${L.sleep.bottom + 12}%`, top: 'auto' }}>
                <span>z</span>
                <span>z</span>
                <span>Z</span>
              </div>
              <div className="sleep-panel">
                <div className="sleep-text">{s.pet.name}はねむくなって、先にねちゃったみたい…</div>
                <button
                  className="btn primary big"
                  onClick={() => {
                    update((d) => goToSleep(d));
                    sound.se('night');
                    toast(`おやすみなさい。${s.pet.name}といっしょに冒険に出かけるね`);
                  }}
                >
                  🌙 いっしょにねる
                </button>
              </div>
            </>
          ) : sleeping ? (
            <>
              {tod !== 'night' && <div className={`overlay-dawn ${tod}`} />}
              {dream && (
                <div className={`dream r-${dream.rarity}`} style={{ left: `${L.sleep.x + sleepW * 0.05}%`, bottom: `${L.sleep.bottom + 15}%` }}>
                  <span className="dream-ico">{AREA_INFO[dream.area].emoji}</span>
                  {dream.rarity !== 'common' && <span className="dream-spark">✦</span>}
                </div>
              )}
              {dream && talk && <div className="sleep-talk" style={{ left: `${Math.max(4, L.sleep.x - 6)}%`, bottom: `${L.sleep.bottom + 30}%` }} key={talk}>{talk}</div>}
              <div className="sleeper" style={{ left: `${L.sleep.x - sleepW / 2}%`, bottom: `${L.sleep.bottom}%`, width: `${sleepW}%` }}>
                <LuuImg sprite="g_sleep" />
              </div>
              <div className="zzz" style={{ left: `${L.sleep.x + sleepW / 3}%`, bottom: `${L.sleep.bottom + 12}%`, top: 'auto' }}>
                <span>z</span>
                <span>z</span>
                <span>Z</span>
              </div>
              <div className="sleep-panel">
                {overslept ? (
                  <div className="oversleep">おやすみから{Math.floor(sleptHours)}時間たったよ。もう起きてる？</div>
                ) : (
                  <div className="sleep-text">
                    {tod === 'night' ? `${s.pet.name}はぐっすり。夢の中で冒険中…` : `朝だよ。${s.pet.name}はまだ夢の中…起こしてあげよう`}
                  </div>
                )}
                <button className="btn primary big" onClick={() => doWake(false)}>
                  ☀️ おはよう
                </button>
                {canCancelSleep(s) && (
                  <button
                    className="btn ghost small-btn sleep-cancel"
                    onClick={() => {
                      update((d) => cancelSleep(d));
                      toast('おやすみを取り消したよ');
                    }}
                  >
                    まちがえて押しちゃった（取り消す）
                  </button>
                )}
                {overslept && (
                  <button className="btn soft" onClick={() => doWake(true)}>
                    起きた時刻を直して「おはよう」
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <Luu
                pose={pose}
                outfitSprite={outfit}
                scale={lscale}
                x={L.luu.x}
                bottom={L.luu.bottom}
                hold={live?.hold ?? null}
                anim={anim}
                night={tod === 'night'}
                onClick={() => {
                  sound.se('tap');
                  // さわると、ぴくっと反応してからメニューが出る
                  if (!menu) react({ pose: 'perk', anim: 'wiggle', line: '' }, 900);
                  setMenu(menu ? null : 'main');
                }}
              />
              {leaf && (
                <button
                  className="head-leaf"
                  style={{ left: `${L.luu.x + 3}%`, top: `${top + 1}%` }}
                  aria-label="葉っぱをとる"
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.se('pet');
                    update((d) => void (d.leaf = null));
                    react({ pose: 'tereru', anim: 'wiggle', line: 'えへへ、ついてた？' }, 2200);
                  }}
                >
                  {leaf.icon}
                </button>
              )}
              {live?.fx && (
                live.fx.startsWith('img:') ? (
                  <div className="toy-fx" style={{ left: `${L.luu.x + 17}%`, bottom: `${L.luu.bottom}%` }} key={live.until}>
                    <img src={asset(`${live.fx.slice(4)}.webp`)} alt="" />
                  </div>
                ) : (
                  <div className="fx" style={{ left: `${L.luu.x}%`, top: `${top - 4}%` }} key={live.until}>
                    {live.fx}
                  </div>
                )
              )}
              {!menu && bubbleText && (
                <div className="bubble" style={{ top: `${Math.max(4, top - 13)}%`, left: `${Math.min(70, Math.max(30, L.luu.x))}%` }} key={bubbleText}>
                  {bubbleText}
                </div>
              )}
              {menu && (
                <div className="interact" style={{ top: `${Math.max(3, top - 17)}%` }} onClick={(e) => e.stopPropagation()}>
                  {menu === 'main' && (
                    <>
                      <button
                        className={!canEatMeal(s) && (!specialFoods.length || !canEatSnack(s)) ? 'dim' : ''}
                        onClick={() => {
                          if (!canEatMeal(s) && (!specialFoods.length || !canEatSnack(s))) {
                            setMenu(null);
                            react({ pose: 'kutsurogi', anim: 'sway', line: `おなかいっぱい…つぎは${nextMeal(s)}ごはんね` }, 2600);
                          } else setMenu('food');
                        }}
                      >
                        <span>🥕</span>
                        ごはん
                        <small>{canEatMeal(s) ? `${MEAL_NAMES[mealSlot(ms)]}ごはん` : 'おなかいっぱい'}</small>
                      </button>
                      <button
                        className={playsLeft(s) <= 0 ? 'dim' : ''}
                        onClick={() => {
                          if (playsLeft(s) <= 0) {
                            setMenu(null);
                            react({ pose: 'nemunemu', anim: 'sway', line: 'ちょっとつかれちゃった。ひと休みしたら、また遊ぼうね' }, 2800);
                          } else setMenu('play');
                        }}
                      >
                        <span>🧶</span>
                        あそぶ
                        <small>{playsLeft(s) > 0 ? `あと${playsLeft(s)}回` : 'ひと休み中'}</small>
                      </button>
                      <button onClick={pet}>
                        <span>🤚</span>なでる
                      </button>
                    </>
                  )}
                  {menu === 'food' && (
                    <>
                      {canEatMeal(s) &&
                        FOODS.filter((f) => (f.stage ?? 1) <= stage).map((f) => (
                          <button key={f.id} onClick={() => feed(f)}>
                            <span>{f.emoji}</span>
                            {f.label}
                          </button>
                        ))}
                      {specialFoods.length > 0 && <div className="menu-label">おやつ{canEatSnack(s) ? `（1日${snackLimit(s)}回）` : '：また明日ね'}</div>}
                      {canEatSnack(s) &&
                        specialFoods.map((it) => (
                          <button key={it.id} className="special" onClick={() => feed({ emoji: it.icon, pose: it.food!.pose, line: it.food!.line, motion: it.food!.motion, cup: it.food!.cup }, true)}>
                            <span>{it.icon}</span>
                            {it.title}
                          </button>
                        ))}
                    </>
                  )}
                  {menu === 'play' && (
                    <>
                      <div className="menu-label">セルフケアをすると、遊べる回数がふえるよ</div>
                      {BASIC_PLAYS.map((p) => (
                        <button key={p.id} onClick={() => play(p.id)}>
                          <span>{p.emoji}</span>
                          {p.label}
                        </button>
                      ))}
                      {ownedToys.map((t) => (
                        <button key={t.id} onClick={() => play(t.id)}>
                          <span>{t.img ? <img className="menu-img" src={asset(`${t.img}.webp`)} alt="" /> : t.icon}</span>
                          {t.title}
                        </button>
                      ))}
                    </>
                  )}
                  {menu !== 'main' && (
                    <button className="back" onClick={() => setMenu('main')}>
                      ‹ もどる
                    </button>
                  )}
                </div>
              )}
              <button
                className="corner-btn left"
                onClick={(e) => {
                  e.stopPropagation();
                  nav.open({ k: 'wardrobe' });
                }}
              >
                👕<small>きせかえ</small>
              </button>
              <button
                className="corner-btn right"
                onClick={(e) => {
                  e.stopPropagation();
                  nav.open({ k: 'room' });
                }}
              >
                🪑<small>もようがえ</small>
              </button>
              {s.egg && (
                <button className="room-egg" style={{ left: `${L.egg.left}%`, top: `${L.egg.top}%`, bottom: "auto" }} onClick={(e) => (e.stopPropagation(), nav.open({ k: 'pets' }))}>
                  <Egg color={s.egg.color} size={40} wobble={!reduce} />
                  <small>あと{s.egg.nightsLeft}晩</small>
                </button>
              )}
              {s.eggOffer && !unclaimed && (
                <button className="adv-card" onClick={(e) => (e.stopPropagation(), nav.open({ k: 'eggs' }))}>
                  <Egg color={s.eggOffer.choices[0]} size={34} />
                  <span>
                    <b>たまごが待ってるよ</b>
                    <br />
                    どれを温めるか選ぶ ›
                  </span>
                </button>
              )}
              {letter && !unclaimed && !s.eggOffer && (
                <button className="adv-card" onClick={(e) => (e.stopPropagation(), nav.open({ k: 'letter', month: letter }))}>
                  <span className="adv-ico">💌</span>
                  <span>
                    <b>{letterAuthor(s, letter, '').name}から手紙が届いたよ</b>
                    <br />
                    {Number(letter.slice(5))}月のふりかえりを読む ›
                  </span>
                </button>
              )}
              {soloMorning && !unclaimed && !s.eggOffer && !letter && (
                <button className="adv-card" onClick={(e) => (e.stopPropagation(), nav.open({ k: 'soloNight' }))}>
                  <span className="adv-ico">💤</span>
                  <span>
                    <b>きのうは{s.pet.name}が先にねちゃった</b>
                    <br />
                    こんやはいっしょに冒険いこうね ›
                  </span>
                </button>
              )}
              {unclaimed && (
                <button className="adv-card" onClick={(e) => (e.stopPropagation(), nav.open({ k: 'adventure', id: unclaimed.id }))}>
                  <span className="adv-ico">{item(unclaimed.itemId).img ? <img src={asset(`${item(unclaimed.itemId).img}.webp`)} alt="" /> : item(unclaimed.itemId).icon}</span>
                  <span>
                    <b>{s.pet.name}がおかえり！</b>
                    <br />
                    冒険の結果を見る ›
                  </span>
                </button>
              )}
            </>
          )}
        </Room>
        )}
      </div>

      {showLow && (
        <div className="soft-card low-card">
          <span>
            ここ数日、つらい日が続いているみたい。{s.pet.name}はそばにいるよ。ひとりで抱えこまずに、身近な人や相談窓口に話してみてね。
          </span>
          <span className="row gap end">
            <button className="btn tiny soft" onClick={() => (update((d) => void (d.rewardKeys[`lowcare:${today(d)}`] = true)), nav.open({ k: 'help' }))}>
              📞 相談先を見る
            </button>
            <button className="btn tiny ghost" onClick={() => update((d) => void (d.rewardKeys[`lowcare:${today(d)}`] = true))}>
              とじる
            </button>
          </span>
        </div>
      )}
      {showGuide && !showLow && guide && (
        <div className="soft-card guide-card">
          <span className="guide-day">はじめての{dayN}日目</span>
          <span>{guide.text}</span>
          <span className="row gap end">
            {guide.btn && (
              <button className="btn tiny soft" onClick={() => (update((d) => void (d.rewardKeys[`guide:${today(d)}`] = true)), guide.go())}>
                {guide.btn}
              </button>
            )}
            <button className="btn tiny ghost" onClick={() => update((d) => void (d.rewardKeys[`guide:${today(d)}`] = true))}>
              とじる
            </button>
          </span>
        </div>
      )}
      {showBackup && (
        <div className="soft-card">
          <span>📦 記録を守るために、引き継ぎコードを保存しておく？（週に1回のおしらせ）</span>
          <span className="row gap end">
            <button className="btn tiny soft" onClick={() => (update((d) => void (d.rewardKeys[`backup:w${week}`] = true)), nav.open({ k: 'backup' }))}>
              保存する
            </button>
            <button className="btn tiny ghost" onClick={() => update((d) => void (d.rewardKeys[`backup:w${week}`] = true))}>
              あとで
            </button>
          </span>
        </div>
      )}
      {!showGuide && !showLow && !showBackup && !isStandalone() && !s.rewardKeys['install-tip'] && (
        <div className="install-tip">
          <span>📱 ホーム画面に追加すると、アプリのように開けて記録も消えにくくなるよ</span>
          <span className="row gap">
            <button className="btn tiny soft" onClick={() => nav.open({ k: 'test' })}>
              やり方
            </button>
            <button className="btn tiny ghost" onClick={() => update((d) => void (d.rewardKeys['install-tip'] = true))}>
              とじる
            </button>
          </span>
        </div>
      )}
      <div className="mood-bar">
        <div className="mood-head">
          <div className="mood-q">
            {todayMoods.length >= MOOD_PER_DAY ? '今日の気分はここまで' : lastMood ? '気分を記録したよ。また変わったら教えてね' : 'いまの気分は？'}
            <span className="mood-left">
              {Array.from({ length: MOOD_PER_DAY }, (_, i) => (
                <i key={i} className={i < todayMoods.length ? 'used' : ''} />
              ))}
              <b>{todayMoods.length >= MOOD_PER_DAY ? '' : `あと${MOOD_PER_DAY - todayMoods.length}回`}</b>
            </span>
          </div>
          {SHOW_BAG && <button className={`care-count bag ${bag.length >= MAX_CHARMS ? 'full' : ''}`} onClick={() => nav.open({ k: 'charms' })} aria-label="今夜のおまもり">
            今夜のかばん
            <span className="bag-row">
              {Array.from({ length: MAX_CHARMS }, (_, i) => (
                <span key={i} className={`bag-slot ${bag[i] ? 'on' : ''}`}>
                  {bag[i] ? CHARMS[bag[i]].icon : ''}
                </span>
              ))}
            </span>
          </button>}
        </div>
        <div className={`mood-icons ${todayMoods.length >= MOOD_PER_DAY ? 'done' : ''}`}>
          {MOODS.map((m) => (
            <button key={m.value} className={`mood-btn ${lastMood?.value === m.value ? 'on' : ''}`} onClick={() => onMood(m.value)} aria-label={m.label}>
              <MoodFace value={m.value} size={38} />
              <small>{m.label}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="shortcuts">
        {!showSleep && !outing && (
          <>
            <button className="chip rec" onClick={() => nav.setTab('kokoro')}>
              <span className="chip-ico">🌿</span>
              <span className="chip-txt">
                <small>今日の習慣</small>
                {habits.length === 0
                  ? '習慣をえらぶ'
                  : habitsDone >= habits.length
                    ? 'ぜんぶできたね ✓'
                    : habitsDone === 0
                      ? `${habits.length}つの小さな習慣`
                      : `${habitsDone}/${habits.length} できたよ`}
              </span>
              <span className="chev">›</span>
            </button>
            <button className={`chip sleep ${tod === 'night' ? 'glow' : ''}`} onClick={() => setConfirmSleep(true)}>
              <span className="chip-ico">🌙</span>
              <span className="chip-txt">
                <small>ねるとき</small>おやすみ
              </span>
            </button>
          </>
        )}
      </div>

      {confirmSleep && (
        <Confirm
          text={
            <>
              <b>おやすみを記録しますか？</b>
              {todayDone.length ? (
                <div className="today-done">
                  <div className="td-title">{s.pet.name}「今日はこれができたね」</div>
                  <ul>
                    {todayDone.map((t, i) => (
                      <li key={i}>✦ {t}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="today-done">
                  <div className="small">{s.pet.name}「今日はゆっくりできたね。それも大事なことだよ」</div>
                </div>
              )}
              {!lowToday && (nightLeft.length > 0 || !journaled) && (
                <div className="sleep-extra">
                  {nightLeft.length > 0 && (
                    <>
                      <div className="se-note">夜の習慣、もうやってたらチェックしてね</div>
                      {nightLeft.map((t) => (
                        <div key={t.id} className="se-row">
                          <span className="grow">{t.title}</span>
                          <button className="btn tiny soft" onClick={() => checkBeforeSleep(t)}>
                            ✓ やった
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                  {!journaled && (
                    <div className="se-row">
                      <span className="grow">ひとことだけ、今日のこと書いておく？</span>
                      <button className="btn tiny soft" onClick={() => (setConfirmSleep(false), nav.open({ k: 'journal' }))}>
                        📓 書く
                      </button>
                    </div>
                  )}
                </div>
              )}
              {bag.length > 0 && (
                <div className="sleep-bag">
                  {bag.map((c) => CHARMS[c].icon).join(' ')} を持って、冒険に行ってくるね
                </div>
              )}
              <span className="muted small">{s.pet.name}もいっしょに眠って、夢の中で冒険に出かけます。起きたら「おはよう」を押してね。</span>
            </>
          }
          okLabel="おやすみ"
          cancel={() => setConfirmSleep(false)}
          ok={() => {
            setConfirmSleep(false);
            setMenu(null);
            update((d) => goToSleep(d));
            sound.se('night');
            toast(`おやすみなさい。${s.pet.name}もいっしょに眠るね`);
          }}
        />
      )}
    </div>
  );
}
