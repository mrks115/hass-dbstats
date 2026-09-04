import * as React from 'react';
import type { FC, ReactNode } from 'react';

// Persists the chart "long tail" cutoff share across reloads, same
// localStorage approach as dataCache.ts. Best-effort: any storage failure
// just falls back to the default in-memory value.
const STORAGE_KEY = 'dbstats:settings:cutoffShare';
const DEFAULT_CUTOFF_SHARE = 0.9;

function readStoredCutoffShare(): number {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return DEFAULT_CUTOFF_SHARE;
        }
        const parsed = parseFloat(raw);
        if (isFinite(parsed) && parsed > 0 && parsed <= 1) {
            return parsed;
        }
    } catch {
        // ignore, fall back to default
    }
    return DEFAULT_CUTOFF_SHARE;
}

type ChartSettingsContextValue = {
    // Fraction (0-1) of a widget's total that should be covered by the bars
    // shown before the long tail of small entries is cut off.
    cutoffShare: number;
    setCutoffShare: (share: number) => void;
};

const ChartSettingsContext = React.createContext<ChartSettingsContextValue>({
    cutoffShare: DEFAULT_CUTOFF_SHARE,
    setCutoffShare: () => {
    },
});

export const ChartSettingsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [cutoffShare, setCutoffShareState] = React.useState(readStoredCutoffShare);

    const setCutoffShare = React.useCallback((share: number) => {
        setCutoffShareState(share);
        try {
            window.localStorage.setItem(STORAGE_KEY, String(share));
        } catch {
            // best-effort only
        }
    }, []);

    const value = React.useMemo(
        () => ({ cutoffShare, setCutoffShare }),
        [cutoffShare, setCutoffShare],
    );

    return (
        <ChartSettingsContext.Provider value={value}>
            {children}
        </ChartSettingsContext.Provider>
    );
};

export function useChartSettings(): ChartSettingsContextValue {
    return React.useContext(ChartSettingsContext);
}
