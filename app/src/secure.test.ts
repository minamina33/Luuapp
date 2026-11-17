import { describe, expect, it } from 'vitest';
import { afterFail, checkPin, FREE_TRIES, hashPin, isCrisisText, lockWaitMs, LOCK_GUARD_KEY, MAX_WAIT, passWarning, pinNeedsUpgrade, readGuard, seal, unseal, writeGuard } from './secure';
import { MemStore } from './test/memStore';

const enc = new TextEncoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));

describe('引き継ぎコードの暗号化', () => {
  it('同じあいことばで開ける（日本語もそのまま）', async () => {
    const text = JSON.stringify({ hello: 'こんにちは、るう 🐰' });
    const code = await seal(text, 'たいせつなあいことば');
    expect(code.startsWith('LUU3:')).toBe(true);
    expect(await unseal(code, 'たいせつなあいことば')).toBe(text);
  });
  it('あいことばがちがえば開けない', async () => {
    const code = await seal('secret', 'correct horse');
    expect(await unseal(code, 'wrong horse!')).toBeNull();
  });
  it('とちゅうで切れたコード・書きかえられたコード・形のちがうコードは開けない', async () => {
    const code = await seal('secret data that is long enough', 'passphrase1');
    expect(await unseal(code.slice(0, code.length - 10), 'passphrase1')).toBeNull();
    const [head, data] = [code.slice(0, code.lastIndexOf('.') + 1), code.slice(code.lastIndexOf('.') + 1)];
    const flipped = head + (data[0] === 'A' ? 'B' : 'A') + data.slice(1);
    expect(await unseal(flipped, 'passphrase1')).toBeNull();
    expect(await unseal('LUU3:abc', 'passphrase1')).toBeNull();
    expect(await unseal('LUU3:a.b.c.d', 'passphrase1')).toBeNull();
    expect(await unseal('LUU3:!!!.???.***', 'passphrase1')).toBeNull();
    expect(await unseal('ちがう文字列', 'passphrase1')).toBeNull();
  });
  it('長すぎるコードは開こうとしない', async () => {
    expect(await unseal('LUU3:' + 'A'.repeat(6_000_001), 'passphrase1')).toBeNull();
  });
  it('前の形式（LUU2・15万回）のコードも開ける', async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const base = await crypto.subtle.importKey('raw', enc.encode('oldpassword'), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode('old data')));
    const code = `LUU2:${b64(salt)}.${b64(iv)}.${b64(data)}`;
    expect(await unseal(code, 'oldpassword')).toBe('old data');
  });
});

describe('あいことばの注意', () => {
  it('弱そうなあいことばには注意を出す', () => {
    expect(passWarning('aaaaaaaa')).not.toBeNull();
    expect(passWarning('12345678')).not.toBeNull();
    expect(passWarning('password123')).not.toBeNull();
    expect(passWarning('20240101')).not.toBeNull();
    expect(passWarning('abcdefghij')).not.toBeNull();
    expect(passWarning('usagi2026')).not.toBeNull(); // 12文字未満
  });
  it('長くてまざっていれば注意しない', () => {
    expect(passWarning('もふもふのるうと夜のさんぽ')).toBeNull();
    expect(passWarning('blue-lake-carrot-27')).toBeNull();
  });
});

describe('ロック番号', () => {
  it('今の形式：正しい番号だけ通る', async () => {
    const h = await hashPin('1234');
    expect(h.startsWith('p2$')).toBe(true);
    expect(await checkPin('1234', h)).toBe(true);
    expect(await checkPin('1235', h)).toBe(false);
    expect(pinNeedsUpgrade(h)).toBe(false);
  });
  it('同じ番号でも、毎回ちがう保存内容になる（ソルト）', async () => {
    expect(await hashPin('0000')).not.toBe(await hashPin('0000'));
  });
  it('前の形式（SHA-256 1回）の番号も通り、置きかえが必要と分かる', async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const buf = await crypto.subtle.digest('SHA-256', new Uint8Array([...salt, ...enc.encode('luu-lock:4321')]));
    const old = `${b64(salt)}:${b64(new Uint8Array(buf))}`;
    expect(await checkPin('4321', old)).toBe(true);
    expect(await checkPin('1234', old)).toBe(false);
    expect(pinNeedsUpgrade(old)).toBe(true);
  });
  it('こわれた保存内容では通らない（エラーにもならない）', async () => {
    for (const bad of ['', 'p2$', 'p2$abc$def$ghi', 'p2$999999999$AAAA$BBBB', ':', 'garbage']) {
      expect(await checkPin('1234', bad)).toBe(false);
    }
  });
});

