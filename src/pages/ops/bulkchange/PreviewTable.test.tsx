import React from "react";
import {fireEvent, render, screen, within} from "@testing-library/react";
import PreviewTable, {countsLine, presentCodes, RowsTable} from "./PreviewTable";
import {BulkPreview} from "../../../services/bulkchange.service";
import previewResponse from "../../../services/__fixtures__/bulkchange/preview.response.json";

const preview = previewResponse as BulkPreview;

describe("PreviewTable", () => {
  it("the legend lists only the codes of this preview", () => {
    render(<PreviewTable field="MANDATE_REFERENCE" preview={preview} onDownload={() => undefined}/>);
    fireEvent.click(screen.getByText("Bedeutung der Hinweise und Fehler"));
    const legend = screen.getByText("Bedeutung der Hinweise und Fehler").closest(".MuiAccordion-root") as HTMLElement;
    const codes = within(legend).getAllByText(/^[FH]\d$/).map(e => e.textContent);
    expect(codes).toEqual(["F5", "H6"]);
  });

  it("no legend without codes", () => {
    const quiet = {...preview, rows: preview.rows.filter(r => !r.error && r.hints.length === 0)};
    render(<PreviewTable field="MANDATE_REFERENCE" preview={quiet} onDownload={() => undefined}/>);
    expect(screen.queryByText("Bedeutung der Hinweise und Fehler")).toBeNull();
  });

  it("presentCodes: errors before hints, by number", () => {
    const rows = [{...preview.rows[0], hints: ["H9", "H1"], error: undefined}, {...preview.rows[3], hints: ["H10"]}];
    expect(presentCodes(rows)).toEqual(["F5", "H1", "H9", "H10"]);
  });

  it("counts line: singular and plural, grouped numbers", () => {
    expect(countsLine({changed: 1234, withHint: 1, unchangedCondition: 0, unchangedTarget: 1, errors: 1}))
      .toMatch(/^1.234 geändert .* 1 hat schon den Zielwert\) · 1 Fehler \(wird nicht geändert\)$/);
    expect(countsLine({changed: 0, withHint: 0, unchangedCondition: 2, unchangedTarget: 2, errors: 2}))
      .toMatch(/2 haben schon den Zielwert\) · 2 Fehler \(werden nicht geändert\)$/);
  });
});

describe("RowsTable", () => {
  it("speaks German and offers no column filter", () => {
    render(<RowsTable field="MANDATE_REFERENCE" rows={[]}/>);
    expect(screen.getByText("Keine Einträge")).toBeInTheDocument();
    expect(screen.getByText("Zeilen pro Seite:")).toBeInTheDocument();
    // the header buttons only show on hover
    fireEvent.click(document.querySelector('button[aria-label="Menü"]') as HTMLElement);
    const items = screen.getAllByRole("menuitem").map(i => i.textContent);
    expect(items.length).toBeGreaterThan(0);
    expect(items.some(t => /filter/i.test(t ?? ""))).toBe(false);
  });
});
