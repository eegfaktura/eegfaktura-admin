import * as XLSX from 'xlsx';

// A CSV as UTF-8 text: SheetJS reads a CSV without BOM byte by byte, so "ü" in UTF-8 became "Ã¼". Undefined if
// the bytes are no valid UTF-8 (e.g. Windows-1252 from Excel): then SheetJS reads them as before.
const utf8 = (buffer: ArrayBuffer): string | undefined => {
  try {
    return new TextDecoder('utf-8', {fatal: true}).decode(buffer)
  } catch {
    return undefined
  }
}

// Reads an XLSX, XLS or CSV file. raw: keep the cells of text formats (CSV, HTML saved as .xls) as written; without it
// SheetJS reads "12 a" as a time and "12 / 3" as a date. No effect on real .xlsx and .xls files. Used by the Excel
// upload of the registration and by the bulk change template.
export function readWorkbook(buffer: ArrayBuffer, fileName: string, options: XLSX.ParsingOptions = {}): XLSX.WorkBook {
  const csv = /\.csv$/i.test(fileName) ? utf8(buffer) : undefined
  return csv === undefined
    ? XLSX.read(buffer, {...options, type: 'array', raw: true})
    : XLSX.read(csv, {...options, type: 'string', raw: true})
}
