import React, {createContext, FC, ReactNode, useState} from "react";
import {AccountInfo, AccountUser, EegRegister} from "../model/eeg.model";
import {useSelector} from "react-redux";
import {selectGridOperators} from "../redux/features/eegStateSlice";

const fieldTransformer = {
  "street": "Straße",
  "street_nr": "Nr.",
  "city": "Ort",
  "zip": "PLZ",
  "settlementInterval": "Abrechnungs-zeitraum",
  "settlement": "",
  "firstname": "Vorname",
  "lastname": "Nachname",
  "email": "E-Mail",
  "phone": "Telefon",
  "area": "Lokal/Regional\r\nBEG/GEA",
  "allocation": "Verteilung",
  "operator_id": "Kennung Netzbetreiber",
  "community_id": "GemID",
  "tenant": "RC-Nummer",
  "name": "Name der EG",
  "iban": "IBAN",
  "owner": "Kontoinhaber",
  "bank_name": "Kontoinhaber",
}

const initialEeg: EegRegister = {
  tenant: "", rcNumber: "", communityId: "", online: false, name: "", settlement: "", description: "",
  user: {firstname: "", lastname: "", email: "", username: "", password: "", confirmPassword: ""},
  businessInfo: {legal: "verein", settlementInterval: "MONTHLY"},
  grid: {id: "", name: "", area: "LOCAL", allocation: "DYNAMIC"},
  pontonInfo: {
    host: "",
    password: "",
    username: "",
    port: 0,
    confirmPassword: "",
    domain: "edanet.at",
    pontonCommType: "NONE"
  },
  accountInfo: {iban: "", sepa: false, owner: ""} as AccountInfo,
  contact: {
    street: "",
    city: "",
    zip: "",
    streetNumber: "",
    phone: "",
  },
  accounts: [],
}

// Column headers vary between list versions ("E-Mail" / "EMail", line breaks LF / CRLF): compare without
// case, white space and hyphens
const normalizeHeader = (h: string) => h.toLowerCase().replace(/[\s-]/g, "")
export const cell = (row: Record<string, any>, header: string) => {
  const key = Object.keys(row).find(k => normalizeHeader(k) === normalizeHeader(header))
  return key === undefined ? undefined : row[key]
}
const text = (v: any) => (v === undefined || v === null ? "" : String(v).trim())

const accountFrom = (row: Record<string, any>, prefix: string): AccountUser => ({
  firstname: text(cell(row, `${prefix}\nVorname`)),
  lastname: text(cell(row, `${prefix}\nNachname`)),
  email: text(cell(row, `${prefix}\nE-Mail`)),
})

// Logins from the member list (platform#166): the main account, or the contact if it is empty, and the further
// accounts 1–3 that have an e-mail. All get the same rights. A list without any account: none, the contact gets
// the login as before (with the username computed here).
export const excelAccounts = (row: Record<string, any>): AccountUser[] => {
  const main = accountFrom(row, "Hauptaccount")
  const contact: AccountUser = {
    firstname: text(cell(row, fieldTransformer.firstname)),
    lastname: text(cell(row, fieldTransformer.lastname)),
    email: text(cell(row, fieldTransformer.email)),
  }
  const further = [1, 2, 3].map(i => accountFrom(row, `Nebenaccount ${i}`)).filter(a => a.email)
  if (!main.email && further.length === 0) return []
  return [main.email ? main : contact, ...further].filter(a => a.email)
}

const calculateUsername = (firstname: string, lastname: string) => (lastname.slice(0,6)+firstname.slice(0,3)).toLowerCase()

const normalizeSettlement = (s: string): 'MONTHLY' | "ANNUAL" | "BIANNUAL" | "QUARTER" => {
  switch (s.toLowerCase()) {
    case 'jährlich': return "ANNUAL"
    case 'halbjährlich': return "BIANNUAL"
    case 'vierteljährlich': return "QUARTER"
    case 'monatlich': return "MONTHLY"
  }
  return "MONTHLY"
}

const normalizeAllocation = (s: string): "DYNAMIC" | "STATIC" => {
  switch (s.toLowerCase()) {
    case 'dynamisch': return "DYNAMIC"
    case 'statisch': return "STATIC"
  }
  return "DYNAMIC"
}

const normalizeArea = (s?: string): "LOCAL" | "REGIONAL" | "GEA" | "BEG" => {
  const res = String(s ?? 'LOCAL').trim().toUpperCase()
  return (["LOCAL", "REGIONAL", "GEA", "BEG"].includes(res) ? res : 'LOCAL') as "LOCAL" | "REGIONAL" | "GEA" | "BEG"
}

