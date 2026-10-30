import {PortalService} from "./portal.service";
import {AuthService} from "./auth.service";
import {AdminUpdateData} from "../model/admin.model";

// admin-backend answers a master-data update with the updated record, or with 400 when
// the backend refused it (admin-backend 261005-ca13).

const authService = {getToken: async () => "token"} as unknown as AuthService

const mockFetch = (httpStatus: number, body: unknown, statusText = "") => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: httpStatus >= 200 && httpStatus < 300,
    status: httpStatus,
    statusText,
    json: async () => body,
  }) as unknown as typeof fetch
}

const update = {tenant: "TE100002", participantId: "p1", meteringPoint: "AT001", value: {}} as AdminUpdateData

describe("PortalService master-data updates", () => {
  const service = new PortalService(authService)
  const calls: [string, (s: PortalService) => Promise<unknown>][] = [
    ["changeProcessState", s => s.changeProcessState("PROCESSSTATUS", {...update})],
    ["changeParticipantState", s => s.changeParticipantState("PARTICIPANT", {...update})],
    ["changeEegState", s => s.changeEegState("EEG", {...update})],
  ]

  it.each(calls)("%s resolves with the body for any 2xx, not only 200", async (_, call) => {
    mockFetch(201, {tenant: "TE100002"})
    await expect(call(service)).resolves.toEqual({tenant: "TE100002"})
  })

  it.each(calls)("%s rejects with the status when the update is refused", async (_, call) => {
    mockFetch(400, undefined)
    await expect(call(service)).rejects.toThrow("400")
  })

  it("keeps the status text in the error when there is one", async () => {
    mockFetch(400, undefined, "Bad Request")
    await expect(service.changeEegState("EEG", {...update})).rejects.toThrow("400 Bad Request")
  })
})
