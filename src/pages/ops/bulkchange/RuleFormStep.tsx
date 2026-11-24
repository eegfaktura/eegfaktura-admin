import React, {FC} from "react";
import {MenuItem, Stack, TextField, Typography} from "@mui/material";
import {BulkDirection, BulkTariff} from "../../../services/bulkchange.service";
import {actionsFor, CONDITIONS, DEBIT_TYPES, DIRECTIONS, FIELDS, formProblems, RuleForm, tariffOptions, todayIso, valueKind, initialForm} from "./rule";
import {ACTION_LABELS, clearLabel, CONDITION_LABELS, DEBIT_TYPE_LABELS, DIRECTION_LABELS, FIELD_LABELS, tariffLabel} from "./texts";
import FileValuesInput from "./FileValuesInput";

// Step 2: the rule. Only the combinations of the matrix are offered (rule.ts); a changed field starts afresh.
// tariffs: the active tariffs of the community and whether they are there; disabled while a call runs.
export type TariffStatus = "noCommunity" | "loading" | "error" | "ready";

const TARIFF_STATUS_TEXT: Record<Exclude<TariffStatus, "ready">, string> = {
  noCommunity: "Zuerst die Gemeinschaft wählen",
  loading: "Tarife werden geladen …",
  error: "Tarife konnten nicht geladen werden",
};

const RuleFormStep: FC<{
  form: RuleForm, tariffs: BulkTariff[] | null, tariffStatus: TariffStatus, disabled: boolean,
  onChange: (f: RuleForm) => void,
}> = ({form, tariffs, tariffStatus, disabled, onChange}) => {
  const set = (patch: Partial<RuleForm>) => onChange({...form, ...patch});
  const problems = formProblems(form);
  const kind = valueKind(form.field);

  const valueInput = (label: string, value: string, problem: string | undefined, onValue: (v: string) => void,
                      setting: boolean) => {
    const common = {label, value, fullWidth: true, disabled, error: !!problem && value !== "", helperText: problem ?? " ",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onValue(e.target.value)};
    switch (kind) {
      case "debitType":
        return (
          <TextField select {...common}>
            {DEBIT_TYPES.map(t => <MenuItem key={t} value={t}>{DEBIT_TYPE_LABELS[t]}</MenuItem>)}
          </TextField>
        );
      case "date":
        return <TextField type="date" {...common} InputLabelProps={{shrink: true}}
                          inputProps={setting ? {max: todayIso()} : undefined}/>;
      case "tariff": {
        const options = tariffOptions(tariffs ?? [], form.field, form.direction);
        const why = tariffStatus !== "ready" ? TARIFF_STATUS_TEXT[tariffStatus]
          : form.field === "METER_TARIFF" && !form.direction ? "Zuerst die Richtung wählen"
            : options.length === 0 ? "Die Gemeinschaft hat keinen passenden aktiven Tarif" : problem;
        return (
          <TextField select {...common} disabled={disabled || options.length === 0} helperText={why ?? " "}>
            {options.map(t => <MenuItem key={t.id} value={t.id}>{tariffLabel(t)}</MenuItem>)}
          </TextField>
        );
      }
      default:
        return <TextField {...common}/>;
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{xs: "column", md: "row"}} spacing={2}>
        <TextField select disabled={disabled} label="Feld" value={form.field} fullWidth
                   onChange={e => onChange(initialForm(e.target.value as RuleForm["field"]))}>
          {FIELDS.map(f => <MenuItem key={f} value={f}>{FIELD_LABELS[f]}</MenuItem>)}
        </TextField>
        <TextField select disabled={disabled} label="Aktion" value={form.action} fullWidth
                   onChange={e => set({action: e.target.value as RuleForm["action"], value: "", prefix: "", suffix: "", fileValues: null})}>
          {actionsFor(form.field).map(a => (
            <MenuItem key={a} value={a}>{a === "CLEAR" ? clearLabel(form.field) : ACTION_LABELS[a]}</MenuItem>
          ))}
        </TextField>
        {form.field === "METER_TARIFF" && (
          <TextField select disabled={disabled} label="Richtung" value={form.direction} fullWidth
                     helperText={problems.direction ?? " "}
                     onChange={e => set({direction: e.target.value as BulkDirection, value: "", conditionValue: ""})}>
            {DIRECTIONS.map(d => <MenuItem key={d} value={d}>{DIRECTION_LABELS[d]}</MenuItem>)}
          </TextField>
        )}
      </Stack>

      {form.action === "SET" && valueInput("Neuer Wert", form.value, problems.value, v => set({value: v}), true)}

      {form.action === "COPY" && (
        <Stack spacing={1}>
          <Stack direction={{xs: "column", md: "row"}} spacing={2} alignItems="center">
            <TextField disabled={disabled} label="Text davor (optional)" value={form.prefix} onChange={e => set({prefix: e.target.value})}/>
            <Typography>+ Mitgliedsnummer +</Typography>
            <TextField disabled={disabled} label="Text danach (optional)" value={form.suffix} onChange={e => set({suffix: e.target.value})}/>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Beispiel: „{form.prefix}135{form.suffix}“. Gültig sind höchstens 35 Zeichen aus Buchstaben, Ziffern und
            {" "}+ ? / - : ( ) . , ' — sonst Fehler F1 in der Vorschau.
          </Typography>
        </Stack>
      )}

      {form.action === "FROM_FILE" && (
        <FileValuesInput field={form.field} disabled={disabled} onChange={fileValues => set({fileValues})}/>
      )}

      <Stack direction={{xs: "column", md: "row"}} spacing={2}>
        <TextField select disabled={disabled} label="Bedingung" value={form.condition} fullWidth
                   onChange={e => set({condition: e.target.value as RuleForm["condition"], conditionValue: ""})}>
          {CONDITIONS.map(c => <MenuItem key={c} value={c}>{CONDITION_LABELS[c]}</MenuItem>)}
        </TextField>
        {form.condition === "EQUALS"
          && valueInput("Bisheriger Wert", form.conditionValue, problems.conditionValue, v => set({conditionValue: v}), false)}
      </Stack>
    </Stack>
  );
};

export default RuleFormStep;
