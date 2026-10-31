import {registerErrorMessage} from "./Registration.page";
import {APIError} from "../../services/eeg.service";

describe("registerErrorMessage", () => {
  const text = "EEG RC100100 ist bereits registriert. Es wurde nichts geändert."

  it("shows the reason when an EEG that exists is refused (261015-ca1)", () => {
    expect(registerErrorMessage(new APIError(409, 409, text))).toEqual({message: text, severity: "error"})
  })

  it("keeps the texts of the other codes", () => {
    expect(registerErrorMessage(new APIError(400, 501, "a"))).toEqual({message: "a", severity: "error"})
    expect(registerErrorMessage(new APIError(400, 502, "b"))).toEqual({message: "b", severity: "warning"})
    expect(registerErrorMessage(new APIError(400, 510, "c"))).toEqual({message: "c", severity: "warning"})
    expect(registerErrorMessage(new APIError(500, 500, "d"))).toEqual({message: "Error beim Anlegen des Mitglieds", severity: "error"})
  })
})
