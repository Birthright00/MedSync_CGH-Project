import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

const handleExcelUpload = (file, currentUser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { range: 2 }); // Skip header row

        const fullName = `${currentUser.last_name} ${currentUser.first_name}`.toLowerCase().trim();

        const extractYear = (value) => {
          if (!value) return null;

          // Case 1: Excel serial number (pure numeric value)
          if (!isNaN(value) && typeof value === "number") {
            const baseDate = new Date(1899, 11, 30);
            const date = new Date(baseDate.getTime() + value * 86400000);
            return date.getFullYear();
          }

          // Case 2: String with a 4-digit year, like "Mar 2022", "Apr 2023", etc.
          const str = value.toString().trim();
          const yearMatch = str.match(/\b(19|20)\d{2}\b/); // Match "2022", "2023", etc.
          return yearMatch ? parseInt(yearMatch[0]) : null;
        };



        const validRows = jsonData
          .filter((row) => {
            const nameFromExcel = row["Educator's Name"]?.toLowerCase().trim();
            const deptFromExcel = row["Department"]?.trim();
            return (
              nameFromExcel === fullName &&
              deptFromExcel === currentUser.department
            );
          })
          .map((row) => {
            const extractedYear = extractYear(row["Academic Year"]);
            return {
              ...row,
              "Academic Year": extractedYear && !isNaN(extractedYear) ? extractedYear : 1999,
              "Honorarium": row["Honorarium"] === "" ? null : Number(row["Honorarium"]),
              "Training Hours": Math.round(Number(row["Training Hours"])) || 0,

            };
          });

        if (validRows.length === 0) {
          toast.error("No valid rows matched your account details.");
          return reject("No valid rows.");
        }

        const token = localStorage.getItem("token");

        const response = await axios.post(
          "http://localhost:3001/upload-non-institutional",
          { data: validRows },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        toast.success(`${validRows.length} row(s) matched and uploaded.`);
        resolve(response);
      };

      reader.onerror = (error) => {
        console.error("File read error:", error);
        toast.error("Failed to read the file.");
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Upload failed due to an unexpected error.");
      reject(err);
    }
  });
};

export default handleExcelUpload;
