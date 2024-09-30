import "../styles/managementhomepage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CSVLink } from "react-csv";
import bootstrap from "bootstrap";

const ManagementHomePage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [firstNameFilter, setFirstNameFilter] = useState("");
  const [lastNameFilter, setLastNameFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState("");
  const [trainingHoursFilter, setTrainingHoursFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null }); // State to track sorting
  const nav = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(
    () => Number(localStorage.getItem("entriesPerPage")) || 10
  );
  const handleRowClick = (mcr_number) => {
    nav(`/staff/${mcr_number}`); // Navigate to the detail page
  };
  // Reset filters
  const resetFilters = () => {
    setFirstNameFilter("");
    setLastNameFilter("");
    setDepartmentFilter("");
    setAppointmentFilter("");
    setTrainingHoursFilter("");
    setFilteredData(data);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found");
          return;
        }
        const response = await axios.get("http://localhost:3001/database", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
        setFilteredData(response.data); // Initialize filtered data
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);
  // Function to handle sorting

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

  // Filter data when filters change
  useEffect(() => {
    const filtered = data.filter(
      (staff) =>
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
            .includes(trainingHoursFilter))
    );
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [
    firstNameFilter,
    lastNameFilter,
    departmentFilter,
    appointmentFilter,
    trainingHoursFilter,
    data,
  ]);

  // Pagination calculations
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

  // Handle next and previous page clicks
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

  // Handle entries per page change
  const handleEntriesPerPageChange = (e) => {
    const value = Number(e.target.value);
    setEntriesPerPage(value);
    localStorage.setItem("entriesPerPage", value); // Save to localStorage
    setCurrentPage(1); // Reset to the first page
  };

  return (
    <>
      <Navbar homeRoute={"/management-home"} />
      <div className="management-home-page">
        <div className="filter-section">
          <h3>Filter</h3>

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

          <label htmlFor="training-hours-filter">
            Teaching Training Hours:
          </label>
          <input
            type="text"
            id="training-hours-filter"
            value={trainingHoursFilter}
            onChange={(e) => setTrainingHoursFilter(e.target.value)}
            placeholder="Training hours"
            autoComplete="off"
          />
          <button className="reset-button" onClick={resetFilters}>
            Reset
          </button>
        </div>
        <div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th> {/* No sorting for this column */}
                  <th onClick={() => handleSort("mcr_number")}>
                    MCR Number
                    <i
                      className={`bi ${
                        sortConfig.key === "mcr_number"
                          ? sortConfig.direction === "asc"
                            ? "bi-sort-up"
                            : "bi-sort-down"
                          : "bi-sort"
                      }`}
                    ></i>
                  </th>
                  <th onClick={() => handleSort("first_name")}>
                    First Name
                    <i
                      className={`bi ${
                        sortConfig.key === "first_name"
                          ? sortConfig.direction === "asc"
                            ? "bi-sort-up"
                            : "bi-sort-down"
                          : "bi-sort"
                      }`}
                    ></i>
                  </th>
                  <th onClick={() => handleSort("last_name")}>
                    Last Name
                    <i
                      className={`bi ${
                        sortConfig.key === "last_name"
                          ? sortConfig.direction === "asc"
                            ? "bi-sort-up"
                            : "bi-sort-down"
                          : "bi-sort"
                      }`}
                    ></i>
                  </th>
                  <th onClick={() => handleSort("department")}>
                    Department
                    <i
                      className={`bi ${
                        sortConfig.key === "department"
                          ? sortConfig.direction === "asc"
                            ? "bi-sort-up"
                            : "bi-sort-down"
                          : "bi-sort"
                      }`}
                    ></i>
                  </th>
                  <th onClick={() => handleSort("appointment")}>
                    Appointment
                    <i
                      className={`bi ${
                        sortConfig.key === "appointment"
                          ? sortConfig.direction === "asc"
                            ? "bi-sort-up"
                            : "bi-sort-down"
                          : "bi-sort"
                      }`}
                    ></i>
                  </th>
                  {/* <th onClick={() => handleSort("teaching_training_hours")}>
                    Teaching Training Hours
                    <i
                      className={`bi ${
                        sortConfig.key === "teaching_training_hours"
                          ? sortConfig.direction === "asc"
                            ? "bi-sort-up"
                            : "bi-sort-down"
                          : "bi-sort"
                      }`}
                    ></i>
                  </th> */}
                </tr>
              </thead>

              <tbody>
                {rowsToDisplay.map((staff, index) => (
                  <tr
                    key={index}
                    onClick={() => handleRowClick(staff.mcr_number)}
                  >
                    <td>{indexOfFirstEntry + index + 1}</td>{" "}
                    {/* Fix row numbering */}
                    <td>{staff.mcr_number}</td>
                    <td>{staff.first_name}</td>
                    <td>{staff.last_name}</td>
                    <td>{staff.department}</td>
                    <td>{staff.appointment}</td>
                    {/* <td>{staff.teaching_training_hours}</td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Entries Per Page Dropdown */}{" "}
          <div className="pagination-background">
            <div className="entries-per-page">
              <label htmlFor="entries-per-page">Entries per page : </label>
              <input
                id="entries-per-page"
                value={entriesPerPage}
                onChange={handleEntriesPerPageChange}
                autoComplete="off"
              />
              {/* <select
                id="entries-per-page"
                value={entriesPerPage}
                onChange={handleEntriesPerPageChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="25">25</option>
                <option value="30">30</option>
                <option value="35">35</option>
                <option value="40">40</option>
                <option value="45">45</option>
                <option value="50">50</option>
              </select> */}
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
      {/* <Footer /> */}
    </>
  );
};

export default ManagementHomePage;
