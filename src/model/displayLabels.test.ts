import {businessRoleLabel, processStateLabel} from "./displayLabels";

describe("display labels", () => {
  it.each([["ACTIVE", "Aktiv"], ["INACTIVE", "Inaktiv"], ["PENDING", "PENDING"], [undefined, undefined]])(
    "shows the process state %s as %s", (value, text) => {
      expect(processStateLabel(value)).toBe(text)
    })

  it.each([["EEG_PRIVATE", "Privat"], ["EEG_BUSINESS", "Unternehmen"], ["OTHER", "OTHER"]])(
    "shows the member type %s as %s", (value, text) => {
      expect(businessRoleLabel(value)).toBe(text)
    })
})
