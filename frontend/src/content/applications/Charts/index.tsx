import {
    Card, Grid, CardContent, CardHeader, Slider, Typography, Box,
    ToggleButton, ToggleButtonGroup, Button
} from '@mui/material';
import RefreshIcon from "@mui/icons-material/Refresh";
import apiClient from "../../../apiClient";
import {Helmet} from "react-helmet-async";
import PageTitleWrapper from "../../../components/PageTitleWrapper";
import PageTitle from "../../../components/PageTitle";
import Container from "@mui/material/Container";
import Footer from "../../../components/Footer";
import {CountStatsChart} from "../../../components/Charts/CountStatsChart";
import {DonutStatsChart} from "../../../components/Charts/DonutStatsChart";
import {AlertSet} from "../../../components/AlertSet/AlertSet";
import {LoadingProgressProvider, useLoadingProgress} from "../../../contexts/LoadingProgressContext";
import {LoadingProgressBar} from "../../../components/LoadingProgressBar/LoadingProgressBar";
import {ChartSettingsProvider, useChartSettings} from "../../../contexts/ChartSettingsContext";
import {RefreshProvider, useRefresh} from "../../../contexts/RefreshContext";
import {LanguageProvider, useTranslation} from "../../../i18n";
import type {Language} from "../../../i18n";

// Keep in sync with the number of widgets below that load data via apiClient
// (each CountStatsChart / AlertSet reports exactly once when it settles).
const TOTAL_WIDGETS = 11;

// Lets the user trade off "fewer, cleaner bars" against "see everything" for
// all charts on the page at once - a widget stops adding bars once this share
// of its total is covered, dropping the long tail of small entries.
function CutoffShareControl() {
    const {cutoffShare, setCutoffShare} = useChartSettings();
    const {t} = useTranslation();
    return (
        <Box sx={{maxWidth: 420, mt: 2, mb: 1}}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {t.cutoffLabel(Math.round(cutoffShare * 100))}
            </Typography>
            <Slider
                value={cutoffShare}
                min={0.5}
                max={1}
                step={0.01}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                onChange={(_event, value) => setCutoffShare(Array.isArray(value) ? value[0] : value)}
            />
        </Box>
    );
}

function LanguageToggle() {
    const {language, setLanguage, t} = useTranslation();
    return (
        <ToggleButtonGroup
            size="small"
            value={language}
            exclusive
            aria-label={t.language}
            onChange={(_event, value: Language | null) => {
                if (value) {
                    setLanguage(value);
                }
            }}
        >
            <ToggleButton value="en">EN</ToggleButton>
            <ToggleButton value="de">DE</ToggleButton>
        </ToggleButtonGroup>
    );
}

function TopBar() {
    const {refreshAll} = useRefresh();
    const progress = useLoadingProgress();
    const {t} = useTranslation();

    const handleRefreshAll = () => {
        progress?.reset();
        refreshAll();
    };

    return (
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2}}>
            <Button variant="outlined" size="small" startIcon={<RefreshIcon/>} onClick={handleRefreshAll}>
                {t.refreshAll}
            </Button>
            <LanguageToggle/>
        </Box>
    );
}

function DatabaseStatsContent() {
    const {t} = useTranslation();
    return (
        <>
            <Helmet>
                <title>{t.pageTitle}</title>
            </Helmet>
            <PageTitleWrapper>
                <PageTitle
                    heading={t.heading}
                    subHeading={t.subHeading}
                />
            </PageTitleWrapper>
            <Container maxWidth="lg">
                <TopBar/>
                <LoadingProgressBar/>
                <CutoffShareControl/>
                <Grid
                    container
                    direction="row"
                    justifyContent="center"
                    alignItems="stretch"
                >
                    <Grid item xs={12}>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title={t.genericStats}></CardHeader>
                            <CardContent>
                                <AlertSet api={apiClient.system.getDbAlerts} cacheKey="dbAlerts"></AlertSet>
                                <CountStatsChart api={apiClient.system.getTableRows}
                                                 cacheKey="tableRows"
                                                 title={t.tableRows}/>
                                <CountStatsChart api={apiClient.system.getTableSize}
                                                 cacheKey="tableSize"
                                                 unit="MB"
                                                 title={t.tableSize}/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title={t.events}></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.events.countEventTypes}
                                                 cacheKey="countEventTypes"
                                                 title={t.countEventTypes}/>
                                <CountStatsChart api={apiClient.events.countEventsByDomain}
                                                 cacheKey="countEventsByDomain"
                                                 title={t.countEventsByDomain}/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title={t.states}></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.states.countStates}
                                                 cacheKey="countStates"
                                                 title={t.countStates}/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title={t.attributes}></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.states.countAttributesSize}
                                                 cacheKey="countAttributesSize"
                                                 title={t.attributesSize}/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title={t.longTermStats}></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.statistic.countLong}
                                                 cacheKey="countLongTerm"
                                                 title={t.countLongTerm}/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title={t.shortTermStats}></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.statistic.countShort}
                                                 cacheKey="countShortTerm"
                                                 title={t.countShortTerm}/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title={t.recorderLoad}></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.states.countRecentStateWrites}
                                                 cacheKey="countRecentStateWrites"
                                                 title={t.recentWrites}/>
                                <DonutStatsChart api={apiClient.system.getTableSizeByCategory}
                                                 cacheKey="tableSizeByCategory"
                                                 unit="MB"
                                                 title={t.sizeByCategory}/>
                            </CardContent></Card>
                </Grid>
            </Grid>
        </Container>
            <Footer/>
        </>
    );
}

function DatabaseStats() {
    return (
        <LanguageProvider>
            <RefreshProvider>
                <ChartSettingsProvider>
                    <LoadingProgressProvider total={TOTAL_WIDGETS}>
                        <DatabaseStatsContent/>
                    </LoadingProgressProvider>
                </ChartSettingsProvider>
            </RefreshProvider>
        </LanguageProvider>
    );
}

export default DatabaseStats;
