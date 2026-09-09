import React from 'react';
import './App.css';
import MainLayout from "./components/layout/MainLayout";
import { routes } from "./routes";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {hasAuthParams, useAuth} from "react-oidc-context";
import {createTheme, ThemeOptions, ThemeProvider} from "@mui/material";
import {LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import AccessDenied from "./components/layout/AccessDenied";
import {hasSuperuserRole} from "./services/superuser";
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

  // Dieses Portal ist ein Betriebswerkzeug: es verwaltet Stammdaten und Energiedaten
  // ueber alle Energiegemeinschaften hinweg. Der Keycloak-Client ist ein oeffentlicher
  // Client mit Standard-Flow, jeder Realm-Nutzer kann sich also anmelden. Wer die Rolle
  // nicht hat, bekommt hier EINE klare Meldung statt einer scheinbar bedienbaren
  // Oberflaeche, die bei jeder Aktion mit 403 abbricht.
  //
  // Durchgesetzt wird die Berechtigung serverseitig (admin-backend); dies ist die
  // Anzeige dazu, kein Ersatz.
  const superuser = hasSuperuserRole(auth.user?.access_token);

  if (auth.isAuthenticated && !superuser) {
    return (
      <ThemeProvider theme={theme}>
        <AccessDenied/>
      </ThemeProvider>
    );
  }

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
