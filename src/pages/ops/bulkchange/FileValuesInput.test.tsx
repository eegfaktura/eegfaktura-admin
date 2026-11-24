import React from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import FileValuesInput, {summaryText} from "./FileValuesInput";

// The template is loaded in the browser; onChange gets number and value of the rule's field only.

const csvFile = (text: string, name = "vorlage.csv") => {
  const bytes = new TextEncoder().encode(text);
  const file = new File([bytes], name, {type: "text/csv"});
  // jsdom's File may lack arrayBuffer(): the component reads the bytes with it
  Object.defineProperty(file, "arrayBuffer", {value: async () => bytes.buffer});
  return file;
};

const load = (file: File) => fireEvent.change(screen.getByTestId("bulk-file-input"), {target: {files: [file]}});

describe("FileValuesInput", () => {
  it("offers the template and sends only number and value of the field", async () => {
    const onChange = vi.fn();
    render(<FileValuesInput field="MANDATE_REFERENCE" disabled={false} onChange={onChange}/>);
    expect(screen.getByText("Vorlage herunterladen").closest("a")?.getAttribute("href")).toMatch(/vorlage-massenaenderung\.xlsx$/);

    load(csvFile("Mitgliedsnummer;Name;Mandatsreferenz;Mandatsdatum\n0007;Anna Muster;STERN-MIT0007;1.1.2024\n8;Ben;;\n"));
    await waitFor(() => expect(screen.getByText("vorlage.csv")).toBeTruthy());
    expect(onChange).toHaveBeenLastCalledWith([{participantNumber: "0007", value: "STERN-MIT0007"}]);
    expect(screen.getByText(/2 Zeilen mit Mitgliedsnummer · 1 mit Wert · 1 ohne Wert/)).toBeTruthy();
  });

  it("a file without the template's columns shows why and sends nothing", async () => {
    const onChange = vi.fn();
    render(<FileValuesInput field="MANDATE_DATE" disabled={false} onChange={onChange}/>);
    load(csvFile("Nr.;Datum\n1;1.1.2024\n"));
    await waitFor(() => expect(screen.getByText(/keine Spalte „Mitgliedsnummer“/)).toBeTruthy());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("a file that cannot be read shows an error and sends nothing", async () => {
    const onChange = vi.fn();
    render(<FileValuesInput field="MANDATE_DATE" disabled={false} onChange={onChange}/>);
    const broken = new File(["x"], "liste.xlsx");
    Object.defineProperty(broken, "arrayBuffer", {value: async () => { throw new Error("read failed"); }});
    load(broken);
    await waitFor(() => expect(screen.getByText(/konnte nicht gelesen werden/)).toBeTruthy());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("summaryText names only what occurs", () => {
    expect(summaryText({rows: 3, emptyValue: 0, noNumber: 0, duplicateSame: 0, duplicateConflict: 0}, 3))
      .toBe("3 Zeilen mit Mitgliedsnummer · 3 mit Wert");
    expect(summaryText({rows: 1200, emptyValue: 1, noNumber: 2, duplicateSame: 3, duplicateConflict: 4}, 1199))
      .toMatch(/^1\D?200 Zeilen mit Mitgliedsnummer · 1\D?199 mit Wert · 1 ohne Wert \(bleiben unverändert\) · 2 ohne Mitgliedsnummer \(werden ignoriert\) · 3 Nummern doppelt mit gleichem Wert · 4 Nummern doppelt mit verschiedenen Werten \(Fehler F8\)$/);
  });
});
