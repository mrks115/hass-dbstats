import type {ICountStats, IShowAlerts} from "@dbstats/shared/src/stats";

// Timeout-ish statuses: 408 (client), 504 (gateway timeout), 524 (Cloudflare's
// own "a connection was established but the origin didn't respond in time").
// These come back with an HTML error page body, not JSON - handled specially
// below so the raw markup never ends up in the UI.
const TIMEOUT_STATUSES = [408, 504, 524];

async function checkResponse(response: Response) {
    if (response.status === 401) {
        throw new Error('Bad login or password')
    }
    if (response.status === 403) {
        throw new Error('Not enough permissions')
    }
    if ([200, 201, 202, 304].includes(response.status)) {
        return;
    }

    if (TIMEOUT_STATUSES.includes(response.status)) {
        throw new Error(
            `Request timed out (HTTP ${response.status}). The query may still be ` +
            `running on the server - try again in a moment.`
        );
    }

    // Only ever surface a response body that we know isn't an HTML error page
    // (proxy/gateway error pages come back as text/html and are not useful to
    // show verbatim). A JSON error body's "message" field is used when present;
    // short plain-text bodies are shown as-is; anything else falls back to a
    // generic status message.
    const contentType = response.headers.get('content-type') || '';
    let detail = '';
    if (contentType.includes('application/json')) {
        try {
            const body = await response.json();
            if (typeof body?.message === 'string') {
                detail = body.message;
            } else if (Array.isArray(body?.message)) {
                detail = body.message.join(', ');
            }
        } catch {
            // malformed JSON body - fall through to the generic message
        }
    } else if (!contentType.includes('text/html')) {
        try {
            const text = await response.text();
            if (text && text.length < 500) {
                detail = text;
            }
        } catch {
            // ignore
        }
    }

    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    if (detail) {
        errorMessage += ` - ${detail}`;
    }
    throw new Error(errorMessage);
}

const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        // 'Content-Type': 'application/x-www-form-urlencoded',
    };
}

async function countEventTypes(): Promise<Array<ICountStats>> {

    const url = `/addon-api/event/countEventTypes`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}

async function countEventsByDomain(): Promise<Array<ICountStats>> {

    const url = `/addon-api/event/countEventsByDomain`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}

async function countStates(): Promise<Array<ICountStats>> {

    const url = `/addon-api/state/countStates`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}
async function countAttributesSize(): Promise<Array<ICountStats>> {

    const url = `/addon-api/state/countAttributesSize`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}
async function countStatisticLong(): Promise<Array<ICountStats>> {

    const url = `/addon-api/statistic/long/count`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}

async function countStatisticShort(): Promise<Array<ICountStats>> {

    const url = `/addon-api/statistic/short/count`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}

async function getTableRows(): Promise<Array<ICountStats>> {

    const url = `/addon-api/system/getTableRows`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}

async function getTableSize(): Promise<Array<ICountStats>> {

    const url = `/addon-api/system/getTableSize`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}

async function countRecentStateWrites(): Promise<Array<ICountStats>> {

    const url = `/addon-api/state/countRecentStateWrites`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}

async function getTableSizeByCategory(): Promise<Array<ICountStats>> {

    const url = `/addon-api/system/getTableSizeByCategory`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}

async function getDbAlerts(): Promise<Array<IShowAlerts>> {

    const url = `/addon-api/system/getDbAlerts`;
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: getHeaders(),
    });
    await checkResponse(response);
    return response.json();
}


// Concurrency limiting moved to requestQueue.ts, keyed per-widget by
// cacheKey, so the UI can tell a truly running request apart from one
// still queued behind it. These exports are the plain, unwrapped calls.
export default {
    events: {
        countEventTypes,
        countEventsByDomain,
    },
    states: {
        countStates,
        countAttributesSize,
        countRecentStateWrites,
    },
    statistic: {
        countLong: countStatisticLong,
        countShort: countStatisticShort
    }, system: {
        getTableSize,
        getTableRows,
        getTableSizeByCategory,
        getDbAlerts,
    }
}
