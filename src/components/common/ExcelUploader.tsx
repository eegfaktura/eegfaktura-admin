import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import {Button} from "@mui/material";
import {readWorkbook} from "./readWorkbook";

interface ExcelData {
  [key: string]: any;
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

      // 2. Parse with SheetJS (cells of text formats kept as written, CSV as UTF-8)
      const workbook = readWorkbook(buffer, file.name);

      // 3. Grab the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // 4. Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json<ExcelData>(worksheet);

      onLoad(file.name, jsonData);
    } catch (error) {
      console.error("Error reading Excel file:", error);
      alert("Die Datei konnte nicht gelesen werden.");
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
        Excel-Datei wählen
      </Button>
    </div>
  );
};

export default ExcelUploader;