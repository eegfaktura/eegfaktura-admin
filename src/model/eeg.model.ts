
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

export type EegRegister = Eeg & EegOwner & EegPonton & EegBusiness & EegGrid

export interface EegTenant { tenant: string, rcNumber: string}
export type PontonRegister = EegTenant & EegPonton
export interface PontonRegisterResponse { status: number, message: string }

export interface Address {
  street: string;
  streetNumber: string;
  zip: string;
  city: string;
  type: "BILLING" | "RESIDENCE"
}

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

export interface Optionals {
  website: string;
}

export interface EegRateItem {
  name: RateTypeEnum;
  value: string;
  unit: string;
  optional: boolean;
}

export interface EegRate {
  id: string;
  name: string;
  vat: number;
  type: "EEG" | "EZP" | "VZP";
  items: EegRateItem[];
}

export enum RateTypeEnum {
  AHEAD = "Vorauszahlung",
  DISCOUNT = "Rabatt",
  CENTPERKWH = "Cent pro kWh",
  INCLUDEKWH = "Inklusive kWh",
  DISCOUNTINPERCENT = "Rabatt in %",
  FIXSUM = "Pauschalbetrag",
  FIXSUM1 = ""
}

export const memberType: EegRateItem[] = [
  {name: RateTypeEnum.AHEAD, value: "", unit: "€", optional: true},
  {name: RateTypeEnum.DISCOUNT, value: "", unit: "%", optional: true},
]

export const vzpType: EegRateItem[] = [
  {name: RateTypeEnum.CENTPERKWH, value: "", unit: "€", optional: false},
  {name: RateTypeEnum.INCLUDEKWH, value: "", unit: "kWh", optional: true},
  {name: RateTypeEnum.DISCOUNTINPERCENT, value: "", unit: "%", optional: true},
]

export const ezpType: EegRateItem[] = [
  {name: RateTypeEnum.FIXSUM, value: "", unit: "€", optional: false},
  {name: RateTypeEnum.CENTPERKWH, value: "", unit: "€" , optional: true},
]

export interface EegTariff {
  id: string;
  name: string;
  type: "EEG" | "EZP" | "VZP" | "AKONTO";
  billingPeriod?: string
  useVat?: boolean
  vatInPercent?: string
  accountNetAmount?: string
  accountGrossAmount?: string
  participantFee?: string
  baseFee?: string
  businessNr?: string
  centPerKWh?: string
  freeKWH?: string
  discount?: string
}

export enum MONTHNAME {
  Januar = 1,
  Februar,
  März,
  April,
  Mai,
  Juni,
  Juli,
  August,
  September,
  Oktober,
  November,
  Dezember
}

export enum MONTHNAMESHORT {
  Jan = 1,
  Feb,
  Mär,
  Apr,
  Mai,
  Jun,
  Jul,
  Aug,
  Sep,
  Okt,
  Nov,
  Dez
}

export interface EdaProcess {
  name: string
  description: string
  type: 'CR_REQ_PT' | 'EC_REQ_ONL'
}


export class Message {
  constructor(public properties: { [key: string]: any | any[]; }) {
  }

  private getValue = (prop: string): string => this.properties ? this.properties[prop] ? this.properties[prop] : "-" : "-"

  public get type() {
    return this.getValue("type")
  }
  public get meteringPoint() {
    // console.log("get MeteringPoint", this.properties["meteringPoint"])
    // console.log("get MeteringPoints", this.properties["meteringPoints"])
    if (this.properties) {
      return this.properties["meteringPoint"] ? this.properties["meteringPoint"] : this.properties["meteringPoints"] ? this.properties["meteringPoints"].join() : "-"
    }
    return "-"
  }
  public get responseCode() {
    return this.getValue("responseCode")
  }
}

export interface EegNotification {
  id: number;
  date: string;
  type: 'ERROR' | 'MESSAGE' | 'NOTIFICATION';
  message: Message;
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

export interface ContractInfo {
  id: string;
  userId: string;
  name: string;
  fileCategory: string;
  fileDownloadUri: string;
  createdAt: string;
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