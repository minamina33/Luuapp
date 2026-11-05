/**
 * 効果音とBGM（Web Audio で合成。音声ファイルは使わない）
 * ブラウザの制約で、最初のタップのあとに音が鳴るようになる。
 * 本番で音源ファイル（mp3等）に差し替える場合は se() / startBgm() の中身を置き換える。
 */
export type SE = 'tap' | 'pop' | 'munch' | 'boing' | 'pet' | 'coin' | 'chime' | 'sparkle' | 'open' | 'fanfare' | 'levelup' | 'morning' | 'night';

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// オルゴール風BGM（ハ長調ペンタトニック・4小節ループ）。null は休符
const MELODY: Array<number | null> = [
  76, 79, 81, 79, 76, 74, 72, null,
  74, 76, 79, 76, 74, 72, 69, null,
  72, 76, 79, 81, 84, 81, 79, 76,
  74, null, 76, 74, 72, null, null, null,
];
const BASS = [48, 45, 41, 43];
const STEP = 60 / 72 / 2; // 72bpm の8分音符

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bgmBus!: GainNode;
  private seBus!: GainNode;
  private seOn = true;
  private bgmOn = false;
  private muted = false;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;

  configure(o: { se: boolean; bgm: boolean; muted?: boolean }) {
    this.seOn = o.se;
    this.bgmOn = o.bgm;
    this.muted = !!o.muted;
    if (this.bgmOn && !this.muted && this.ctx) this.startBgm();
    else this.stopBgm();
  }

  /** 最初のタップで呼ぶ（AudioContext の作成・再開） */
  unlock() {
    if (this.muted || (!this.seOn && !this.bgmOn)) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.8;
        this.master.connect(this.ctx.destination);
        this.seBus = this.ctx.createGain();
        this.seBus.gain.value = 1;
        this.seBus.connect(this.master);
        // BGM はやわらかい残響（ディレイ）を通す
        this.bgmBus = this.ctx.createGain();
        this.bgmBus.gain.value = 0.55;
        const delay = this.ctx.createDelay();
        delay.delayTime.value = 0.33;
        const fbk = this.ctx.createGain();
        fbk.gain.value = 0.28;
        const wet = this.ctx.createGain();
        wet.gain.value = 0.3;
        this.bgmBus.connect(this.master);
        this.bgmBus.connect(delay);
        delay.connect(fbk);
        fbk.connect(delay);
        delay.connect(wet);
        wet.connect(this.master);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      if (this.bgmOn && !this.muted) this.startBgm();
    } catch {
      /* 音が使えない環境では何もしない */
    }
  }

  private note(freq: number, at: number, dur: number, opt: { type?: OscillatorType; vol?: number; slideTo?: number; attack?: number; bus?: GainNode } = {}) {
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = opt.type ?? 'sine';
    o.frequency.setValueAtTime(freq, at);
    if (opt.slideTo) o.frequency.exponentialRampToValueAtTime(opt.slideTo, at + dur);
    const v = opt.vol ?? 0.15;
    const a = opt.attack ?? 0.008;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(v, at + a);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g);
    g.connect(opt.bus ?? this.seBus);
    o.start(at);
    o.stop(at + dur + 0.05);
  }
  private noise(at: number, dur: number, freq: number, vol = 0.12) {
    const c = this.ctx!;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.2;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(this.seBus);
    src.start(at);
  }
  private bell(m: number, at: number, vol = 0.1, dur = 0.9) {
    this.note(mtof(m), at, dur, { vol, type: 'sine' });
    this.note(mtof(m + 12), at, dur * 0.6, { vol: vol * 0.35, type: 'sine' });
  }

  se(name: SE) {
    if (!this.seOn || this.muted) return;
    this.unlock();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'tap':
        this.note(820, t, 0.09, { slideTo: 1250, vol: 0.08 });
        break;
      case 'pop':
        this.note(520, t, 0.12, { type: 'triangle', slideTo: 900, vol: 0.12 });
        break;
      case 'munch':
        [0, 0.13, 0.26].forEach((d) => this.noise(t + d, 0.07, 1700, 0.18));
        this.note(660, t + 0.42, 0.18, { type: 'triangle', slideTo: 990, vol: 0.08 });
        break;
      case 'boing':
        this.note(260, t, 0.32, { type: 'sine', slideTo: 620, vol: 0.14 });
        this.note(520, t + 0.18, 0.25, { type: 'sine', slideTo: 900, vol: 0.06 });
        break;
      case 'pet':
        this.bell(88, t, 0.06, 0.7);
        this.bell(91, t + 0.12, 0.05, 0.9);
        break;
      case 'coin':
        this.note(mtof(83), t, 0.09, { type: 'triangle', vol: 0.09 });
        this.note(mtof(88), t + 0.08, 0.35, { type: 'triangle', vol: 0.09 });
        break;
      case 'chime':
        [72, 76, 79, 84].forEach((m, i) => this.bell(m, t + i * 0.11, 0.07, 1.1));
        break;
      case 'sparkle':
        [84, 88, 91, 96, 93, 98, 100, 103].forEach((m, i) => this.note(mtof(m), t + i * 0.055, 0.35, { vol: 0.04 }));
        break;
      case 'open':
        this.noise(t, 0.35, 900, 0.1);
        [72, 79, 84, 88].forEach((m, i) => this.bell(m, t + 0.15 + i * 0.07, 0.07, 1.2));
        break;
      case 'fanfare': {
        const seq = [60, 64, 67, 72, 76, 79];
        seq.forEach((m, i) => this.note(mtof(m), t + i * 0.08, 0.3, { type: 'triangle', vol: 0.1 }));
        [72, 76, 79, 84].forEach((m) => this.note(mtof(m), t + 0.55, 1.4, { type: 'triangle', vol: 0.06, attack: 0.03 }));
        [96, 100, 103, 108].forEach((m, i) => this.note(mtof(m), t + 0.6 + i * 0.07, 0.4, { vol: 0.03 }));
        break;
      }
      case 'levelup':
        [67, 71, 74, 79].forEach((m, i) => this.bell(m, t + i * 0.09, 0.08, 1));
        this.note(mtof(86), t + 0.4, 0.8, { vol: 0.04 });
        break;
      case 'morning':
        [72, 74, 79, 84].forEach((m, i) => this.bell(m, t + i * 0.16, 0.07, 1.2));
        break;
      case 'night':
        [79, 76, 72, 67].forEach((m, i) => this.bell(m, t + i * 0.22, 0.05, 1.4));
        break;
    }
  }

  private startBgm() {
    if (!this.ctx || this.timer !== null) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 150);
  }
  private stopBgm() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  private schedule() {
    if (!this.ctx) return;
    while (this.nextTime < this.ctx.currentTime + 0.6) {
      const i = this.step % MELODY.length;
      const m = MELODY[i];
      if (m !== null) {
        this.note(mtof(m), this.nextTime, 1.3, { type: 'triangle', vol: 0.045, bus: this.bgmBus });
        this.note(mtof(m + 12), this.nextTime, 0.6, { type: 'sine', vol: 0.012, bus: this.bgmBus });
      }
      if (i % 4 === 0) {
        const b = BASS[Math.floor(i / 8) % BASS.length];
        this.note(mtof(b + 12), this.nextTime, 1.6, { type: 'sine', vol: i % 8 === 0 ? 0.04 : 0.025, bus: this.bgmBus });
      }
      this.nextTime += STEP;
      this.step++;
    }
  }
}

export const sound = new SoundEngine();
