import * as React from 'react';
import type { FC, ReactNode } from 'react';

type LoadingProgressContextValue = {
    completed: number;
    total: number;
    reportDone: () => void;
};

const LoadingProgressContext = React.createContext<LoadingProgressContextValue | null>(null);

type ProviderProps = {
    total: number;
    children: ReactNode;
};

export const LoadingProgressProvider: FC<ProviderProps> = ({ total, children }) => {
    const [completed, setCompleted] = React.useState(0);

    // A single widget can only ever report "done" once (guarded where it's called),
    // so this simply advances the shared counter that drives the progress bar.
    const reportDone = React.useCallback(() => {
        setCompleted((current) => Math.min(current + 1, total));
    }, [total]);

    const value = React.useMemo(
        () => ({ completed, total, reportDone }),
        [completed, total, reportDone],
    );

    return (
        <LoadingProgressContext.Provider value={value}>
            {children}
        </LoadingProgressContext.Provider>
    );
};

// Returns null when used outside a provider, so callers can no-op safely.
export function useLoadingProgress(): LoadingProgressContextValue | null {
    return React.useContext(LoadingProgressContext);
}
