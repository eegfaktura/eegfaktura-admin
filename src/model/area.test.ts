import {AREA_OPTIONS, areaLabel} from "./area";

describe("area labels", () => {
  it("shows the short forms for the known areas", () => {
    expect(areaLabel("LOCAL")).toBe("EEG lokal")
    expect(areaLabel("REGIONAL")).toBe("EEG regional")
    expect(areaLabel("GEA")).toBe("GEA")
    expect(areaLabel("BEG")).toBe("BEG")
  })

  it("shows unknown or missing values as they are", () => {
    expect(areaLabel("PP")).toBe("PP")
    expect(areaLabel("toString")).toBe("toString")
    expect(areaLabel("")).toBe("")
    expect(areaLabel(undefined)).toBeUndefined()
  })

  it("offers the areas in the select with unchanged keys", () => {
    expect(AREA_OPTIONS).toEqual([
      {key: "LOCAL", value: "EEG lokal"},
      {key: "REGIONAL", value: "EEG regional"},
      {key: "GEA", value: "GEA"},
      {key: "BEG", value: "BEG"},
    ])
  })
})
