import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import FileValuesInput, {summaryText} from "./FileValuesInput";

// The file is read in the browser; onChange gets number and value of the chosen columns only.

const csvFile = (text: string, name = "liste.csv") => {
  const bytes = new TextEncoder().encode(text);
  const file = new File([bytes], name, {type: "text/csv"});
  // jsdom's File may lack arrayBuffer(): the component reads the bytes with it
  Object.defineProperty(file, "arrayBuffer", {value: async () => bytes.buffer});
  return file;
};

const openListbox = () => screen.getAllByRole("listbox").slice(-1)[0];
const choose = (label: string, option: string) => {
  fireEvent.mouseDown(screen.getByLabelText(label));
  fireEvent.click(within(openListbox()).getByRole("option", {name: option}));
};

describe("FileValuesInput", () => {
  it("reads the file, offers the header's columns and sends only number and value", async () => {
    const onChange = vi.fn();
    render(<FileValuesInput field="MANDATE_REFERENCE" disabled={false} onChange={onChange}/>);
    const file = csvFile("Titel\nNr;Name;Referenz\n0007;Anna Muster;STERN-MIT0007\n8;Ben;\n");
    fireEvent.change(screen.getByTestId("bulk-file-input"), {target: {files: [file]}});

    await waitFor(() => expect(screen.getByText("liste.csv")).toBeTruthy());
    expect(screen.getByLabelText("Kopfzeile (Zeilennummer)")).toHaveProperty("value", "2");
    expect(onChange).toHaveBeenLastCalledWith(null);

    choose("Spalte Mitgliedsnummer", "A · Nr");
    expect(onChange).toHaveBeenLastCalledWith(null);
    choose("Spalte Wert (Mandatsreferenz)", "C · Referenz");
    expect(onChange).toHaveBeenLastCalledWith([{participantNumber: "0007", value: "STERN-MIT0007"}]);
    expect(screen.getByText(/2 Zeilen mit Mitgliedsnummer · 1 mit Wert · 1 ohne Wert/)).toBeTruthy();
  });

  it("a file that cannot be read shows an error and sends nothing", async () => {
    const onChange = vi.fn();
    render(<FileValuesInput field="MANDATE_DATE" disabled={false} onChange={onChange}/>);
    const broken = new File(["x"], "liste.xlsx");
    Object.defineProperty(broken, "arrayBuffer", {value: async () => { throw new Error("read failed"); }});
    fireEvent.change(screen.getByTestId("bulk-file-input"), {target: {files: [broken]}});
    await waitFor(() => expect(screen.getByText(/konnte nicht gelesen werden/)).toBeTruthy());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("summaryText names only what occurs", () => {
    expect(summaryText({rows: 3, emptyValue: 0, noNumber: 0, duplicateSame: 0, duplicateConflict: 0}, 3))
      .toBe("3 Zeilen mit Mitgliedsnummer · 3 mit Wert");
    // grouping as the locale of the runtime writes it ("1.200" or "1 200")
    const n = (v: number) => v.toLocaleString("de-AT");
    expect(summaryText({rows: 1200, emptyValue: 1, noNumber: 2, duplicateSame: 3, duplicateConflict: 4}, 1199))
      .toBe(`${n(1200)} Zeilen mit Mitgliedsnummer · ${n(1199)} mit Wert · 1 ohne Wert (bleiben unverändert) · `
        + "2 ohne Mitgliedsnummer (werden ignoriert) · 3 Nummern doppelt mit gleichem Wert · "
        + "4 Nummern doppelt mit verschiedenen Werten (Fehler F8)");
  });
});
