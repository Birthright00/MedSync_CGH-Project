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
        const jsonData = XLSX.utils.sheet_to_json(sheet, { range: 2 }); // Start from row 3


        const fullName = `${currentUser.last_name} ${currentUser.first_name}`.toLowerCase().trim();

        console.log("Current User →", currentUser);
        console.log("Full Name →", fullName);
        console.log("Excel Raw Headers →", Object.keys(jsonData[0]));

        const validRows = jsonData.filter((row) => {
          const nameFromExcel = row["Educator's Name"]?.toLowerCase().trim();
          const deptFromExcel = row["Department"]?.trim();

          console.log("Row Name →", nameFromExcel);
          console.log("Row Dept →", deptFromExcel);

          return (
            nameFromExcel === fullName &&
            deptFromExcel === currentUser.department
          );
        });

        console.log("Valid Rows →", validRows);
        console.log("=== RAW ROW DUMP ===");
        jsonData.slice(0, 3).forEach((row, index) => {
          console.log(`Row ${index + 1}:`, row);
          console.log("Keys:", Object.keys(row));
        });

        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(
          "http://localhost:3001/upload-non-institutional",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (validRows.length === 0) {
          toast.error("No valid rows matched your account details.");
        } else {
          toast.success(`${validRows.length} row(s) matched and uploaded.`);
        }

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
