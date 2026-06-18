import {AuthService} from "./auth.service";
import {Eeg, EegMember, EegParticipant, Metering} from "../model/eeg.model";
import moment from "moment";
import {AdminUpdateData} from "../model/admin.model";

const ADMIN_API_SERVER = process.env.REACT_APP_ADMIN_SERVER_URL;

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
}