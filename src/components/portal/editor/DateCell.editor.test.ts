import {dayToEpochMs} from "./DateCell.editor";

// The backend (adminService.go) takes epoch ms and keeps the calendar day of that moment in Europe/Berlin
// (image ENV TZ), the admin may work in any other zone (admin 261005-ca3).
const dayInBackendZone = (epochMs: string) =>
  new Intl.DateTimeFormat("en-CA", {timeZone: "Europe/Berlin"}).format(new Date(Number(epochMs)))

const originalTz = process.env.TZ

describe.each(["Europe/Vienna", "Asia/Tokyo", "Pacific/Auckland", "America/New_York", "Pacific/Honolulu"])("in a browser in %s", (zone) => {
  beforeAll(() => { process.env.TZ = zone })
  afterAll(() => {
    if (originalTz === undefined) delete process.env.TZ
    else process.env.TZ = originalTz
  })

  it.each(["2026-01-15", "2026-03-29", "2026-10-25", "2026-12-31"])("the picked day %s stays that day", (day) => {
    const [y, m, d] = day.split("-").map(Number)
    expect(new Date(y, m - 1, d).getHours()).toBe(0)
    expect(dayInBackendZone(dayToEpochMs(new Date(y, m - 1, d))!)).toBe(day)
  })

  it("sends a date of the row that was not touched as the admin-backend delivered it", () => {
    const stored = Date.UTC(2026, 0, 15)
    expect(dayToEpochMs(stored)).toBe(String(stored))
    expect(dayInBackendZone(dayToEpochMs(stored)!)).toBe("2026-01-15")
  })
})

describe("dayToEpochMs", () => {
  it("is a number the backend can parse", () => {
    expect(dayToEpochMs(new Date(2026, 0, 15))).toBe(String(Date.UTC(2026, 0, 15, 12)))
  })

  it.each([[undefined], [null]])("sends nothing for an unset date (%s), not today", (value) => {
    expect(dayToEpochMs(value)).toBeUndefined()
  })
})
