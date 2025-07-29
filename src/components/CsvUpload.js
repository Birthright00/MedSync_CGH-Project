import React, { useState } from "react";
import * as XLSX from "xlsx";

const CsvUpload = () => {
  const [fileData, setFileData] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      setFileData(sheetData); // Parsed JSON data
    };

    if (file) {
      reader.readAsBinaryString(file);
    }
  };

  const handleSubmit = async () => {
    if (!fileData) {
      alert("Please upload a file first!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: fileData }),
      });

      if (response.ok) {
        alert("Data uploaded successfully!");
      } else {
        alert("Error uploading data.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h2>Upload CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <button onClick={handleSubmit}>Upload</button>
    </div>
  );
};

export default CsvUpload;
