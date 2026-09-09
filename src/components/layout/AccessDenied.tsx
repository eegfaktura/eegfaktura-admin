import React, {FC} from "react";
import {Alert, AlertTitle, Box, Button, Paper, Stack, Typography} from "@mui/material";
import {useAuth} from "react-oidc-context";

// Einzige Seite, die ein Konto ohne die Rolle `superuser` zu sehen bekommt. Der Sinn ist,
// den Grund an genau einer Stelle zu nennen — vorher war das Portal vollständig bedienbar
// und brach erst bei der jeweiligen Aktion mit einem nackten 403 ab.
const AccessDenied: FC = () => {
  const auth = useAuth();

  return (
    <Box sx={{display: "flex", justifyContent: "center", p: 4}}>
      <Paper sx={{p: 4, maxWidth: 640}}>
        <Stack spacing={2}>
          <Typography variant="h5">Kein Zugriff auf das Verwaltungsportal</Typography>

          <Alert severity="warning">
            <AlertTitle>Es fehlt die Rolle <strong>superuser</strong></AlertTitle>
            Dieses Portal ist ein Werkzeug des Betriebs. Es verwaltet Stammdaten und
            Energiedaten über alle Energiegemeinschaften hinweg und ist deshalb nicht Teil
            der EEG-Verwaltung.
          </Alert>

          <Typography variant="body2">
            Die Anmeldung hat funktioniert, aber dein Konto hat die dafür nötige Rolle nicht.
            Wenn du sie brauchst, wende dich an den Betrieb.
          </Typography>

          <Typography variant="body2">
            Wurde dir die Rolle gerade erst zugewiesen, ist einmal Abmelden und neu Anmelden
            nötig: Rollen stehen im Anmelde-Token und werden bei dessen Ausstellung
            festgeschrieben.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Für die Verwaltung deiner Energiegemeinschaft ist die EEGFaktura-Anwendung
            zuständig, nicht dieses Portal.
          </Typography>

          <Box>
            <Button variant="outlined" onClick={() => auth.removeUser()}>
              Abmelden
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AccessDenied;
