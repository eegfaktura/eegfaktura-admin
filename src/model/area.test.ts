import {AREA_OPTIONS, areaFromText, areaLabel} from "./area";

describe("area labels", () => {
  it("shows the short forms for the known areas", () => {
    expect(areaLabel("LOCAL")).toBe("EEG lokal")
    expect(areaLabel("REGIONAL")).toBe("EEG regional")
    expect(areaLabel("GEA")).toBe("GEA")
    expect(areaLabel("BEG")).toBe("BEG")
    expect(areaLabel("P2P")).toBe("P2P")
    expect(areaLabel("EVA")).toBe("EVA")
  })

  it("shows unknown or missing values as they are", () => {
    expect(areaLabel("PP")).toBe("PP")
    expect(areaLabel("toString")).toBe("toString")
    expect(areaLabel("")).toBe("")
    expect(areaLabel(undefined)).toBeUndefined()
  })

  it("finds the area for a key or a short form, case-insensitive", () => {
    expect(areaFromText("eeg lokal")).toBe("LOCAL")
    expect(areaFromText("Regional")).toBe("REGIONAL")
    expect(areaFromText("p2p")).toBe("P2P")
    expect(areaFromText(" Eva ")).toBe("EVA")
    expect(areaFromText("PP")).toBeUndefined()
    expect(areaFromText("Nachbarschaft")).toBeUndefined()
  })

  it("finds the area for the further spellings of member lists, case-insensitive", () => {
    expect(areaFromText("Lokal")).toBe("LOCAL")
    expect(areaFromText(" Peer-to-Peer ")).toBe("P2P")
    expect(areaFromText("eigenversorgung")).toBe("EVA")
    expect(areaFromText("Eigenversorger")).toBe("EVA")
    expect(areaFromText("Gemeinschaftliche Erzeugungsanlagen")).toBe("GEA")
    expect(areaFromText("BÜRGERGEMEINSCHAFTEN")).toBe("BEG")
    expect(areaFromText("Bürgerenergiegemeinschaft")).toBe("BEG")
    expect(areaFromText("toString")).toBeUndefined()
  })

  it("offers the areas in the select with unchanged keys", () => {
    expect(AREA_OPTIONS).toEqual([
      {key: "LOCAL", value: "EEG lokal"},
      {key: "REGIONAL", value: "EEG regional"},
      {key: "GEA", value: "GEA"},
      {key: "BEG", value: "BEG"},
      {key: "P2P", value: "P2P"},
      {key: "EVA", value: "EVA"},
    ])
  })
})
