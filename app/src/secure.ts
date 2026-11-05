/**
 * 安全まわりの小さな道具
 * - 引き継ぎコードの暗号化（あいことばから鍵を作って AES-GCM で暗号化）
 * - アプリロックの番号（そのまま保存せず、ソルト付きハッシュで保存）
 * どれもブラウザ標準の Web Crypto だけを使い、外には何も送らない。
 */
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;

async function keyFrom(pass: string, salt: Uint8Array<ArrayBuffer>) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export const SEALED_PREFIX = 'LUU2:';
/** 文字列をあいことばで暗号化（LUU2:salt.iv.data） */
export async function seal(text: string, pass: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFrom(pass, salt);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
  return `${SEALED_PREFIX}${b64(salt)}.${b64(iv)}.${b64(data)}`;
}
/** 暗号化されたコードを開く。あいことばがちがえば null */
export async function unseal(code: string, pass: string): Promise<string | null> {
  try {
    const [salt, iv, data] = code.trim().slice(SEALED_PREFIX.length).split('.').map(unb64);
    const key = await keyFrom(pass, salt);
    const out = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return dec.decode(out);
  } catch {
    return null;
  }
}

/** ロック番号のハッシュ（salt:hash） */
export async function hashPin(pin: string, saltB64?: string) {
  const salt: Uint8Array<ArrayBuffer> = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const buf = await crypto.subtle.digest('SHA-256', new Uint8Array([...salt, ...enc.encode('luu-lock:' + pin)]));
  return `${b64(salt)}:${b64(new Uint8Array(buf))}`;
}
export async function checkPin(pin: string, stored: string) {
  const [salt] = stored.split(':');
  return (await hashPin(pin, salt)) === stored;
}

// ------------------------------------------------------------ 命にかかわる言葉
/** 日記やメモに、命にかかわる気持ちが書かれていないか（保存はしない・判定だけ） */
const CRISIS = [/死にたい/, /しにたい/, /消えたい/, /きえたい/, /死のう/, /自殺/, /生きていたくない/, /生きてたくない/, /いなくなりたい/, /終わりにしたい/, /楽になりたい/, /自分を傷つけ/, /リスカ/, /自傷/, /首をつ/, /飛び降り/];
export const isCrisisText = (t: string | undefined) => !!t && CRISIS.some((r) => r.test(t));
