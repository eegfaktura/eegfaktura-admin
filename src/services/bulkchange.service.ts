import {AuthService} from "./auth.service";

// Bulk change of master data (konzept-massenaenderungen.md, Tech Design A): the browser calls eegfaktura-backend
// directly under /api/bulkchange/… with the support user's bearer, as "Energiedaten löschen" calls energystore.
// backend admits only the realm role superuser; the community travels in the header tenant, never in the body.
// The JSON shapes are the contract of backend's api/testdata/bulkchange (copies in __fixtures__/bulkchange).

const API_SERVER = import.meta.env.REACT_APP_API_SERVER_URL;

export type BulkField = "DEBIT_TYPE" | "MANDATE_REFERENCE" | "MANDATE_DATE" | "PARTICIPANT_TARIFF" | "METER_TARIFF";
export type BulkAction = "SET" | "CLEAR" | "COPY" | "FROM_FILE";
export type BulkCondition = "ALL" | "EMPTY" | "EQUALS";
export type BulkDirection = "CONSUMPTION" | "GENERATOR";
export type BulkClass = "CHANGED" | "UNCHANGED_CONDITION" | "UNCHANGED_TARGET" | "UNCHANGED_NOT_IN_FILE" | "ERROR";

// An active tariff of the community that a tariff rule can set (type EEG for members, VZP/EZP for metering points).
export interface BulkTariff {
  id: string;
  name: string;
  type: "EEG" | "VZP" | "EZP";
  joiningFee: number;
}

export interface BulkCommunity {
  tenant: string;
  name: string;
  rcNumber: string;
}

// One row of a file for "Wert aus Datei" (action FROM_FILE): member number and the new value.
export interface BulkFileValue {
  participantNumber: string;
  value: string;
}

// The rule of preview and apply; keys the rule does not use are left out (backend refuses them when set).
export interface BulkRule {
  field: BulkField;
  action: BulkAction;
  value?: string;
  source?: "PARTICIPANT_NUMBER";
  prefix?: string;
  suffix?: string;
  condition: BulkCondition;
  conditionValue?: string;
  direction?: BulkDirection;
  values?: BulkFileValue[];
}

export interface BulkRow {
  participantId: string;
  meteringPointId?: string;
  participantNumber: string;
  name: string;
  oldValue: string | null;
  newValue: string | null;
  oldText: string;
  newText: string;
  class: BulkClass;
  hints: string[];
  error?: string;
}

export interface BulkCounts {
  changed: number;
  withHint: number;
  unchangedCondition: number;
  unchangedTarget: number;
  errors: number;
  // FROM_FILE only: members without a value in the file (backend omits it otherwise; the service fills in 0)
  unchangedNotInFile: number;
}

export interface BulkPreview {
  counts: BulkCounts;
  runHints: string[];
  rows: BulkRow[];
  // FROM_FILE only: member numbers of the file without a member in the community, as written in the file
  notFound: string[];
}

export interface BulkApplyItem {
  participantId: string;
  meteringPointId?: string;
  expectedOld: string | null;
  expectedNew: string | null;
}

export interface BulkSkip {
  participantId: string;
  meteringPointId?: string;
  reason: string;
}

export interface BulkApplyResult {
  changed: number;
  skipped: BulkSkip[];
  runHints: string[];
  rows: BulkRow[];
}

// A failed call: HTTP status (0: no answer at all), backend error code (6100–6107, 0 without body) and the
// server's German text, if any.
export class BulkChangeError extends Error {
  constructor(public status: number, public code: number, public serverText: string) {
    super(serverText || `HTTP ${status}`);
    Object.setPrototypeOf(this, BulkChangeError.prototype);
  }
}

// Key of a hit: member, and for the metering point tariff the metering point (as backend's BulkItemKey).
export const rowKey = (r: { participantId: string, meteringPointId?: string }) =>
  `${r.participantId.toLowerCase()}|${r.meteringPointId ?? ""}`;

// The changed hits of the preview, sent back to apply with the values the preview showed.
export const applyItems = (preview: BulkPreview): BulkApplyItem[] =>
  preview.rows.filter(r => r.class === "CHANGED").map(r => ({
    participantId: r.participantId,
    ...(r.meteringPointId ? {meteringPointId: r.meteringPointId} : {}),
    expectedOld: r.oldValue,
    expectedNew: r.newValue,
  }));

export class BulkChangeService {
  public constructor(private authService: AuthService) {
  }

  async communities(): Promise<BulkCommunity[]> {
    return this.call("GET", "/bulkchange/communities");
  }

  async tariffs(tenant: string): Promise<BulkTariff[]> {
    return this.call("GET", "/bulkchange/tariffs", tenant);
  }

  async preview(tenant: string, rule: BulkRule): Promise<BulkPreview> {
    const p = await this.call<BulkPreview>("POST", "/bulkchange/preview", tenant, {rule});
    return {
      ...p, counts: {...p.counts, unchangedNotInFile: p.counts?.unchangedNotInFile ?? 0},
      runHints: p.runHints ?? [], rows: normRows(p.rows), notFound: p.notFound ?? [],
    };
  }

  async apply(tenant: string, rule: BulkRule, items: BulkApplyItem[]): Promise<BulkApplyResult> {
    const r = await this.call<BulkApplyResult>("POST", "/bulkchange/apply", tenant, {rule, items});
    return {...r, skipped: r.skipped ?? [], runHints: r.runHints ?? [], rows: normRows(r.rows)};
  }

  private async call<T>(method: string, path: string, tenant?: string, body?: unknown): Promise<T> {
    let token: string;
    try {
      token = await this.authService.getToken();
    } catch {
      // no session or the silent renew failed: nothing was sent, the user has to sign in again
      throw new BulkChangeError(401, 0, "");
    }
    const headers: Record<string, string> = {'Authorization': `Bearer ${token}`};
    if (tenant) headers['tenant'] = tenant;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    let res: Response;
    try {
      res = await fetch(`${API_SERVER}${path}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new BulkChangeError(0, 0, "");
    }
    if (!res.ok) {
      throw await toError(res);
    }
    return await res.json();
  }
}

// Go encodes an empty slice as null (e.g. a preview without matches): the page always gets arrays.
const normRows = (rows: BulkRow[] | null | undefined): BulkRow[] =>
  (rows ?? []).map(r => ({...r, hints: r.hints ?? []}));

// Reads {"error": {code, error, message}}; the auth middleware answers 401/403 without a body.
async function toError(res: Response): Promise<BulkChangeError> {
  let code = 0;
  let text = "";
  try {
    const parsed = JSON.parse(await res.text());
    code = typeof parsed?.error?.code === "number" ? parsed.error.code : 0;
    text = typeof parsed?.error?.message === "string" ? parsed.error.message.trim().slice(0, 300) : "";
  } catch {
    // no or no JSON body: status alone
  }
  return new BulkChangeError(res.status, code, text);
}
