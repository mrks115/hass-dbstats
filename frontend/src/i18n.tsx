import * as React from 'react';
import type { FC, ReactNode } from 'react';

export type Language = 'en' | 'de';

const STORAGE_KEY = 'dbstats:language';

export type Translations = {
    pageTitle: string;
    heading: string;
    subHeading: string;
    infoAlertPrefix: string;
    infoAlertLinkText: string;
    genericStats: string;
    events: string;
    states: string;
    attributes: string;
    longTermStats: string;
    shortTermStats: string;
    tableRows: string;
    tableSize: string;
    countEventTypes: string;
    countEventsByDomain: string;
    countStates: string;
    attributesSize: string;
    countLongTerm: string;
    countShortTerm: string;
    recorderLoad: string;
    recentWrites: string;
    sizeByCategory: string;
    cutoffLabel: (percent: number) => string;
    moreEntries: (count: number, percent: string) => string;
    loadingProgress: (completed: number, total: number, percent: number) => string;
    refreshAll: string;
    refreshWidget: string;
    lastUpdated: (time: string) => string;
    neverUpdated: string;
    language: string;
};

const translations: Record<Language, Translations> = {
    en: {
        pageTitle: 'Database Stats',
        heading: 'Database Stats',
        subHeading: 'Size and growth of your Home Assistant recorder database',
        infoAlertPrefix: 'If you are unfamiliar with HA tables, you can read about them',
        infoAlertLinkText: 'here',
        genericStats: 'Generic database stats',
        events: 'Events',
        states: 'States',
        attributes: 'Attributes',
        longTermStats: 'Long term statistics',
        shortTermStats: 'Short term statistics',
        tableRows: 'Number of rows in tables',
        tableSize: 'Table size in MB',
        countEventTypes: 'Count event types',
        countEventsByDomain: 'Count events by domain',
        countStates: 'Count states',
        attributesSize: 'Shared attributes size, MB',
        countLongTerm: 'Count long term statistics',
        countShortTerm: 'Count short term statistics',
        recorderLoad: 'Recorder load',
        recentWrites: 'Most active entities (last 7 days)',
        sizeByCategory: 'Database size by category',
        cutoffLabel: (percent: number) => `Chart detail: show entries covering ${percent}% of each total`,
        moreEntries: (count: number, percent: string) => `+${count} more, ${percent}% of total`,
        loadingProgress: (completed: number, total: number, percent: number) =>
            `Loading ${completed} of ${total} (${percent}%)`,
        refreshAll: 'Refresh all',
        refreshWidget: 'Refresh',
        lastUpdated: (time: string) => `Updated ${time}`,
        neverUpdated: 'Not loaded yet',
        language: 'Language',
    },
    de: {
        pageTitle: 'Datenbankstatistiken',
        heading: 'Datenbankstatistiken',
        subHeading: 'Größe und Wachstum deiner Home-Assistant-Recorder-Datenbank',
        infoAlertPrefix: 'Falls dir die HA-Tabellen nicht geläufig sind, kannst du hier mehr darüber lesen',
        infoAlertLinkText: 'hier',
        genericStats: 'Allgemeine Datenbankstatistiken',
        events: 'Events',
        states: 'States',
        attributes: 'Attribute',
        longTermStats: 'Langzeitstatistiken',
        shortTermStats: 'Kurzzeitstatistiken',
        tableRows: 'Anzahl Zeilen pro Tabelle',
        tableSize: 'Tabellengröße in MB',
        countEventTypes: 'Anzahl Event-Typen',
        countEventsByDomain: 'Anzahl Events nach Domain',
        countStates: 'Anzahl States',
        attributesSize: 'Größe geteilter Attribute, MB',
        countLongTerm: 'Anzahl Langzeitstatistiken',
        countShortTerm: 'Anzahl Kurzzeitstatistiken',
        recorderLoad: 'Recorder-Auslastung',
        recentWrites: 'Aktivste Entities (letzte 7 Tage)',
        sizeByCategory: 'Datenbankgröße nach Kategorie',
        cutoffLabel: (percent: number) => `Detailgrad: zeige Einträge bis ${percent}% der jeweiligen Summe`,
        moreEntries: (count: number, percent: string) => `+${count} weitere, ${percent}% der Summe`,
        loadingProgress: (completed: number, total: number, percent: number) =>
            `Lade ${completed} von ${total} (${percent}%)`,
        refreshAll: 'Alles aktualisieren',
        refreshWidget: 'Aktualisieren',
        lastUpdated: (time: string) => `Aktualisiert ${time}`,
        neverUpdated: 'Noch nicht geladen',
        language: 'Sprache',
    },
};

function detectDefaultLanguage(): Language {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'de') {
            return stored;
        }
    } catch {
        // ignore, fall through to browser-language detection
    }
    // No explicit preference saved yet - fall back to the browser's language.
    // In a Home Assistant ingress setup this is normally the same language
    // the user has their HA frontend set to, since it's the same browser;
    // there's no ingress-provided "HA language" header to read instead.
    const browserLang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en';
    return browserLang.toLowerCase().startsWith('de') ? 'de' : 'en';
}

type LanguageContextValue = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
};

const LanguageContext = React.createContext<LanguageContextValue>({
    language: 'en',
    setLanguage: () => {
    },
    t: translations.en,
});

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = React.useState<Language>(detectDefaultLanguage);

    const setLanguage = React.useCallback((lang: Language) => {
        setLanguageState(lang);
        try {
            window.localStorage.setItem(STORAGE_KEY, lang);
        } catch {
            // best-effort only
        }
    }, []);

    const value = React.useMemo(
        () => ({ language, setLanguage, t: translations[language] }),
        [language, setLanguage],
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export function useTranslation(): LanguageContextValue {
    return React.useContext(LanguageContext);
}
