import React, {FC, useEffect} from "react";
import {render, screen} from "@testing-library/react";
import {ParticipantProvider, useParticipantContext} from "./context/participant.context";
import {EegParticipantsComponent} from "./EegParticipants.component";
import {EegParticipant} from "../../model/eeg.model";

// An EEG without members, or a search without hits, shows a note instead of an empty area; the two say different
// things.

const anna = {id: "p1", firstName: "Anna", lastName: "Ott", meters: []} as unknown as EegParticipant

const Members: FC<{members: EegParticipant[], search?: string}> = ({members, search}) => {
  const {participantsLoaded, setSearchItem} = useParticipantContext()
  useEffect(() => {
    participantsLoaded(members)
    setSearchItem(search)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, as the details page loads them
  }, [])
  return <EegParticipantsComponent/>
}

const mount = (members: EegParticipant[], search?: string) =>
  render(<ParticipantProvider><Members members={members} search={search}/></ParticipantProvider>)

it("says when the community has no members", () => {
  mount([])

  expect(screen.getByText("Keine Mitglieder")).toBeInTheDocument()
})

it("says when a search has no hits", () => {
  mount([anna], "huber")

  expect(screen.getByText("Keine Treffer für „huber“")).toBeInTheDocument()
  expect(screen.queryByText("Keine Mitglieder")).not.toBeInTheDocument()
})
