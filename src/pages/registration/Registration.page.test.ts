import {registerErrorMessage} from "./Registration.page";
import {APIError} from "../../services/eeg.service";

describe("registerErrorMessage", () => {
  const text = "EEG ist bereits registriert (Tenant RC100100, RC-Nummer RC100100). Es wurde nichts geändert."

  it("shows the reason when an EEG that exists is refused (261015-ca1)", () => {
    expect(registerErrorMessage(new APIError(409, 409, text))).toEqual({message: text, severity: "error", sticky: true})
  })

  it("keeps the texts of the other codes", () => {
    expect(registerErrorMessage(new APIError(400, 501, "a"))).toEqual({message: "a", severity: "error"})
    expect(registerErrorMessage(new APIError(400, 502, "b"))).toEqual({message: "b", severity: "warning"})
    expect(registerErrorMessage(new APIError(400, 510, "c"))).toEqual({message: "c", severity: "warning"})
    expect(registerErrorMessage(new APIError(500, 500, "d"))).toEqual({message: "Error beim Anlegen des Mitglieds", severity: "error"})
  })
})
