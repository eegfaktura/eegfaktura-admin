import React from "react";
import {render, screen, waitFor} from "@testing-library/react";
import {Provider} from "react-redux";
import {combineReducers, configureStore} from "@reduxjs/toolkit";
import eegStateSlice, {setSelectedEeg} from "../../redux/features/eegStateSlice";
import {ParticipantProvider} from "./context/participant.context";
import {EegMember} from "../../model/eeg.model";
import EegMemberDetailsComponent from "./EegMemberDetails.component";

// The settlement interval is only shown here; it is changed in eegfaktura-web with the rules of
// platform#230 (billed periods, running calculations), which the admin tool cannot check.

vi.mock("../../services/eeg.service", () => ({
  Api: {eegService: {getParticipants: async () => []}},
}))
vi.mock("./EegParticipants.component", () => ({EegParticipantsComponent: () => null}))
vi.mock("./AppBar.component", () => ({SearchBarComponent: () => null}))

const renderDetails = (eeg: Partial<EegMember>) => {
  const store = configureStore({reducer: combineReducers({eegStateSlice})})
  store.dispatch(setSelectedEeg({tenant: "TE100002", description: "EEG Test", area: "LOCAL", ...eeg} as EegMember))
  render(
    <Provider store={store}>
      <ParticipantProvider><EegMemberDetailsComponent/></ParticipantProvider>
    </Provider>
  )
}

describe("EegMemberDetails", () => {
  it.each([
    ["MONTHLY", "Monatlich"],
    ["QUARTER", "Vierteljährlich"],
    ["BIANNUAL", "Halbjährlich"],
    ["ANNUAL", "Jährlich"],
  ] as const)("shows the settlement interval %s as %s", async (settlementInterval, label) => {
    renderDetails({settlementInterval})
    await waitFor(() => expect(screen.getByText("Abrechnungszeitraum")).toBeInTheDocument())
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it("offers no way to change the settlement interval", async () => {
    renderDetails({settlementInterval: "MONTHLY"})
    await waitFor(() => expect(screen.getByText("Abrechnungszeitraum")).toBeInTheDocument())
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
