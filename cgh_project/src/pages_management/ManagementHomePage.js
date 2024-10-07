import "../styles/managementhomepage.css";
import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CSVLink } from "react-csv";

const ManagementHomePage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mcrNumberFilter, setMcrNumberFilter] = useState("");
  const [firstNameFilter, setFirstNameFilter] = useState("");
  const [lastNameFilter, setLastNameFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState("");
  const [trainingHoursFilter, setTrainingHoursFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const nav = useNavigate();
  const [showDeleted, setShowDeleted] = useState(false);
  const [onlyDeleted, setOnlyDeleted] = useState(false); // New state for Only Show Deleted
  const [activeButton, setActiveButton] = useState(null); // Track which button is active

  const [entriesPerPage, setEntriesPerPage] = useState(
    () => Number(localStorage.getItem("entriesPerPage")) || 10
  );

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return `${year}-${month}-${day} | ${hours}${minutes}H`;
  };

  const handleRowClick = (mcr_number) => {
    nav(`/staff/${mcr_number}`);
  };

  const resetFilters = () => {
    setMcrNumberFilter("");
    setFirstNameFilter("");
    setLastNameFilter("");
    setDepartmentFilter("");
    setAppointmentFilter("");
    setTrainingHoursFilter("");
    setShowDeleted(false);
    setOnlyDeleted(false);
    setFilteredData(data);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

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

  useEffect(() => {
    const filtered = data.filter((staff) => {
      const matchesFilters =
        staff.mcr_number.toString().includes(mcrNumberFilter) &&
        staff.first_name
          .toLowerCase()
          .includes(firstNameFilter.toLowerCase()) &&
        staff.last_name.toLowerCase().includes(lastNameFilter.toLowerCase()) &&
        staff.department
          .toLowerCase()
          .includes(departmentFilter.toLowerCase()) &&
        staff.appointment
          .toLowerCase()
          .includes(appointmentFilter.toLowerCase()) &&
        (trainingHoursFilter === "" ||
          staff.teaching_training_hours
            .toString()
            .includes(trainingHoursFilter));

      if (onlyDeleted) return matchesFilters && staff.deleted === 1; // Only show deleted entries
      return matchesFilters && (!showDeleted ? staff.deleted === 0 : true); // Show or hide deleted based on state
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    mcrNumberFilter,
    firstNameFilter,
    lastNameFilter,
    departmentFilter,
    appointmentFilter,
    trainingHoursFilter,
    showDeleted,
    onlyDeleted,
    data,
  ]);

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
      appointment: "",
      teaching_training_hours: "",
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

  const handleEntriesPerPageChange = (entries) => {
    setEntriesPerPage(entries);
    localStorage.setItem("entriesPerPage", entries);
    setActiveButton(entries); // Set the active button based on value
    setCurrentPage(1);
  };

  return (
    <>
      <Navbar homeRoute={"/management-home"} />
      <div className="management-home-page">
        <div className="filter-section">
          <label htmlFor="mcr-number-filter">MCR Number:</label>
          <input
            type="text"
            id="mcr-number-filter"
            value={mcrNumberFilter}
            onChange={(e) => {
              const value = e.target.value;
              setMcrNumberFilter(value.replace(/^m/i, "M"));
            }}
            placeholder="MCR Number"
            autoComplete="off"
          />
          <label htmlFor="first-name-filter">First Name:</label>
          <input
            type="text"
            id="first-name-filter"
            value={firstNameFilter}
            onChange={(e) => setFirstNameFilter(e.target.value)}
            placeholder="First name"
            autoComplete="off"
          />
          <label htmlFor="last-name-filter">Last Name:</label>
          <input
            type="text"
            id="last-name-filter"
            value={lastNameFilter}
            onChange={(e) => setLastNameFilter(e.target.value)}
            placeholder="Last name"
            autoComplete="off"
          />
          <label htmlFor="department-filter">Department:</label>
          <input
            type="text"
            id="department-filter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            placeholder="Department"
            autoComplete="off"
          />
          <label htmlFor="appointment-filter">Appointment:</label>
          <input
            type="text"
            id="appointment-filter"
            value={appointmentFilter}
            onChange={(e) => setAppointmentFilter(e.target.value)}
            placeholder="Appointment"
            autoComplete="off"
          />
          <button
            className={`filter-button ${
              showDeleted ? "button-blue" : "button-grey"
            }`}
            onClick={() => {
              setShowDeleted((prev) => !prev);
              setOnlyDeleted(false);
            }}
          >
            Show Deleted
          </button>
          <button
            className={`filter-button ${
              onlyDeleted ? "button-blue" : "button-grey"
            }`}
            onClick={() => {
              setOnlyDeleted((prev) => !prev);
              setShowDeleted(false);
            }}
          >
            Only Show Deleted
          </button>
          <button className="reset-button" onClick={resetFilters}>
            Reset
          </button>
        </div>
        <div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th onClick={() => handleSort("mcr_number")}>MCR Number</th>
                  <th onClick={() => handleSort("first_name")}>First Name</th>
                  <th onClick={() => handleSort("last_name")}>Last Name</th>
                  <th onClick={() => handleSort("department")}>Department</th>
                  <th onClick={() => handleSort("appointment")}>Appointment</th>
                  <th onClick={() => handleSort("teaching_training_hours")}>
                    Teaching Training Hours
                  </th>
                  <th>Email</th>
                  <th>Promotion History</th>
                  <th>Contract Details</th>
                  <th>FTE</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Created By</th>
                  <th>Updated By</th>
                  <th>Deleted By</th>
                  <th>Deleted At</th>
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
                    <td>{staff.appointment}</td>
                    <td>{staff.teaching_training_hours}</td>
                    <td>{staff.email}</td>
                    <td>{staff.promotion_history || "N/A"}</td>
                    <td>{staff.contract_details || "N/A"}</td>
                    <td>{staff.fte}</td>
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
          </div>
          <div className="pagination-background">
            <div className="entries-per-page">
              <label htmlFor="entries-per-page">Entries per page : </label>
              <input
                value={entriesPerPage}
                onChange={handleEntriesPerPageChange}
                autoComplete="off"
                className="entries-per-page-input"
              />
              <button
                className={`entries-per-page-button ${
                  activeButton === 10 ? "button-blue" : "button-grey"
                }`}
                onClick={() => handleEntriesPerPageChange(10)}
              >
                10
              </button>
              <button
                className={`entries-per-page-button ${
                  activeButton === 20 ? "button-blue" : "button-grey"
                }`}
                onClick={() => handleEntriesPerPageChange(20)}
              >
                20
              </button>
              <button
                className={`entries-per-page-button ${
                  activeButton === 50 ? "button-blue" : "button-grey"
                }`}
                onClick={() => handleEntriesPerPageChange(50)}
              >
                50
              </button>
              <button
                className={`entries-per-page-button ${
                  activeButton === 100 ? "button-blue" : "button-grey"
                }`}
                onClick={() => handleEntriesPerPageChange(100)}
              >
                100
              </button>
              <button
                className={`entries-per-page-button ${
                  activeButton === filteredData.length
                    ? "button-blue"
                    : "button-grey"
                }`}
                onClick={() => handleEntriesPerPageChange(filteredData.length)}
              >
                All
              </button>
            </div>
            <div className="pagination-container">
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
              </div>
              <div className="download-section">
                <button className="download-button">
                  <CSVLink
                    data={rowsToDisplay.filter((row) => row.mcr_number)}
                    filename={`page-${currentPage}-data.csv`}
                    className="csv-link"
                  >
                    Download
                  </CSVLink>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagementHomePage;
