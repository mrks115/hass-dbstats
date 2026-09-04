import type {FC} from "react";
import {useEffect, useRef} from "react";
import * as React from "react";
import Chart from "react-apexcharts";
import {Alert, Box, IconButton, Typography} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import {SuspenseLoaderInline} from "../SuspenseLoader";
import type {ICountStats} from "@dbstats/shared/src/stats";
import type {ApexOptions} from "apexcharts";
import colors from "./colors";
import {useLoadingProgress} from "../../contexts/LoadingProgressContext";
import {useRefresh} from "../../contexts/RefreshContext";
import {getCached, setCached} from "../../dataCache";
import {useTranslation} from "../../i18n";

type DonutStatsChartProps = {
    title: string,
    api: () => Promise<Array<ICountStats>>,
    cacheKey: string,
    // Unit suffix appended to values in the tooltip/legend, e.g. "MB".
    unit?: string,
}

function buildDonutState(data: Array<ICountStats>, title: string, unit: string): { options: ApexOptions, series: Array<number> } {
    return {
        options: {
            colors: colors(data.length),
            labels: data.map(item => item.type),
            title: {text: title, align: "center"},
            legend: {position: "bottom"},
            dataLabels: {
                formatter: (val: number) => `${val.toFixed(1)}%`,
            },
            tooltip: {
                y: {
                    formatter: (val: number) => unit ? `${val.toFixed(1)} ${unit}` : val.toFixed(1),
                },
            },
        },
        series: data.map(item => item.cnt),
    };
}

export const DonutStatsChart: FC<DonutStatsChartProps> = ({title, api, cacheKey, unit = ''}) => {

    const [loading, setLoading] = React.useState(true);
    const [chartState, setChartState] = React.useState<{ options: ApexOptions, series: Array<number> } | null>(null);
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

    function applyData(data: Array<ICountStats>) {
        setChartState(buildDonutState(data, title, unit));
    }

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
                const cached = getCached<Array<ICountStats>>(cacheKey);
                if (cached) {
                    applyData(cached.data);
                    setLastUpdated(cached.timestamp);
                    finish();
                    return;
                }
            }
            const data = await api();
            setCached(cacheKey, data);
            applyData(data);
            setLastUpdated(Date.now());
            finish();
        }
        fetchData().catch((err) => {
            setErrorMessageLoad(err.message);
            finish();
        });
    }

    // Runs once on mount; hasStartedRef makes re-invocation (StrictMode, dep
    // churn) a no-op. Cache-first, no automatic reload afterwards - the user
    // triggers a refresh explicitly (per-widget button, or "refresh all").
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

    if (loading && !chartState) {
        return <SuspenseLoaderInline success={false}></SuspenseLoaderInline>;
    }
    if (errorMessageLoad && !chartState) {
        return (
            <Alert style={{marginTop: 25}} severity="error">{errorMessageLoad}</Alert>)
    }

    return (
        <>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 2}}>
                <Typography variant="caption" color="text.secondary">
                    {lastUpdated ? t.lastUpdated(new Date(lastUpdated).toLocaleTimeString()) : t.neverUpdated}
                </Typography>
                <IconButton size="small"
                            onClick={handleManualRefresh}
                            disabled={loading}
                            aria-label={t.refreshWidget}
                            title={t.refreshWidget}>
                    <RefreshIcon fontSize="small"/>
                </IconButton>
            </Box>
            {errorMessageLoad && (
                <Alert style={{marginTop: 8}} severity="error">{errorMessageLoad}</Alert>
            )}
            {chartState && (
                <Chart style={{marginTop: 10}}
                       options={chartState.options}
                       series={chartState.series}
                       type="donut"
                       width="100%"
                       height={360}
                />
            )}
        </>
    );
}
