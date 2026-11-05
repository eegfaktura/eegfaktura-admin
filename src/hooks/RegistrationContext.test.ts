import {cell, normalizeAllocation, normalizeArea} from "./RegistrationContext";

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
    expect(normalizeArea("Nachbarschaft")).toBe("")
    expect(normalizeArea("Lokal/Regional")).toBe("")
  })
  it("accepts the further spellings of member lists", () => {
    expect(normalizeArea("lokal")).toBe("LOCAL")
    expect(normalizeArea("Peer-to-Peer")).toBe("P2P")
    expect(normalizeArea("Eigenversorger")).toBe("EVA")
    expect(normalizeArea("Bürgergemeinschaften")).toBe("BEG")
  })
})

describe("Excel member list: allocation (platform#229, E6)", () => {
  it("gives DYNAMIC for an empty cell, dynamisch or dynamic in any case", () => {
    expect(normalizeAllocation(undefined)).toBe("DYNAMIC")
    expect(normalizeAllocation(" ")).toBe("DYNAMIC")
    expect(normalizeAllocation(" Dynamisch ")).toBe("DYNAMIC")
    expect(normalizeAllocation("DYNAMIC")).toBe("DYNAMIC")
    expect(normalizeAllocation("dynamic")).toBe("DYNAMIC")
  })
  it("gives no allocation for statisch or an unknown value", () => {
    expect(normalizeAllocation("statisch")).toBe("")
    expect(normalizeAllocation("STATIC")).toBe("")
    expect(normalizeAllocation("fix")).toBe("")
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
