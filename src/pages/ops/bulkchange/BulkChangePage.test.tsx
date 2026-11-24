import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import BulkChangePage from "./BulkChangePage";
import {BulkChangeError, BulkChangeService} from "../../../services/bulkchange.service";
import communities from "../../../services/__fixtures__/bulkchange/communities.response.json";
import tariffs from "../../../services/__fixtures__/bulkchange/tariffs.response.json";
import previewResponse from "../../../services/__fixtures__/bulkchange/preview.response.json";
import applyResponse from "../../../services/__fixtures__/bulkchange/apply.response.json";

const downloads = vi.hoisted(() => [] as { name: string, content: string }[]);
vi.mock("./csv", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./csv")>()),
  downloadCsv: (name: string, content: string) => downloads.push({name, content}),
}));

// The grid itself is tested in PreviewTable.test.tsx; here a plain list of the rows keeps the flow tests fast
// (the full grid made each test take seconds and the file time out under the load of the whole suite).
vi.mock("@mui/x-data-grid", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mui/x-data-grid")>()),
  DataGrid: ({rows}: { rows: { name: string }[] }) => <ul>{rows.map((r, i) => <li key={i}>{r.name}</li>)}</ul>,
}));

// each flow drives several MUI selects (1-2 s alone); under the parallel load of the whole suite that can pass
// the default 5 s
vi.setConfig({testTimeout: 15000});

// The flow of the page against the fixtures: community, rule, preview, "Vorschau geprüft", apply, errors.

const makeService = () => ({
  communities: vi.fn().mockResolvedValue(communities),
  preview: vi.fn().mockResolvedValue(previewResponse),
  apply: vi.fn().mockResolvedValue(applyResponse),
  tariffs: vi.fn().mockResolvedValue(tariffs),
});

// a menu that was just closed stays in the DOM during its exit transition (labelled like the select): the
// select comes first, the newest list last
const openListbox = () => screen.getAllByRole("listbox").slice(-1)[0];

const choose = (label: string, option: string) => {
  fireEvent.mouseDown(screen.getAllByLabelText(label)[0]);
  fireEvent.click(within(openListbox()).getByRole("option", {name: option}));
};

