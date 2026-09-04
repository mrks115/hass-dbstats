import type {FC} from "react";
import {useEffect, useRef} from "react";
import * as React from "react";
import Chart from "react-apexcharts";
import {Alert} from "@mui/material";
import {SuspenseLoaderInline} from "../SuspenseLoader";
import type {ICountStats} from "@dbstats/shared/src/stats";
import type {ApexOptions} from "apexcharts";
import colors from "./colors";
import {useLoadingProgress} from "../../contexts/LoadingProgressContext";

type CountStatesChartProps = {
    title: string,
    api: () => Promise<Array<ICountStats>>,
}

function thousandFormatter(value: string | number): string {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (num < 1000) {
        return num.toString();
    }
    return num.toLocaleString('en-us');
}

// Abbreviates large numbers for compact display on the bars themselves,
// e.g. 555839 -> "556k", 1234567 -> "1.2M". Values under 1000 are shown as-is.
const COMPACT_UNITS: Array<{ value: number, suffix: string }> = [
    {value: 1e12, suffix: 'T'},
    {value: 1e9, suffix: 'B'},
    {value: 1e6, suffix: 'M'},
    {value: 1e3, suffix: 'k'},
];

function compactNumberFormatter(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isFinite(num)) {
        return String(value);
    }
    const abs = Math.abs(num);
    if (abs < 1000) {
        return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
    }
    const unit = COMPACT_UNITS.find((u) => abs >= u.value) ?? COMPACT_UNITS[COMPACT_UNITS.length - 1];
    const scaled = num / unit.value;
    const decimals = Math.abs(scaled) < 10 ? 1 : 0;
    return `${scaled.toFixed(decimals)}${unit.suffix}`;
}

const MONOSPACE_FONT_STACK = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

// Entity/statistic ids can get long (e.g. "sensor.shellypro3em_f8b3b77cbef4_total_active_power").
// Keep the "domain." prefix (it's useful context) and, if the id is still too
// long, collapse the unreadable middle (often a device id/hash) while keeping
// enough of the start (domain + object name start) and end to stay identifiable.
function shortenEntityLabel(value: string | number, maxLength = 36): string {
    if (typeof value !== 'string') {
        return String(value);
    }
    if (value.length <= maxLength) {
        return value;
    }
    const keep = maxLength - 1; // reserve one char for the ellipsis
    const front = Math.ceil(keep * 0.65);
    const back = keep - front;
    return `${value.slice(0, front)}…${value.slice(value.length - back)}`;
}

export const CountStatsChart: FC<CountStatesChartProps> = ({title, api}) => {

    const [loading, setLoading] = React.useState(true);
    const [stats, setStats] = React.useState(null);
    const [errorMessageLoad, setErrorMessageLoad] = React.useState('');
    const progress = useLoadingProgress();
    // Guards against firing the load twice for the same mount (e.g. React
    // StrictMode double-invoking effects), which used to double every request.
    const hasStartedRef = useRef(false);

    function loadStats() {
        if (hasStartedRef.current) {
            return;
        }
        hasStartedRef.current = true;

        const fetchData = async () => {
            setLoading(true);
            const data = await api();

            const state: { options: ApexOptions, series: ApexAxisChartSeries } = {
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
                        formatter: compactNumberFormatter,
                    },
                    tooltip: {
                        y: {
                            // full, exact value on hover so nothing is lost to the abbreviation
                            formatter: thousandFormatter,
                        },
                    },
                    yaxis: {
                        floating: false,
                        labels: {
                            maxWidth: 700,
                            align: 'right',
                            formatter: shortenEntityLabel,
                            style: {
                                fontSize: "14",
                                fontFamily: MONOSPACE_FONT_STACK,
                            },
                        },
                    },
                    xaxis: {
                        categories: data.map(item => item.type),
                        labels: {
                            formatter: compactNumberFormatter,
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
            setStats(state);
            setLoading(false);
        }
        fetchData()
            // make sure to catch any error
            .catch((err) => setErrorMessageLoad(err.message))
            // report progress once the request has settled, success or failure
            .finally(() => progress?.reportDone());
    }

    // Runs once on mount; hasStartedRef makes re-invocation (StrictMode, dep
    // churn) a no-op, so 'api'/'progress' are intentionally excluded here.
    useEffect(loadStats, []);
    if (errorMessageLoad) {
        return (
            <Alert style={{marginTop: 25}} severity="error">{errorMessageLoad}</Alert>)
    }
    if (loading) {
        return <SuspenseLoaderInline success={false}></SuspenseLoaderInline>;
    }

    return (
        <Chart style={{marginTop: 25}}
               options={stats.options}
               series={stats.series}
               type="bar"
               width="100%"
               height={stats.series[0].data.length * 45}
        />
    );
}
