import {cell, normalizeArea} from "./RegistrationContext";

describe("Excel member list: area", () => {
  it("accepts the keys in any case", () => {
    expect(normalizeArea("REGIONAL")).toBe("REGIONAL")
    expect(normalizeArea(" gea ")).toBe("GEA")
    expect(normalizeArea("Beg")).toBe("BEG")
  })
  it("accepts the short forms in any case", () => {
    expect(normalizeArea("EEG lokal")).toBe("LOCAL")
    expect(normalizeArea("EEG regional")).toBe("REGIONAL")
    expect(normalizeArea("eeg REGIONAL ")).toBe("REGIONAL")
  })
  it("accepts P2P and EVA in any case (platform#229)", () => {
    expect(normalizeArea("P2P")).toBe("P2P")
    expect(normalizeArea("p2p")).toBe("P2P")
    expect(normalizeArea(" eva ")).toBe("EVA")
  })
  it("keeps LOCAL for an empty cell (E8)", () => {
    expect(normalizeArea(undefined)).toBe("LOCAL")
    expect(normalizeArea("")).toBe("LOCAL")
    expect(normalizeArea("  ")).toBe("LOCAL")
  })
  it("gives no area for an unknown type, instead of LOCAL", () => {
    expect(normalizeArea("PP")).toBe("")
    expect(normalizeArea("Peer-to-Peer")).toBe("")
    expect(normalizeArea("Bürgergemeinschaften")).toBe("")
  })
})

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