// community TE000441, rule "Mandatsreferenz ← Lastschrift- + Mitgliedsnummer, nur wo leer", preview computed
const toPreview = async (service: ReturnType<typeof makeService>) => {
  render(<BulkChangePage service={service as unknown as BulkChangeService}/>);
  const input = await screen.findByLabelText(/Gemeinschaft \(Name/);
  fireEvent.change(input, {target: {value: "Massen"}});
  fireEvent.click(await screen.findByRole("option", {name: "EEG Massenänderung · Tenant TE000441 · RC100441"}));
  choose("Feld", "Mandatsreferenz");
  fireEvent.change(screen.getByLabelText("Text davor (optional)"), {target: {value: "Lastschrift-"}});
  choose("Bedingung", "nur wo leer");
  fireEvent.click(screen.getByRole("button", {name: "Vorschau berechnen"}));
  await screen.findByText("3 Vorschau");
};

const checkbox = () => screen.getByLabelText("Vorschau für EEG Massenänderung (TE000441) geprüft");
// the section of a step, found by its heading
const step = (heading: string) => screen.getByRole("heading", {name: heading}).closest("section") as HTMLElement;

const applyButton = () => screen.getByRole("button", {name: "1 Änderung anwenden"});

describe("BulkChangePage", () => {
  it("shows communities with name, tenant and RC number separately", async () => {
    const service = makeService();
    render(<BulkChangePage service={service as unknown as BulkChangeService}/>);
    fireEvent.mouseDown(await screen.findByLabelText(/Gemeinschaft \(Name/));
    expect(screen.getByRole("option").textContent).toBe("EEG Massenänderung · Tenant TE000441 · RC100441");
  });

  it("previews the rule for the chosen tenant and shows counts and run hints", async () => {
    const service = makeService();
    await toPreview(service);
    expect(service.preview).toHaveBeenCalledWith("TE000441", {field: "MANDATE_REFERENCE", action: "COPY",
      source: "PARTICIPANT_NUMBER", prefix: "Lastschrift-", condition: "EMPTY"});
    expect(screen.getByText(/1 geändert/)).toBeInTheDocument();
    expect(screen.getByText(/nächste Abrechnung/)).toBeInTheDocument();
  });

  it("apply is disabled until 'Vorschau geprüft' and sends the changed hits", async () => {
    const service = makeService();
    await toPreview(service);
    expect(applyButton()).toBeDisabled();
    fireEvent.click(checkbox());
    expect(applyButton()).toBeEnabled();
    fireEvent.click(applyButton());
    await screen.findByText("Ergebnis");
    expect(service.apply).toHaveBeenCalledWith("TE000441", expect.objectContaining({field: "MANDATE_REFERENCE"}),
      [{participantId: "d4410000-0000-4000-8000-000000000001", expectedOld: null, expectedNew: "Lastschrift-1"}]);
    expect(screen.getByText(/1 übersprungen/)).toBeInTheDocument();
    expect(screen.getByText("Seit der Vorschau geändert — nicht geschrieben.")).toBeInTheDocument();
    expect(screen.queryByText(/CHANGED_SINCE_PREVIEW/)).toBeNull();
    expect(screen.getByText("3 Anna Muster")).toBeInTheDocument();
    expect(screen.queryByRole("button", {name: "1 Änderung anwenden"})).toBeNull();
  });

  it("the CSV holds the rows of the current filter and names the filter", async () => {
    downloads.length = 0;
    await toPreview(makeService());
    fireEvent.click(screen.getByRole("button", {name: "mit Hinweis (1)"}));
    fireEvent.click(screen.getByRole("button", {name: "Herunterladen (CSV)"}));
    expect(downloads).toHaveLength(1);
    expect(downloads[0].name).toMatch(/^massenaenderung-TE000441-mandate_reference-mit-hinweis-\d{4}-\d{2}-\d{2}\.csv$/);
    const lines = downloads[0].content.split("\r\n").filter(l => l !== "");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("H6 Mandatsänderung");
  });

  it("loads the tariffs of the chosen community for the tariff rules", async () => {
    const service = makeService();
    await toPreview(service);
    expect(service.tariffs).toHaveBeenCalledWith("TE000441");
    choose("Feld", "Mitgliedstarif");
    fireEvent.mouseDown(screen.getAllByLabelText("Neuer Wert")[0]);
    fireEvent.click(within(screen.getAllByRole("listbox").slice(-1)[0]).getByRole("option", {name: /^Mitgliedsbeitrag/}));
    expect(screen.getByRole("button", {name: "Vorschau berechnen"})).toBeEnabled();
  });

  it("the result can be downloaded as CSV of the written rows", async () => {
    downloads.length = 0;
    const service = makeService();
    await toPreview(service);
    fireEvent.click(screen.getByLabelText(/^Vorschau .*geprüft$/));
    fireEvent.click(applyButton());
    await screen.findByText("Geschrieben");
    const buttons = screen.getAllByRole("button", {name: "Herunterladen (CSV)"});
    fireEvent.click(buttons[buttons.length - 1]);
    expect(downloads[0].name).toMatch(/^massenaenderung-TE000441-mandate_reference-ergebnis-/);
    expect(downloads[0].content.split("\r\n").filter(l => l !== "")).toHaveLength(1 + applyResponse.rows.length);
  });

  it("says why the preview cannot be computed yet", async () => {
    render(<BulkChangePage service={makeService() as unknown as BulkChangeService}/>);
    await screen.findByLabelText(/Gemeinschaft \(Name/);
    expect(screen.getByRole("button", {name: "Vorschau berechnen"})).toBeDisabled();
    expect(screen.getByText("Zuerst die Gemeinschaft wählen.")).toBeInTheDocument();
  });

  it("while a preview is computed: progress, locked form, the old preview stays", async () => {
    const service = makeService();
    await toPreview(service);
    let resolve: (v: unknown) => void = () => undefined;
    service.preview.mockReturnValue(new Promise(r => { resolve = r; }));
    fireEvent.click(screen.getByRole("button", {name: "Vorschau berechnen"}));
    expect(screen.getByRole("progressbar", {name: "Vorschau wird berechnet"})).toBeInTheDocument();
    expect(screen.getByLabelText(/Gemeinschaft \(Name/)).toBeDisabled();
    expect(screen.getAllByLabelText("Feld")[0]).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("3 Vorschau")).toBeInTheDocument();
    expect(applyButton()).toBeDisabled();
    resolve(previewResponse);
    await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
    expect(screen.getAllByLabelText("Feld")[0]).not.toHaveAttribute("aria-disabled");
  });

  it("while apply runs: progress in step 4", async () => {
    const service = makeService();
    service.apply.mockReturnValue(new Promise(() => undefined));
    await toPreview(service);
    fireEvent.click(checkbox());
    fireEvent.click(applyButton());
    expect(within(step("3 Vorschau")).getByRole("progressbar", {name: "Anwenden läuft"})).toBeInTheDocument();
    expect(applyButton()).toBeDisabled();
  });

  it("a change of the rule drops the preview", async () => {
    const service = makeService();
    await toPreview(service);
    choose("Bedingung", "alle");
    expect(screen.queryByText("3 Vorschau")).toBeNull();
  });

  it("a preview without matches says so", async () => {
    const service = makeService();
    service.preview.mockResolvedValue({counts: {changed: 0, withHint: 0, unchangedCondition: 0, unchangedTarget: 0, errors: 0},
      runHints: [], rows: []});
    await toPreview(service);
    expect(screen.getByText("Die Regel trifft kein Mitglied dieser Gemeinschaft.")).toBeInTheDocument();
    expect(screen.getByText("Nichts zu ändern.")).toBeInTheDocument();
  });

  it("step 4 names community and rule before the apply button", async () => {
    await toPreview(makeService());
    expect(within(step("3 Vorschau")).getByText("Gemeinschaft: EEG Massenänderung · Tenant TE000441 (RC RC100441) — "
      + "Mandatsreferenz: aus Mitgliedsnummer kopieren „Lastschrift-‹Mitgliedsnummer›“, nur wo leer")).toBeInTheDocument();
  });

  it.each([[409, 6104], [413, 6107]])("%i: nothing changed, the error shows in step 4, the preview stays", async (status, code) => {
    const service = makeService();
    service.apply.mockRejectedValue(new BulkChangeError(status, code, ""));
    await toPreview(service);
    fireEvent.click(checkbox());
    fireEvent.click(applyButton());
    const text = (content: string) => content.includes(`(${status})`);
    await within(step("3 Vorschau")).findByText(text);
    expect(screen.getAllByText(text)).toHaveLength(1);
    expect(applyButton()).toBeEnabled();
  });

  it("400 'Vorschau veraltet': the preview is dropped and can be computed again", async () => {
    const service = makeService();
    service.apply.mockRejectedValue(new BulkChangeError(400, 6102, ""));
    await toPreview(service);
    fireEvent.click(checkbox());
    fireEvent.click(applyButton());
    expect(await screen.findByText(/Vorschau veraltet/)).toBeInTheDocument();
    expect(screen.queryByText("3 Vorschau")).toBeNull();
    fireEvent.click(screen.getByRole("button", {name: "Vorschau neu berechnen"}));
    await screen.findByText("3 Vorschau");
    expect(service.preview).toHaveBeenCalledTimes(2);
    expect(checkbox()).not.toBeChecked();
  });

  it("500 on apply: outcome from the server, preview to be computed again", async () => {
    const service = makeService();
    service.apply.mockRejectedValue(new BulkChangeError(500, 6105, "Das Ergebnis der Massenänderung ist unklar."));
    await toPreview(service);
    fireEvent.click(checkbox());
    fireEvent.click(applyButton());
    expect(await screen.findByText(/Ergebnis der Massenänderung ist unklar/)).toBeInTheDocument();
    expect(screen.getByRole("button", {name: "Vorschau neu berechnen"})).toBeInTheDocument();
  });

  it("403 when loading the communities names the role", async () => {
    const service = makeService();
    service.communities.mockRejectedValue(new BulkChangeError(403, 0, ""));
    render(<BulkChangePage service={service as unknown as BulkChangeService}/>);
    expect(await screen.findByText(/superuser/, {selector: ".MuiAlert-message"})).toBeInTheDocument();
    service.communities.mockResolvedValue(communities);
    fireEvent.click(screen.getByRole("button", {name: "Neu laden"}));
    await waitFor(() => expect(screen.getByLabelText(/Gemeinschaft \(Name/)).toBeInTheDocument());
  });
});
