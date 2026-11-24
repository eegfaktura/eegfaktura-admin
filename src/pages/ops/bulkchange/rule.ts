import {BulkAction, BulkCondition, BulkDirection, BulkField, BulkRule, BulkTariff} from "../../../services/bulkchange.service";

// The rule matrix of konzept-massenaenderungen.md (Tech Design A), the same as backend's BulkRule.Validate:
// the form offers only these combinations and builds the request body from them.

export const FIELDS: BulkField[] = ["DEBIT_TYPE", "MANDATE_REFERENCE", "MANDATE_DATE", "PARTICIPANT_TARIFF", "METER_TARIFF"];
export const CONDITIONS: BulkCondition[] = ["ALL", "EMPTY", "EQUALS"];
export const DIRECTIONS: BulkDirection[] = ["CONSUMPTION", "GENERATOR"];
export const DEBIT_TYPES = ["CORE", "B2B", "NONE"];

// The mandate reference has no value that is the same for all: only copy (with text before/after) or clear.
export const actionsFor = (field: BulkField): BulkAction[] =>
  field === "MANDATE_REFERENCE" ? ["COPY", "CLEAR"] : ["SET", "CLEAR"];

// What a value of the field is: drives the input of "Wert setzen" and of "nur wo gleich …".
export type ValueKind = "debitType" | "text" | "date" | "tariff";

export const valueKind = (field: BulkField): ValueKind =>
  field === "DEBIT_TYPE" ? "debitType"
    : field === "MANDATE_REFERENCE" ? "text"
      : field === "MANDATE_DATE" ? "date" : "tariff";

// The tariffs a tariff rule can use: members only type EEG, metering points VZP for consumption and EZP for
// generation (none before the direction is chosen). backend checks the same (F4).
export function tariffOptions(tariffs: BulkTariff[], field: BulkField, direction: BulkDirection | ""): BulkTariff[] {
  const type = field === "PARTICIPANT_TARIFF" ? "EEG"
    : field === "METER_TARIFF" && direction === "CONSUMPTION" ? "VZP"
      : field === "METER_TARIFF" && direction === "GENERATOR" ? "EZP" : null;
  return type ? tariffs.filter(t => t.type === type) : [];
}

export interface RuleForm {
  field: BulkField;
  action: BulkAction;
  value: string;
  prefix: string;
  suffix: string;
  condition: BulkCondition;
  conditionValue: string;
  direction: BulkDirection | "";
}

export const initialForm = (field: BulkField = "DEBIT_TYPE"): RuleForm => ({
  field, action: actionsFor(field)[0], value: "", prefix: "", suffix: "",
  condition: "ALL", conditionValue: "", direction: "",
});


const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// A real calendar day as YYYY-MM-DD: Date would roll 2026-02-30 over to 2026-03-02, so the day must survive the
// round trip (backend parses the same way, time.DateOnly).
const isCalendarDate = (t: string) => {
  if (!ISO_DATE.test(t)) return false;
  const d = new Date(`${t}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t;
};

// Today as ISO date in the browser's time zone (the date input's max).
export const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// Checks one value of the field's kind; returns the German problem or null.
export function valueProblem(kind: ValueKind, v: string, setting: boolean, today = todayIso()): string | null {
  const t = v.trim();
  if (t === "") return "Wert fehlt";
  switch (kind) {
    case "debitType":
      return DEBIT_TYPES.includes(t) ? null : "Einzugsart wählen";
    case "date":
      if (!isCalendarDate(t)) return "Datum ungültig";
      return setting && t > today ? "Datum liegt in der Zukunft" : null;
    case "tariff":
      return UUID.test(t) ? null : "Tarif wählen";
  }
  return null;
}

// The problems of the form, by input; empty when the rule can be sent.
export function formProblems(f: RuleForm, today = todayIso()): Partial<Record<"value" | "conditionValue" | "direction", string>> {
  const out: Partial<Record<"value" | "conditionValue" | "direction", string>> = {};
  const kind = valueKind(f.field);
  if (f.action === "SET") {
    const p = valueProblem(kind, f.value, true, today);
    if (p) out.value = p;
  }
  if (f.condition === "EQUALS") {
    const p = valueProblem(kind, f.conditionValue, false, today);
    if (p) out.conditionValue = p;
  }
  if (f.field === "METER_TARIFF" && !f.direction) out.direction = "Richtung wählen";
  return out;
}

// The request body of the rule: only the keys of this combination, values trimmed (prefix/suffix as typed).
export function buildRule(f: RuleForm): BulkRule {
  const rule: BulkRule = {field: f.field, action: f.action, condition: f.condition};
  if (f.action === "SET") rule.value = f.value.trim();
  if (f.action === "COPY") {
    rule.source = "PARTICIPANT_NUMBER";
    if (f.prefix) rule.prefix = f.prefix;
    if (f.suffix) rule.suffix = f.suffix;
  }
  if (f.condition === "EQUALS") rule.conditionValue = f.conditionValue.trim();
  if (f.field === "METER_TARIFF" && f.direction) rule.direction = f.direction;
  return rule;
}
