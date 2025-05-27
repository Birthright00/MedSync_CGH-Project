import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

const handleExcelUploadManager = (file, selectedDoctor) => {
  return new Promise(async (resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { range: 2 }); // Start from row 3

        const fullName = `${selectedDoctor.last_name} ${selectedDoctor.first_name}`.toLowerCase().trim();

        const validRows = jsonData.filter((row) => {
          const nameFromExcel = row["Educator's Name"]?.toLowerCase().trim();
          const deptFromExcel = row["Department"]?.trim();

          return (
            nameFromExcel === fullName &&
            deptFromExcel === selectedDoctor.department
          );
        });

        if (validRows.length === 0) {
          toast.error("No valid rows matched the selected doctor.");
          return resolve({ message: "No valid rows." });
        }

        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("full_name", fullName); // ✅ for backend matching
        formData.append("department", selectedDoctor.department); // ✅ for backend matching
        formData.append("mcr_number", selectedDoctor.mcr_number); // ✅ added

        const response = await axios.post(
          "http://localhost:3001/upload-non-institutional-manager",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success(`${validRows.length} activity row(s) uploaded for Dr. ${selectedDoctor.last_name}.`);
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

export default handleExcelUploadManager;
