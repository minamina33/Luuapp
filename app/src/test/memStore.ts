/** テスト用：localStorage のかわり（容量の上限や、こわれた保存領域もまねできる） */
export class MemStore {
  m = new Map<string, string>();
  constructor(
    public quota = Infinity,
    public broken: 'none' | 'read' | 'write' = 'none'
  ) {}
  private used(except?: string) {
    let n = 0;
    for (const [k, v] of this.m) if (k !== except) n += k.length + v.length;
    return n;
  }
  getItem(k: string) {
    if (this.broken === 'read') throw new Error('SecurityError');
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    if (this.broken === 'write') throw new Error('QuotaExceededError');
    if (this.used(k) + k.length + v.length > this.quota) throw new Error('QuotaExceededError');
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}
