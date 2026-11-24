import * as XLSX from "xlsx";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {dateValue, readSheet, templateValues} from "./fileValues";

// The template filled in: header row, a member number with a letter, a mandate date as date cell and one as text,
// a duplicate number, an empty value, a row without number.
const HEADER = ["Mitgliedsnummer", "Name", "Mandatsreferenz", "Mandatsdatum"];

function xlsx(aoa: unknown[][], patch: (ws: XLSX.WorkSheet) => void = () => undefined, date1904 = false): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  patch(ws);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Massenänderung");
  if (date1904) wb.Workbook = {WBProps: {date1904: true}};
  return XLSX.write(wb, {type: "array", bookType: "xlsx"});
}

const filled = () => xlsx([
  HEADER,
  ["7", "Anna", "STERN-EEG eGen MIT0007", null],
  ["187a", "Firma", "STERN-MIT0187a", "1.2.2024"],
  ["8", "Leer", "", ""],
  [null, "ohne Nummer", "X-1", ""],
  ["7", "zweiter Rechnungskreis", "stern-eeg egen mit0007", "2024-01-01"],
], ws => {
  ws["D2"] = {t: "n", v: 45292, z: "dd.mm.yyyy"}; // 2024-01-01 as Excel date
});

describe("reading the template", () => {
  it("the shipped template (public/vorlage-massenaenderung.xlsx) fits both fields, empty", () => {
    // a copy into this realm's ArrayBuffer (as ExcelUploader.test): SheetJS checks the type
    const bytes = Uint8Array.from(readFileSync(resolve(__dirname, "../../../../public/vorlage-massenaenderung.xlsx"))).buffer as ArrayBuffer;
    const rows = readSheet(bytes, "vorlage.xlsx");
    for (const field of ["MANDATE_REFERENCE", "MANDATE_DATE"] as const) {
      expect(templateValues(rows, field)).toEqual({values: [], summary: {rows: 0, emptyValue: 0, noNumber: 0, duplicateSame: 0, duplicateConflict: 0}});
    }
  });

  it("reads number and reference; empty values stay out, duplicates are counted", () => {
    const res = templateValues(readSheet(filled(), "vorlage.xlsx"), "MANDATE_REFERENCE");
    expect(res).toEqual({
      values: [
        {participantNumber: "7", value: "STERN-EEG eGen MIT0007"},
        {participantNumber: "187a", value: "STERN-MIT0187a"},
        {participantNumber: "7", value: "stern-eeg egen mit0007"},
      ],
      // the same reference in another case counts as the same value (as in backend)
      summary: {rows: 4, emptyValue: 1, noNumber: 1, duplicateSame: 1, duplicateConflict: 0},
    });
  });

  it("reads mandate dates from date cells and text as YYYY-MM-DD", () => {
    const res = templateValues(readSheet(filled(), "vorlage.xlsx"), "MANDATE_DATE");
    expect(res).toEqual({
      values: [
        {participantNumber: "7", value: "2024-01-01"}, // date cell
        {participantNumber: "187a", value: "2024-02-01"}, // text 1.2.2024
        {participantNumber: "7", value: "2024-01-01"}, // text 2024-01-01: the same date again
      ],
      summary: {rows: 4, emptyValue: 1, noNumber: 0, duplicateSame: 1, duplicateConflict: 0},
    });
  });

  it("finds the header below a title row, columns in any order and case", () => {
    const rows = readSheet(xlsx([["Liste STERN"], [], ["mandatsreferenz", "MITGLIEDSNUMMER"], ["R-1", "1"]]), "x.xlsx");
    expect(templateValues(rows, "MANDATE_REFERENCE"))
      .toEqual({values: [{participantNumber: "1", value: "R-1"}], summary: expect.objectContaining({rows: 1})});
  });

  it("names the missing column", () => {
    const rows = readSheet(xlsx([["Nr.", "Mandatsreferenz"], ["1", "R"]]), "x.xlsx");
    expect(templateValues(rows, "MANDATE_REFERENCE")).toEqual({problem: "Die Datei hat keine Spalte „Mitgliedsnummer“. Bitte die Vorlage verwenden."});
    const noDate = readSheet(xlsx([["Mitgliedsnummer", "Mandatsreferenz"], ["1", "R"]]), "x.xlsx");
    expect(templateValues(noDate, "MANDATE_DATE")).toEqual({problem: "Die Datei hat keine Spalte „Mandatsdatum“. Bitte die Vorlage verwenden."});
  });

  it("refuses a cell over 100 characters with its row number", () => {
    const rows = readSheet(xlsx([HEADER, ["1", "", "R"], ["2", "", "x".repeat(101)]]), "x.xlsx");
    expect(templateValues(rows, "MANDATE_REFERENCE"))
      .toEqual({problem: "Zeile 3: Mitgliedsnummer oder Mandatsreferenz ist länger als 100 Zeichen."});
  });

  it("different values of one number count as conflict", () => {
    const rows = [HEADER, ["1", "", "A"], ["1", "", "B"], ["1", "", "A"]];
    expect(templateValues(rows, "MANDATE_REFERENCE")).toMatchObject({summary: {duplicateConflict: 1, duplicateSame: 0}});
  });

  it("an error cell (#N/A) is empty, not its error code", () => {
    const rows = readSheet(xlsx([HEADER, ["1", "", "R"]], ws => {
      ws["C2"] = {t: "e", v: 42, w: "#N/A"};
    }), "x.xlsx");
    expect(templateValues(rows, "MANDATE_REFERENCE")).toMatchObject({values: [], summary: {emptyValue: 1}});
  });

  it("a formatted number is taken as Excel shows it, a plain number as written", () => {
    const rows = readSheet(xlsx([HEADER, [7, "", 123], [8, "", "R-8"]], ws => {
      ws["A2"] = {t: "n", v: 7, z: "0000"};
      ws["C2"] = {t: "n", v: 123, z: "000000"};
    }), "x.xlsx");
    expect(templateValues(rows, "MANDATE_REFERENCE")).toMatchObject({
      values: [{participantNumber: "0007", value: "000123"}, {participantNumber: "8", value: "R-8"}],
    });
  });

  it("other number formats are taken as written, not in en-US style", () => {
    const rows = readSheet(xlsx([HEADER, [1234, "", 7]], ws => {
      ws["A2"] = {t: "n", v: 1234, z: "#,##0"};
      ws["C2"] = {t: "n", v: 7, z: "0.00"};
    }), "x.xlsx");
    expect(templateValues(rows, "MANDATE_REFERENCE")).toMatchObject({values: [{participantNumber: "1234", value: "7"}]});
  });

  it("a file longer than 10,000 rows is refused, not cut off", () => {
    const aoa: unknown[][] = [HEADER, ...Array.from({length: 10001}, (_, i) => [String(i + 1), "", `R-${i + 1}`])];
    expect(templateValues(readSheet(xlsx(aoa), "x.xlsx"), "MANDATE_REFERENCE"))
      .toEqual({problem: expect.stringMatching(/mehr als 10.000 Zeilen/)});
  });

  it("dates of a 1904 workbook (old Mac Excel) are not shifted", () => {
    // 2024-01-01 is serial 43830 in the 1904 date system
    const rows = readSheet(xlsx([HEADER, ["1", "", "", null]], ws => {
      ws["D2"] = {t: "n", v: 43830, z: "dd.mm.yyyy"};
    }, true), "x.xlsx");
    expect(templateValues(rows, "MANDATE_DATE")).toMatchObject({values: [{participantNumber: "1", value: "2024-01-01"}]});
  });

  it("row numbers are Excel's, also when the used range starts below row 1", () => {
    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, [HEADER, ["1", "", "R"], ["2", "", "x".repeat(101)]], {origin: "B3"});
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "S");
    const rows = readSheet(XLSX.write(wb, {type: "array", bookType: "xlsx"}), "x.xlsx");
    expect(templateValues(rows, "MANDATE_REFERENCE")).toEqual({problem: expect.stringMatching(/^Zeile 5:/)});
  });

  it("keeps the cells of a CSV as written (leading zeros, letters, UTF-8)", () => {
    const csv = new TextEncoder().encode("Mitgliedsnummer;Name;Mandatsreferenz\n0007;Müller;STERN-MIT0007\n187a;Groß;R-187a\n");
    const rows = readSheet(csv.buffer as ArrayBuffer, "vorlage.csv");
    expect(templateValues(rows, "MANDATE_REFERENCE")).toMatchObject({
      values: [{participantNumber: "0007", value: "STERN-MIT0007"}, {participantNumber: "187a", value: "R-187a"}],
    });
  });
});

describe("dateValue", () => {
  it.each([
    ["1.2.2024", "2024-02-01"],
    ["01.02.2024", "2024-02-01"],
    ["2024-02-01", "2024-02-01"],
    ["31.2.2024", "2024-02-31"], // sent on; backend answers F3
    ["Februar", "Februar"],
  ])("%s → %s", (input, out) => {
    expect(dateValue(input)).toBe(out);
  });
});
