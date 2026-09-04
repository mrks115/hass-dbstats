import type {FC} from "react";
import {Box, LinearProgress, Typography} from "@mui/material";
import {useLoadingProgress} from "../../contexts/LoadingProgressContext";
import {useTranslation} from "../../i18n";

// Shows overall load progress ("Loading X of Y (Z%)") for all the widgets on
// the page that report into LoadingProgressProvider. Renders nothing once
// everything has finished loading (or a refresh hasn't reset it yet).
export const LoadingProgressBar: FC = () => {
    const progress = useLoadingProgress();
    const {t} = useTranslation();

    if (!progress || progress.completed >= progress.total) {
        return null;
    }

    const percent = progress.total > 0
        ? Math.round((progress.completed / progress.total) * 100)
        : 0;

    return (
        <Box style={{marginTop: 25, marginBottom: 10}}>
            <Typography variant="body2" color="textSecondary" style={{marginBottom: 6}}>
                {t.loadingProgress(progress.completed, progress.total, percent)}
            </Typography>
            <LinearProgress variant="determinate" value={percent}/>
        </Box>
    );
}
