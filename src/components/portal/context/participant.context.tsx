import React, {FC, ReactNode, useContext, useMemo} from "react";
import {EegParticipant, Metering} from "../../../model/eeg.model";

interface ParticipantContextProps {
  participantsLoaded: (participants: EegParticipant[]) => void;
  updateMeter: (meter: Metering) => void;
  updateParticipant: (participant: EegParticipant) => void;
  selectParticipant: (participant: EegParticipant | undefined) => void;
  selectedParticipant?: EegParticipant;
  selectedMeters?: Metering[];
  participants: EegParticipant[];
  setSearchItem: (item: string | undefined) => void;
}

const ParticipantContext = React.createContext({} as ParticipantContextProps );

const filterParticipants = (participants: EegParticipant[], searchItem: string | undefined) => {
  if (searchItem && searchItem.length > 0) {
    const search = searchItem.toLowerCase()
    return participants.filter(p =>
      p.firstName.toLowerCase().includes(search) ||
      p.lastName.toLowerCase().includes(search) ||
      p.meters.find(m => m.meteringPoint.toLowerCase().includes(search))
    )
  }
  return participants
}

export const ParticipantProvider:FC<{children: ReactNode}> = ({children}) => {

  const [allParticipants, setAllParticipants] = React.useState<EegParticipant[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);
  const [searchItem, setSearchItem] = React.useState<string | undefined>(undefined);

  const participants = useMemo(() => filterParticipants(allParticipants, searchItem), [allParticipants, searchItem]);
  const selectedParticipant = selectedId === undefined ? undefined : allParticipants.find(p => p.id === selectedId);

  const value: ParticipantContextProps = {
    participantsLoaded: (participants: EegParticipant[]) => {
      setAllParticipants(participants)
      setSearchItem(undefined)
    },
    selectedParticipant: selectedParticipant,
    participants: participants,
    updateMeter: (meter: Metering) => {
      setAllParticipants(all => all.map(
        s => s.id === meter.participantId
          ? {...s, meters: s.meters.map(m => m.meteringPoint === meter.meteringPoint ? meter : m)}
          : s))
    },
    updateParticipant: (participant: EegParticipant) => {
      setAllParticipants(p => p.map(e => e.id === participant.id ? participant : e));
    },
    selectParticipant: (participant?: EegParticipant) => setSelectedId(participant?.id),
    selectedMeters: selectedParticipant?.meters,
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
