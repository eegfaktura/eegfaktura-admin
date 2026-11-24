import React, {FC} from "react";
import {Alert, List, ListItem, ListItemText, Stack, Typography} from "@mui/material";
import {BulkApplyResult, BulkField, BulkRow, rowKey} from "../../../services/bulkchange.service";
import {RowsTable, RunHints} from "./PreviewTable";
import {SKIP_TEXTS} from "./texts";

// Step 4, after apply: written hits with the hints of the applied plan, skipped hits with the reason. The
// skipped ones are named from the preview, since apply only returns their ids.
const ApplyResult: FC<{ field: BulkField, result: BulkApplyResult, previewRows: BulkRow[] }> = ({field, result, previewRows}) => {
  const byKey = new Map(previewRows.map(r => [rowKey(r), r]));
  const who = (k: string) => {
    const r = byKey.get(k);
    return r ? `${r.participantNumber || "ohne Nr."} ${r.name}` : k;
  };
  return (
    <Stack spacing={2}>
      <Alert severity={result.skipped.length ? "warning" : "success"}>
        <strong>{result.changed} geändert</strong>, {result.skipped.length} übersprungen. Rückgängig machen geht
        nicht: Eine Korrektur ist eine neue Massenänderung (z. B. „nur wo gleich“ dem falschen Wert).
      </Alert>
      <RunHints codes={result.runHints}/>
      {result.skipped.length > 0 && (
        <>
          <Typography variant="subtitle1">Übersprungen</Typography>
          <List dense>
            {result.skipped.map(s => {
              const k = rowKey(s);
              return (
                <ListItem key={k}>
                  <ListItemText primary={`${who(k)}${s.meteringPointId ? ` · ${s.meteringPointId}` : ""}`}
                                secondary={`${s.reason}: ${SKIP_TEXTS[s.reason] ?? "unbekannter Grund"}`}/>
                </ListItem>
              );
            })}
          </List>
        </>
      )}
      {result.rows.length > 0 && (
        <>
          <Typography variant="subtitle1">Geschrieben</Typography>
          <RowsTable field={field} rows={result.rows}/>
        </>
      )}
    </Stack>
  );
};

export default ApplyResult;
