import React, {FC} from "react";
import {Alert, Box, Button, List, ListItem, ListItemText, Stack, Typography} from "@mui/material";
import {BulkApplyResult, BulkField, BulkRow, BulkSkip, rowKey} from "../../../services/bulkchange.service";
import {num, RowsTable, RunHints} from "./PreviewTable";
import {SKIP_TEXTS} from "./texts";

// Step 4, after apply: written hits with the hints of the applied plan (also as CSV for the ticket), skipped
// hits with the reason. The skipped ones are named from the preview, since apply only returns their ids.

// "F3: Das Mandatsdatum …" for a row error, the text alone otherwise; never the raw enum
export const skipText = (s: BulkSkip) => {
  const text = SKIP_TEXTS[s.reason] ?? "aus unbekanntem Grund übersprungen";
  return /^F\d$/.test(s.reason) ? `${s.reason}: ${text}` : text;
};

const ApplyResult: FC<{
  field: BulkField, result: BulkApplyResult, previewRows: BulkRow[], onDownload: (rows: BulkRow[]) => void,
}> = ({field, result, previewRows, onDownload}) => {
  const byKey = new Map(previewRows.map(r => [rowKey(r), r]));
  const who = (k: string) => {
    const r = byKey.get(k);
    return r ? `${r.participantNumber || "ohne Nr."} ${r.name}` : k;
  };
  const skipped = result.skipped.length;
  return (
    <Stack spacing={2}>
      <Alert severity={skipped ? "warning" : "success"}>
        <strong>{num(result.changed)} Treffer geändert</strong>
        {skipped > 0 && `, ${num(skipped)} übersprungen`}. Rückgängig machen geht nicht: Eine Korrektur ist eine
        neue Massenänderung (z. B. „nur wo gleich …“ dem falschen Wert).
      </Alert>
      <RunHints codes={result.runHints}/>
      {skipped > 0 && (
        <>
          <Typography variant="subtitle1" component="h3">Übersprungen</Typography>
          <Box sx={{maxHeight: 300, overflowY: "auto"}}>
            <List dense>
              {result.skipped.map(s => {
                const k = rowKey(s);
                return (
                  <ListItem key={k}>
                    <ListItemText primary={`${who(k)}${s.meteringPointId ? ` · ${s.meteringPointId}` : ""}`}
                                  secondary={skipText(s)}/>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </>
      )}
      {result.rows.length > 0 && (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" component="h3">Geschrieben</Typography>
            <Button variant="outlined" onClick={() => onDownload(result.rows)}>Herunterladen (CSV)</Button>
          </Stack>
          <RowsTable field={field} rows={result.rows}/>
        </>
      )}
    </Stack>
  );
};

export default ApplyResult;
