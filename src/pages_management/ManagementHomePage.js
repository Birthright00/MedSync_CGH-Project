import "../styles/managementhomepage.css";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import MainDataTemplateDownload from "../components/csv_upload_templates/MainDataTemplateDownload";
import API_BASE_URL from '../apiConfig';
const ManagementHomePage = () => {
  // ########################################## //
  // Generic Constants
  // ########################################## //
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mcrNumberFilter, setMcrNumberFilter] = useState("");
  const [firstNameFilter, setFirstNameFilter] = useState("");
  const [lastNameFilter, setLastNameFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const nav = useNavigate();
  const [showDeleted, setShowDeleted] = useState(false);
  const [onlyDeleted, setOnlyDeleted] = useState(false);
  const [activeButton, setActiveButton] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [schoolFilter, setSchoolFilter] = useState("");
  const templateData = []; // Empty data for the template
  const [selectedSchools, setSelectedSchools] = useState({
    duke_nus: false,
    singhealth_residency: false,
    sutd: false,
    nus_ylls: false,
    ntu_lkc: false,
  });
  const csvHeaders = [
    { label: "MCR Number", key: "mcr_number" },
    { label: "First Name", key: "first_name" },
    { label: "Last Name", key: "last_name" },
    { label: "Department", key: "department" },
    { label: "Designation", key: "designation" },
    { label: "FTE", key: "fte" },
    { label: "Email", key: "email" },
    { label: "Duke NUS Start Date", key: "duke_nus_start_date" },
    { label: "Duke NUS End Date", key: "duke_nus_end_date" },
    { label: "Duke NUS Status", key: "duke_nus_status" },
    { label: "Singhealth Start Date", key: "singhealth_start_date" },
    { label: "Singhealth End Date", key: "singhealth_end_date" },
    { label: "Singhealth Status", key: "singhealth_status" },
    { label: "SUTD Start Date", key: "sutd_start_date" },
    { label: "SUTD End Date", key: "sutd_end_date" },
    { label: "SUTD Status", key: "sutd_status" },
    { label: "NUS YLL Start Date", key: "nus_ylls_start_date" },
    { label: "NUS YLL End Date", key: "nus_ylls_end_date" },
    { label: "NUS YLL Status", key: "nus_ylls_status" },
    { label: "NTU LKC Start Date", key: "ntu_lkc_start_date" },
    { label: "NTU LKC End Date", key: "ntu_lkc_end_date" },
    { label: "NTU LKC Status", key: "ntu_lkc_status" },
    { label: "Teaching Categories", key: "teaching_categories" },
    { label: "Non-Institutional Role", key: "non_institutional_role" },
    { label: "Activity Type", key: "activity_type" },
    { label: "Medium", key: "medium" },
    { label: "Host Country", key: "host_country" },
    { label: "Honorarium", key: "honorarium" },
    { label: "Created At", key: "created_at" },
    { label: "Updated At", key: "updated_at" },
    { label: "Created By", key: "created_by" },
    { label: "Updated By", key: "updated_by" },
    { label: "Deleted By", key: "deleted_by" },
    { label: "Deleted At", key: "deleted_at" },
  ];
  const csvFilename = `management_data_${new Date().toISOString()}.csv`;

  const [entriesPerPage, setEntriesPerPage] = useState(
    () => Number(localStorage.getItem("entriesPerPage")) || 20
  );

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return `${year}-${month}-${day} @ ${hours}${minutes}H`;
  };

  // ########################################## //
  // Buttons' Function
  // ########################################## //
  // Reset filters button
  // ########################################## //
  const resetFilters = () => {
    setMcrNumberFilter("");
    setFirstNameFilter("");
    setLastNameFilter("");
    setDepartmentFilter("");
    setDesignationFilter("");
    setShowDeleted(false);
    setOnlyDeleted(false);
    setFilteredData(data);
    setSchoolFilter("");
    setSelectedSchools({
      duke_nus: false,
      singhealth_residency: false,
      sutd: false,
      nus_ylls: false,
      ntu_lkc: false,
    });
  };

  // ########################################## //
  // Refresh button
  // ########################################## //
  const handleRefresh = () => {
    window.location.reload();
  };

  // ########################################## //
  // File Upload
  // ########################################## //

  // ###################const handleFileUpload = (event) => {
  const [fileData, setFileData] = useState(null);
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(new Uint8Array(binaryStr), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      console.log("Parsed Data:", sheetData); // Debug parsed data
      setFileData(sheetData); // Store parsed data
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileUploadSubmit = async () => {
    if (!fileData || fileData.length === 0) {
      alert("Please upload a file with valid data!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload-main-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: fileData }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Data uploaded successfully!");
      } else {
        console.error("Upload failed:", result);
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error uploading data:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  // ########################################## //
  // Table Functions
  // ########################################## //
  const handleRowClick = (mcr_number) => {
    nav(`/staff/${mcr_number}`);
  };

  const handleSort = (column) => {
    let direction = "asc";
    if (sortConfig.key === column && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: column, direction });

    const sortedData = [...data].sort((a, b) => {
      // If it's a date field, convert to timestamp and sort
      if (
        [
          "duke_nus_start_date",
          "duke_nus_end_date",
          "singhealth_start_date",
          "singhealth_end_date",
          "sutd_start_date",
          "sutd_end_date",
          "nus_ylls_start_date",
          "nus_ylls_end_date",
          "ntu_lkc_start_date",
          "ntu_lkc_end_date",
        ].includes(column)
      ) {
        const dateA = new Date(a[column]);
        const dateB = new Date(b[column]);
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Sort for non-date fields
      if (a[column] < b[column]) {
        return direction === "asc" ? -1 : 1;
      }
      if (a[column] > b[column]) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredData(sortedData);
  };

  // ########################################## //
  // Pagination Constants and Functions
  // ########################################## //

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const rowsToDisplay = [...currentEntries];
  while (rowsToDisplay.length < entriesPerPage) {
    rowsToDisplay.push({
      mcr_number: "",
      first_name: "",
      last_name: "",
      department: "",
      designation: "",
      duke_nus_status: "",
      singhealth_status: "",
      sutd_status: "",
      nus_ylls_status: "",
      ntu_lkc_status: "",
    });
  }
  const handleNextPage = () => {
    if (indexOfLastEntry < filteredData.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const handleAddDoctor = () => {
    nav("/entry");
  };
  const handleEntriesInputChange = (event) => {
    const value = event.target.value;

    // Allow the input to be empty, which is needed when deleting the first digit
    if (value === "" || value === "0") {
      setEntriesPerPage(value); // Set the state to an empty string temporarily
      setActiveButton(null); // Clear active button state
      return;
    }

    // Convert the value to a positive integer
    const entries = parseInt(value, 10);

    // Update the state only if the value is a valid positive number
    if (!isNaN(entries) && entries > 0) {
      setEntriesPerPage(entries);
      localStorage.setItem("entriesPerPage", entries);
      setActiveButton(entries); // Update active button based on input value
      setCurrentPage(1);
    }
  };

  const handleEntriesButtonClick = (entries) => {
    // Update state and active button when button is clicked
    setEntriesPerPage(entries);
    localStorage.setItem("entriesPerPage", entries);
    setActiveButton(entries);
    setCurrentPage(1);
  };

  // ########################################## //
  // useEffect Post Render
  // ########################################## //
  // useEffect #1 for fetching all data
  // ########################################## //
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found");
          return;
        }
        const response = await axios.get(
          `${API_BASE_URL}/database?includeDeleted=true`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(response.data); // Add this to verify the API response
        setData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  // ########################################## //
  // useEffect #2 for filtering data
  // ########################################## //

  useEffect(() => {
    const filtered = data.filter((staff) => {
      // If `onlyDeleted` is true, show only deleted rows
      if (onlyDeleted) {
        return staff.deleted;
      }

      // If `showDeleted` is false, exclude deleted rows
      if (!showDeleted && staff.deleted) {
        return false;
      }

      // Check if the MCR number matches the filter or if the filter is empty
      const matchesMcrNumber =
        !mcrNumberFilter ||
        (staff.mcr_number &&
          staff.mcr_number.toString().includes(mcrNumberFilter));

      // Check if the first name matches the filter or if the filter is empty
      const matchesFirstName =
        !firstNameFilter ||
        (staff.first_name &&
          staff.first_name
            .toLowerCase()
            .includes(firstNameFilter.toLowerCase()));

      // Check if the last name matches the filter or if the filter is empty
      const matchesLastName =
        !lastNameFilter ||
        (staff.last_name &&
          staff.last_name.toLowerCase().includes(lastNameFilter.toLowerCase()));

      // Check if the department matches the filter or if the filter is empty
      const matchesDepartment =
        !departmentFilter ||
        (staff.department &&
          staff.department
            .toLowerCase()
            .includes(departmentFilter.toLowerCase()));

      // Check if the designation matches the filter or if the filter is empty
      const matchesDesignation =
        !designationFilter ||
        (staff.designation &&
          staff.designation
            .toLowerCase()
            .includes(designationFilter.toLowerCase()));

      // School filtering logic - "AND" logic for selected schools
      const matchesSchools =
        (!selectedSchools.duke_nus || staff.duke_nus_status) &&
        (!selectedSchools.singhealth || staff.singhealth_status) &&
        (!selectedSchools.sutd || staff.sutd_status) &&
        (!selectedSchools.nus_ylls || staff.nus_ylls_status) &&
        (!selectedSchools.ntu_lkc || staff.ntu_lkc_status);

      // Combine all filters
      return (
        matchesMcrNumber &&
        matchesFirstName &&
        matchesLastName &&
        matchesDepartment &&
        matchesDesignation &&
        matchesSchools
      );
    });

    setFilteredData(filtered); // Update the filtered data
    setCurrentPage(1); // Reset to the first page
  }, [
    mcrNumberFilter,
    firstNameFilter,
    lastNameFilter,
    departmentFilter,
    designationFilter,
    selectedSchools,
    data,
    showDeleted, // Handle showDeleted in the dependency array
    onlyDeleted, // Add onlyDeleted to the dependency array
  ]);

  return (
    <>
      <Navbar homeRoute={"/management-home"} />
      <h2 className="page-title">Doctor Data</h2>
      <div className="management-home-page">
        <motion.div
          className="filter-section"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {" "}
          <h4>Filter by Doctor</h4>
          <br></br>
          <label htmlFor="mcr-number-filter">MCR No.</label>
          <input
            type="text"
            id="mcr-number-filter"
            value={mcrNumberFilter}
            onChange={(e) => {
              const value = e.target.value;
              setMcrNumberFilter(value.replace(/^m/i, "M"));
            }}
            placeholder="MCR No."
            autoComplete="off"
          />
          <label htmlFor="first-name-filter">First Name</label>
          <input
            type="text"
            id="first-name-filter"
            value={firstNameFilter}
            onChange={(e) => setFirstNameFilter(e.target.value)}
            placeholder="First name"
            autoComplete="off"
          />
          <label htmlFor="last-name-filter">Last Name</label>
          <input
            type="text"
            id="last-name-filter"
            value={lastNameFilter}
            onChange={(e) => setLastNameFilter(e.target.value)}
            placeholder="Last name"
            autoComplete="off"
          />
          <label htmlFor="department-filter">Department</label>
          <input
            type="text"
            id="department-filter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            placeholder="Department"
            autoComplete="off"
          />
          <label htmlFor="designation-filter">Designation</label>
          <input
            type="text"
            id="designation-filter"
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            placeholder="Designation"
            autoComplete="off"
          />
        </motion.div>
        <motion.div
          className="school-filter-button-section"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {" "}
          <h4>Filter by School</h4>
          <br></br>
          <div className="school-filter-buttons">
            <button
              onClick={() =>
                setSelectedSchools((prev) => ({
                  ...prev,
                  duke_nus: !prev.duke_nus,
                }))
              }
              className={selectedSchools.duke_nus ? "active" : ""}
            >
              Duke NUS
            </button>
            <button
              onClick={() => {
                setSelectedSchools((prev) => ({
                  ...prev,
                  singhealth_residency: !prev.singhealth_residency,
                }));
                console.log(
                  "SingHealth Residency filter:",
                  !selectedSchools.singhealth_residency
                ); // Debugging line
              }}
              className={selectedSchools.singhealth_residency ? "active" : ""}
            >
              Singhealth Residency
            </button>

            <button
              onClick={() =>
                setSelectedSchools((prev) => ({ ...prev, sutd: !prev.sutd }))
              }
              className={selectedSchools.sutd ? "active" : ""}
            >
              SUTD
            </button>
            <button
              onClick={() =>
                setSelectedSchools((prev) => ({
                  ...prev,
                  nus_ylls: !prev.nus_ylls,
                }))
              }
              className={selectedSchools.nus_ylls ? "active" : ""}
            >
              NUS YLL
            </button>
            <button
              onClick={() =>
                setSelectedSchools((prev) => ({
                  ...prev,
                  ntu_lkc: !prev.ntu_lkc,
                }))
              }
              className={selectedSchools.ntu_lkc ? "active" : ""}
            >
              NTU LKC
            </button>
            <button
              className={`filter-button ${
                showDeleted ? "button-blue" : "button-grey"
              }`}
              onClick={() => {
                setShowDeleted((prev) => !prev);
              }}
            >
              Include Deleted Data
            </button>
          </div>
          <button
            className={`filter-button ${
              onlyDeleted ? "button-blue" : "button-grey"
            }`}
            onClick={() => {
              setOnlyDeleted((prev) => !prev); // Toggle onlyDeleted
              setShowDeleted(false); // Disable "Include Deleted Data" when "Only Show Deleted Data" is active
            }}
          >
            Only Show Deleted Data
          </button>
          <button className="reset-button" onClick={resetFilters}>
            Reset
          </button>
        </motion.div>
        <div>
          <motion.div
            className="table-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th rowSpan="2">No</th>
                  <th rowSpan="2" onClick={() => handleSort("mcr_number")}>
                    MCR No.
                  </th>
                  <th rowSpan="2" onClick={() => handleSort("first_name")}>
                    First Name
                  </th>
                  <th rowSpan="2" onClick={() => handleSort("last_name")}>
                    Last Name
                  </th>
                  <th rowSpan="2" onClick={() => handleSort("department")}>
                    Department
                  </th>
                  <th rowSpan="2" onClick={() => handleSort("designation")}>
                    Designation
                  </th>
                  <th rowSpan="2" onClick={() => handleSort("fte")}>
                    FTE
                  </th>
                  <th rowSpan="2" onClick={() => handleSort("email")}>
                    Email
                  </th>
                  {/* Group headers */}
                  <th colSpan="3">Duke NUS</th>
                  <th colSpan="3">Singhealth Residency</th>
                  <th colSpan="3">SUTD</th>
                  <th colSpan="3">NUS YLL</th>
                  <th colSpan="3">NTU LKC</th>
                  <th colSpan="6">Non Institutional</th>{" "}
                  {/* New group header for Non Institutional */}
                  <th rowSpan="2">Created At</th>
                  <th rowSpan="2">Updated At</th>
                  <th rowSpan="2">Created By</th>
                  <th rowSpan="2">Updated By</th>
                  <th rowSpan="2">Deleted By</th>
                  <th rowSpan="2">Deleted At</th>
                </tr>
                <tr>
                  {/* Sub-headers for Duke NUS */}
                  <th onClick={() => handleSort("duke_nus_start_date")}>
                    Start Date
                  </th>
                  <th onClick={() => handleSort("duke_nus_end_date")}>
                    End Date
                  </th>
                  <th onClick={() => handleSort("duke_nus_status")}>Status</th>

                  {/* Sub-headers for Singhealth Residency */}
                  <th onClick={() => handleSort("singhealth_start_date")}>
                    Start Date
                  </th>
                  <th onClick={() => handleSort("singhealth_end_date")}>
                    End Date
                  </th>
                  <th onClick={() => handleSort("singhealth_status")}>
                    Status
                  </th>

                  {/* Sub-headers for SUTD */}
                  <th onClick={() => handleSort("sutd_start_date")}>
                    Start Date
                  </th>
                  <th onClick={() => handleSort("sutd_end_date")}>End Date</th>
                  <th onClick={() => handleSort("sutd_status")}>Status</th>

                  {/* Sub-headers for NUS YLL */}
                  <th onClick={() => handleSort("nus_ylls_start_date")}>
                    Start Date
                  </th>
                  <th onClick={() => handleSort("nus_ylls_end_date")}>
                    End Date
                  </th>
                  <th onClick={() => handleSort("nus_ylls_status")}>Status</th>

                  {/* Sub-headers for NTU LKC */}
                  <th onClick={() => handleSort("ntu_lkc_start_date")}>
                    Start Date
                  </th>
                  <th onClick={() => handleSort("ntu_lkc_end_date")}>
                    End Date
                  </th>
                  <th onClick={() => handleSort("ntu_lkc_status")}>Status</th>

                  {/* Sub-headers for Non Institutional */}
                  <th onClick={() => handleSort("teaching_categories")}>
                    Teaching Categories
                  </th>
                  <th onClick={() => handleSort("non_institutional_role")}>
                    Role
                  </th>
                  <th onClick={() => handleSort("activity_type")}>
                    Activity Type
                  </th>
                  <th onClick={() => handleSort("medium")}>Medium</th>
                  <th onClick={() => handleSort("host_country")}>
                    Host Country
                  </th>
                  <th onClick={() => handleSort("honorarium")}>Honorarium</th>
                </tr>
              </thead>
              {/* Rest of the table code */}

              <tbody>
                {rowsToDisplay.map((staff, index) => (
                  <tr
                    key={index}
                    onClick={() => handleRowClick(staff.mcr_number)}
                    className={staff.deleted ? "greyed-out" : ""}
                  >
                    <td>{indexOfFirstEntry + index + 1}</td>
                    <td>{staff.mcr_number}</td>
                    <td>{staff.first_name}</td>
                    <td>{staff.last_name}</td>
                    <td>{staff.department}</td>
                    <td>{staff.designation}</td>
                    <td>{staff.fte}</td>
                    <td>{staff.email}</td>
                    <td>{formatDateTime(staff.duke_nus_start_date)}</td>
                    <td>{formatDateTime(staff.duke_nus_end_date)}</td>
                    <td>{staff.duke_nus_status}</td>
                    <td>{formatDateTime(staff.singhealth_start_date)}</td>
                    <td>{formatDateTime(staff.singhealth_end_date)}</td>
                    <td>{staff.singhealth_status}</td>
                    <td>{formatDateTime(staff.sutd_start_date)}</td>
                    <td>{formatDateTime(staff.sutd_end_date)}</td>
                    <td>{staff.sutd_status}</td>
                    <td>{formatDateTime(staff.nus_ylls_start_date)}</td>
                    <td>{formatDateTime(staff.nus_ylls_end_date)}</td>
                    <td>{staff.nus_ylls_status}</td>
                    <td>{formatDateTime(staff.ntu_lkc_start_date)}</td>
                    <td>{formatDateTime(staff.ntu_lkc_end_date)}</td>
                    <td>{staff.ntu_lkc_status}</td>

                    <td>{staff.teaching_categories}</td>
                    <td>{staff.non_institutional_role}</td>
                    <td>{staff.activity_type}</td>
                    <td>{staff.medium}</td>
                    <td>{staff.host_country}</td>
                    <td>{staff.honorarium}</td>

                    <td>{formatDateTime(staff.created_at)}</td>
                    <td>{formatDateTime(staff.updated_at)}</td>
                    <td>{staff.created_by || "N/A"}</td>
                    <td>{staff.updated_by || "N/A"}</td>
                    <td>{staff.deleted_by || "N/A"}</td>
                    <td>{formatDateTime(staff.deleted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
          <div className="pagination-background">
            <div className="entries-per-page">
              <label htmlFor="entries-per-page">Entries per page : </label>
              <input
                type="number"
                value={entriesPerPage}
                onChange={handleEntriesInputChange}
                autoComplete="off"
                className="entries-per-page-input"
              />

              <button
                className={`entries-per-page-button ${
                  activeButton === 10 ? "button-blue" : "button-grey"
                }`}
                onClick={() => handleEntriesButtonClick(10)}
              >
                10
              </button>
              <button
                className={`entries-per-page-button ${
                  activeButton === 20 ? "button-blue" : "button-grey"
                }`}
                onClick={() => handleEntriesButtonClick(20)}
              >
                20
              </button>
              <button
                className={`entries-per-page-button ${
                  activeButton === 50 ? "button-blue" : "button-grey"
                }`}
                onClick={() => handleEntriesButtonClick(50)}
              >
                50
              </button>
              <button
                className={`entries-per-page-button ${
                  activeButton === 100 ? "button-blue" : "button-grey"
                }`}
                onClick={() => handleEntriesButtonClick(100)}
              >
                100
              </button>
              <button
                className={`entries-per-page-button ${
                  activeButton === filteredData.length
                    ? "button-blue"
                    : "button-grey"
                }`}
                onClick={() => handleEntriesButtonClick(filteredData.length)}
              >
                All
              </button>
            </div>
            <motion.div
              className="pagination-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="pagination">
                <span className="current-page">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={indexOfLastEntry >= filteredData.length}
                >
                  Next
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={indexOfLastEntry >= filteredData.length}
                >
                  Refresh
                </button>
                <button className="homepg-download-button">
                  <CSVLink
                    headers={csvHeaders}
                    data={rowsToDisplay.filter((row) => row.mcr_number)} // Filter rows to exclude empty ones
                    filename={csvFilename}
                    className="csv-link"
                  >
                    Download
                  </CSVLink>
                </button>
                <button className="add-dr-button" onClick={handleAddDoctor}>
                  New Doctor
                </button>
                <MainDataTemplateDownload />
              </div>
            </motion.div>{" "}
            <h2>Upload Excel File</h2>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
            />
            <button onClick={handleFileUploadSubmit}>Upload</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagementHomePage;
