import type {FC} from 'react';
import { useEffect} from 'react';
import NProgress from 'nprogress';
import {Box, CircularProgress, IconButton} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

export enum LoaderState {
  Off,
  On,
  Success,
}

interface LoaderProps {
    success?: boolean,
    // True while this widget's request is queued behind the shared,
    // single-concurrency request queue but hasn't actually started yet -
    // shown as a static hourglass instead of a spinner, so the page doesn't
    // look like everything is loading in parallel when really only one
    // request is in flight at a time.
    pending?: boolean,
}
export const SuspenseLoader: FC<LoaderProps> = ({
                                             success=false,
                                               }) => {
  useEffect(() => {
    NProgress.start();

    return () => {
      NProgress.done();
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%'
      }}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
        {success? <IconButton style={{fontSize: 64}}><CheckIcon color='success' fontSize='inherit' /></IconButton> : <CircularProgress size={64} disableShrink thickness={3} /> }
    </Box>
  );
}


export const SuspenseLoaderInline: FC<LoaderProps> = ({
                                             success=false,
                                             pending=false,
                                         }) => {
    // Only pulse the global top progress bar for a request that's actually
    // running - a merely-queued widget hasn't started any real work yet.
    useEffect(() => {
        if (pending || success) {
            return;
        }
        NProgress.start();

        return () => {
            NProgress.done();
        };
    }, [pending, success]);

    if (success) {
        return <IconButton style={{fontSize: 64}}><CheckIcon color='success' fontSize='inherit' /></IconButton>;
    }
    if (pending) {
        return <IconButton style={{fontSize: 64}}><HourglassEmptyIcon color='disabled' fontSize='inherit' /></IconButton>;
    }
    return <CircularProgress size={64} disableShrink thickness={3} />;
}
