import React, {FC, useRef, useState} from "react";
import {Alert, Button, MenuItem, Stack, TextField, Typography} from "@mui/material";
import {BulkField, BulkFileValue} from "../../../services/bulkchange.service";
import {columnOptions, extractValues, FileSummary, guessHeaderRow, MAX_FILE_VALUES, readSheets, Sheet} from "./fileValues";
import {FIELD_LABELS} from "./texts";

// "Wert aus Datei": choose the file, the sheet, the header row and the two columns. The file is read in the browser
// only; onChange gets the pairs of member number and value once both columns are chosen, null otherwise.

interface FileState {
  fileName: string;
  sheets: Sheet[];
  sheet: number;
  header: number; // 0-based
  numberCol: number | "";
  valueCol: number | "";
}

const num = (n: number) => n.toLocaleString("de-AT");

export function summaryText(s: FileSummary, sent: number): string {
  const parts = [`${num(s.rows)} Zeilen mit Mitgliedsnummer`, `${num(sent)} mit Wert`];
  if (s.emptyValue) parts.push(`${num(s.emptyValue)} ohne Wert (bleiben unverändert)`);
  if (s.noNumber) parts.push(`${num(s.noNumber)} ohne Mitgliedsnummer (werden ignoriert)`);
  if (s.duplicateSame) parts.push(`${num(s.duplicateSame)} Nummern doppelt mit gleichem Wert`);
  if (s.duplicateConflict) parts.push(`${num(s.duplicateConflict)} Nummern doppelt mit verschiedenen Werten (Fehler F8)`);
  return parts.join(" · ");
}

const FileValuesInput: FC<{ field: BulkField, disabled: boolean, onChange: (values: BulkFileValue[] | null) => void }> = ({field, disabled, onChange}) => {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<FileState | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  const rows = state?.sheets[state.sheet]?.rows ?? [];
  const extracted = state && state.numberCol !== "" && state.valueCol !== ""
    ? extractValues(rows, state.header, state.numberCol, state.valueCol, field) : null;

  // a new state of the inputs: emit the values right away (no effect: the parent passes a new onChange every render)
  const update = (next: FileState | null) => {
    setState(next);
    const r = next?.sheets[next.sheet]?.rows ?? [];
    onChange(next && next.numberCol !== "" && next.valueCol !== ""
      ? extractValues(r, next.header, next.numberCol, next.valueCol, field).values : null);
  };

  const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // the same file again sends a change event
    if (!file) return;
    try {
      const sheets = readSheets(await file.arrayBuffer(), file.name);
      setReadError(sheets.length === 0 ? "Die Datei enthält kein Blatt." : null);
      update(sheets.length === 0 ? null : {
        fileName: file.name, sheets, sheet: 0, header: Math.max(guessHeaderRow(sheets[0].rows), 0), numberCol: "", valueCol: "",
      });
    } catch {
      setReadError("Die Datei konnte nicht gelesen werden (XLSX, XLS oder CSV).");
      update(null);
    }
  };

  const columns = state ? columnOptions(rows, state.header) : [];
  const columnSelect = (label: string, value: number | "", onValue: (v: number) => void) => (
    <TextField select label={label} value={value} fullWidth disabled={disabled || columns.length === 0}
               helperText={columns.length === 0 ? "Die Kopfzeile hat keine Überschriften" : " "}
               onChange={e => onValue(Number(e.target.value))}>
      {columns.map(c => <MenuItem key={c.index} value={c.index}>{c.label}</MenuItem>)}
    </TextField>
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <input ref={input} type="file" accept=".xlsx,.xls,.csv" hidden onChange={choose} data-testid="bulk-file-input"/>
        <Button variant="outlined" disabled={disabled} onClick={() => input.current?.click()}>
          {state ? "Andere Datei" : "Datei wählen"}
        </Button>
        <Typography>{state?.fileName ?? "keine Datei gewählt"}</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        XLSX, XLS oder CSV. Die Datei wird nur im Browser gelesen; an eegFaktura gehen nur Mitgliedsnummer und Wert
        der gewählten Spalten. Zuordnung genau über die Mitgliedsnummer (0007 ist nicht 7).
      </Typography>
      {readError && <Alert severity="error">{readError}</Alert>}
      {state && (
        <>
          <Stack direction={{xs: "column", md: "row"}} spacing={2}>
            {state.sheets.length > 1 && (
              <TextField select label="Blatt" value={state.sheet} fullWidth disabled={disabled}
                         onChange={e => {
                           const sheet = Number(e.target.value);
                           update({...state, sheet, header: Math.max(guessHeaderRow(state.sheets[sheet].rows), 0), numberCol: "", valueCol: ""});
                         }}>
                {state.sheets.map((s, i) => <MenuItem key={s.name} value={i}>{s.name}</MenuItem>)}
              </TextField>
            )}
            <TextField type="number" label="Kopfzeile (Zeilennummer)" value={state.header + 1} fullWidth disabled={disabled}
                       inputProps={{min: 1, max: Math.max(rows.length, 1)}}
                       onChange={e => {
                         const n = Number(e.target.value);
                         if (Number.isInteger(n) && n >= 1 && n <= rows.length) update({...state, header: n - 1, numberCol: "", valueCol: ""});
                       }}/>
          </Stack>
          <Stack direction={{xs: "column", md: "row"}} spacing={2}>
            {columnSelect("Spalte Mitgliedsnummer", state.numberCol, v => update({...state, numberCol: v}))}
            {columnSelect(`Spalte Wert (${FIELD_LABELS[field]})`, state.valueCol, v => update({...state, valueCol: v}))}
          </Stack>
          {extracted && (
            <Alert severity={extracted.values.length > MAX_FILE_VALUES || extracted.summary.duplicateConflict ? "warning" : "info"}>
              {summaryText(extracted.summary, extracted.values.length)}
            </Alert>
          )}
        </>
      )}
    </Stack>
  );
};

export default FileValuesInput;
