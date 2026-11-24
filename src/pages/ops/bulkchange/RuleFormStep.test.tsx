import React, {useState} from "react";
import {fireEvent, render, screen, within} from "@testing-library/react";
import RuleFormStep, {TariffStatus} from "./RuleFormStep";
import {initialForm, RuleForm} from "./rule";
import {BulkTariff} from "../../../services/bulkchange.service";
import tariffs from "../../../services/__fixtures__/bulkchange/tariffs.response.json";

// The form offers only the combinations of the matrix.

const Harness = ({status = "ready", disabled = false, field}: { status?: TariffStatus, disabled?: boolean, field?: RuleForm["field"] }) => {
  const [form, setForm] = useState<RuleForm>(initialForm(field));
  return <RuleFormStep form={form} tariffs={status === "ready" ? tariffs as BulkTariff[] : null} tariffStatus={status}
                       disabled={disabled} onChange={setForm}/>;
};

// a menu that was just closed stays in the DOM during its exit transition (labelled like the select): the
// select comes first, the newest list last
const openListbox = () => screen.getAllByRole("listbox").slice(-1)[0];

const options = (label: string) => {
  fireEvent.mouseDown(screen.getAllByLabelText(label)[0]);
  const listbox = openListbox();
  const texts = within(listbox).getAllByRole("option").map(o => o.textContent);
  fireEvent.keyDown(listbox, {key: "Escape"});
  return texts;
};

const choose = (label: string, option: string) => {
  fireEvent.mouseDown(screen.getAllByLabelText(label)[0]);
  fireEvent.click(within(openListbox()).getByRole("option", {name: option}));
};

describe("RuleFormStep", () => {
  it("offers the five fields", () => {
    render(<Harness/>);
    expect(options("Feld")).toEqual(["Einzugsart", "Mandatsreferenz", "Mandatsdatum", "Mitgliedstarif", "Zählpunkttarif"]);
  });

  it("direct debit type: set or clear, values CORE/B2B/Kein SEPA, no direction", () => {
    render(<Harness/>);
    expect(options("Aktion")).toEqual(["Wert setzen", "leer setzen (nicht gewählt)"]);
    expect(options("Neuer Wert")).toEqual(["CORE (normale Lastschrift)", "B2B (Firmenlastschrift)", "Kein SEPA"]);
    expect(screen.queryByLabelText("Richtung")).toBeNull();
  });

  it("mandate reference: only copy with text before/after or clear, no value for all", () => {
    render(<Harness/>);
    choose("Feld", "Mandatsreferenz");
    expect(options("Aktion")).toEqual(["aus Mitgliedsnummer kopieren", "leer setzen (Mitgliedsnummer gilt)"]);
    expect(screen.queryByLabelText("Neuer Wert")).toBeNull();
    expect(screen.getByLabelText("Text davor (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Text danach (optional)")).toBeInTheDocument();
    choose("Aktion", "leer setzen (Mitgliedsnummer gilt)");
    expect(screen.queryByLabelText("Text davor (optional)")).toBeNull();
  });

  it("tariffs can be set to 'kein Tarif'; the metering point tariff asks for the direction", () => {
    render(<Harness/>);
    choose("Feld", "Mitgliedstarif");
    expect(options("Aktion")).toEqual(["Wert setzen", "kein Tarif"]);
    expect(screen.queryByLabelText("Richtung")).toBeNull();
    choose("Feld", "Zählpunkttarif");
    expect(options("Richtung")).toEqual(["Verbrauch", "Erzeugung"]);
  });

  it("conditions all / empty / equals; 'nur wo gleich' asks for the old value of the field's kind", () => {
    render(<Harness/>);
    expect(options("Bedingung")).toEqual(["alle", "nur wo leer", "nur wo gleich …"]);
    expect(screen.queryByLabelText("Bisheriger Wert")).toBeNull();
    choose("Bedingung", "nur wo gleich …");
    expect(options("Bisheriger Wert")).toEqual(["CORE (normale Lastschrift)", "B2B (Firmenlastschrift)", "Kein SEPA"]);
  });

  it("member tariff: only EEG tariffs, with the joining fee", () => {
    render(<Harness/>);
    choose("Feld", "Mitgliedstarif");
    const opts = options("Neuer Wert");
    expect(opts).toHaveLength(1);
    expect(opts[0]).toMatch(/^Mitgliedsbeitrag \(Beitrittsgebühr .*50,00/);
  });

  it("metering point tariff: no tariff before the direction, then VZP or EZP; a new direction drops the tariff", () => {
    render(<Harness/>);
    choose("Feld", "Zählpunkttarif");
    expect(screen.getAllByLabelText("Neuer Wert")[0]).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Zuerst die Richtung wählen")).toBeInTheDocument();
    choose("Richtung", "Verbrauch");
    expect(options("Neuer Wert")).toEqual(["Bezug"]);
    choose("Neuer Wert", "Bezug");
    choose("Richtung", "Erzeugung");
    expect(screen.queryByText("Bezug")).toBeNull();
    expect(options("Neuer Wert")).toEqual(["Einspeisung"]);
  });

  it.each([
    ["noCommunity", "Zuerst die Gemeinschaft wählen"],
    ["loading", "Tarife werden geladen …"],
    ["error", "Tarife konnten nicht geladen werden"],
  ] as const)("tariff without list (%s) says why", (status, text) => {
    render(<Harness status={status} field="PARTICIPANT_TARIFF"/>);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getAllByLabelText("Neuer Wert")[0]).toHaveAttribute("aria-disabled", "true");
    ["Tarife konnten nicht geladen werden", "Tarife werden geladen …", "Zuerst die Gemeinschaft wählen"]
      .filter(t => t !== text).forEach(t => expect(screen.queryByText(t)).toBeNull());
  });

  it("disabled locks every input", () => {
    render(<Harness disabled field="MANDATE_REFERENCE"/>);
    ["Feld", "Aktion", "Bedingung"].forEach(l => expect(screen.getAllByLabelText(l)[0]).toHaveAttribute("aria-disabled", "true"));
    expect(screen.getByLabelText("Text davor (optional)")).toBeDisabled();
  });

  it("a new field starts a new rule", () => {
    render(<Harness/>);
    choose("Bedingung", "nur wo gleich …");
    choose("Feld", "Mandatsdatum");
    expect(screen.queryByLabelText("Bisheriger Wert")).toBeNull();
    expect(screen.getByLabelText("Neuer Wert")).toHaveAttribute("type", "date");
  });
});
