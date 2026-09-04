import {
    Card,
    useTheme, Alert, Grid, CardContent, CardHeader, Link
} from '@mui/material';
import * as React from "react";
import apiClient from "../../../apiClient";
import {Helmet} from "react-helmet-async";
import PageTitleWrapper from "../../../components/PageTitleWrapper";
import PageTitle from "../../../components/PageTitle";
import Container from "@mui/material/Container";
import Footer from "../../../components/Footer";
import {CountStatsChart} from "../../../components/Charts/CountStatsChart";
import {AlertSet} from "../../../components/AlertSet/AlertSet";
import {LoadingProgressProvider} from "../../../contexts/LoadingProgressContext";
import {LoadingProgressBar} from "../../../components/LoadingProgressBar/LoadingProgressBar";

// Keep in sync with the number of widgets below that load data via apiClient
// (each CountStatsChart / AlertSet reports exactly once when it settles).
const TOTAL_WIDGETS = 9;

function DatabaseStats() {
    return (
        <LoadingProgressProvider total={TOTAL_WIDGETS}>
            <Helmet>
                <title>Database stats</title>
            </Helmet>
            <PageTitleWrapper>
                <PageTitle
                    heading="Database stats"
                    subHeading="Different database stats"
                />
            </PageTitleWrapper>
            <Container maxWidth="lg">
                <LoadingProgressBar/>
                <Grid
                    container
                    direction="row"
                    justifyContent="center"
                    alignItems="stretch"
                >
                    <Grid item xs={12}>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title="Generic database stats"></CardHeader>
                            <CardContent>
                                <Alert severity="info">If you are unfamiliar with HA tables, you can read about them <Link href="https://data.home-assistant.io/docs/data">here</Link></Alert>
                                <AlertSet api={apiClient.system.getDbAlerts}></AlertSet>
                                <CountStatsChart api={apiClient.system.getTableRows}
                                                 title="Number of rows in tables"/>
                                <CountStatsChart api={apiClient.system.getTableSize}
                                                 title="Table size in MB"/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title="Events"></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.events.countEventTypes}
                                                 title="Count event types"/>
                                <CountStatsChart api={apiClient.events.countEventsByDomain}
                                                 title="Count events by domain"/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title="States"></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.states.countStates}
                                                 title="Count states"/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title="Attributes"></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.states.countAttributesSize}
                                                 title="Shared attributes size, MB"/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title="Long term statistics"></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.statistic.countLong}
                                                 title="Count long term statistics"/>
                            </CardContent></Card>
                        <Card style={{marginTop: 25}}>
                            <CardHeader title="Short term statistics"></CardHeader>
                            <CardContent>
                                <CountStatsChart api={apiClient.statistic.countShort}
                                                 title="Count short term statistics"/>
                            </CardContent></Card>
                    </Grid>
                </Grid>
            </Container>
            <Footer/>
        </LoadingProgressProvider>
    );
}

export default DatabaseStats;
