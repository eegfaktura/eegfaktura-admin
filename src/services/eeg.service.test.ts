import {APIError, EegService} from "./eeg.service";
import {AuthService} from "./auth.service";
import {EegRegister, PontonRegister} from "../model/eeg.model";

// admin-backend answers POST /eeg/ponton with HTTP 200 and reports the outcome
// as {status, message} in the body.

const ponton = {
  tenant: "RC100100", rcNumber: "RC100100",
  pontonInfo: {username: "", password: "", domain: "edanet.at", pontonCommType: "KEP"},
} as PontonRegister

const authService = {getToken: async () => "token"} as unknown as AuthService

const mockFetch = (httpStatus: number, body: unknown, json = async () => body) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: httpStatus >= 200 && httpStatus < 300,
    status: httpStatus,
    statusText: "",
    json,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch
}

describe("EegService.registerPonton", () => {
  const service = new EegService(authService)

  it("resolves when the body status is 200", async () => {
    mockFetch(200, {status: 200, message: "registered"})
    await expect(service.registerPonton(ponton)).resolves.toEqual({status: 200, message: "registered"})
  })

  it.each([500, 501, 502])("rejects with the body message when the body status is %i", async (status) => {
    mockFetch(200, {status, message: "Ponton nicht erreichbar"})
    const err = await service.registerPonton(ponton).catch(e => e)
    expect(err).toBeInstanceOf(APIError)
    expect(err.code).toBe(status)
    expect(err.message).toContain("Ponton nicht erreichbar")
    expect(err.message).toContain("bereits erfolgt")
  })

  it("resolves when the body has no numeric status", async () => {
    mockFetch(200, {message: "ok"})
    await expect(service.registerPonton(ponton)).resolves.toEqual({message: "ok"})
  })

  it("rejects with a clear message when the body is not JSON", async () => {
    mockFetch(200, "", async () => { throw new SyntaxError("Unexpected end of JSON input") })
    const err = await service.registerPonton(ponton).catch(e => e)
    expect(err).toBeInstanceOf(APIError)
    expect(err.message).toBe("Ponton-Registrierung: ungültige Antwort vom Server")
  })

  it("rejects when the HTTP status is not ok", async () => {
    mockFetch(500, {code: 500, message: "boom"})
    await expect(service.registerPonton(ponton)).rejects.toBeInstanceOf(APIError)
  })
})

describe("EegService.registerEeg", () => {
  it("rejects with the admin-backend's code and message for an EEG that exists (261015-ca1)", async () => {
    const message = "EEG ist bereits registriert (Tenant RC100100, RC-Nummer RC100100). Es wurde nichts geändert; fehlende Logins oder Ponton über „EEG Accounts“ bzw. „Ponton Verbindung“ ergänzen."
    mockFetch(409, {code: 409, message})
    const err = await new EegService(authService).registerEeg({} as EegRegister).catch(e => e)
    expect(err).toBeInstanceOf(APIError)
    expect(err.code).toBe(409)
    expect(err.message).toBe(message)
  })
})

describe("addAccount (platform#166)", () => {
  const service = new EegService({getToken: async () => "t"} as any)
  const answer = (status: number, body: unknown) =>
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify(body), {status}) as any)
  afterEach(() => vi.restoreAllMocks())

  it("returns the result of the admin-backend, also for 400", async () => {
    answer(400, {email: "x", status: "failed", message: "E-Mail-Adresse ungültig"})
    await expect(service.addAccount("RC1", {firstname: "A", lastname: "B", email: "x"}))
      .resolves.toEqual({email: "x", status: "failed", message: "E-Mail-Adresse ungültig"})
  })

  it("treats an answer without a result (403) as failed", async () => {
    answer(403, {error: "superuser role required"})
    const r = await service.addAccount("RC1", {firstname: "A", lastname: "B", email: "a@test.local"})
    expect(r.status).toBe("failed")
    expect(r.email).toBe("a@test.local")
  })
})
