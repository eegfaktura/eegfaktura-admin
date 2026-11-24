import {actionsFor, buildRule, FIELDS, formProblems, initialForm, RuleForm, tariffOptions, todayIso, valueKind} from "./rule";
import {BulkTariff} from "../../../services/bulkchange.service";
import tariffFixture from "../../../services/__fixtures__/bulkchange/tariffs.response.json";

const TARIFF = "3f2a5c1e-1111-4222-8333-444455556666";

describe("rule matrix", () => {
  it("the mandate reference only copies or clears, every other field sets or clears", () => {
    expect(actionsFor("MANDATE_REFERENCE")).toEqual(["COPY", "FROM_FILE", "CLEAR"]);
    expect(actionsFor("MANDATE_DATE")).toEqual(["SET", "FROM_FILE", "CLEAR"]);
    FIELDS.filter(f => f !== "MANDATE_REFERENCE" && f !== "MANDATE_DATE")
      .forEach(f => expect(actionsFor(f)).toEqual(["SET", "CLEAR"]));
  });

  it("value kinds per field", () => {
    expect(FIELDS.map(valueKind)).toEqual(["debitType", "text", "date", "tariff", "tariff"]);
  });
});

describe("tariffOptions", () => {
  const tariffs = tariffFixture as BulkTariff[];
  const names = (l: BulkTariff[]) => l.map(t => t.name);

  it("member tariff: only type EEG", () => {
    expect(names(tariffOptions(tariffs, "PARTICIPANT_TARIFF", ""))).toEqual(["Mitgliedsbeitrag"]);
  });

  it("metering point tariff: VZP for consumption, EZP for generation, none without direction", () => {
    expect(names(tariffOptions(tariffs, "METER_TARIFF", "CONSUMPTION"))).toEqual(["Bezug"]);
    expect(names(tariffOptions(tariffs, "METER_TARIFF", "GENERATOR"))).toEqual(["Einspeisung"]);
    expect(tariffOptions(tariffs, "METER_TARIFF", "")).toEqual([]);
  });

  it("no tariffs for the other fields", () => {
    expect(tariffOptions(tariffs, "DEBIT_TYPE", "")).toEqual([]);
  });
});

describe("buildRule", () => {
  it("sends only the keys of the combination", () => {
    const f: RuleForm = {...initialForm("DEBIT_TYPE"), value: "CORE", prefix: "x", condition: "EQUALS",
      conditionValue: "NONE", direction: "GENERATOR"};
    expect(buildRule(f)).toEqual({field: "DEBIT_TYPE", action: "SET", value: "CORE", condition: "EQUALS", conditionValue: "NONE"});
  });

  it("clear sends no value", () => {
    expect(buildRule({...initialForm("PARTICIPANT_TARIFF"), action: "CLEAR", value: TARIFF}))
      .toEqual({field: "PARTICIPANT_TARIFF", action: "CLEAR", condition: "ALL"});
  });

  it("copy sends the source and the texts around it as typed", () => {
    expect(buildRule({...initialForm("MANDATE_REFERENCE"), prefix: "L-", suffix: "/A"}))
      .toEqual({field: "MANDATE_REFERENCE", action: "COPY", source: "PARTICIPANT_NUMBER", prefix: "L-", suffix: "/A", condition: "ALL"});
  });

  it("the metering point tariff carries the direction", () => {
    expect(buildRule({...initialForm("METER_TARIFF"), value: ` ${TARIFF} `, direction: "CONSUMPTION", condition: "EMPTY"}))
      .toEqual({field: "METER_TARIFF", action: "SET", value: TARIFF, condition: "EMPTY", direction: "CONSUMPTION"});
  });
});

describe("formProblems", () => {
  const today = "2026-11-25";

  it("a complete rule has none", () => {
    expect(formProblems({...initialForm("DEBIT_TYPE"), value: "CORE"}, today)).toEqual({});
    expect(formProblems({...initialForm("MANDATE_REFERENCE")}, today)).toEqual({});
  });

  it("set needs a value of the field's kind", () => {
    expect(formProblems(initialForm("DEBIT_TYPE"), today).value).toBe("Wert fehlt");
    expect(formProblems({...initialForm("PARTICIPANT_TARIFF"), value: "Tarif A"}, today).value).toBe("Tarif wählen");
    expect(formProblems({...initialForm("MANDATE_DATE"), value: "25.11.2026"}, today).value).toBe("Datum ungültig");
    ["2026-02-30", "2026-02-29", "2025-13-01", "2025-04-31", "2025-00-10"].forEach(d =>
      expect(formProblems({...initialForm("MANDATE_DATE"), value: d}, today).value).toBe("Datum ungültig"));
    expect(formProblems({...initialForm("MANDATE_DATE"), value: "2024-02-29"}, today)).toEqual({});
  });

  it("a mandate date in the future cannot be set, but can be a condition", () => {
    expect(formProblems({...initialForm("MANDATE_DATE"), value: "2026-11-26"}, today).value).toMatch(/Zukunft/);
    expect(formProblems({...initialForm("MANDATE_DATE"), action: "CLEAR", condition: "EQUALS", conditionValue: "2026-11-26"}, today)).toEqual({});
  });

  it("'nur wo gleich' needs a value", () => {
    expect(formProblems({...initialForm("MANDATE_REFERENCE"), condition: "EQUALS"}, today).conditionValue).toBe("Wert fehlt");
  });

  it("the metering point tariff needs a direction", () => {
    expect(formProblems({...initialForm("METER_TARIFF"), action: "CLEAR"}, today).direction).toBe("Richtung wählen");
  });

  it("todayIso is the local date", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

describe("value from file", () => {
  const form = (fileValues: RuleForm["fileValues"]): RuleForm =>
    ({...initialForm("MANDATE_DATE"), action: "FROM_FILE", fileValues});

  it("needs a file with values, at most 5,000", () => {
    expect(formProblems(form(null)).value).toBe("Datei und Spalten wählen");
    expect(formProblems(form([])).value).toMatch(/keine Zeile/);
    const many = Array.from({length: 5001}, (_, i) => ({participantNumber: String(i), value: "2024-01-01"}));
    expect(formProblems(form(many)).value).toMatch(/Höchstens 5.000/);
    expect(formProblems(form(many.slice(0, 5000)))).toEqual({});
  });

  it("sends the values, no value key", () => {
    const values = [{participantNumber: "7", value: "2024-01-01"}];
    expect(buildRule(form(values))).toEqual({field: "MANDATE_DATE", action: "FROM_FILE", condition: "ALL", values});
  });
});
