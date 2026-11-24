import {AuthService} from "./auth.service";
import {applyItems, BulkChangeError, BulkChangeService, BulkPreview} from "./bulkchange.service";
import {buildRule, initialForm} from "../pages/ops/bulkchange/rule";
import communities from "./__fixtures__/bulkchange/communities.response.json";
import previewRequest from "./__fixtures__/bulkchange/preview.request.json";
import previewResponse from "./__fixtures__/bulkchange/preview.response.json";
import applyRequest from "./__fixtures__/bulkchange/apply.request.json";
import applyResponse from "./__fixtures__/bulkchange/apply.response.json";
import tariffs from "./__fixtures__/bulkchange/tariffs.response.json";
import previewEmpty from "./__fixtures__/bulkchange/preview.empty.response.json";
import errorResponse from "./__fixtures__/bulkchange/error.response.json";
import previewFileRequest from "./__fixtures__/bulkchange/preview.file.request.json";
import previewFileResponse from "./__fixtures__/bulkchange/preview.file.response.json";
import applyFileRequest from "./__fixtures__/bulkchange/apply.file.request.json";
import applyFileResponse from "./__fixtures__/bulkchange/apply.file.response.json";

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

  it("loads the tariffs of the community with the tenant in the header", async () => {
    const fetchMock = answer(200, tariffs);
    await expect(service.tariffs("TE000441")).resolves.toEqual(tariffs);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/bulkchange\/tariffs$/);
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({Authorization: "Bearer token", tenant: "TE000441"});
    tariffs.forEach(t => {
      expect(Object.keys(t).sort()).toEqual(["id", "joiningFee", "name", "type"]);
      expect(["EEG", "VZP", "EZP"]).toContain(t.type);
    });
  });

  it("posts the preview with the tenant in the header, never in the body", async () => {
    const fetchMock = answer(200, previewResponse);
    const res = await service.preview("TE000441", buildRule(fixtureForm));
    // backend omits unchangedNotInFile outside FROM_FILE; the service fills in 0
    expect(res.counts).toEqual({changed: 1, withHint: 1, unchangedCondition: 1, unchangedTarget: 1, errors: 1, unchangedNotInFile: 0});
    expect(res.notFound).toEqual([]);
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

  it("reads the preview without hits of the fixture", async () => {
    answer(200, previewEmpty);
    const res = await service.preview("TE000441", buildRule(fixtureForm));
    expect(res).toEqual({...previewEmpty, counts: {...previewEmpty.counts, unchangedNotInFile: 0}, notFound: []});
    expect(applyItems(res)).toEqual([]);
  });

  it("an empty preview may come with null lists: the page gets empty arrays", async () => {
    answer(200, {counts: {changed: 0, withHint: 0, unchangedCondition: 0, unchangedTarget: 0, errors: 0}, runHints: null, rows: null});
    const res = await service.preview("TE000441", buildRule(fixtureForm));
    expect(res.rows).toEqual([]);
    expect(res.runHints).toEqual([]);
    expect(applyItems(res)).toEqual([]);
  });

  it("null lists of apply and of a row's hints become empty arrays", async () => {
    answer(200, {changed: 0, skipped: null, runHints: null, rows: [{...applyResponse.rows[0], hints: null}]});
    const res = await service.apply("TE000441", applyRequest.rule as never, applyRequest.items);
    expect(res.skipped).toEqual([]);
    expect(res.runHints).toEqual([]);
    expect(res.rows[0].hints).toEqual([]);
  });

  // Value from file (konzept Teil 2): the form sends only number and value of the chosen columns.
  const fileForm = {...initialForm("MANDATE_REFERENCE"), action: "FROM_FILE" as const, fileValues: previewFileRequest.rule.values};

  it("the file rule builds the preview request of the fixture", () => {
    expect({rule: buildRule(fileForm)}).toEqual(previewFileRequest);
  });

  it("reads the file preview: not in the file, F8 and the numbers not found", async () => {
    answer(200, previewFileResponse);
    const res = await service.preview("TE000441", buildRule(fileForm));
    expect(res.counts.unchangedNotInFile).toBe(1);
    expect(res.notFound).toEqual(["0009"]);
    expect(res.rows.map(r => r.class)).toContain("UNCHANGED_NOT_IN_FILE");
    expect(applyItems(res)).toEqual(applyFileRequest.items);
  });

  it("apply sends the file rule again with its values", async () => {
    const fetchMock = answer(200, applyFileResponse);
    const res = await service.apply("TE000441", buildRule(fileForm), applyFileRequest.items);
    expect(res.changed).toBe(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(applyFileRequest);
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

  it("a failed token renew is 401 and sends nothing", async () => {
    const fetchMock = answer(200, communities);
    const expired = new BulkChangeService({getToken: async () => { throw new Error("Token expired"); }} as unknown as AuthService);
    const err = await expired.apply("TE000441", applyRequest.rule as never, applyRequest.items).catch(e => e);
    expect(err).toMatchObject({status: 401, code: 0});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports status 0 when no answer arrives", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const err = await service.apply("TE000441", applyRequest.rule as never, applyRequest.items).catch(e => e);
    expect(err).toMatchObject({status: 0, code: 0});
  });
});
