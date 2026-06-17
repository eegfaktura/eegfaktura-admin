import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import {Button} from "@mui/material";

interface ExcelData {
  [key: string]: any;
}

const ExcelUploader: React.FC<{fileName: string | null, onLoad:(fileName: string, data: ExcelData[]) => void }> = ({fileName, onLoad}) => {
  // const [data, setData] = useState<ExcelData[]>([]);
  // const [fileName, setFileName] = useState<string>("");

  // Create a ref to link our custom button to the hidden input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    // Manually trigger the click on the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // setFileName(file.name);

    try {
      // 1. Convert file to ArrayBuffer
      const buffer = await file.arrayBuffer();

      // 2. Parse with SheetJS
      const workbook = XLSX.read(buffer, { type: 'array' });

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
      {/* 1. Hidden Native Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        style={{ display: 'none' }}
      />

      {/* 2. Your Custom Styled Button */}
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