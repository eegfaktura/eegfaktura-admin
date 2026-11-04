// Short forms of an EEG's area ("Region"), used in the registration form and in the EEG details.
export const AREA_LABELS: Record<string, string> = {
  LOCAL: "EEG lokal",
  REGIONAL: "EEG regional",
  GEA: "GEA",
  BEG: "BEG",
}

export const AREA_OPTIONS = Object.entries(AREA_LABELS).map(([key, value]) => ({key, value}))

// Unknown or missing values are shown as they are.
export const areaLabel = (area?: string) => area && Object.hasOwn(AREA_LABELS, area) ? AREA_LABELS[area] : area
