import "../styles/managementhomepage.css";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CSVLink } from "react-csv";
import { motion } from "framer-motion";

const ManagementHomePage = () => {
  // ########################################## //
  // Generic Constants
  // ########################################## //
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [snbNumberFilter, setSnbNumberFilter] = useState("");
  const [firstNameFilter, setFirstNameFilter] = useState("");
  const [lastNameFilter, setLastNameFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [activeButton, setActiveButton] = useState(null);
  const [selectedInstitutions, setSelectedInstitutions] = useState({
    duke_nus: false,
    singhealth_residency: false,
    sutd: false,
    nus_yll: false,
    ntu_lkc: false,
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const nav = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(
    () => Number(localStorage.getItem("entriesPerPage")) || 20
  );
  // ########################################## //
  // Refresh button
  // ########################################## //
  const handleRefresh = () => {
    window.location.reload();
  };

  const csvHeaders = [
    { label: "SNB Number", key: "snb_number" },
    { label: "First Name", key: "first_name" },
    { label: "Last Name", key: "last_name" },
    { label: "Department", key: "department" },
    { label: "Designation", key: "designation" },
    { label: "FTE", key: "fte" },
    { label: "Email", key: "email" },
    { label: "Institution", key: "institution" },
    { label: "Created At", key: "created_at" },
    { label: "Updated At", key: "updated_at" },
    { label: "Created By", key: "created_by" },
    { label: "Updated By", key: "updated_by" },
    { label: "Deleted By", key: "deleted_by" },
    { label: "Deleted At", key: "deleted_at" },
  ];
  const csvFilename = `nurses_data_${new Date().toISOString()}.csv`;

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

  const resetFilters = () => {
    setSnbNumberFilter("");
    setFirstNameFilter("");
    setLastNameFilter("");
    setDepartmentFilter("");
    setDesignationFilter("");
    setInstitutionFilter("");
    setSelectedInstitutions({
      duke_nus: false,
      singhealth_residency: false,
      sutd: false,
      nus_yll: false,
      ntu_lkc: false,
    });
    setFilteredData(data);
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
          "http://localhost:3001/main_data_nurses",
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
    const filtered = data.filter((nurse) => {
      const matchesSnbNumber =
        !snbNumberFilter ||
        (nurse.snb_number &&
          nurse.snb_number.toString().includes(snbNumberFilter));

      const matchesFirstName =
        !firstNameFilter ||
        (nurse.first_name &&
          nurse.first_name
            .toLowerCase()
            .includes(firstNameFilter.toLowerCase()));

      const matchesLastName =
        !lastNameFilter ||
        (nurse.last_name &&
          nurse.last_name.toLowerCase().includes(lastNameFilter.toLowerCase()));

      const matchesDepartment =
        !departmentFilter ||
        (nurse.department &&
          nurse.department
            .toLowerCase()
            .includes(departmentFilter.toLowerCase()));

      const matchesDesignation =
        !designationFilter ||
        (nurse.designation &&
          nurse.designation
            .toLowerCase()
            .includes(designationFilter.toLowerCase()));

      const matchesInstitutions =
        (!selectedInstitutions.nus || nurse.institution === "NUS") &&
        (!selectedInstitutions.sit || nurse.institution === "SIT") &&
        (!selectedInstitutions.np || nurse.institution === "NP");

      return (
        matchesSnbNumber &&
        matchesFirstName &&
        matchesLastName &&
        matchesDepartment &&
        matchesDesignation &&
        matchesInstitutions
      );
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    snbNumberFilter,
    firstNameFilter,
    lastNameFilter,
    departmentFilter,
    designationFilter,
    selectedInstitutions,
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
          <h4>Filter by Nurse</h4>
          <label htmlFor="snb-number-filter">SNB No.</label>
          <input
            type="text"
            id="snb-number-filter"
            value={snbNumberFilter}
            onChange={(e) => setSnbNumberFilter(e.target.value)}
            placeholder="SNB No."
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
          <h4>Filter by Institution</h4>
          <br></br>
          <div className="school-filter-buttons">
            <button
              onClick={() =>
                setSelectedInstitutions((prev) => ({
                  ...prev,
                  nus: !prev.nus,
                }))
              }
              className={selectedInstitutions.nus ? "active" : ""}
            >
              NUS
            </button>
            <button
              onClick={() =>
                setSelectedInstitutions((prev) => ({
                  ...prev,
                  sit: !prev.sit,
                }))
              }
              className={selectedInstitutions.sit ? "active" : ""}
            >
              SIT
            </button>
            <button
              onClick={() =>
                setSelectedInstitutions((prev) => ({
                  ...prev,
                  np: !prev.np,
                }))
              }
              className={selectedInstitutions.np ? "active" : ""}
            >
              NP
            </button>
            <button className="reset-button" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </motion.div>

        <div>
          {" "}
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
                  <th onClick={() => handleSort("snb_number")}>SNB No.</th>
                  <th onClick={() => handleSort("first_name")}>First Name</th>
                  <th onClick={() => handleSort("last_name")}>Last Name</th>
                  <th onClick={() => handleSort("department")}>Department</th>
                  <th onClick={() => handleSort("designation")}>Designation</th>
                  <th onClick={() => handleSort("email")}>Email</th>
                  <th onClick={() => handleSort("institution")}>Institution</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Created By</th>
                  <th>Updated By</th>
                  <th>Deleted By</th>
                  <th>Deleted At</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((nurse, index) => (
                  <tr key={index}>
                    <td>{indexOfFirstEntry + index + 1}</td>
                    <td>{nurse.snb_number}</td>
                    <td>{nurse.first_name}</td>
                    <td>{nurse.last_name}</td>
                    <td>{nurse.department}</td>
                    <td>{nurse.designation}</td>
                    <td>{nurse.email}</td>
                    <td>{nurse.institution}</td>
                    <td>{formatDateTime(nurse.created_at)}</td>
                    <td>{formatDateTime(nurse.updated_at)}</td>
                    <td>{nurse.created_by || "N/A"}</td>
                    <td>{nurse.updated_by || "N/A"}</td>
                    <td>{nurse.deleted_by || "N/A"}</td>
                    <td>{formatDateTime(nurse.deleted_at)}</td>
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
                    data={rowsToDisplay.filter((row) => row.snb_number)} // Filter rows to exclude empty ones
                    filename={csvFilename}
                    className="csv-link"
                  >
                    Download
                  </CSVLink>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagementHomePage;
