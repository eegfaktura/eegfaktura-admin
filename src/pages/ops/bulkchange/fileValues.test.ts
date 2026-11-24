import * as XLSX from "xlsx";
import {columnOptions, dateValue, extractValues, guessHeaderRow, readSheets} from "./fileValues";

// A workbook like the one of the ticket: a title row, the header in row 2, numbers as number cells, a member number
// with a letter, a mandate date as date cell and one as text.
function workbook(): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ["STERN-EEG eGen"],
    ["Nr. ", "Name", "Mandatsreferenz", "Zeitpunkt der Mandatsausstellung"],
    [7, "Anna", "STERN-EEG eGen MIT0007", null],
    ["187a", "Firma", "STERN-MIT0187a", "1.2.2024"],
    [8, "Leer", "", ""],
    [null, "ohne Nummer", "X-1", ""],
    [7, "Anna zweiter Rechnungskreis", "stern-eeg egen mit0007", "2024-01-01"],
  ]);
  ws["D3"] = {t: "n", v: 45292, z: "dd.mm.yyyy"}; // 2024-01-01 as Excel date
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mitgliederliste");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["leer"]]), "Zweites Blatt");
  return XLSX.write(wb, {type: "array", bookType: "xlsx"});
}

describe("reading the file", () => {
  const sheets = readSheets(workbook(), "liste.xlsx");
  const rows = sheets[0].rows;

  it("reads all sheets as text cells", () => {
    expect(sheets.map(s => s.name)).toEqual(["Mitgliederliste", "Zweites Blatt"]);
    expect(rows[2].slice(0, 3)).toEqual(["7", "Anna", "STERN-EEG eGen MIT0007"]);
    expect(rows[2][3]).toBe("2024-01-01");
  });

  it("finds the header below a title row and offers its columns", () => {
    expect(guessHeaderRow(rows)).toBe(1);
    expect(columnOptions(rows, 1).map(c => c.label))
      .toEqual(["A · Nr.", "B · Name", "C · Mandatsreferenz", "D · Zeitpunkt der Mandatsausstellung"]);
    expect(columnOptions(rows, 99)).toEqual([]);
  });

  it("extracts number and reference; empty values stay out, duplicates are counted", () => {
    const {values, summary} = extractValues(rows, 1, 0, 2, "MANDATE_REFERENCE");
    expect(values).toEqual([
      {participantNumber: "7", value: "STERN-EEG eGen MIT0007"},
      {participantNumber: "187a", value: "STERN-MIT0187a"},
      {participantNumber: "7", value: "stern-eeg egen mit0007"},
    ]);
    // the same reference in another case counts as the same value (as in backend)
    expect(summary).toEqual({rows: 4, emptyValue: 1, noNumber: 1, duplicateSame: 1, duplicateConflict: 0});
  });

  it("extracts mandate dates from date cells and text as YYYY-MM-DD", () => {
    const {values, summary} = extractValues(rows, 1, 0, 3, "MANDATE_DATE");
    expect(values).toEqual([
      {participantNumber: "7", value: "2024-01-01"}, // date cell
      {participantNumber: "187a", value: "2024-02-01"}, // text 1.2.2024
      {participantNumber: "7", value: "2024-01-01"}, // text 2024-01-01: the same date again
    ]);
    expect(summary).toEqual({rows: 4, emptyValue: 1, noNumber: 0, duplicateSame: 1, duplicateConflict: 0});
  });

  it("different values of one number count as conflict", () => {
    const r = [["Nr", "Wert"], ["1", "A"], ["1", "B"], ["1", "A"]];
    expect(extractValues(r, 0, 0, 1, "MANDATE_REFERENCE").summary)
      .toEqual({rows: 3, emptyValue: 0, noNumber: 0, duplicateSame: 0, duplicateConflict: 1});
  });

  it("keeps the cells of a CSV as written (leading zeros, letters, UTF-8)", () => {
    const csv = new TextEncoder().encode("Nr;Referenz;Name\n0007;STERN-MIT0007;Müller\n187a;R-187a;Groß\n");
    const s = readSheets(csv.buffer as ArrayBuffer, "liste.csv");
    expect(s[0].rows).toEqual([["Nr", "Referenz", "Name"], ["0007", "STERN-MIT0007", "Müller"], ["187a", "R-187a", "Groß"]]);
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
