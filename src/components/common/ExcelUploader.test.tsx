import React, {useContext} from "react";
import {readFileSync} from "fs";
import {resolve} from "path";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {Provider} from "react-redux";
import {combineReducers, configureStore} from "@reduxjs/toolkit";
import eegStateSlice from "../../redux/features/eegStateSlice";
import RegistrationProvider, {RegistrationContext} from "../../hooks/RegistrationContext";
import ExcelUploader from "./ExcelUploader";

// Uploads a file through the real path of the EEG registration: ExcelUploader -> SheetJS -> RegistrationProvider.
// __fixtures__/member-list.xlsx is synthetic and written with openpyxl, not with the library under test:
// header row, two rows the import skips, then two EEGs.

type Snapshot = {next: () => void, eeg: any}
const current: Snapshot = {next: () => undefined, eeg: undefined}

const Probe = () => {
  const {eeg, next, isExcelLoaded, excelFile, onLoad} = useContext(RegistrationContext)
  current.eeg = eeg
  current.next = next
  return <>
    <ExcelUploader fileName={excelFile} onLoad={onLoad}/>
    {isExcelLoaded && <div>loaded</div>}
  </>
}

const upload = async (name: string, content: ArrayBuffer) => {
  const store = configureStore({reducer: combineReducers({eegStateSlice})})
  const {container} = render(
    <Provider store={store}>
      <RegistrationProvider>
        <Probe/>
      </RegistrationProvider>
    </Provider>
  )
  const file = new File([content], name)
  file.arrayBuffer = async () => content // jsdom's File has no arrayBuffer()
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(input, {target: {files: [file]}})
  await waitFor(() => expect(screen.getByText("loaded")).toBeInTheDocument())
}

const nextEeg = () => act(() => current.next())

// a copy: an ArrayBuffer from Buffer fails the instanceof check of SheetJS under jsdom
const toArrayBuffer = (b: Buffer) => Uint8Array.from(b).buffer as ArrayBuffer
const fixture = () => toArrayBuffer(readFileSync(resolve(__dirname, "__fixtures__/member-list.xlsx")))

// the same layout as the member list: header, two skipped rows, then the EEGs
const csv = (rows: string[]) => new TextEncoder().encode(
  ["RC-Nummer;Nr.;Telefon;Ort", "Pflichtfeld;;", "Beispiel;;", ...rows].join("\r\n") + "\r\n")

describe("member list upload (.xlsx)", () => {
  it("fills the form from the first EEG row", async () => {
    await upload("member-list.xlsx", fixture())
    const eeg = current.eeg
    expect(eeg.tenant).toBe("RC100001")
    expect(eeg.rcNumber).toBe("RC100001")
    expect(eeg.communityId).toBe("AT00300000000RC100001000000000001")
    expect(eeg.name).toBe("Sonnenkraft Süd") // rich text in the shared strings
    expect(eeg.businessInfo.settlementInterval).toBe("QUARTER")
    expect(eeg.grid).toEqual({id: "AT003000", name: "", area: "GEA", allocation: "STATIC"}) // header with a line break
    expect(eeg.user).toMatchObject({firstname: "Jörg", lastname: "Müller", email: "joerg@example.org"})
    expect(eeg.accountInfo).toMatchObject({iban: "AT61 1904 3002 3457 3201", owner: "Müller & Söhne"})
    expect(eeg.contact).toEqual({street: "Hauptstraße", streetNumber: "12", city: "Linz", zip: "4020", phone: "+43 664 1234567"})
    expect(eeg.accounts).toEqual([{firstname: "Anna", lastname: "Berg", email: "anna@example.org"}])
  })

  it("reads numeric and text cells of the next EEG as text", async () => {
    await upload("member-list.xlsx", fixture())
    nextEeg()
    const eeg = current.eeg
    expect(eeg.tenant).toBe("RC100002")
    expect(eeg.communityId).toBe("1234567")
    expect(eeg.businessInfo.settlementInterval).toBe("ANNUAL")
    expect(eeg.grid).toMatchObject({id: "AT001000", area: "BEG", allocation: "DYNAMIC"})
    expect(eeg.contact).toMatchObject({streetNumber: "12 a", zip: "1010", phone: "0664123"})
  })

  it("keeps a line break inside a cell as LF", async () => {
    await upload("member-list.xlsx", fixture())
    nextEeg()
    expect(current.eeg.contact.street).toBe("Weg\nHof 2")
  })
})

describe("member list upload (HTML saved as .xls)", () => {
  it("keeps the cells as written", async () => {
    const row = (...cells: string[]) => `<tr>${cells.map(c => `<td>${c}</td>`).join("")}</tr>`
    const html = `<table>${row("RC-Nummer", "Nr.", "Telefon")}${row("x")}${row("y")}${row("TRUE", "12/3", "0664123")}</table>`
    await upload("list.xls", new TextEncoder().encode(html))
    expect(current.eeg.tenant).toBe("TRUE")
    expect(current.eeg.contact).toMatchObject({streetNumber: "12/3", phone: "0664123"})
  })
})

describe("member list upload (.csv)", () => {
  it.each(["12 a", "12 A", "1 a", "12 / 3", "12 3", "12:30", "12/3", "3-5", "1.2", "12a", "12 Top 3"])(
    "keeps the house number %s as text", async (nr) => {
      await upload("list.csv", csv([`RC1;${nr};`]))
      expect(current.eeg.contact.streetNumber).toBe(nr)
    })

  it.each(["0664123", "0664 1234567", "+43 664 1234567", "0664/1234567"])(
    "keeps the phone number %s as text", async (phone) => {
      await upload("list.csv", csv([`RC1;;${phone}`]))
      expect(current.eeg.contact.phone).toBe(phone)
    })

  it("unwraps Excel's text notation =\"…\"", async () => {
    await upload("list.csv", csv(['="RC100001";="12/3";="0664123"', '"=""RC2""";="a""b";=""']))
    expect(current.eeg.tenant).toBe("RC100001")
    expect(current.eeg.rcNumber).toBe("RC100001")
    expect(current.eeg.contact).toMatchObject({streetNumber: "12/3", phone: "0664123"})
    nextEeg()
    expect(current.eeg.tenant).toBe("RC2")
    expect(current.eeg.contact).toMatchObject({streetNumber: 'a"b', phone: ""})
  })

  it("gives a line break in a quoted cell as LF, like .xlsx", async () => {
    await upload("list.csv", csv(['RC1;;;"Linz\r\nUrfahr"']))
    expect(current.eeg.contact.city).toBe("Linz\nUrfahr")
  })

  it("skips empty rows, so the second EEG follows the first", async () => {
    await upload("list.csv", csv(["RC1;1;", ";;", "", "RC2;2;"]))
    expect(current.eeg.tenant).toBe("RC1")
    nextEeg()
    expect(current.eeg.tenant).toBe("RC2")
  })
})
