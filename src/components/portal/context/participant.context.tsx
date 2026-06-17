import React, {FC, ReactNode, useContext, useEffect} from "react";
import {EegParticipant, Metering} from "../../../model/eeg.model";

interface ParticipantContextProps {
  participantsLoaded: (participants: EegParticipant[]) => void;
  resetParticipants: () => void;
  updateMeter: (meter: Metering) => void;
  updateParticipant: (participant: EegParticipant) => void;
  selectParticipant: (participant: EegParticipant | undefined) => void;
  selectedParticipant?: EegParticipant;
  selectedMeters?: Metering[];
  participants: EegParticipant[];
  setSearchItem: (item: string | undefined) => void;
}

const ParticipantContext = React.createContext({} as ParticipantContextProps );

export const ParticipantProvider:FC<{children: ReactNode}> = ({children}) => {

  const [participants, setParticipants] = React.useState<EegParticipant[]>([]);
  const [allParticipants, setAllParticipants] = React.useState<EegParticipant[]>([]);
  const [participant, setParticipant] = React.useState<EegParticipant | undefined>(undefined);
  const [searchItem, setSearchItem] = React.useState<string | undefined>(undefined);
  // const [selectedMeters, setSelectedMeters] = React.useState<Metering[] | undefined>([]);

  // useEffect(() => {
  //   setSelectedMeters(participant?.meters);
  // }, [participant]);

  const filterParticipants = () => {
    if (searchItem && searchItem.length > 0) {
      return allParticipants.filter(p =>
        p.firstName.toLowerCase().includes(searchItem.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchItem.toLowerCase()) ||
        p.meters.find(m => m.meteringPoint.toLowerCase().includes(searchItem.toLowerCase()))
      )
    }
    return allParticipants
  }

  useEffect(() => {
    setParticipants(allParticipants);
  }, [allParticipants]);

  useEffect(() => {
    if (searchItem && searchItem.length > 0) {
      setParticipants(filterParticipants());
    } else {
      setParticipants(allParticipants)
    }
  }, [searchItem]);

  const value: ParticipantContextProps = {
    participantsLoaded: (participants: EegParticipant[]) => {
      setAllParticipants(participants)
      setSearchItem(undefined)
    },
    resetParticipants: () => setAllParticipants([]),
    selectedParticipant: participant,
    participants: participants,
    updateMeter: (meter: Metering) => {
      const updatedParticipants: EegParticipant[] = participants.map(
        s => s.id === meter.participantId
          ? {...s, meters: s.meters.map(m => m.meteringPoint === meter.meteringPoint ? meter : m)}
          : s)
      setParticipants(updatedParticipants)
      // setSelectedMeters(participants.find(p => p.id = meter.participantId)?.meters)
      setParticipant(updatedParticipants.find(s => s.id === meter.participantId))
    },
    updateParticipant: (participant: EegParticipant) => {
      setAllParticipants(p => p.map(e => e.id === participant.id ? participant : e));
    },
    selectParticipant: (participant?: EegParticipant) => setParticipant(participant),
    selectedMeters: participant?.meters,
    setSearchItem: setSearchItem,
  }

  return (
    <ParticipantContext.Provider value={value}>
      {children}
    </ParticipantContext.Provider>
 )
}

export const useParticipantContext = () => {
  return useContext(ParticipantContext);
}