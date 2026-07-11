import {AuthService} from "./auth.service";
import {Eeg, EegMember, EegParticipant, Metering} from "../model/eeg.model";
import moment from "moment";
import {AdminUpdateData} from "../model/admin.model";

const ADMIN_API_SERVER = process.env.REACT_APP_ADMIN_SERVER_URL;
const ENERGY_SERVER = process.env.REACT_APP_ENERGY_SERVER_URL;

export class PortalService {

  public constructor(private authService: AuthService) {
  }

  private async getUser() {
    return this.authService.getToken()
  }

  private getSecureHeaders(tenant: string, token?: string) {
    return {'Authorization': `Bearer ${token}`, "tenant": tenant}
  }

  private async withSecureHeaders(headers: Record<string, string>, tenant?: string) {
    const token = await this.getUser()
    let secHeaders: Record<string, string> = {'Authorization': `Bearer ${token}`}
    if (tenant) {
      secHeaders = {"tenant": tenant, ...secHeaders}
    }
    return {...secHeaders, ...headers}
  }

  private handleErrors(response: Response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }

  // async changeProcessState(props: {tenant: string, participantId: string, meteringPoint: string, value: string, activeSince?: moment.Moment, inactiveSince?: moment.Moment}): Promise<Metering> {
  async changeProcessState(proto: string, props: AdminUpdateData): Promise<Metering> {
    const token = await this.getUser()
    const data: Record<string, any> = props;
    data["updateClass"] = proto;

    return await fetch(`${ADMIN_API_SERVER}/admin/master/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(this.handleErrors).then(async res => {
      if (res.status === 200) {
        return await res.json();
      }
    });
  }

  async changeParticipantState(proto: string, props: AdminUpdateData): Promise<EegParticipant> {
    const token = await this.getUser()
    const data: Record<string, any> = props;
    data["updateClass"] = proto;

    return await fetch(`${ADMIN_API_SERVER}/admin/master/update/participant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(this.handleErrors).then(async res => {
      if (res.status === 200) {
        return await res.json();
      }
    });
  }

  async changeEegState(proto: string, props: AdminUpdateData): Promise<EegMember> {
    const token = await this.getUser()
    const data: Record<string, any> = props;
    data["updateClass"] = proto;

    return await fetch(`${ADMIN_API_SERVER}/admin/master/update/eeg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }).then(this.handleErrors).then(async res => {
      if (res.status === 200) {
        return await res.json();
      }
    });
  }

  // Ops: delete raw energy data of one metering point in a time range (dryRun previews
  // the affected amount without writing). Calls energystore directly (same-origin via the
  // admin host's /energystore route) — no backend-to-backend hop. energystore's
  // superuser-aware middleware authorizes the cross-tenant call; the tenant travels as a
  // header, the ecId as a path segment.
  async deleteRawData(props: { tenant: string, ecId: string, meteringPoint: string, start: number, end: number, dryRun: boolean }): Promise<RawDataDeleteResult> {
    const token = await this.getUser()
    const res = await fetch(`${ENERGY_SERVER}/eeg/v2/${encodeURIComponent(props.ecId)}/rawdata/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'tenant': props.tenant,
      },
      body: JSON.stringify({
        meteringPoint: props.meteringPoint,
        start: props.start,
        end: props.end,
        dryRun: props.dryRun,
      })
    });
    if (!res.ok) {
      throw new Error(`Anfrage fehlgeschlagen (${res.status})`);
    }
    return await res.json();
  }
}

export interface RawDataDeleteResult {
  meteringPoint: string,
  affectedTimesteps: number,
  sumKwh: number,
  deleted: boolean,
}