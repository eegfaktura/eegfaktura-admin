// Display texts of values in the portal grids; the values themselves are sent and stored unchanged. Unknown or
// missing values are shown as they are.
const label = (labels: Record<string, string>) => (value?: string) =>
  value && Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : value

export const processStateLabel = label({ACTIVE: "Aktiv", INACTIVE: "Inaktiv"})

export const businessRoleLabel = label({EEG_PRIVATE: "Privat", EEG_BUSINESS: "Unternehmen"})
