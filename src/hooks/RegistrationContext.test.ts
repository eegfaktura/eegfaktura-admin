import {cell} from "./RegistrationContext";

describe("Excel member list: column lookup", () => {
  it("finds the email column whether it is called E-Mail or EMail", () => {
    expect(cell({"EMail": "a@b.at"}, "E-Mail")).toBe("a@b.at")
    expect(cell({"E-Mail": "a@b.at"}, "E-Mail")).toBe("a@b.at")
  })
  it("matches headers with LF or CRLF line breaks", () => {
    expect(cell({"Lokal/Regional\nBEG/GEA": "GEA"}, "Lokal/Regional\r\nBEG/GEA")).toBe("GEA")
  })
  it("does not confuse the main account email with the member email", () => {
    expect(cell({"Hauptaccount\nE-Mail": "x@y.at"}, "E-Mail")).toBeUndefined()
  })
})
