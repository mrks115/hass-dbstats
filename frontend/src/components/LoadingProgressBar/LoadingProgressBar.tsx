import type {FC} from "react";
import {Box, LinearProgress, Typography} from "@mui/material";
import {useLoadingProgress} from "../../contexts/LoadingProgressContext";

// Shows overall load progress ("loading X of Y (Z%)") for all the widgets on
// the page that report into LoadingProgressProvider. Renders nothing once
// everything has finished loading.
export const LoadingProgressBar: FC = () => {
    const progress = useLoadingProgress();

    if (!progress || progress.completed >= progress.total) {
        return null;
    }

    const percent = progress.total > 0
        ? Math.round((progress.completed / progress.total) * 100)
        : 0;

    return (
        <Box style={{marginTop: 25, marginBottom: 10}}>
            <Typography variant="body2" color="textSecondary" style={{marginBottom: 6}}>
                Lade {progress.completed} von {progress.total} ({percent}%)
            </Typography>
            <LinearProgress variant="determinate" value={percent}/>
        </Box>
    );
}
