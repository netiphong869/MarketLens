interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly values = new Map<string, CacheEntry<T>>();

  constructor(private readonly now: () => number = Date.now) {}

  get(key: string): T | undefined {
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if (this.now() > entry.expiresAt) {
      this.values.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlSeconds: number): void {
    this.values.set(key, {
      value,
      expiresAt: this.now() + ttlSeconds * 1000,
    });
  }
}
