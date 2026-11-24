import React, {FC, useEffect, useRef, useState} from "react";
import {Alert, Button, Stack, Typography} from "@mui/material";
import {FileDownloadOutlined, UploadFileOutlined} from "@mui/icons-material";
import {BulkField, BulkFileValue} from "../../../services/bulkchange.service";
import {FileSummary, readSheet, TEMPLATE_URL, templateValues, VALUE_HEADERS} from "./fileValues";
import {MAX_FILE_VALUES} from "./rule";
import {num} from "./PreviewTable";

// "Wert aus Datei": download the template, fill it in, load it. The file is read in the browser only; onChange gets
// the pairs of member number and value of the rule's field, or null while no usable file is loaded.

export function summaryText(s: FileSummary, sent: number): string {
  const parts = [`${num(s.rows)} Zeilen mit Mitgliedsnummer`, `${num(sent)} mit Wert`];
  if (s.emptyValue) parts.push(`${num(s.emptyValue)} ohne Wert (bleiben unverändert)`);
  if (s.noNumber) parts.push(`${num(s.noNumber)} ohne Mitgliedsnummer (werden ignoriert)`);
  if (s.duplicateSame) parts.push(`${num(s.duplicateSame)} Nummern doppelt mit gleichem Wert`);
  if (s.duplicateConflict) parts.push(`${num(s.duplicateConflict)} Nummern doppelt mit verschiedenen Werten (Fehler F8)`);
  return parts.join(" · ");
}

interface Loaded {
  fileName: string;
  text: string;
  severity: "info" | "warning" | "error";
}

const FileValuesInput: FC<{ field: BulkField, disabled: boolean, onChange: (values: BulkFileValue[] | null) => void }> = ({field, disabled, onChange}) => {
  const input = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // the input left the page (other action or field) while a file was read: drop the result
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
  }, []);

  const choose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // the same file again sends a change event
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      if (!mounted.current) return;
      const result = templateValues(readSheet(buffer, file.name), field);
      if ("problem" in result) {
        setLoaded({fileName: file.name, text: result.problem, severity: "error"});
        onChange(null);
        return;
      }
      const {values, summary} = result;
      const warn = values.length > MAX_FILE_VALUES || summary.duplicateConflict > 0 || values.length === 0;
      setLoaded({fileName: file.name, text: summaryText(summary, values.length), severity: warn ? "warning" : "info"});
      onChange(values);
    } catch {
      if (!mounted.current) return;
      setLoaded({fileName: file.name, text: "Die Datei konnte nicht gelesen werden (XLSX, XLS oder CSV).", severity: "error"});
      onChange(null);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Vorlage herunterladen, je Mitglied Mitgliedsnummer und {VALUE_HEADERS[field]} eintragen und hier laden.
        Zuordnung genau über die Mitgliedsnummer (0007 ist nicht 7); leere Zellen ändern nichts. Die Datei wird nur im Browser gelesen; an eegFaktura gehen nur Mitgliedsnummer
        und {VALUE_HEADERS[field]}.
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <input ref={input} type="file" accept=".xlsx,.xls,.csv" hidden onChange={choose} data-testid="bulk-file-input"/>
        <Button variant="text" href={TEMPLATE_URL} download startIcon={<FileDownloadOutlined/>}>
          Vorlage herunterladen
        </Button>
        <Button variant="outlined" disabled={disabled} startIcon={<UploadFileOutlined/>} onClick={() => input.current?.click()}>
          {loaded ? "Andere Datei" : "Datei wählen"}
        </Button>
        <Typography>{loaded?.fileName ?? "keine Datei gewählt"}</Typography>
      </Stack>
      {loaded && <Alert severity={loaded.severity}>{loaded.text}</Alert>}
    </Stack>
  );
};

export default FileValuesInput;
