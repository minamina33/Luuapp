/**
 * 安全まわりの小さな道具
 * - 引き継ぎコードの暗号化（あいことばから鍵を作って AES-GCM で暗号化）
 * - アプリロックの番号（そのまま保存せず、ソルト付きで何十万回もかきまぜてから保存）
 * - ロック番号をまちがえたときの待ち時間
 * - 命にかかわる言葉の判定
 * どれもブラウザ標準の Web Crypto だけを使い、外には何も送らない。
 */
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u: Uint8Array) => {
  // 大きなデータでも落ちないように、少しずつ文字にする
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;

async function keyFrom(pass: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// ------------------------------------------------------------ 引き継ぎコード
/** 今つくるコードの形式。鍵づくりの回数を増やしたので LUU2 から上げた */
const SEALED_PREFIX = 'LUU3:';
const SEALED_ITERATIONS = 600_000;
/** 前の形式（LUU2）のコードも開けるように残しておく */
const OLD_SEALED_PREFIX = 'LUU2:';
const OLD_SEALED_ITERATIONS = 150_000;
/** あいことばの最低文字数（新しくコードをつくるときだけ確認する） */
export const MIN_PASS_LENGTH = 8;
/** 開けるコードの長さの上限（文字）。これより長いものは開かずに断る */
export const MAX_SEALED_LENGTH = 6_000_000;

export const isSealed = (code: string) => {
  const t = code.trim();
  return t.startsWith(SEALED_PREFIX) || t.startsWith(OLD_SEALED_PREFIX);
};
/** 文字列をあいことばで暗号化（LUU3:salt.iv.data） */
export async function seal(text: string, pass: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFrom(pass, salt, SEALED_ITERATIONS);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
  return `${SEALED_PREFIX}${b64(salt)}.${b64(iv)}.${b64(data)}`;
}
/** 暗号化されたコードを開く。あいことばがちがう・コードがこわれている・長すぎるときは null */
export async function unseal(code: string, pass: string): Promise<string | null> {
  try {
    const t = code.trim();
    if (t.length > MAX_SEALED_LENGTH || !isSealed(t)) return null;
    const iterations = t.startsWith(OLD_SEALED_PREFIX) ? OLD_SEALED_ITERATIONS : SEALED_ITERATIONS;
    const parts = t.slice(SEALED_PREFIX.length).split('.');
    if (parts.length !== 3) return null;
    const [salt, iv, data] = parts.map(unb64);
    // 形がちがうものは、鍵づくり（時間がかかる）の前に断る
    if (salt.length !== 16 || iv.length !== 12 || data.length < 16) return null;
    const key = await keyFrom(pass, salt, iterations);
    const out = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return dec.decode(out);
  } catch {
    return null;
  }
}

/** あいことばが弱そうなときの注意（null＝問題なし）。つくるのを止めはしない */
export function passWarning(pass: string): string | null {
  if (pass.length < MIN_PASS_LENGTH) return null; // 文字数の案内は別に出している
  const p = pass.toLowerCase();
  const common = ['password', 'passw0rd', 'qwertyui', 'iloveyou', 'abcdefgh', '12345678', '87654321', 'luuluulu', 'ruuruuru'];
  if (new Set(p).size <= 2) return '同じ文字のくり返しは、当てられやすいよ';
  if (common.some((c) => p.includes(c))) return 'よく使われることばは、当てられやすいよ';
  if (/^\d+$/.test(p)) return '数字だけだと当てられやすいよ。ことばをまぜると安心';
  const seq = '0123456789abcdefghijklmnopqrstuvwxyz';
  if (p.length >= 6 && (seq.includes(p) || seq.split('').reverse().join('').includes(p))) return '順番にならんだ文字は、当てられやすいよ';
  if (pass.length < 12) return 'もう少し長くすると、もっと安心（12文字以上がおすすめ）';
  return null;
}

// ------------------------------------------------------------ アプリロックの番号
/** 今の保存形式：p2$回数$ソルト$ハッシュ（PBKDF2-SHA256） */
const PIN_PREFIX = 'p2$';
export const PIN_ITERATIONS = 300_000;

async function pbkdf2(pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const base = await crypto.subtle.importKey('raw', enc.encode('luu-lock:' + pin), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, 256));
}
/** ロック番号を保存用の形にする */
export async function hashPin(pin: string, iterations = PIN_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${PIN_PREFIX}${iterations}$${b64(salt)}$${b64(await pbkdf2(pin, salt, iterations))}`;
}
/** 前の形式（salt:hash、SHA-256 を1回）のハッシュ。読みとりのためだけに残す */
async function oldHash(pin: string, saltB64: string) {
  const salt = unb64(saltB64);
  const buf = await crypto.subtle.digest('SHA-256', new Uint8Array([...salt, ...enc.encode('luu-lock:' + pin)]));
  return `${saltB64}:${b64(new Uint8Array(buf))}`;
}
/** 時間で中身を推測されないよう、最後まで比べる */
function sameText(a: string, b: string) {
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
export async function checkPin(pin: string, stored: string) {
  try {
    if (stored.startsWith(PIN_PREFIX)) {
      const [iter, salt, hash] = stored.slice(PIN_PREFIX.length).split('$');
      const n = Number(iter);
      if (!Number.isInteger(n) || n < 1 || n > 10_000_000 || !salt || !hash) return false;
      return sameText(b64(await pbkdf2(pin, unb64(salt), n)), hash);
    }
    const [salt] = stored.split(':');
    return sameText(await oldHash(pin, salt), stored);
  } catch {
    return false;
  }
}
/** 前の形式のまま保存されている（次にロックを外したとき、今の形式に置きかえる） */
export const pinNeedsUpgrade = (stored: string) => !stored.startsWith(PIN_PREFIX) || Number(stored.split('$')[1]) < PIN_ITERATIONS;

// ------------------------------------------------------------ まちがえたときの待ち時間
/**
 * 番号を続けてまちがえたら、少し待ってもらう（総当たりで番号をさがされないように）。
 * 回数はアプリを開き直しても残る。ただし端末の保存領域を直接さわれる人には消せてしまうので、
 * これは「画面から番号を当てられにくくする」ためのもので、保存データそのものを守るものではない。
 */
export const LOCK_GUARD_KEY = 'luu-lock-guard';
export const FREE_TRIES = 5;
const WAITS = [30_000, 60_000, 5 * 60_000, 15 * 60_000];
export const MAX_WAIT = WAITS[WAITS.length - 1];
export interface LockGuard {
  fails: number;
  until: number;
}
/** まちがえた回数から、待ち時間（ミリ秒） */
export const lockWaitMs = (fails: number) => (fails < FREE_TRIES ? 0 : WAITS[Math.min(fails - FREE_TRIES, WAITS.length - 1)]);
export const afterFail = (g: LockGuard, now: number): LockGuard => {
  const fails = g.fails + 1;
  return { fails, until: now + lockWaitMs(fails) };
};
type GuardStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function readGuard(store: GuardStore, now: number): LockGuard {
  try {
    const g = JSON.parse(store.getItem(LOCK_GUARD_KEY) ?? 'null');
    if (!g || !Number.isFinite(g.fails) || !Number.isFinite(g.until)) return { fails: 0, until: 0 };
    // 端末の時計が戻されても、いちばん長い待ち時間より長くは閉じこめない
    return { fails: Math.max(0, Math.floor(g.fails)), until: Math.min(g.until, now + MAX_WAIT) };
  } catch {
    return { fails: 0, until: 0 };
  }
}
export function writeGuard(store: GuardStore, g: LockGuard | null) {
  try {
    if (!g || g.fails === 0) store.removeItem(LOCK_GUARD_KEY);
    else store.setItem(LOCK_GUARD_KEY, JSON.stringify(g));
  } catch {
    /* 保存できなくても、この画面のあいだは待ち時間が効く */
  }
}

// ------------------------------------------------------------ 命にかかわる言葉
/**
 * 日記やメモに、命にかかわる気持ちが書かれていないか（保存はしない・外にも送らない・判定だけ）。
 * - 見のがしを減らすほうを優先する（まちがって出ても、相談先をそっと案内するだけなので）
 * - 言葉の判定には限界がある。つらい気分が続いたときの案内や、いつでも開ける相談先と組み合わせて使う
 * - 専門の支援の代わりではない
 */
/** 比べやすい形にする：全角半角・大文字小文字をそろえ、カタカナはひらがなに、空白や記号の一部をのぞく */
export function normalizeText(t: string) {
  return t
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s　・…ー〜~]+/g, '');
}
const CRISIS: RegExp[] = [
  // 死
  /(死|し|タヒ|たひ|氏|4)に(たい|たく|てえ|てぇ|たみ|てー)/,
  /(死|し)んで(しまい|しまえ|しまお|楽|らく)/,
  /(死|し)んだ(ほう|方)が/,
  /死(のう|ぬしか|なせて)|しぬしか|しなせて/,
  /殺して(ほしい|くれ|ください)/,
  /自殺|自死|じさつ/,
  // 消える・いなくなる
  /(消|き)え(たい|てしまいたい|てなくなりたい|てしまえたら|たく)/,
  /いなくなり(たい|たく)|いなくなれ(ばいい|たら)/,
  // 生きる
  // 「行きたくない（いきたくない）」とまちがえないよう、ひらがなは「いきてたくない」の形だけ
  /生きたくな|(生|い)き(てい|て)たくな/,
  /(生|い)きる?(のが|のも)(つら|辛|しんど|疲|つか|いや|嫌)/,
  /(生|い)き(る|てる|ている|てく)(意味|いみ)(が|も)?(な|わから)/,
  // 終わらせる・楽になる（「仕事が楽になりたい」などは前の言葉で区別する）
  /(人生|全部|ぜんぶ|すべて|全て|なにもかも|何もかも)(を)?(終|お)わ(らせ|りにし)/,
  /(^|[。、！？!?]|もう|もうはやく|はやく|早く|いっそ)(楽|らく)になりた/,
  // 自分を傷つける
  /自分を(傷|きず)つけ|自傷|じしょう(こうい)?したい|りすか|手首を?(切|き)|腕を?(切|き)った/,
  /(^|[^a-z])od(る|して|しよ|した|する|しちゃ|やっ|$|[^a-z])|おばどず|(薬|くすり)を?(たくさん|大量|いっぱい|まとめて)(飲|の)/,
  /首を?(つ|吊)|首(つり|吊)|飛び降り|とびおり|飛び込み自殺|遺書/,
];
/** 命にかかわる話ではないことがはっきりしている言い回し（判定の前にのぞく） */
// （ならべる前に normalizeText をかけるので、ひらがな・のばし棒なしの形で書く）
const NOT_CRISIS: RegExp[] = [
  /自殺(防止|予防|対策)/,
  /いのちの電話/,
  /ばんじ.{0,6}(飛び降り|とびおり)/,
  // 「わたしにたいして（私に対して）」など
  /しにたいし(て|た|ま)|しにたいす(る|れ)/,
];
export function isCrisisText(t: string | undefined) {
  if (!t) return false;
  let n = normalizeText(t);
  for (const r of NOT_CRISIS) n = n.replace(new RegExp(r.source, 'g'), '');
  return CRISIS.some((r) => r.test(n));
}
