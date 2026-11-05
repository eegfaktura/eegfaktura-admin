import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {Provider} from "react-redux";
import {makeStore} from "../../redux/store";
import {setOperators} from "../../redux/features/eegStateSlice";
import RegistrationProvider from "../../hooks/RegistrationContext";
import RegistrationPage from "./Registration.page";
import {Api, EegService} from "../../services/eeg.service";

// Type of a new community in the registration form (platform#229): an unknown type in an Excel row
// is an error of that row.

const UNKNOWN = "Typ der Gemeinschaft unbekannt, bitte wählen"

const mount = () => {
  const store = makeStore()
  store.dispatch(setOperators([{id: "AT003000", name: "Netz Oberösterreich GmbH"}]))
  const {container} = render(
    <Provider store={store}>
      <RegistrationProvider>
        <RegistrationPage/>
      </RegistrationProvider>
    </Provider>
  )
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

// one EEG per area, or whole rows with their own header
const upload = async (areas: string[], header?: string) => {
  const rows = header ? areas : areas.map((a, i) => `RC${i + 1};${a}`)
  const list = [header ?? 'RC-Nummer;"Lokal/Regional\r\nBEG/GEA"', "Pflichtfeld;", "Beispiel;", ...rows].join("\r\n") + "\r\n"
  const content = new TextEncoder().encode(list).buffer as ArrayBuffer
  const file = new File([content], "list.csv")
  file.arrayBuffer = async () => content // jsdom's File has no arrayBuffer()
  fireEvent.change(mount(), {target: {files: [file]}})
  await waitFor(() => expect(screen.getByText("Filename: list.csv")).toBeInTheDocument())
}

// the select of a label (the label is not linked to the select by id)
const select = (label: string) =>
  screen.getByText(label, {selector: "label"}).parentElement!.querySelector('[role="button"], [role="combobox"]')!

const options = (label: string) => {
  fireEvent.mouseDown(select(label))
  return within(screen.getByRole("listbox")).getAllByRole("option").map(o => o.textContent)
}

describe("registration: type", () => {
  const service = Api.eegService
  afterEach(() => {
    Api.eegService = service
  })

  it("offers P2P and EVA as type", () => {
    mount()
    expect(options("Region")).toEqual(["EEG lokal", "EEG regional", "GEA", "BEG", "P2P", "EVA"])
  })

  it("shows an unknown type of an Excel row as an error and does not go on", async () => {
    await upload(["Peer-to-Peer"])
    expect(await screen.findByText(UNKNOWN)).toBeInTheDocument()
    fireEvent.click(screen.getByText("Next"))
    await waitFor(() => expect(screen.getByText(UNKNOWN)).toBeInTheDocument())
    expect(screen.getByText("Allgemeine Einstellungen Erneuerbarer Energie Gemeinschaften")).toBeInTheDocument()
  })

  it("clears the error once a type is chosen", async () => {
    await upload(["Peer-to-Peer"])
    await screen.findByText(UNKNOWN)
    fireEvent.mouseDown(select("Region"))
    fireEvent.click(within(screen.getByRole("listbox")).getByText("P2P"))
    await waitFor(() => expect(screen.queryByText(UNKNOWN)).not.toBeInTheDocument())
  })

  it("shows no error for a known type or an empty cell", async () => {
    await upload(["p2p", ""])
    fireEvent.click(screen.getAllByRole("button").find(b => b.querySelector('[data-testid="ArrowRightIcon"]'))!)
    await waitFor(() => expect(screen.getByText("RC-Number: RC2")).toBeInTheDocument())
    expect(screen.queryByText(UNKNOWN)).not.toBeInTheDocument()
  })

  it("does not send a row with an unknown type chosen on the last step, and goes back to the first", async () => {
    const register = vi.fn()
    Api.eegService = {registerEeg: register} as unknown as EegService
    const header = 'RC-Nummer;"Lokal/Regional\r\nBEG/GEA";Name der EG;GemID;Vorname;Nachname;E-Mail;IBAN;Kontoinhaber;' +
      "Kennung Netzbetreiber"
    const row = (rc: string, area: string) => `${rc};${area};EEG ${rc};AT003000${rc};Anna;Berg;a@b.at;` +
      "AT611904300234573201;Anna Berg;AT003000"
    await upload([row("RC1", "BEG"), row("RC2", "Peer-to-Peer")], header)
    fireEvent.click(screen.getByText("Next"))
    await screen.findByLabelText("Vorname")
    fireEvent.click(screen.getByText("Next"))
    await screen.findByText("Finish")
    fireEvent.click(screen.getAllByRole("button").find(b => b.querySelector('[data-testid="ArrowRightIcon"]'))!)
    await waitFor(() => expect(screen.getByText("RC-Number: RC2")).toBeInTheDocument())
    fireEvent.click(screen.getByText("Finish"))
    expect(await screen.findByText("Typ der Gemeinschaft unbekannt, bitte unter „Allgemein“ wählen.")).toBeInTheDocument()
    expect(await screen.findByText(UNKNOWN)).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })
})
