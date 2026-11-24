import {actionsFor, buildRule, FIELDS, formProblems, initialForm, RuleForm, todayIso, valueKind} from "./rule";

const TARIFF = "3f2a5c1e-1111-4222-8333-444455556666";

describe("rule matrix", () => {
  it("the mandate reference only copies or clears, every other field sets or clears", () => {
    expect(actionsFor("MANDATE_REFERENCE")).toEqual(["COPY", "CLEAR"]);
    FIELDS.filter(f => f !== "MANDATE_REFERENCE").forEach(f => expect(actionsFor(f)).toEqual(["SET", "CLEAR"]));
  });

  it("value kinds per field", () => {
    expect(FIELDS.map(valueKind)).toEqual(["debitType", "text", "date", "tariff", "tariff"]);
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
    expect(formProblems({...initialForm("PARTICIPANT_TARIFF"), value: "Tarif A"}, today).value).toMatch(/Tarif-ID ungültig/);
    expect(formProblems({...initialForm("MANDATE_DATE"), value: "25.11.2026"}, today).value).toBe("Datum ungültig");
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
