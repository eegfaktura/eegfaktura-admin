import {AuthService} from "./auth.service";
import {applyItems, BulkChangeError, BulkChangeService, BulkPreview} from "./bulkchange.service";
import {buildRule, initialForm} from "../pages/ops/bulkchange/rule";
import communities from "./__fixtures__/bulkchange/communities.response.json";
import previewRequest from "./__fixtures__/bulkchange/preview.request.json";
import previewResponse from "./__fixtures__/bulkchange/preview.response.json";
import applyRequest from "./__fixtures__/bulkchange/apply.request.json";
import applyResponse from "./__fixtures__/bulkchange/apply.response.json";
import errorResponse from "./__fixtures__/bulkchange/error.response.json";

// Contract with eegfaktura-backend (copies of api/testdata/bulkchange, source commit in the fixtures' README):
// the page builds exactly these request bodies and reads these answers.

const authService = {getToken: async () => "token"} as unknown as AuthService;

const answer = (status: number, body: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

// The rule of the fixtures: mandate reference ← "Lastschrift-" + member number, only where empty.
const fixtureForm = {...initialForm("MANDATE_REFERENCE"), action: "COPY" as const, prefix: "Lastschrift-", condition: "EMPTY" as const};

describe("bulk change contract", () => {
  const service = new BulkChangeService(authService);

  it("the rule form builds the preview request of the fixture", () => {
    expect({rule: buildRule(fixtureForm)}).toEqual(previewRequest);
  });

  it("apply sends the changed hits of the preview with the values it showed", () => {
    const items = applyItems(previewResponse as BulkPreview);
    // the fixture's apply request has a second hit that changed in between (skipped, CHANGED_SINCE_PREVIEW)
    expect(items).toEqual([applyRequest.items[0]]);
    expect(Object.keys(items[0])).not.toContain("meteringPointId");
  });

  it("loads the communities without a tenant header", async () => {
    const fetchMock = answer(200, communities);
    await expect(service.communities()).resolves.toEqual(communities);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/bulkchange\/communities$/);
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({Authorization: "Bearer token"});
  });

  it("posts the preview with the tenant in the header, never in the body", async () => {
    const fetchMock = answer(200, previewResponse);
    const res = await service.preview("TE000441", buildRule(fixtureForm));
    expect(res.counts).toEqual({changed: 1, withHint: 1, unchangedCondition: 1, unchangedTarget: 1, errors: 1});
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/bulkchange\/preview$/);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({Authorization: "Bearer token", tenant: "TE000441", "Content-Type": "application/json"});
    expect(JSON.parse(init.body)).toEqual(previewRequest);
  });

  it("posts apply with rule and items as in the fixture", async () => {
    const fetchMock = answer(200, applyResponse);
    const res = await service.apply("TE000441", applyRequest.rule as never, applyRequest.items);
    expect(res.changed).toBe(1);
    expect(res.skipped).toEqual([{participantId: "d4410000-0000-4000-8000-000000000003", reason: "CHANGED_SINCE_PREVIEW"}]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/bulkchange\/apply$/);
    expect(JSON.parse(init.body)).toEqual(applyRequest);
  });

  it("reads code and text of the error body", async () => {
    answer(409, errorResponse);
    const err = await service.apply("TE000441", applyRequest.rule as never, applyRequest.items).catch(e => e);
    expect(err).toBeInstanceOf(BulkChangeError);
    expect(err.status).toBe(409);
    expect(err.code).toBe(6104);
    expect(err.serverText).toBe(errorResponse.error.message);
  });

  it("takes a bare status when the auth middleware sends no body", async () => {
    answer(403, undefined);
    const err = await service.communities().catch(e => e);
    expect(err).toMatchObject({status: 403, code: 0, serverText: ""});
  });

  it("reports status 0 when no answer arrives", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const err = await service.apply("TE000441", applyRequest.rule as never, applyRequest.items).catch(e => e);
    expect(err).toMatchObject({status: 0, code: 0});
  });
});
