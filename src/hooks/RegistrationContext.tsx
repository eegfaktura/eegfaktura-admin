import React, {createContext, FC, ReactNode, useState} from "react";
import {AccountInfo, EegRegister} from "../model/eeg.model";
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
  const res = String(s ?? 'LOCAL').toUpperCase()
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
      tenant: data[fieldTransformer.tenant],
      rcNumber: data[fieldTransformer.tenant],
      communityId: data[fieldTransformer.community_id],
      online: false,
      name: data[fieldTransformer.name],
      settlement: data[fieldTransformer.settlementInterval],
      description: data[fieldTransformer.name],
      user: {
        firstname: data[fieldTransformer.firstname],
        lastname: data[fieldTransformer.lastname],
        email: data[fieldTransformer.email],
        username: calculateUsername(data[fieldTransformer.firstname], data[fieldTransformer.lastname]),
        password: "",
        confirmPassword: ""
      },
      businessInfo: {
        legal: "verein",
        settlementInterval: normalizeSettlement(data[fieldTransformer.settlementInterval])
      },
      grid: {
        id: data[fieldTransformer.operator_id],
        name: getGridOperatorName(data[fieldTransformer.operator_id]),
        area: normalizeArea(data[fieldTransformer.area]),
        allocation: normalizeAllocation(data[fieldTransformer.allocation])
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
      accountInfo: {iban: data[fieldTransformer.iban], sepa: false, owner: data[fieldTransformer.owner]} as AccountInfo,
      contact: {
        street: data[fieldTransformer.street],
        city: data[fieldTransformer.city],
        zip: "" + data[fieldTransformer.zip],
        streetNumber: "" + data[fieldTransformer.street_nr],
        phone: "" + data[fieldTransformer.phone],
      },
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