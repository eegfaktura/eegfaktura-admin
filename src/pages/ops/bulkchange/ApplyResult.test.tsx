import {skipText} from "./ApplyResult";

describe("skipText", () => {
  it("names the F code of a row error, never the raw enum", () => {
    expect(skipText({participantId: "p", reason: "F3"})).toMatch(/^F3: /);
    expect(skipText({participantId: "p", reason: "CHANGED_SINCE_PREVIEW"})).not.toContain("CHANGED_SINCE_PREVIEW");
    expect(skipText({participantId: "p", reason: "SOMETHING_NEW"})).toBe("aus unbekanntem Grund übersprungen");
  });
});
