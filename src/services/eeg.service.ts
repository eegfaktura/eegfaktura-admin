import {EegMember, EegParticipant, EegRegister, EegUsers, GridOperator, PontonRegister, PontonRegisterResponse} from "../model/eeg.model";
import {AuthService} from "./auth.service";
import {PortalService} from "./portal.service";

const ADMIN_API_SERVER = process.env.REACT_APP_ADMIN_SERVER_URL;

export class APIError extends Error {
  status: number;
  code: number;

  constructor(status: number, code: number, message: string) {
    super(message);
    this.status = status;
    this.code = code;

    Object.setPrototypeOf(this, APIError.prototype);
  }
}

interface IApi {
  eegService: EegService
  portalService: PortalService
}

export const Api = {} as IApi


export class EegService {

  public constructor(private authService: AuthService) {
  }


  // private getUser() {
  //   const oidcStorage = sessionStorage.getItem(`oidc.user:https://login.ourproject.at/auth/realms/VFEEG/:at.ourproject.vfeeg.admin`)
  //   if (!oidcStorage) {
  //     return null;
  //   }
  //
  //   return User.fromStorageString(oidcStorage);
  // }

  private async getUser() {
    return this.authService.getToken()
  }
  private getSecureHeaders(tenant: string, token?: string) {
    return {'Authorization': `Bearer ${token}`, "tenant": tenant}
  }

  private async withSecureHeaders(headers: Record<string, string>, tenant?: string) {
    const token = await this.getUser()
    let secHeaders: Record<string, string> = { 'Authorization': `Bearer ${token}`}
    if (tenant) {
      secHeaders = {"tenant": tenant, ...secHeaders}
    }
    return { ...secHeaders, ...headers}
  }

  private async handleErrors(response: Response) {
    if (!response.ok) {
      let apiError: APIError
      const body = await response.text();
      if (body) {
        try {
          const bodyData = JSON.parse(body);
          if (bodyData.code) {
            apiError = new APIError(response.status, bodyData.code, bodyData.message ? bodyData.message : response.statusText);
          } else {
            apiError = new APIError(response.status, 500, response.statusText);
          }
        } catch (e) {
          apiError = new APIError(response.status, 500, response.statusText);
        }
      } else {
        apiError = new APIError(response.status, 500, response.statusText);
      }
      throw apiError
    }
    return response;
  }

  async registerEeg(eeg: EegRegister): Promise<EegRegister> {
    const token = await this.getUser()
    return await fetch(`${ADMIN_API_SERVER}/eeg/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eeg)
    }).then(this.handleErrors).then(async res => {
      if (res.status === 200) {
        const data = await res.json();
        return data;
      }
    });
  }

  async registerPonton(ponton: PontonRegister): Promise<PontonRegisterResponse | undefined> {
    return await fetch(`${ADMIN_API_SERVER}/eeg/ponton`, {
      method: 'POST',
      headers: await this.withSecureHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(ponton)
    }).then(this.handleErrors).then(async res => {
      if (res.status === 200) {
        let data: PontonRegisterResponse;
        try {
          data = await res.json();
        } catch (e) {
          throw new APIError(res.status, 500, "Ponton-Registrierung: ungültige Antwort vom Server");
        }
        // admin-backend answers HTTP 200 and reports the outcome as status/message in the body
        if (typeof data?.status === "number" && (data.status < 200 || data.status > 299)) {
          throw new APIError(res.status, data.status,
            `${data.message || "Ponton-Registrierung fehlgeschlagen"} (Registrierung bei Ponton evtl. bereits erfolgt; ein erneuter Versuch kann "bereits registriert" melden.)`);
        }
        return data;
      }
    });
  }
  async getEegUser(tenant: string): Promise<EegUsers[]> {
    const token = await this.getUser()
    // const token = "1234"
    return await fetch(`${ADMIN_API_SERVER}/eeg/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    }).then(this.handleErrors).then(async res => {
      if (res.status === 200) {
        const data = await res.json();
        return data.users;
      }
    });
  }

  async getEeg(): Promise<EegMember[]> {
    const token = await this.getUser()
    // const token = "1234"
    return await fetch(`${ADMIN_API_SERVER}/vfeeg/eeg`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    }).then(this.handleErrors).then(async res => {
      if (res.status === 200) {
        const data = await res.json();
        return data;
      }
    });
  }

  async getParticipants(tenant: string): Promise<EegParticipant[]> {
    const token = await this.getUser()
    // const token = "1234"
    return await fetch(`${ADMIN_API_SERVER}/vfeeg/participants?tenant=${tenant}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    }).then(this.handleErrors).then(async res => {
      if (res.status === 200) {
        const data = await res.json();
        return data;
      }
    });
  }

  async getOperators(): Promise<GridOperator[]> {
    const token = await this.getUser()
    return await fetch(`${ADMIN_API_SERVER}/vfeeg/operators`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    }).then(this.handleErrors).then(async res => {
      if (res.status === 200) {
        const data = await res.json();
        return data;
      }
    });
  }
}
// export const eegService = new EegService(authService);
//
// export const useToken = () => {
//   const auth = useAuth()
//
//   const token = auth.user?.access_token
//
//   return token
// }