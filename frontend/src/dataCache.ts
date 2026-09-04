// Small localStorage-backed cache so widget data survives page reloads and
// SPA navigation. Best-effort: any localStorage failure (quota, private
// browsing, disabled storage) just results in cache misses, never a crash.

const NAMESPACE = 'dbstats:cache:';

export type CacheEntry<T> = {
    data: T;
    timestamp: number;
};

export function getCached<T>(key: string): CacheEntry<T> | null {
    try {
        const raw = window.localStorage.getItem(NAMESPACE + key);
        if (!raw) {
            return null;
        }
        return JSON.parse(raw) as CacheEntry<T>;
    } catch {
        return null;
    }
}

export function setCached<T>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = {data, timestamp: Date.now()};
        window.localStorage.setItem(NAMESPACE + key, JSON.stringify(entry));
    } catch {
        // best-effort only
    }
}