interface RegistrationState {
  eeg: EegRegister;
  excelFile: string | null;
  excelData: Record<string, any>[] | null;
  reset: () => void;
  next: () => void;
  hasNext: () => boolean;
  prev: () => void;
  hasPrev: () => boolean;
  isExcelLoaded: boolean;
  onLoad: (f:string, d:Record<string, any>[]) => void;
  removeExcel: () => void;
  rcNumber: () => string
}

const initialState = {
  eeg: initialEeg,
} as RegistrationState;

export const RegistrationContext = createContext(initialState)

const RegistrationProvider: FC<{children: ReactNode}> = ({children}) => {
  const [eeg, setEeg] = useState(initialEeg);
  const [excelFile, setExcelFile] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<Record<string, any>[] | null>([]);
  const [excelIndex, setExcelIndex] = useState(2);
  const [isExcelLoaded, setIsExcelLoaded] = useState(false);

  const operators = useSelector(selectGridOperators)

  const getGridOperatorName = (id: string)=> {
    return operators.find(o => o.id === id)?.name || ""
  }

  const reset = () => {
    const idx = excelIndex + 1;
    if (excelData && (excelData?.length || 0) > idx) {
      setExcelIndex(idx)
      onLoad_setEegData(excelData[idx])
      return
    }
    setExcelFile(null)
    setExcelData(null)
    setIsExcelLoaded(false)
    setEeg(initialEeg);
  }

  const onLoad = (fileName: string, data: Record<string, any>[]) => {
    setExcelFile(fileName)
    setExcelData(data)
    setExcelIndex(2)
    onLoad_setEegData(data[2])
    setIsExcelLoaded(true);
  }

  const onLoad_setEegData = (data: Record<string, any>) => {
    const formValues: EegRegister = {
      tenant: text(cell(data, fieldTransformer.tenant)),
      rcNumber: text(cell(data, fieldTransformer.tenant)),
      communityId: text(cell(data, fieldTransformer.community_id)),
      online: false,
      name: text(cell(data, fieldTransformer.name)),
      settlement: text(cell(data, fieldTransformer.settlementInterval)),
      description: text(cell(data, fieldTransformer.name)),
      user: {
        firstname: text(cell(data, fieldTransformer.firstname)),
        lastname: text(cell(data, fieldTransformer.lastname)),
        email: text(cell(data, fieldTransformer.email)),
        username: calculateUsername(text(cell(data, fieldTransformer.firstname)), text(cell(data, fieldTransformer.lastname))),
        password: "",
        confirmPassword: ""
      },
      businessInfo: {
        legal: "verein",
        settlementInterval: normalizeSettlement(text(cell(data, fieldTransformer.settlementInterval)))
      },
      grid: {
        id: text(cell(data, fieldTransformer.operator_id)),
        name: getGridOperatorName(text(cell(data, fieldTransformer.operator_id))),
        area: normalizeArea(text(cell(data, fieldTransformer.area))),
        allocation: normalizeAllocation(text(cell(data, fieldTransformer.allocation)))
      },
      pontonInfo: {
        host: "",
        password: "",
        username: "",
        port: 0,
        confirmPassword: "",
        domain: "edanet.at",
        pontonCommType: "NONE"
      },
      accountInfo: {iban: text(cell(data, fieldTransformer.iban)), sepa: false, owner: text(cell(data, fieldTransformer.owner))} as AccountInfo,
      contact: {
        street: text(cell(data, fieldTransformer.street)),
        city: text(cell(data, fieldTransformer.city)),
        zip: text(cell(data, fieldTransformer.zip)),
        streetNumber: text(cell(data, fieldTransformer.street_nr)),
        phone: text(cell(data, fieldTransformer.phone)),
      },
      accounts: excelAccounts(data),
    }
    setEeg(formValues);
  }

  const next = () => {
    if (excelData && hasNext()) {
      const idx = excelIndex + 1;
      onLoad_setEegData(excelData[idx])
      setExcelIndex(idx);
    }
  }

  const prev = () => {
    if (excelData && hasPrev()) {
      const idx = excelIndex - 1;
      onLoad_setEegData(excelData[idx])
      setExcelIndex(idx);
    }
  }

  const hasNext = (): boolean => {
    return (isExcelLoaded && excelData) ? ((excelIndex + 1) < (excelData?.length ?? 0)) : false;
  }

  const hasPrev = (): boolean => {
    return (isExcelLoaded && excelData) ? (excelIndex > 2) : false;
  }

  const removeExcel = () => {
    setExcelFile(null)
    setExcelData(null)
    setExcelIndex(2)
    setIsExcelLoaded(false)
    setEeg(initialEeg)
  }

  const rcNumber = (): string => {
    return eeg.tenant ?? ""
  }

  return (
    <RegistrationContext.Provider value={{eeg, excelFile, excelData, reset, next, hasNext, prev, hasPrev, isExcelLoaded, onLoad, removeExcel, rcNumber}}>
      {children}
    </RegistrationContext.Provider>
  )
}

export default RegistrationProvider