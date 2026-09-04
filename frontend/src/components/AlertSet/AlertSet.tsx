import type {IShowAlerts} from "@dbstats/shared/src/stats";
import type {FC} from "react";
import { useEffect, useRef} from "react";
import * as React from "react";
import {Alert} from "@mui/material";
import {SuspenseLoaderInline} from "../SuspenseLoader";
import {useLoadingProgress} from "../../contexts/LoadingProgressContext";

type AlertSetProps = {
    api: () => Promise<Array< IShowAlerts >>,
}


export const AlertSet: FC<AlertSetProps> = ({api}) => {

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState(null);
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
            const response = await api();
            setData(response);
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
            <Alert severity="error">{errorMessageLoad}</Alert>)
    }
    if (loading) {
        return <SuspenseLoaderInline success={false}></SuspenseLoaderInline>;
    }

    if (!data.length) {
        return null;
    }
    return (
        <>
                {
                    data.map((el, index) => (<Alert style={{marginTop: 15}} key={index} severity={el.type}>{el.text}</Alert>))
                }
        </>
    );
}
