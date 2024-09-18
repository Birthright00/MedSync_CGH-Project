import "../styles/managementhomepage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { useState, useEffect } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";

const ManagementHomePage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [firstNameFilter, setFirstNameFilter] = useState("");
  const [lastNameFilter, setLastNameFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState("");
  const [trainingHoursFilter, setTrainingHoursFilter] = useState("");
  const resetFilters = () => {
    setFirstNameFilter("");
    setLastNameFilter("");
    setDepartmentFilter("");
    setAppointmentFilter("");
    setTrainingHoursFilter("");
  };
  const entriesPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/database");
        setData(response.data);
        setFilteredData(response.data); // Initialize filtered data
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

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

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );

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
            placeholder="Enter first name"
          />

          <label htmlFor="last-name-filter">Last Name:</label>
          <input
            type="text"
            id="last-name-filter"
            value={lastNameFilter}
            onChange={(e) => setLastNameFilter(e.target.value)}
            placeholder="Enter last name"
          />

          <label htmlFor="department-filter">Department:</label>
          <input
            type="text"
            id="department-filter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            placeholder="Enter department"
          />

          <label htmlFor="appointment-filter">Appointment:</label>
          <input
            type="text"
            id="appointment-filter"
            value={appointmentFilter}
            onChange={(e) => setAppointmentFilter(e.target.value)}
            placeholder="Enter appointment"
          />

          <label htmlFor="training-hours-filter">
            Teaching Training Hours:
          </label>
          <input
            type="text"
            id="training-hours-filter"
            value={trainingHoursFilter}
            onChange={(e) => setTrainingHoursFilter(e.target.value)}
            placeholder="Enter training hours"
          />
          <button onClick={resetFilters}>Reset</button>
        </div>
        <div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MCR Number</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Department</th>
                  <th>Appointment</th>
                  <th>Teaching Training Hours</th>
                </tr>
              </thead>
              <tbody>
                {rowsToDisplay.map((staff, index) => (
                  <tr key={index}>
                    <td>{staff.mcr_number}</td>
                    <td>{staff.first_name}</td>
                    <td>{staff.last_name}</td>
                    <td>{staff.department}</td>
                    <td>{staff.appointment}</td>
                    <td>{staff.teaching_training_hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="current-page">Page {currentPage}</span>
            <button onClick={handlePreviousPage} disabled={currentPage === 1}>
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={indexOfLastEntry >= filteredData.length}
            >
              Next
            </button>
          </div>
          <div className="download-section">
            <CSVLink
              data={rowsToDisplay.filter((row) => row.mcr_number)}
              filename={`page-${currentPage}-data.csv`}
              className="download-button"
            >
              Download Page Data
            </CSVLink>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ManagementHomePage;
