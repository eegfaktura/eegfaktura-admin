import React from 'react';
import './App.css';
import MainLayout from "./components/layout/MainLayout";
import { routes } from "./routes";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {hasAuthParams, useAuth} from "react-oidc-context";
import {createTheme, ThemeOptions, ThemeProvider} from "@mui/material";
import {LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import "moment/locale/de";

export const IDENTITY_CONFIG = {
  response_type: "id_token token",
  automaticSilentRenew: false,
  loadUserInfo: false,
};

export const METADATA_OIDC = {
};

export const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#2B6860',
      light: '#88dcb6',
      contrastText: '#b9bab9',
    },
    secondary: {
      main: '#dc631e',
    },
    background: {
      default: '#EAE7D9',
      paper: '#f9f7ec',
    },
  },
};
const theme = createTheme(themeOptions)

function App() {
  const auth = useAuth()
  // automatically sign-in
  React.useEffect(() => {

    const authP = hasAuthParams()

    if (!hasAuthParams() && !auth.isAuthenticated && !auth.activeNavigator && !auth.isLoading) {
      auth.signinRedirect();
    }
  }, [auth.isAuthenticated, auth.activeNavigator, auth.isLoading, auth.signinRedirect]);

  return (
    <ThemeProvider theme={theme}>
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="de">
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {routes}
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
    </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
