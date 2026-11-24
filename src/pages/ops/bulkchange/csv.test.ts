import {BulkPreview, BulkRow} from "../../../services/bulkchange.service";
import {csvCell, csvFileName, previewCsv} from "./csv";
import previewResponse from "../../../services/__fixtures__/bulkchange/preview.response.json";

describe("csvCell", () => {
  it.each([
    ["Anna Muster", "Anna Muster"],
    ["=cmd|' /C calc'!A0", "'=cmd|' /C calc'!A0"],
    ["+1", "'+1"],
    ["-1", "'-1"],
    ["@SUM(A1)", "'@SUM(A1)"],
    ["\tx", "'\tx"],
    ["  =1", "'  =1"],
    ["Lastschrift-1", "Lastschrift-1"],
  ])("%j → %j", (input, out) => {
    expect(csvCell(input)).toBe(out);
  });

  it("quotes separator, quote and line breaks, quotes doubled", () => {
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell('sagt "Hallo"')).toBe('"sagt ""Hallo"""');
    expect(csvCell("Zeile\nzwei")).toBe('"Zeile\nzwei"');
  });

  it("neutralises and quotes a cell starting with CR", () => {
    expect(csvCell("\r=1")).toBe("\"'\r=1\"");
  });
});

describe("previewCsv", () => {
  const preview = previewResponse as BulkPreview;

  it("starts with the BOM, uses ; and CRLF, one line per preview row", () => {
    const csv = previewCsv("MANDATE_REFERENCE", preview.rows);
    expect(csv.startsWith("\uFEFFMitgliedsnummer;Name;Feld;Bisher;Neu;Ergebnis;Hinweis/Fehler\r\n")).toBe(true);
    const lines = csv.slice(1).split("\r\n").filter(l => l !== "");
    expect(lines).toHaveLength(1 + preview.rows.length);
    expect(lines[1]).toBe("1;Anna Muster;Mandatsreferenz;leer (Mitgliedsnummer gilt);Lastschrift-1;geändert;H6 Mandatsänderung");
    expect(lines[4]).toContain("Fehler — wird nicht geändert;F5 Quellfeld leer");
  });

  it("has a metering point column for the metering point tariff and no IBAN", () => {
    const row: BulkRow = {participantId: "p", meteringPointId: "AT0030000000000000000000000000001", participantNumber: "7",
      name: "=HYPERLINK(\"x\")", oldValue: null, newValue: "t", oldText: "kein Tarif", newText: "Tarif A",
      class: "CHANGED", hints: []};
    const csv = previewCsv("METER_TARIFF", [row]);
    expect(csv).toContain("Mitgliedsnummer;Name;Zählpunkt;Feld;");
    expect(csv).toContain(`7;"'=HYPERLINK(""x"")";AT0030000000000000000000000000001;Zählpunkttarif;kein Tarif;Tarif A;geändert;`);
    expect(csv.toLowerCase()).not.toContain("iban");
  });
});

describe("csvFileName", () => {
  it.each([
    ["all", "alle"], ["changed", "geaendert"], ["hint", "mit-hinweis"], ["error", "fehler"], ["unchanged", "unveraendert"], ["result", "ergebnis"],
  ] as const)("names the filter %s", (filter, slug) => {
    expect(csvFileName("TE000441", "MANDATE_REFERENCE", filter, "2026-11-25"))
      .toBe(`massenaenderung-TE000441-mandate_reference-${slug}-2026-11-25.csv`);
  });
});
