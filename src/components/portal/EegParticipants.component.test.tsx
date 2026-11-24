import React from "react";
import {render, screen} from "@testing-library/react";
import {ParticipantProvider} from "./context/participant.context";
import {EegParticipantsComponent} from "./EegParticipants.component";

// An EEG without members shows a note instead of an empty area.
it("says when the community has no members", () => {
  render(<ParticipantProvider><EegParticipantsComponent/></ParticipantProvider>)

  expect(screen.getByText("Keine Mitglieder")).toBeInTheDocument()
})
