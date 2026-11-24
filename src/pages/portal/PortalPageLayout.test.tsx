import React from "react";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Provider} from "react-redux";
import {makeStore} from "../../redux/store";
import {selectedEeg} from "../../redux/features/eegStateSlice";
import {Api, EegService} from "../../services/eeg.service";
import {EegMember} from "../../model/eeg.model";
import PortalPageLayout from "./PortalPageLayout";

// The list of communities in the portal: usable with the keyboard and a screen reader, and it says when it is
// loading, empty or failed instead of showing an empty page.

vi.mock("../../components/portal/EegMemberDetails.component", () => ({default: () => null}))

const eegs = [{tenant: "TE100002", name: "EEG Zwei"}, {tenant: "TE100001", name: "EEG Eins"}] as EegMember[]

const service = Api.eegService
afterEach(() => {
  Api.eegService = service
})

const mount = (getEeg: () => Promise<EegMember[]>) => {
  Api.eegService = {getEeg} as unknown as EegService
  const store = makeStore()
  render(<Provider store={store}><PortalPageLayout/></Provider>)
  return store
}

describe("portal: list of communities", () => {
  it("shows each community as a button that selects it", async () => {
    const store = mount(async () => eegs)

    const card = await screen.findByRole("button", {name: /TE100001/})
    expect(card).not.toHaveAttribute("aria-current")
    userEvent.click(card)

    expect(selectedEeg(store.getState())?.tenant).toBe("TE100001")
    await waitFor(() => expect(card).toHaveAttribute("aria-current", "true"))
  })

  it("names the search field", async () => {
    mount(async () => eegs)

    expect(await screen.findByRole("textbox", {name: "Gemeinschaften suchen"})).toBeInTheDocument()
  })
})

describe("portal: loading the communities", () => {
  it("shows a progress indicator while loading", () => {
    mount(() => new Promise(() => {}))

    expect(screen.getByRole("progressbar", {name: "Gemeinschaften werden geladen"})).toBeInTheDocument()
  })

  it("says when there are no communities", async () => {
    mount(async () => [])

    expect(await screen.findByText("Keine Gemeinschaften")).toBeInTheDocument()
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })

  it("shows an error when the list cannot be loaded", async () => {
    mount(() => Promise.reject(new Error("500")))

    expect(await screen.findByRole("alert")).toHaveTextContent("Gemeinschaften konnten nicht geladen werden.")
  })
})
