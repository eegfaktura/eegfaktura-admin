import {BulkField, BulkRow} from "../../../services/bulkchange.service";
import type {Filter} from "./PreviewTable";
import {CLASS_LABELS, codeText, ERROR_TEXTS, FIELD_LABELS, HINT_TEXTS} from "./texts";

// Download of the preview for the ticket (konzept-massenaenderungen.md, Tech Design A): UTF-8 with BOM, separator
// ";", quoted where needed, never an IBAN (the preview has none). A cell that starts with = + - @ tab or CR, also
// after leading blanks, gets a leading ' so that a spreadsheet does not run it as a formula.

const FORMULA_START = /^[^\S\t\r]*[=+\-@\t\r]/;

export function csvCell(value: string): string {
  const v = FORMULA_START.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const notes = (r: BulkRow) => [
  ...(r.error ? [`${r.error} ${codeText(ERROR_TEXTS, r.error).short}`] : []),
  ...r.hints.map(h => `${h} ${codeText(HINT_TEXTS, h).short}`),
].join(", ");

// The rows of the preview as the page shows them under the current filter.
export function previewCsv(field: BulkField, rows: BulkRow[]): string {
  const meter = field === "METER_TARIFF";
  const header = ["Mitgliedsnummer", "Name", ...(meter ? ["Zählpunkt"] : []), "Feld", "bisher", "neu", "Ergebnis",
    "Hinweis/Fehler"];
  const lines = rows.map(r => [r.participantNumber, r.name, ...(meter ? [r.meteringPointId ?? ""] : []),
    FIELD_LABELS[field], r.oldText, r.newText, CLASS_LABELS[r.class] ?? r.class, notes(r)]);
  return "﻿" + [header, ...lines].map(l => l.map(csvCell).join(";")).join("\r\n") + "\r\n";
}

const FILTER_SLUGS: Record<Filter, string> = {
  all: "alle", changed: "geaendert", hint: "mit-hinweis", error: "fehler", unchanged: "unveraendert",
};

// e.g. massenaenderung-TE000441-mandate_reference-mit-hinweis-2026-11-25.csv: the filter is part of the name
export const csvFileName = (tenant: string, field: BulkField, filter: Filter, date: string) =>
  `massenaenderung-${tenant}-${field.toLowerCase()}-${FILTER_SLUGS[filter]}-${date}.csv`;

export function downloadCsv(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], {type: "text/csv;charset=utf-8"}));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
