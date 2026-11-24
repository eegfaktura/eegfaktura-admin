import * as XLSX from "xlsx";
import {BulkField, BulkFileValue} from "../../../services/bulkchange.service";

// "Wert aus Datei" (konzept-massenaenderungen.md, Teil 2): the file is read in the browser only. The page lets the
// support pick the column of the member number and the column of the value; only these two go to backend.

// Most values one run may carry (backend refuses more, BulkMaxFileValues).
export const MAX_FILE_VALUES = 5000;

// A sheet as text cells: every cell a string, "" when empty. Date cells become YYYY-MM-DD, whole numbers lose ".0".
export interface Sheet {
  name: string;
  rows: string[][];
}

const pad = (n: number) => String(n).padStart(2, "0");

// One cell as text. A number formatted as a date is a date (the serial number alone would not be one).
function cellText(cell: XLSX.CellObject | undefined): string {
  if (!cell || cell.v === undefined || cell.v === null) return "";
  if (cell.t === "n" && typeof cell.v === "number") {
    if (cell.z && XLSX.SSF.is_date(cell.z)) {
      const d = XLSX.SSF.parse_date_code(cell.v);
      if (d) return `${d.y}-${pad(d.m)}-${pad(d.d)}`;
    }
    return String(cell.v);
  }
  return String(cell.v).trim();
}

function sheetRows(ws: XLSX.WorkSheet): string[][] {
  if (!ws["!ref"]) return [];
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const rows: string[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = 0; c <= range.e.c; c++) {
      row.push(cellText(ws[XLSX.utils.encode_cell({r, c})] as XLSX.CellObject | undefined));
    }
    rows.push(row);
  }
  return rows;
}

// A CSV as UTF-8 text when it is valid UTF-8 (as ExcelUploader): SheetJS would read UTF-8 bytes one by one.
const utf8 = (buffer: ArrayBuffer): string | undefined => {
  try {
    return new TextDecoder("utf-8", {fatal: true}).decode(buffer);
  } catch {
    return undefined;
  }
};

// Reads all sheets of an XLSX/XLS or CSV file. raw for CSV: text cells stay as written ("187a", "0007").
export function readSheets(buffer: ArrayBuffer, fileName: string): Sheet[] {
  const csv = /\.csv$/i.test(fileName) ? utf8(buffer) : undefined;
  const wb = csv === undefined
    ? XLSX.read(buffer, {type: "array", cellNF: true, raw: /\.csv$/i.test(fileName)})
    : XLSX.read(csv, {type: "string", raw: true});
  return wb.SheetNames.map(name => ({name, rows: sheetRows(wb.Sheets[name])}));
}

// The header row: the first row with at least two filled cells (a title row above it has one). -1 if none.
export const guessHeaderRow = (rows: string[][]) => rows.findIndex(r => r.filter(c => c !== "").length >= 2);

// Column letter of a 0-based index: 0 → A, 26 → AA.
export const columnLetter = (i: number) => XLSX.utils.encode_col(i);

export interface ColumnOption {
  index: number;
  label: string;
}

// The columns of the header row that have a heading, e.g. {index: 2, label: "C · Mandatsreferenz"}.
export const columnOptions = (rows: string[][], header: number): ColumnOption[] =>
  header < 0 || header >= rows.length ? []
    : rows[header].flatMap((h, i) => h === "" ? [] : [{index: i, label: `${columnLetter(i)} · ${h}`}]);

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

export interface FileValues {
  values: BulkFileValue[];
  summary: FileSummary;
}

// Same value of one member number twice: a reference compares without case, as backend does.
const sameValue = (field: BulkField, a: string, b: string) =>
  field === "MANDATE_REFERENCE" ? a.toUpperCase() === b.toUpperCase() : a === b;

// The pairs of member number and value below the header. Empty values are left out (the member stays unchanged);
// duplicates are sent as they are — backend decides (one value counts, different values are F8) — and counted here
// for the summary.
export function extractValues(rows: string[][], header: number, numberCol: number, valueCol: number,
                              field: BulkField): FileValues {
  const values: BulkFileValue[] = [];
  const summary: FileSummary = {rows: 0, emptyValue: 0, noNumber: 0, duplicateSame: 0, duplicateConflict: 0};
  const byNumber = new Map<string, string[]>();
  for (const row of rows.slice(header + 1)) {
    const nr = (row[numberCol] ?? "").trim();
    const raw = (row[valueCol] ?? "").trim();
    if (nr === "") {
      if (raw !== "") summary.noNumber++;
      continue;
    }
    summary.rows++;
    if (raw === "") {
      summary.emptyValue++;
      continue;
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
