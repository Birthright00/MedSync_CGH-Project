import "../styles/managementhomepage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { useState, useEffect } from "react";
import axios from "axios";

const ManagementHomePage = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/database");
        setData(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = data.slice(indexOfFirstEntry, indexOfLastEntry);

  // Create an array with 10 slots, filling with data or empty objects
  const rowsToDisplay = [...currentEntries];
  while (rowsToDisplay.length < entriesPerPage) {
    rowsToDisplay.push({
      mcr_number: '',
      first_name: '',
      last_name: '',
      department: '',
      appointment: '',
      teaching_training_hours: ''
    });
  }

  const handleNextPage = () => {
    if (indexOfLastEntry < data.length) {
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
          <button onClick={handlePreviousPage} disabled={currentPage === 1}>
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={indexOfLastEntry >= data.length}
          >
            Next
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ManagementHomePage;
