import React, {ReactNode} from "react";
import {act, renderHook} from "@testing-library/react";
import {ParticipantProvider, useParticipantContext} from "./participant.context";
import {EegParticipant, Metering} from "../../../model/eeg.model";

// The search shows a filtered view of the loaded participants (AD-CQ-12): an edit made while
// a search is active must survive clearing the search, and an edit must not reset the search.

const meter = (participantId: string, meteringPoint: string) =>
  ({participantId, meteringPoint, status: "ACTIVE"} as Metering)

const anna = {id: "p1", firstName: "Anna", lastName: "Ott", meters: [meter("p1", "AT0001")]} as EegParticipant
const bert = {id: "p2", firstName: "Bert", lastName: "Huber", meters: [meter("p2", "AT0002")]} as EegParticipant

const wrapper = ({children}: {children: ReactNode}) => <ParticipantProvider>{children}</ParticipantProvider>

const renderContext = () => {
  const {result} = renderHook(() => useParticipantContext(), {wrapper})
  act(() => result.current.participantsLoaded([anna, bert]))
  return result
}

describe("ParticipantProvider", () => {
  it("filters by first name, last name and metering point", () => {
    const result = renderContext()

    act(() => result.current.setSearchItem("hub"))
    expect(result.current.participants.map(p => p.id)).toEqual(["p2"])

    act(() => result.current.setSearchItem("at0001"))
    expect(result.current.participants.map(p => p.id)).toEqual(["p1"])

    act(() => result.current.setSearchItem(""))
    expect(result.current.participants.map(p => p.id)).toEqual(["p1", "p2"])
  })

  it("keeps a meter change made during a search after the search is cleared", () => {
    const result = renderContext()
    act(() => result.current.setSearchItem("anna"))
    act(() => result.current.selectParticipant(result.current.participants[0]))

    act(() => result.current.updateMeter({...meter("p1", "AT0001"), status: "INACTIVE"}))
    expect(result.current.selectedMeters?.[0].status).toBe("INACTIVE")

    act(() => result.current.setSearchItem(undefined))
    expect(result.current.participants.find(p => p.id === "p1")?.meters[0].status).toBe("INACTIVE")
  })

  it("keeps the search when a participant is changed", () => {
    const result = renderContext()
    act(() => result.current.setSearchItem("anna"))
    act(() => result.current.selectParticipant(result.current.participants[0]))

    act(() => result.current.updateParticipant({...anna, lastName: "Maier"}))

    expect(result.current.participants.map(p => p.lastName)).toEqual(["Maier"])
    expect(result.current.selectedParticipant?.lastName).toBe("Maier")
  })

  it("drops a participant from the filtered list once an edit no longer matches the search", () => {
    const result = renderContext()
    act(() => result.current.setSearchItem("ott"))

    act(() => result.current.updateParticipant({...anna, lastName: "Maier"}))

    expect(result.current.participants).toEqual([])
    act(() => result.current.setSearchItem(undefined))
    expect(result.current.participants.map(p => p.lastName)).toEqual(["Maier", "Huber"])
  })
})
