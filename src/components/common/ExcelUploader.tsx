import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import {Button} from "@mui/material";

interface ExcelData {
  [key: string]: any;
}

// A CSV as UTF-8 text: SheetJS reads a CSV without BOM byte by byte, so "ü" in UTF-8 became "Ã¼". Undefined if
// the bytes are no valid UTF-8 (e.g. Windows-1252 from Excel): then SheetJS reads them as before.
const utf8 = (buffer: ArrayBuffer): string | undefined => {
  try {
    return new TextDecoder('utf-8', {fatal: true}).decode(buffer)
  } catch {
    return undefined
  }
}

const ExcelUploader: React.FC<{onLoad:(fileName: string, data: ExcelData[]) => void }> = ({onLoad}) => {
  // Create a ref to link our custom button to the hidden input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    // Manually trigger the click on the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // otherwise the browser sends no change event when the same file is chosen again
    event.target.value = "";

    try {
      // 1. Convert file to ArrayBuffer
      const buffer = await file.arrayBuffer();

      // 2. Parse with SheetJS
      // raw: keep the cells of text formats (CSV, HTML saved as .xls) as written. Without it SheetJS reads "12 a" as a
      // time and "12 / 3" as a date. No effect on real .xlsx and .xls files.
      const csv = /\.csv$/i.test(file.name) ? utf8(buffer) : undefined
      const workbook = csv === undefined
        ? XLSX.read(buffer, { type: 'array', raw: true })
        : XLSX.read(csv, { type: 'string', raw: true });

      // 3. Grab the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // 4. Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json<ExcelData>(worksheet);

      onLoad(file.name, jsonData);
    } catch (error) {
      console.error("Error reading Excel file:", error);
      alert("Failed to parse Excel file.");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        style={{ display: 'none' }}
      />

      <Button color={'primary'}
        onClick={handleButtonClick}
        style={{
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Select Excel File
      </Button>
    </div>
  );
};

export default ExcelUploader;