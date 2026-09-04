import pLimit from 'p-limit';

// All widget data requests funnel through this single-concurrency queue (the
// backend/db connection isn't meant to be hammered with a dozen parallel
// queries), so at any moment at most one cacheKey is actually "running" and
// the rest are "pending" behind it. Widgets subscribe to know which state
// they're in, so the UI can show a spinner only for the one truly in flight
// instead of every queued widget spinning at once.
const limit = pLimit(1);

let activeKey: string | null = null;
const listeners = new Set<() => void>();

function notify() {
    listeners.forEach((listener) => listener());
}

export function runQueued<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return limit(async () => {
        activeKey = key;
        notify();
        try {
            return await fn();
        } finally {
            activeKey = null;
            notify();
        }
    });
}

export function getActiveKey(): string | null {
    return activeKey;
}

export function subscribeQueue(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
