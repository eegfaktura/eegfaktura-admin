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

// Further spellings in member lists, lower case: the template header "Lokal/Regional", the long forms of the concept
// and the labels before the short forms (platform#229). Read only, never offered.
const AREA_ALIASES: Record<string, Area> = {
  "lokal": "LOCAL",
  "gemeinschaftliche erzeugungsanlagen": "GEA",
  "bürgergemeinschaften": "BEG",
  "bürgerenergiegemeinschaft": "BEG",
  "peer-to-peer": "P2P",
  "eigenversorgung": "EVA",
  "eigenversorger": "EVA",
}

// The area for a key, a short form or an alias, case-insensitive ("EEG regional" -> REGIONAL); undefined if unknown.
export const areaFromText = (text: string): Area | undefined => {
  const t = text.trim().toLowerCase()
  return (Object.keys(AREA_LABELS) as Area[]).find(a => a.toLowerCase() === t || AREA_LABELS[a].toLowerCase() === t)
    ?? (Object.prototype.hasOwnProperty.call(AREA_ALIASES, t) ? AREA_ALIASES[t] : undefined)
}

// Unknown or missing values are shown as they are.
export const areaLabel = (area?: string) =>
  area && Object.prototype.hasOwnProperty.call(AREA_LABELS, area) ? AREA_LABELS[area as Area] : area
