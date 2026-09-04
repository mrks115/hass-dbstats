import type {FC} from "react";
import {keyframes} from "@emotion/react";
import RefreshIcon from "@mui/icons-material/Refresh";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

type SpinningRefreshIconProps = {
    // True while the refresh this icon belongs to is actually in progress -
    // clicking "refresh" should visibly spin the icon until the new data
    // has arrived, not just disable the button.
    spinning: boolean,
    // True while this widget is loading but queued behind another widget's
    // request in the shared, single-concurrency queue - shown as a static
    // hourglass so it's clear this one hasn't started yet, rather than
    // spinning alongside a request that's actually running.
    pending?: boolean,
    fontSize?: "small" | "inherit" | "medium" | "large",
}

export const SpinningRefreshIcon: FC<SpinningRefreshIconProps> = ({spinning, pending = false, fontSize = "small"}) => {
    if (pending) {
        return <HourglassEmptyIcon fontSize={fontSize} color="disabled"/>;
    }
    return (
        <RefreshIcon fontSize={fontSize}
                     sx={spinning ? {animation: `${spin} 0.9s linear infinite`} : undefined}/>
    );
}
