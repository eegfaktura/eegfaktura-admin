
export interface Eeg {
  tenant: string,
  name: string;
  rcNumber: string;
  settlement: string;
  description: string;
  communityId: string;
  contact: Contact;
  accountInfo: AccountInfo;
  online: boolean;
}

export interface EegBusiness {
  businessInfo: {
    legal: 'verein' | 'genossenschaft' | 'gesellschaft';
    settlementInterval: 'MONTHLY' | "ANNUAL" | "BIANNUAL" | "QUARTER";
  }
}

export interface EegOwner {
  user: {
    username: string
    password: string
    confirmPassword: string
    firstname: string
    lastname: string
    email: string
  }
}

export interface EegGrid {
  grid: {
    id: string;
    name: string;
    area: "LOCAL" | "REGIONAL" | "GEA" | "BEG";
    allocation: "DYNAMIC" | "STATIC";
  }
}

export interface EegPonton {
  pontonInfo: {
    host: string
    port: number
    username: string
    password: string
    confirmPassword: string
    domain: string
    pontonCommType: 'NONE' | 'KEP' | 'MAIL'
  }
}

// A person with access to a community (platform#166); all accounts have the same rights.
export interface AccountUser {
  firstname: string
  lastname: string
  email: string
}

// created, linked (an existing account got the community) or failed (message says why)
export interface AccountResult {
  email: string
  status: "created" | "linked" | "failed"
  message: string
}

export interface AccountView {
  username: string
  firstname: string
  lastname: string
  email: string
  enabled: boolean
  passwordPending: boolean
}

// accounts: exactly these get a login; empty or missing: a login for the contact (user), as before
export interface EegAccounts {
  accounts?: AccountUser[]
}

export type EegRegister = Eeg & EegOwner & EegPonton & EegBusiness & EegGrid & EegAccounts

export interface EegRegistered {
  code: number
  message: string
  accounts: AccountResult[]
}

export interface EegTenant { tenant: string, rcNumber: string}
export type PontonRegister = EegTenant & EegPonton
export interface PontonRegisterResponse { status: number, message: string }

export interface Contact {
  street: string;
  streetNumber: string;
  zip: string;
  city: string;
  phone: string;
}

export interface AccountInfo {
  iban: string;
  owner: string;
  sepa: boolean;
}

export interface EegMember {
  name: string;
  tenant: string;
  description: string;
  legal: string;
  area: "LOCAL" | "REGIONAL" | "BEG" | "GEA";
  gridOperatorName: string;
  gridOperatorId: string;
  contactPerson: string;
  settlementInterval: 'MONTHLY' | "ANNUAL" | "BIANNUAL" | "QUARTER";
  allocationMode: "DYNAMIC" | "STATIC"
  online: boolean;
}

export interface EegParticipant {
  tenant: string;
  id: string;
  participantSince: Date
  firstName: string;
  lastName: string;
  meters: Metering[];
  status: 'NEW' | 'PENDING' | 'ACTIVE' | 'DISUSED'
  role: 'EEG_ADMIN' | 'EEG_USER'
  businessRole: 'EEG_PRIVATE' | 'EEG_BUSINESS'
}

export interface ParticipantState {
  activeSince: Date
  inactiveSince: Date
}
export type MeteringStateType = "INIT" | "ACTIVE" | "INACTIVE"
export type MeteringProcessStateType = "NEW" | "INIT" | "PENDING" | "APPROVED" | "ACTIVE" | "INACTIVE" | "REJECTED" | "REVOKED" | "INVALID"
export type MeterDirectionType = "GENERATION" | "CONSUMPTION"

export interface Metering {
  meteringPoint: string;
  consentId: string;
  direction: MeterDirectionType;
  ownValue: number;
  totalValue: number;
  participantId: string;
  equipmentName: string;
  transformer: string;
  inverterid: string;
  tariff_id: string;
  street: string;
  streetNumber: string;
  city: string;
  zip: string,
  status: MeteringStateType,
  statusCode: number,
  registeredSince: Date,
  gridOperatorId: string,
  gridOperatorName: string,
  allocationFactor: number,
  modifiedAt: number,
  modifiedBy: string,
  processState: MeteringProcessStateType,
  participantState: ParticipantState,
  activeSince: Date,
  inactiveSince: Date,
  partFact: number,
  activationCode?: string
  activationMode: 'ONLINE' | 'OFFLINE'
  enabled: boolean
  tenant?: string
}

export interface GridOperator {
  id: string
  name: string
}