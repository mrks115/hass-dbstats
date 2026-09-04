import type {FC} from "react";
import {useEffect, useRef, useSyncExternalStore} from "react";
import * as React from "react";
import Chart from "react-apexcharts";
import {Alert, Box, IconButton, Typography} from "@mui/material";
import {SpinningRefreshIcon} from "../SpinningRefreshIcon";
import {SuspenseLoaderInline} from "../SuspenseLoader";
import type {ICountStats} from "@dbstats/shared/src/stats";
import type {ApexOptions} from "apexcharts";
import colors from "./colors";
import {useLoadingProgress} from "../../contexts/LoadingProgressContext";
import {useChartSettings} from "../../contexts/ChartSettingsContext";
import {useRefresh} from "../../contexts/RefreshContext";
import {getCached, setCached} from "../../dataCache";
import {getActiveKey, runQueued, subscribeQueue} from "../../requestQueue";
import {useTranslation} from "../../i18n";

type CountStatesChartProps = {
    title: string,
    api: () => Promise<Array<ICountStats>>,
    cacheKey: string,
    // Unit suffix appended to displayed values, e.g. "MB" - without this,
    // compactNumberFormatter's "k"/"M" abbreviations look like they
    // contradict a title that already states a unit (e.g. table size in MB
    // showing a bare "3.9k", which reads as a different, wrong unit).
    unit?: string,
}

function thousandFormatter(value: string | number, unit = ''): string {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    const formatted = num < 1000 ? num.toString() : num.toLocaleString('en-us');
    return unit ? `${formatted} ${unit}` : formatted;
}

// Abbreviates large numbers for compact display on the bars themselves,
// e.g. 555839 -> "556k", 1234567 -> "1.2M". Values under 1000 are shown as-is.
const COMPACT_UNITS: Array<{ value: number, suffix: string }> = [
    {value: 1e12, suffix: 'T'},
    {value: 1e9, suffix: 'B'},
    {value: 1e6, suffix: 'M'},
    {value: 1e3, suffix: 'k'},
];

// Byte-magnitude units scale by *advancing through this chain* (MB -> GB ->
// TB) rather than getting an SI "k"/"M" prefixed onto them - "1500 MB"
// should read as "1.5 GB", not the nonsensical "1.5k MB".
const BYTE_UNIT_CHAIN = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

function formatByteUnitValue(num: number, unit: string): string {
    const startIndex = BYTE_UNIT_CHAIN.indexOf(unit);
    let scaled = num;
    let unitIndex = startIndex;
    while (Math.abs(scaled) >= 1000 && unitIndex < BYTE_UNIT_CHAIN.length - 1) {
        scaled /= 1000;
        unitIndex++;
    }
    const formatted = Number.isInteger(scaled)
        ? scaled.toString()
        : scaled.toFixed(unitIndex === startIndex ? 2 : 1).replace(/\.?0+$/, '');
    return `${formatted} ${BYTE_UNIT_CHAIN[unitIndex]}`;
}

function compactNumberFormatter(value: string | number, unit = ''): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isFinite(num)) {
        return String(value);
    }
    if (BYTE_UNIT_CHAIN.includes(unit)) {
        return formatByteUnitValue(num, unit);
    }
    const suffix = unit ? ` ${unit}` : '';
    const abs = Math.abs(num);
    if (abs < 1000) {
        const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
        return `${formatted}${suffix}`;
    }
    const scale = COMPACT_UNITS.find((u) => abs >= u.value) ?? COMPACT_UNITS[COMPACT_UNITS.length - 1];
    const scaled = num / scale.value;
    const decimals = Math.abs(scaled) < 10 ? 1 : 0;
    return `${scaled.toFixed(decimals)}${scale.suffix}${suffix}`;
}

const MONOSPACE_FONT_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

// Minimum number of bars to show regardless of the cutoff share, so a single
// dominant entry doesn't collapse the chart down to just one or two bars.
const MIN_ITEMS_SHOWN = 5;

// Sorts descending by count and keeps only as many leading entries as needed
// to cover `shareThreshold` of the overall total - the long tail of small
// entries (which would otherwise need dozens of barely-readable bars) is
// dropped instead of relying on a fixed, arbitrary "top N" count.
function selectTopByShare(
    data: Array<ICountStats>,
    shareThreshold: number,
): { shown: Array<ICountStats>, hiddenCount: number, hiddenShare: number } {
    const sorted = [...data].sort((a, b) => b.cnt - a.cnt);
    const total = sorted.reduce((sum, item) => sum + item.cnt, 0);
    if (total <= 0 || sorted.length <= MIN_ITEMS_SHOWN) {
        return {shown: sorted, hiddenCount: 0, hiddenShare: 0};
    }

    let cumulative = 0;
    let cutoffIndex = 0;
    for (let i = 0; i < sorted.length; i++) {
        cumulative += sorted[i].cnt;
        cutoffIndex = i + 1;
        if (cumulative / total >= shareThreshold) {
            break;
        }
    }
    cutoffIndex = Math.max(cutoffIndex, Math.min(MIN_ITEMS_SHOWN, sorted.length));

    const shown = sorted.slice(0, cutoffIndex);
    const shownSum = shown.reduce((sum, item) => sum + item.cnt, 0);
    return {
        shown,
        hiddenCount: sorted.length - shown.length,
        hiddenShare: total > 0 ? 1 - shownSum / total : 0,
    };
}

