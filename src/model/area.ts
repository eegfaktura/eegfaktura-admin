import {EegMember} from "./eeg.model";

type Area = EegMember["area"]

// Short forms of an EEG's area ("Region"), used in the registration form and in the EEG details.
// Typed with the area union, so a new area without a label does not compile.
const AREA_LABELS: Record<Area, string> = {
  LOCAL: "EEG lokal",
  REGIONAL: "EEG regional",
  GEA: "GEA",
  BEG: "BEG",
  P2P: "P2P",
  EVA: "EVA",
}

export const AREA_OPTIONS = Object.entries(AREA_LABELS).map(([key, value]) => ({key, value}))

// The area for a key or a short form, case-insensitive ("EEG regional" -> REGIONAL); undefined if unknown.
export const areaFromText = (text: string): Area | undefined => {
  const t = text.trim().toLowerCase()
  return (Object.keys(AREA_LABELS) as Area[]).find(a => a.toLowerCase() === t || AREA_LABELS[a].toLowerCase() === t)
}

// Unknown or missing values are shown as they are.
export const areaLabel = (area?: string) =>
  area && Object.prototype.hasOwnProperty.call(AREA_LABELS, area) ? AREA_LABELS[area as Area] : area
