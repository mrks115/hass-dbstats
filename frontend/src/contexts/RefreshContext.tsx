import * as React from 'react';
import type { FC, ReactNode } from 'react';

type RefreshContextValue = {
    // Bumped every time "refresh all" is triggered. Widgets watch this value
    // (skipping the initial render) to know when to force a fresh fetch
    // instead of reading from their own cache.
    refreshVersion: number;
    refreshAll: () => void;
};

const RefreshContext = React.createContext<RefreshContextValue>({
    refreshVersion: 0,
    refreshAll: () => {
    },
});

export const RefreshProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [refreshVersion, setRefreshVersion] = React.useState(0);

    const refreshAll = React.useCallback(() => {
        setRefreshVersion((v) => v + 1);
    }, []);

    const value = React.useMemo(
        () => ({ refreshVersion, refreshAll }),
        [refreshVersion, refreshAll],
    );

    return (
        <RefreshContext.Provider value={value}>
            {children}
        </RefreshContext.Provider>
    );
};

export function useRefresh(): RefreshContextValue {
    return React.useContext(RefreshContext);
}
