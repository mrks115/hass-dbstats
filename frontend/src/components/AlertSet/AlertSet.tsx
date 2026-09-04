import type {IShowAlerts} from "@dbstats/shared/src/stats";
import type {FC} from "react";
import {useEffect, useRef, useSyncExternalStore} from "react";
import * as React from "react";
import {Alert, Box, IconButton, Typography} from "@mui/material";
import {SpinningRefreshIcon} from "../SpinningRefreshIcon";
import {SuspenseLoaderInline} from "../SuspenseLoader";
import {useLoadingProgress} from "../../contexts/LoadingProgressContext";
import {useRefresh} from "../../contexts/RefreshContext";
import {getCached, setCached} from "../../dataCache";
import {getActiveKey, runQueued, subscribeQueue} from "../../requestQueue";
import {useTranslation} from "../../i18n";

type AlertSetProps = {
    api: () => Promise<Array<IShowAlerts>>,
    cacheKey: string,
}

export const AlertSet: FC<AlertSetProps> = ({api, cacheKey}) => {

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<Array<IShowAlerts> | null>(null);
    const [errorMessageLoad, setErrorMessageLoad] = React.useState('');
    const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);
    const progress = useLoadingProgress();
    const {refreshVersion} = useRefresh();
    const {t} = useTranslation();
    // Guards against firing the initial load twice for the same mount (e.g.
    // React StrictMode double-invoking effects), which used to double every
    // request. Manual/global refreshes bypass this on purpose.
    const hasStartedRef = useRef(false);
    const prevRefreshVersionRef = useRef(refreshVersion);
    const isActive = useSyncExternalStore(subscribeQueue, () => getActiveKey() === cacheKey);

    function runFetch(forceRefresh: boolean, reportProgress: boolean) {
        setLoading(true);
        setErrorMessageLoad('');

        const finish = () => {
            setLoading(false);
            if (reportProgress) {
                progress?.reportDone();
            }
        };

        const fetchData = async () => {
            if (!forceRefresh) {
                const cached = getCached<Array<IShowAlerts>>(cacheKey);
                if (cached) {
                    setData(cached.data);
                    setLastUpdated(cached.timestamp);
                    finish();
                    return;
                }
            }
            const response = await runQueued(cacheKey, api);
            setCached(cacheKey, response);
            setData(response);
            setLastUpdated(Date.now());
            finish();
        }
        fetchData().catch((err) => {
            setErrorMessageLoad(err.message);
            finish();
        });
    }

    // Runs once on mount; hasStartedRef makes re-invocation (StrictMode, dep
    // churn) a no-op. Cache-first, no automatic reload afterwards.
    useEffect(() => {
        if (hasStartedRef.current) {
            return;
        }
        hasStartedRef.current = true;
        runFetch(false, true);
    }, []);

    // A global "refresh all" bumps refreshVersion - forces a fresh fetch here
    // too, counted against the shared progress bar like the initial load.
    useEffect(() => {
        if (refreshVersion === prevRefreshVersionRef.current) {
            return;
        }
        prevRefreshVersionRef.current = refreshVersion;
        runFetch(true, true);
    }, [refreshVersion]);

    const handleManualRefresh = () => runFetch(true, false);

    if (loading && !data) {
        return <SuspenseLoaderInline success={false} pending={!isActive}></SuspenseLoaderInline>;
    }
    if (errorMessageLoad && !data) {
        return (
            <Alert severity="error">{errorMessageLoad}</Alert>)
    }

    return (
        <>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1}}>
                <Typography variant="caption" color="text.secondary">
                    {lastUpdated ? t.lastUpdated(new Date(lastUpdated).toLocaleTimeString()) : t.neverUpdated}
                </Typography>
                <IconButton size="small"
                            onClick={handleManualRefresh}
                            disabled={loading}
                            aria-label={t.refreshWidget}
                            title={t.refreshWidget}>
                    <SpinningRefreshIcon spinning={loading && isActive} pending={loading && !isActive}/>
                </IconButton>
            </Box>
            {errorMessageLoad && (
                <Alert style={{marginTop: 8}} severity="error">{errorMessageLoad}</Alert>
            )}
            {data && data.length > 0 && data.map((el, index) => (
                <Alert style={{marginTop: 15}} key={index} severity={el.type}>{el.text}</Alert>
            ))}
        </>
    );
}
