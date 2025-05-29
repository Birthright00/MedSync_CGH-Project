import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

const handleExcelUploadManager = (file, selectedDoctor) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!file || !(file instanceof File)) {
        toast.error("Invalid or missing file.");
        return reject("Invalid file.");
      }

      const reader = new FileReader();

      reader.onload = async (e) => {
        console.log("📂 FileReader triggered");

        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { range: 2 });

          const fullName = `${selectedDoctor.last_name} ${selectedDoctor.first_name}`.toLowerCase().trim();
          const department = selectedDoctor.department?.trim();

          console.log("🧾 Total rows parsed from Excel →", jsonData.length);
          console.log("👤 Full Name for match →", fullName);
          console.log("🏢 Department for match →", department);
          console.log("🧾 Sample row →", jsonData[0]);

          const extractYear = (value) => {
            if (!value) return null;
            if (!isNaN(value) && typeof value === "number") {
              const baseDate = new Date(1899, 11, 30);
              const date = new Date(baseDate.getTime() + value * 86400000);
              return date.getFullYear();
            }
            const str = value.toString().trim();
            const yearMatch = str.match(/\b(19|20)\d{2}\b/);
            return yearMatch ? parseInt(yearMatch[0]) : null;
          };

          const matchedRows = jsonData
            .filter((row) =>
              row["Educator's Name"]?.toLowerCase().trim() === fullName &&
              row["Department"]?.trim() === department
            )
            .map((row, index) => {
              const extractedYear = extractYear(row["Academic Year"]);
              console.log(`📅 Row ${index} → Raw: ${row["Academic Year"]}, Extracted Year: ${extractedYear}`);
              return {
                ...row,
                "Academic Year": extractedYear && !isNaN(extractedYear) ? extractedYear : 1999,
                "Honorarium": row["Honorarium"] === "" ? null : Number(row["Honorarium"]),
                "Training Hours": Math.round(Number(row["Training Hours"])) || 0,
              };
            });

          console.log("✅ Matched rows count →", matchedRows.length);

          if (matchedRows.length === 0) {
            toast.error("No matching rows found in the Excel file.");
            return resolve({ message: "No valid rows." });
          }

          const token = localStorage.getItem("token");

          console.log("🚀 Sending JSON to /upload-non-institutional-manager");

          const response = await axios.post(
            "http://localhost:3001/upload-non-institutional-manager",
            {
              full_name: fullName,
              department: department,
              mcr_number: selectedDoctor.mcr_number,
              rows: matchedRows,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("✅ Upload successful:", response.data);
          toast.success(`${matchedRows.length} activity row(s) uploaded for Dr. ${selectedDoctor.last_name}.`);
          setTimeout(() => {
            window.location.reload();
          }, 2500);
          resolve(response);
        } catch (error) {
          console.error("❌ Excel parsing or upload failed:", error);
          toast.error("Upload failed: " + (error.response?.data?.error || error.message));
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error("❌ File read error:", error);
        toast.error("Failed to read the file.");
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("❌ Unexpected error in handleExcelUploadManager:", err);
      toast.error("Upload failed due to an unexpected error.");
      reject(err);
    }
  });
};

export default handleExcelUploadManager;
