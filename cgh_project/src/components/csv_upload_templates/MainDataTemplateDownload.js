import React from "react";
import { CSVLink } from "react-csv";

const MainDataTemplateDownload = () => {
  // Define the headers based on the `main_data` table schema
  const csvHeaders = [
    { label: "mcr_number", key: "mcr_number" },
    { label: "first_name", key: "first_name" },
    { label: "last_name", key: "last_name" },
    { label: "department", key: "department" },
    { label: "designation", key: "designation" },
    { label: "email", key: "email" },
  ];

  // Empty data array as the template file will not include rows
  const templateData = [];

  return (
    <CSVLink
      headers={csvHeaders}
      data={templateData}
      filename="main_data_template.csv"
      className="template-download-button"
    >
      Download Main Data Template
    </CSVLink>
  );
};

export default MainDataTemplateDownload;