describe('まちがえたときの待ち時間', () => {
  it(`${FREE_TRIES}回目までは待たない。そのあと少しずつ長くなり、上限で止まる`, () => {
    expect(lockWaitMs(FREE_TRIES - 1)).toBe(0);
    expect(lockWaitMs(FREE_TRIES)).toBe(30_000);
    expect(lockWaitMs(FREE_TRIES + 1)).toBe(60_000);
    expect(lockWaitMs(FREE_TRIES + 2)).toBe(300_000);
    expect(lockWaitMs(FREE_TRIES + 3)).toBe(MAX_WAIT);
    expect(lockWaitMs(100)).toBe(MAX_WAIT);
  });
  it('回数は保存され、開き直しても残る', () => {
    const st = new MemStore();
    let g = { fails: 0, until: 0 };
    for (let i = 0; i < FREE_TRIES; i++) g = afterFail(g, 1000);
    writeGuard(st, g);
    expect(readGuard(st, 1000)).toEqual({ fails: FREE_TRIES, until: 1000 + 30_000 });
  });
  it('時計が戻されても、上限より長くは閉じこめない', () => {
    const st = new MemStore();
    writeGuard(st, { fails: 9, until: 10_000_000_000 });
    expect(readGuard(st, 0).until).toBe(MAX_WAIT);
  });
  it('こわれた記録は「まちがい0回」として読む', () => {
    const st = new MemStore();
    st.setItem(LOCK_GUARD_KEY, '{oops');
    expect(readGuard(st, 0)).toEqual({ fails: 0, until: 0 });
    st.setItem(LOCK_GUARD_KEY, JSON.stringify({ fails: 'x', until: null }));
    expect(readGuard(st, 0)).toEqual({ fails: 0, until: 0 });
  });
  it('ロックを外したら記録を消す', () => {
    const st = new MemStore();
    writeGuard(st, { fails: 3, until: 0 });
    writeGuard(st, null);
    expect(st.getItem(LOCK_GUARD_KEY)).toBeNull();
  });
});

describe('命にかかわる言葉', () => {
  const should = [
    // 前からある言葉
    '死にたい', 'しにたい', '消えたい', 'きえたい', '死のう', '自殺', '生きていたくない', '生きてたくない', 'いなくなりたい', '楽になりたい', '自分を傷つけてしまう', 'リスカした', '自傷', '首をつろうか', '飛び降りたい',
    // 前は見のがしていた言葉
    '死にたくなる', '死んでしまいたい', '死んだほうがまし', '消えてしまいたい', 'もう生きる意味がない', 'ODしようかな', '薬をたくさん飲んで', '首吊り', '遺書を書いた', 'タヒにたい', '４にたい', 'しにたみ', '死にてえ', '殺してほしい', '手首を切った', 'もう全部終わらせたい', 'いなくなればいい', '生きるのがつらい', 'もう楽になりたい', 'ｼﾆﾀｲ', 'シ ニ タ イ', 'オーバードーズした',
    // つらさの冗談めかした言い方も、念のため案内する（見のがしを減らす方を優先）
    '暑すぎて死にたい（笑）',
  ];
  const shouldNot = [
    '仕事が楽になりたい', 'このプロジェクトを終わりにしたい', 'バンジーで飛び降りた', '自殺防止のポスターを見た', '学校に行きたくない', 'がっこういきたくない', 'あしのうらが痛い', 'わたしにたいしてやさしい', 'good food', '今日はたのしかった', 'つかれた。ねむい', '',
  ];
  it.each(should)('案内する：%s', (t) => expect(isCrisisText(t)).toBe(true));
  it.each(shouldNot)('案内しない：%s', (t) => expect(isCrisisText(t)).toBe(false));
  it('空や undefined でもエラーにならない', () => {
    expect(isCrisisText(undefined)).toBe(false);
  });
});
