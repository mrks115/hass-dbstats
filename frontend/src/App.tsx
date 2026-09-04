import {useRoutes} from 'react-router-dom';
import router from 'src/router';

import {LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns'

import {CssBaseline} from '@mui/material';
import ThemeProvider from './theme/ThemeProvider';

function App() {
    const content = useRoutes(router);
    return (
                <ThemeProvider>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <CssBaseline/>
                        {content}
                    </LocalizationProvider>
                </ThemeProvider>
    );
}

export default App;