function buildChartState(data: Array<ICountStats>, title: string, unit: string): { options: ApexOptions, series: ApexAxisChartSeries } {
    return {
        options: {
            colors: colors(data.length),
            legend: {
                show: false,
            },
            title: {text: title, align: "center"},
            chart: {},
            plotOptions: {
                bar: {
                    distributed: true,
                    borderRadius: 4,
                    borderRadiusApplication: 'end',
                    horizontal: true,
                }
            }, dataLabels: {
                style: {fontSize: "14"},
                formatter: (value: string | number) => compactNumberFormatter(value, unit),
            },
            tooltip: {
                y: {
                    // full, exact value on hover so nothing is lost to the abbreviation
                    formatter: (value: string | number) => thousandFormatter(value, unit),
                },
            },
            yaxis: {
                floating: false,
                labels: {
                    // Full, unabbreviated names - apexcharts truncates with its own
                    // ellipsis only if a label genuinely can't fit maxWidth.
                    maxWidth: 700,
                    align: 'right',
                    style: {
                        fontSize: "14",
                        fontFamily: MONOSPACE_FONT_STACK,
                    },
                },
            },
            xaxis: {
                categories: data.map(item => item.type),
                labels: {
                    formatter: (value: string) => compactNumberFormatter(value, unit),
                    trim: false,
                    style: {
                        fontSize: "14",
                    },
                },
            }
        },
        series: [
            {
                name: "",
                data: data.map(item => item.cnt)
            }
        ]
    };
}

export const CountStatsChart: FC<CountStatesChartProps> = ({title, api, cacheKey, unit = ''}) => {

    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState<{ options: ApexOptions, series: ApexAxisChartSeries } | null>(null);
    const [hiddenInfo, setHiddenInfo] = React.useState<{ hiddenCount: number, hiddenShare: number } | null>(null);
    const [errorMessageLoad, setErrorMessageLoad] = React.useState('');
    const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);
    const progress = useLoadingProgress();
    const {cutoffShare} = useChartSettings();
    const {refreshVersion} = useRefresh();
    const {t} = useTranslation();
    // Guards against firing the initial load twice for the same mount (e.g.
    // React StrictMode double-invoking effects), which used to double every
    // request. Manual/global refreshes bypass this on purpose.
    const hasStartedRef = useRef(false);
    const prevRefreshVersionRef = useRef(refreshVersion);
    // True only while THIS widget's request is the one actually executing in
    // the shared, single-concurrency queue - as opposed to merely queued.
    const isActive = useSyncExternalStore(subscribeQueue, () => getActiveKey() === cacheKey);

    function applyData(allData: Array<ICountStats>) {
        const {shown: data, hiddenCount, hiddenShare} = selectTopByShare(allData, cutoffShare);
        setHiddenInfo(hiddenCount > 0 ? {hiddenCount, hiddenShare} : null);
        setStats(buildChartState(data, title, unit));
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
            const allData = await runQueued(cacheKey, api);
            setCached(cacheKey, allData);
            applyData(allData);
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

    if (loading && !stats) {
        return <SuspenseLoaderInline success={false} pending={!isActive}></SuspenseLoaderInline>;
    }
    if (errorMessageLoad && !stats) {
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
                    <SpinningRefreshIcon spinning={loading && isActive} pending={loading && !isActive}/>
                </IconButton>
            </Box>
            {errorMessageLoad && (
                <Alert style={{marginTop: 8}} severity="error">{errorMessageLoad}</Alert>
            )}
            {stats && (
                <Chart style={{marginTop: 10}}
                       options={stats.options}
                       series={stats.series}
                       type="bar"
                       width="100%"
                       height={stats.series[0].data.length * 45}
                />
            )}
            {hiddenInfo && (
                <Typography variant="caption" color="text.secondary" align="center" display="block">
                    {t.moreEntries(hiddenInfo.hiddenCount, (hiddenInfo.hiddenShare * 100).toFixed(1))}
                </Typography>
            )}
        </>
    );
}
