import * as XLSX from "xlsx";
import {BulkField, BulkFileValue} from "../../../services/bulkchange.service";
import {readWorkbook} from "../../../components/common/readWorkbook";
import {MAX_FILE_VALUES} from "./rule";

// "Wert aus Datei" (konzept-massenaenderungen.md, Teil 2): the support fills in the template
// public/vorlage-massenaenderung.xlsx (columns Mitgliedsnummer, Name, Mandatsreferenz, Mandatsdatum) and loads it.
// The file is read in the browser only; only member number and the value of the rule's field go to backend.

// The template's download path (served from public/).
export const TEMPLATE_URL = `${import.meta.env.BASE_URL}vorlage-massenaenderung.xlsx`;

// The column headers the page looks for, compared trimmed and without case.
export const NUMBER_HEADER = "Mitgliedsnummer";
export const VALUE_HEADERS: Partial<Record<BulkField, string>> = {
  MANDATE_REFERENCE: "Mandatsreferenz",
  MANDATE_DATE: "Mandatsdatum",
};

// backend refuses a member number or value over 100 characters (bulkMaxFileText).
const MAX_TEXT = 100;
// Rows and columns read at most: a sheet with formatted empty cells far down must not freeze the tab.
const MAX_ROWS = MAX_FILE_VALUES * 2;
const MAX_COLS = 50;

const pad = (n: number) => String(n).padStart(2, "0");

// One cell as text. Error cells (#N/A) are empty. A number formatted as a date is a date; another number is taken as
// Excel shows it (format "0000": 0007), a number without format as written (7).
function cellText(cell: XLSX.CellObject | undefined, date1904: boolean): string {
  if (!cell || cell.t === "e" || cell.v === undefined || cell.v === null) return "";
  if (cell.t === "n" && typeof cell.v === "number") {
    if (cell.z && XLSX.SSF.is_date(cell.z)) {
      const d = XLSX.SSF.parse_date_code(cell.v, {date1904});
      if (d) return `${d.y}-${pad(d.m)}-${pad(d.d)}`;
    }
    return cell.z && cell.z !== "General" && cell.w ? cell.w : String(cell.v);
  }
  return String(cell.v);
}

// The first sheet as text cells, rows and columns from A1 (index + 1 = Excel row number).
export function readSheet(buffer: ArrayBuffer, fileName: string): string[][] {
  const wb = readWorkbook(buffer, fileName, {cellNF: true});
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws?.["!ref"]) return [];
  const date1904 = !!wb.Workbook?.WBProps?.date1904;
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const rows: string[][] = [];
  for (let r = 0; r <= Math.min(range.e.r, MAX_ROWS); r++) {
    const row: string[] = [];
    for (let c = 0; c <= Math.min(range.e.c, MAX_COLS); c++) {
      row.push(cellText(ws[XLSX.utils.encode_cell({r, c})] as XLSX.CellObject | undefined, date1904).trim());
    }
    rows.push(row);
  }
  return rows;
}

const DOTTED_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

// A mandate date cell as YYYY-MM-DD: date cells already are; text "T.M.JJJJ" is converted. Anything else is sent as
// it is: backend shows it as F3 (date invalid), so the support sees the cell instead of losing it.
export function dateValue(v: string): string {
  const m = DOTTED_DATE.exec(v);
  return m ? `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}` : v;
}

export interface FileSummary {
  // data rows below the header with a member number
  rows: number;
  // rows with a member number but an empty value: those members stay unchanged
  emptyValue: number;
  // rows without a member number (ignored)
  noNumber: number;
  // member numbers that occur more than once with the same value (counted once) and with different values (F8)
  duplicateSame: number;
  duplicateConflict: number;
}

export type FileValues =
  | { values: BulkFileValue[], summary: FileSummary }
  | { problem: string };

// Same value of one member number twice: a reference compares without case, as backend does.
const sameValue = (field: BulkField, a: string, b: string) =>
  field === "MANDATE_REFERENCE" ? a.toUpperCase() === b.toUpperCase() : a === b;

const isHeader = (cell: string, header: string) => cell.toLowerCase() === header.toLowerCase();

// The pairs of member number and value of the template, or why the file does not fit. The header row is the first
// row with a cell "Mitgliedsnummer". Empty values are left out (the member stays unchanged); duplicates are sent as
// they are — backend decides (one value counts, different values are F8) — and counted for the summary.
export function templateValues(rows: string[][], field: BulkField): FileValues {
  const valueHeader = VALUE_HEADERS[field];
  const header = rows.findIndex(r => r.some(c => isHeader(c, NUMBER_HEADER)));
  if (!valueHeader || header < 0) {
    return {problem: `Die Datei hat keine Spalte „${NUMBER_HEADER}“. Bitte die Vorlage verwenden.`};
  }
  const numberCol = rows[header].findIndex(c => isHeader(c, NUMBER_HEADER));
  const valueCol = rows[header].findIndex(c => isHeader(c, valueHeader));
  if (valueCol < 0) {
    return {problem: `Die Datei hat keine Spalte „${valueHeader}“. Bitte die Vorlage verwenden.`};
  }
  const values: BulkFileValue[] = [];
  const summary: FileSummary = {rows: 0, emptyValue: 0, noNumber: 0, duplicateSame: 0, duplicateConflict: 0};
  const byNumber = new Map<string, string[]>();
  for (let i = header + 1; i < rows.length; i++) {
    const nr = rows[i][numberCol] ?? "";
    const raw = rows[i][valueCol] ?? "";
    if (nr === "") {
      if (raw !== "") summary.noNumber++;
      continue;
    }
    summary.rows++;
    if (raw === "") {
      summary.emptyValue++;
      continue;
    }
    if (nr.length > MAX_TEXT || raw.length > MAX_TEXT) {
      return {problem: `Zeile ${i + 1}: Mitgliedsnummer oder ${valueHeader} ist länger als ${MAX_TEXT} Zeichen.`};
    }
    const value = field === "MANDATE_DATE" ? dateValue(raw) : raw;
    const key = nr.toLowerCase();
    byNumber.set(key, [...(byNumber.get(key) ?? []), value]);
    values.push({participantNumber: nr, value});
  }
  byNumber.forEach(list => {
    if (list.length < 2) return;
    if (list.every(v => sameValue(field, v, list[0]))) summary.duplicateSame++;
    else summary.duplicateConflict++;
  });
  return {values, summary};
}
