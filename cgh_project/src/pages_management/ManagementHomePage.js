import "../styles/managementhomepage.css";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CSVLink } from "react-csv";
import * as XLSX from "xlsx"; // Import the xlsx library for file parsing
import { motion } from "framer-motion";
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
  const [selectedSchools, setSelectedSchools] = useState({
    duke_nus: false,
    singhealth_residency: false,
    sutd: false,
    nus_ylls: false,
    ntu_lkc: false,
  });

  const [entriesPerPage, setEntriesPerPage] = useState(
    () => Number(localStorage.getItem("entriesPerPage")) || 50
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
      singhealth_residency_status: "",
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
          "http://localhost:3001/database?includeDeleted=true",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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
        (!selectedSchools.singhealth_residency ||
          staff.singhealth_residency_status) &&
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
    selectedSchools, // Add selected schools to dependency array
    data,
  ]);

  return (
    <>
      <Navbar homeRoute={"/management-home"} />
      <div className="management-home-page">
        <motion.div
          className="filter-section"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
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
              onClick={() =>
                setSelectedSchools((prev) => ({
                  ...prev,
                  singhealth_residency: !prev.singhealth_residency,
                }))
              }
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
              NUS Yong Loo Lin
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
                setOnlyDeleted(false);
              }}
            >
              Include Deleted Data
            </button>
          </div>

          {/* <button
            className={`filter-button ${
              onlyDeleted ? "button-blue" : "button-grey"
            }`}
            onClick={() => {
              setOnlyDeleted((prev) => !prev);
              setShowDeleted(false);
            }}
          >
            Only Show Deleted Data
          </button> */}
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
                  <th>No</th>
                  <th onClick={() => handleSort("mcr_number")}>MCR No.</th>
                  <th onClick={() => handleSort("first_name")}>First Name</th>
                  <th onClick={() => handleSort("last_name")}>Last Name</th>
                  <th onClick={() => handleSort("department")}>Department</th>
                  <th onClick={() => handleSort("designation")}>Designation</th>
                  <th>FTE</th>
                  <th>Email</th>
                  <th>Duke NUS Start Date</th>
                  <th>Duke NUS End Date</th>
                  <th>Duke NUS Status</th>
                  <th>Singhealth Residency Start Date</th>
                  <th>Singhealth Residency End Date</th>
                  <th>Singhealth Residency Status</th>
                  <th>SUTD Start Date</th>
                  <th>SUTD End Date</th>
                  <th>SUTD Status</th>
                  <th>NUS YLL Start Date</th>
                  <th>NUS YLL End Date</th>
                  <th>NUS YLL Status</th>
                  <th>NTU LKC Start Date</th>
                  <th>NTU LKC End Date</th>
                  <th>NTU LKC Status</th>
                  {/* <th>Created At</th>
                  <th>Updated At</th>
                  <th>Created By</th>
                  <th>Updated By</th>
                  <th>Deleted By</th>
                  <th>Deleted At</th> */}
                </tr>
              </thead>
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

                    {/* <td>{formatDateTime(staff.created_at)}</td>
                    <td>{formatDateTime(staff.updated_at)}</td>
                    <td>{staff.created_by || "N/A"}</td>
                    <td>{staff.updated_by || "N/A"}</td>
                    <td>{staff.deleted_by || "N/A"}</td>
                    <td>{formatDateTime(staff.deleted_at)}</td> */}
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
                    data={rowsToDisplay.filter((row) => row.mcr_number)}
                    filename={`page-${currentPage}-data.csv`}
                    className="csv-link"
                  >
                    Download
                  </CSVLink>
                </button>
                <button className="add-dr-button" onClick={handleAddDoctor}>
                  New Doctor
                </button>
              </div>

              {/* Label and input for choosing file */}
              {/* <label htmlFor="file-upload" className="file-upload-label">
                  Choose File:
                </label>
                <input
                  type="file"
                  id="file-upload"
                  className="file-upload-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setSelectedFile(e.target.files[0])} // Store selected file
                /> */}

              {/* Separate button for submitting the file */}
              {/* <button
                  className="submit-file-button"
                  disabled={!selectedFile} // Disable until a file is selected
                >
                  Submit File
                </button> */}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagementHomePage;
