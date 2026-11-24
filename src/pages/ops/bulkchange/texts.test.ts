import {BulkChangeError} from "../../../services/bulkchange.service";
import {codeText, describeError, ruleSummary, tariffLabel, ERROR_TEXTS, HINT_TEXTS, RUN_HINT_TEXTS, SKIP_TEXTS} from "./texts";
import previewResponse from "../../../services/__fixtures__/bulkchange/preview.response.json";
import applyResponse from "../../../services/__fixtures__/bulkchange/apply.response.json";

// backend sends codes; every code of the concept has a German text here.

const codes = (prefix: string, n: number) => Array.from({length: n}, (_, i) => `${prefix}${i + 1}`);

describe("texts of the codes", () => {
  it.each(codes("F", 6))("error %s has a short and a long text", c => {
    expect(ERROR_TEXTS[c].short).not.toBe("");
    expect(ERROR_TEXTS[c].long.length).toBeGreaterThan(ERROR_TEXTS[c].short.length);
  });

  it.each(codes("H", 9))("hint %s has a short and a long text", c => {
    expect(HINT_TEXTS[c].short).not.toBe("");
    expect(HINT_TEXTS[c].long.length).toBeGreaterThan(HINT_TEXTS[c].short.length);
  });

  it.each(codes("L", 3))("run hint %s has a text", c => {
    expect(RUN_HINT_TEXTS[c]).toBeTruthy();
  });

  it.each(["CHANGED_SINCE_PREVIEW", ...codes("F", 6)])("skip reason %s has a text", c => {
    expect(SKIP_TEXTS[c]).toBeTruthy();
  });

  it("knows every code of the fixtures", () => {
    const rows = [...previewResponse.rows, ...applyResponse.rows];
    rows.flatMap(r => r.hints).forEach(h => expect(HINT_TEXTS[h]).toBeDefined());
    rows.flatMap(r => ("error" in r && r.error ? [r.error] : [])).forEach(e => expect(ERROR_TEXTS[e]).toBeDefined());
    [...previewResponse.runHints, ...applyResponse.runHints].forEach(l => expect(RUN_HINT_TEXTS[l]).toBeDefined());
    applyResponse.skipped.forEach(s => expect(SKIP_TEXTS[s.reason]).toBeDefined());
  });

  it("shows an unknown code instead of hiding it", () => {
    expect(codeText(HINT_TEXTS, "H99")).toEqual({short: "H99", long: "Unbekannter Code H99"});
  });
});

describe("tariffLabel", () => {
  it("member tariffs name the joining fee, metering point tariffs only the name", () => {
    expect(tariffLabel({id: "a", name: "Mitgliedsbeitrag", type: "EEG", joiningFee: 50})).toMatch(/^Mitgliedsbeitrag \(Beitrittsgebühr .*50,00.*\)$/);
    expect(tariffLabel({id: "b", name: "Basis", type: "EEG", joiningFee: 0})).toBe("Basis (ohne Beitrittsgebühr)");
    expect(tariffLabel({id: "c", name: "Bezug", type: "VZP", joiningFee: 0})).toBe("Bezug");
  });
});

describe("ruleSummary", () => {
  const c = {name: "EEG A", tenant: "GC100001-002", rcNumber: "RC100001"};

  it("names values in plain text and the condition value", () => {
    expect(ruleSummary({field: "DEBIT_TYPE", action: "SET", value: "CORE", condition: "EQUALS", conditionValue: "NONE"}, c, null))
      .toBe("Gemeinschaft: EEG A · Tenant GC100001-002 (RC RC100001) — Einzugsart: Wert setzen „CORE (normale Lastschrift)“, nur wo gleich „Kein SEPA“");
  });

  it("names the tariff and the direction; clear has no value", () => {
    const tariffs = [{id: "t1", name: "Bezug", type: "VZP" as const, joiningFee: 0}];
    expect(ruleSummary({field: "METER_TARIFF", action: "SET", value: "t1", condition: "ALL", direction: "CONSUMPTION"}, c, tariffs))
      .toMatch(/— Zählpunkttarif \(Verbrauch\): Wert setzen „Bezug“, alle$/);
    expect(ruleSummary({field: "PARTICIPANT_TARIFF", action: "CLEAR", condition: "EMPTY"}, c, tariffs))
      .toMatch(/— Mitgliedstarif: kein Tarif, nur wo leer$/);
  });
});

describe("describeError", () => {
  const err = (status: number, code = 0, text = "") => new BulkChangeError(status, code, text);

  it.each([
    [401, 0, "preview", /Sitzung abgelaufen/],
    [403, 0, "preview", /superuser/],
    [403, 6106, "apply", /Benutzername/],
    [404, 6103, "preview", /Gemeinschaft ist unbekannt/],
    [409, 6104, "apply", /läuft gerade eine Massenänderung/],
    [413, 6107, "apply", /enger fassen/],
    [400, 6100, "preview", /Regel ist ungültig/],
  ] as const)("%i/%i on %s: %s, no reload offered", (status, code, op, text) => {
    const v = describeError(err(status, code), op);
    expect(v.text).toMatch(text);
    expect(v.reloadPreview).toBe(false);
  });

  it.each([[6102, /Vorschau veraltet/], [6101, /doppelt/]])("400/%i offers to compute the preview again", (code, text) => {
    const v = describeError(err(400, code), "apply");
    expect(v.text).toMatch(text);
    expect(v.reloadPreview).toBe(true);
  });

  it("names the wrong part of a rule from the server text", () => {
    expect(describeError(err(400, 6100, "Regel ungültig: Datum muss JJJJ-MM-TT sein"), "preview").text)
      .toContain("Datum muss JJJJ-MM-TT sein");
  });

  it("6105 on apply: nothing changed, the preview stays", () => {
    const v = describeError(err(500, 6105, "x"), "apply");
    expect(v.text).toContain("nichts geändert");
    expect(v.reloadPreview).toBe(false);
  });

  it.each([[500, 6108], [502, 0], [504, 0], [0, 0]])("apply %i/%i: unclear outcome, compute the preview again", (status, code) => {
    const v = describeError(err(status, code), "apply");
    expect(v.text).toContain("Ergebnis des Anwendens ist unklar");
    expect(v.reloadPreview).toBe(true);
  });

  it("a failed preview changed nothing: no reload offered", () => {
    const v = describeError(err(500, 6105, "x"), "preview");
    expect(v.text).toMatch(/später erneut/);
    expect(v.reloadPreview).toBe(false);
  });
});
