import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import BulkChangePage from "./BulkChangePage";
import {BulkChangeError, BulkChangeService} from "../../../services/bulkchange.service";
import communities from "../../../services/__fixtures__/bulkchange/communities.response.json";
import previewResponse from "../../../services/__fixtures__/bulkchange/preview.response.json";
import applyResponse from "../../../services/__fixtures__/bulkchange/apply.response.json";

// The flow of the page against the fixtures: community, rule, preview, "Vorschau geprüft", apply, errors.

const makeService = () => ({
  communities: vi.fn().mockResolvedValue(communities),
  preview: vi.fn().mockResolvedValue(previewResponse),
  apply: vi.fn().mockResolvedValue(applyResponse),
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
    fireEvent.click(screen.getByLabelText("Vorschau geprüft"));
    expect(applyButton()).toBeEnabled();
    fireEvent.click(applyButton());
    await screen.findByText("Ergebnis");
    expect(service.apply).toHaveBeenCalledWith("TE000441", expect.objectContaining({field: "MANDATE_REFERENCE"}),
      [{participantId: "d4410000-0000-4000-8000-000000000001", expectedOld: null, expectedNew: "Lastschrift-1"}]);
    expect(screen.getByText(/1 übersprungen/)).toBeInTheDocument();
    expect(screen.getByText(/CHANGED_SINCE_PREVIEW: Seit der Vorschau geändert/)).toBeInTheDocument();
    expect(screen.getByText("3 Anna Muster")).toBeInTheDocument();
    expect(screen.queryByRole("button", {name: "1 Änderung anwenden"})).toBeNull();
  });

  it("a change of the rule drops the preview", async () => {
    const service = makeService();
    await toPreview(service);
    choose("Bedingung", "alle");
    expect(screen.queryByText("3 Vorschau")).toBeNull();
  });

  it("409: nothing changed, the preview stays to try again", async () => {
    const service = makeService();
    service.apply.mockRejectedValue(new BulkChangeError(409, 6104, "gesperrt"));
    await toPreview(service);
    fireEvent.click(screen.getByLabelText("Vorschau geprüft"));
    fireEvent.click(applyButton());
    expect(await screen.findByText(/läuft gerade eine Massenänderung/)).toBeInTheDocument();
    expect(applyButton()).toBeEnabled();
  });

  it("400 'Vorschau veraltet': the preview is dropped and can be computed again", async () => {
    const service = makeService();
    service.apply.mockRejectedValue(new BulkChangeError(400, 6102, ""));
    await toPreview(service);
    fireEvent.click(screen.getByLabelText("Vorschau geprüft"));
    fireEvent.click(applyButton());
    expect(await screen.findByText(/Vorschau veraltet/)).toBeInTheDocument();
    expect(screen.queryByText("3 Vorschau")).toBeNull();
    fireEvent.click(screen.getByRole("button", {name: "Vorschau neu berechnen"}));
    await screen.findByText("3 Vorschau");
    expect(service.preview).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText("Vorschau geprüft")).not.toBeChecked();
  });

  it("500 on apply: outcome from the server, preview to be computed again", async () => {
    const service = makeService();
    service.apply.mockRejectedValue(new BulkChangeError(500, 6105, "Das Ergebnis der Massenänderung ist unklar."));
    await toPreview(service);
    fireEvent.click(screen.getByLabelText("Vorschau geprüft"));
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
