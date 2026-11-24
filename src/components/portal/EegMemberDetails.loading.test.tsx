import React from "react";
import {act, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Provider} from "react-redux";
import {makeStore} from "../../redux/store";
import {setSelectedEeg} from "../../redux/features/eegStateSlice";
import {ParticipantProvider} from "./context/participant.context";
import {EegMember, EegParticipant} from "../../model/eeg.model";
import {Api, EegService} from "../../services/eeg.service";
import EegMemberDetailsComponent from "./EegMemberDetails.component";

// Choosing another community never shows the members of the one chosen before (admin 261124-mm2): not when its
// load fails, and not when the answer for the earlier community comes in late.

// the member list as plain text, instead of the grid
vi.mock("./EegParticipants.component", async () => {
  const {useParticipantContext} = await import("./context/participant.context")
  return {
    EegParticipantsComponent: () => {
      const {participants} = useParticipantContext()
      return <div data-testid="members">{participants.map(p => p.firstName).join(",")}</div>
    },
  }
})
vi.mock("./AppBar.component", () => ({SearchBarComponent: () => null}))

const eeg = (tenant: string) => ({tenant, description: `EEG ${tenant}`, area: "LOCAL"} as EegMember)
const member = (firstName: string) => ({id: firstName, firstName, lastName: "X", meters: []} as unknown as EegParticipant)

const deferred = <T, >() => {
  let resolve: (v: T) => void = () => {}
  const promise = new Promise<T>(res => { resolve = res })
  return {promise, resolve}
}

const service = Api.eegService
afterEach(() => {
  Api.eegService = service
})

const mount = (answers: Record<string, () => Promise<EegParticipant[]>>) => {
  Api.eegService = {getParticipants: (tenant: string) => answers[tenant]()} as unknown as EegService
  const store = makeStore()
  render(<Provider store={store}><ParticipantProvider><EegMemberDetailsComponent/></ParticipantProvider></Provider>)
  return (tenant: string) => act(() => { store.dispatch(setSelectedEeg(eeg(tenant))) })
}

describe("EegMemberDetails: changing the community", () => {
  it("shows an error and not the members chosen before when the load fails", async () => {
    const select = mount({TE1: async () => [member("Anna")], TE2: () => Promise.reject(new Error("500"))})

    select("TE1")
    expect(await screen.findByTestId("members")).toHaveTextContent("Anna")

    select("TE2")
    expect(await screen.findByRole("alert")).toHaveTextContent("Mitglieder konnten nicht geladen werden.")
    expect(screen.queryByText("Anna")).not.toBeInTheDocument()
  })

  it("loads the members again with \"Neu laden\" after a failed load", async () => {
    let fail = true
    const select = mount({TE1: () => fail ? Promise.reject(new Error("500")) : Promise.resolve([member("Anna")])})

    select("TE1")
    await screen.findByRole("alert")
    fail = false
    userEvent.click(screen.getByRole("button", {name: "Neu laden"}))

    expect(await screen.findByTestId("members")).toHaveTextContent("Anna")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("ignores the late answer for a community that is no longer chosen", async () => {
    const first = deferred<EegParticipant[]>()
    const select = mount({TE1: () => first.promise, TE2: async () => [member("Bert")]})

    select("TE1")
    select("TE2")
    expect(await screen.findByTestId("members")).toHaveTextContent("Bert")

    await act(async () => first.resolve([member("Anna")]))
    await waitFor(() => expect(screen.getByTestId("members")).toHaveTextContent("Bert"))
    expect(screen.queryByText(/Anna/)).not.toBeInTheDocument()
  })
})
