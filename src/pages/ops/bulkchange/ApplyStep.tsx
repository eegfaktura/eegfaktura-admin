import React, {FC} from "react";
import {Alert, Button, Checkbox, FormControlLabel, LinearProgress, Stack, Typography} from "@mui/material";
import {BulkCommunity, BulkRule, BulkTariff} from "../../../services/bulkchange.service";
import {num} from "./PreviewTable";
import {ErrorView, ruleSummary} from "./texts";

// Step 4: what is about to happen (community and rule in one line, the effects), the confirmation and the
// apply button; an apply error that keeps the preview (409, 413, …) is shown here, next to the button.
const ApplyStep: FC<{
  community: BulkCommunity, rule: BulkRule, tariffs: BulkTariff[] | null, changedCount: number,
  checked: boolean, onCheck: (v: boolean) => void, busy: boolean, applying: boolean, error: ErrorView | null,
  onApply: () => void,
}> = ({community, rule, tariffs, changedCount, checked, onCheck, busy, applying, error, onApply}) => (
  <Stack spacing={2}>
    <Typography sx={{fontWeight: 500}}>{ruleSummary(rule, community, tariffs)}</Typography>
    <Alert severity="info">
      Keine Meldung an den Netzbetreiber, keine Mail an Mitglieder. Dass unterschriebene Einzugsermächtigungen
      vorliegen, bestätigt die Gemeinschaft. Keine Rücknahme: Alte Werte werden nicht gespeichert; eine falsche
      Änderung wird mit einer neuen Massenänderung korrigiert. Geschrieben werden nur die geänderten Treffer, deren
      Werte noch der Vorschau entsprechen — alles in einem Schritt oder gar nichts.
    </Alert>
    {changedCount === 0
      ? <Alert severity="info">Nichts zu ändern.</Alert>
      : (
        <Stack direction={{xs: "column", md: "row"}} spacing={2} alignItems={{md: "center"}}>
          <FormControlLabel label={`Vorschau für ${community.name} (${community.tenant}) geprüft`} control={
            <Checkbox checked={checked} disabled={busy} onChange={e => onCheck(e.target.checked)}/>}/>
          <Typography variant="body2" color="text.secondary">Vorher die Vorschau herunterladen (für das Ticket).</Typography>
          <Button variant="contained" color="error" onClick={onApply} disabled={!checked || busy}>
            {changedCount === 1 ? "1 Änderung anwenden" : `${num(changedCount)} Änderungen anwenden`}
          </Button>
        </Stack>
      )}
    {applying && <LinearProgress aria-label="Anwenden läuft"/>}
    {error && <Alert severity="error">{error.text}</Alert>}
  </Stack>
);

export default ApplyStep;
