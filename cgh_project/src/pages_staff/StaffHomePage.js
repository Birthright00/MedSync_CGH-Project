import "../styles/staffhomepage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useEffect } from "react";
import axios from "axios";

const StaffHomePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [doctorData, setDoctorData] = useState(null); // State to store doctor's details
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch doctor details on component load
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        // Retrieve the token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        // Decode the token to extract the mcr_number
        const decodedToken = JSON.parse(atob(token.split(".")[1])); // JWT payload
        const mcr_number = decodedToken.id; // Assuming 'id' contains the mcr_number

        // Fetch the doctor's data
        const response = await axios.get(
          `http://localhost:3001/staff/${mcr_number}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Doctor Data:", response.data);
        setDoctorData(response.data); // Set the fetched data to state
        setLoading(false); // Update the loading state
      } catch (error) {
        console.error("Error fetching doctor details:", error);
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, []);

  return (
    <>
      <Navbar homeRoute={"/staff-home"} />
      <div className="staff-home-page">
        <div className="staff-home-div-left">
          <div className="staff-home-div-left-base">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              inline
            />
          </div>
        </div>
        <div className="staff-home-div-mid">
          <div className="staff-home-div-mid-base">
            {loading ? (
              <p>Loading doctor details...</p>
            ) : doctorData ? (
              <div>
                <h3>Doctor Details</h3>
                <p><strong>MCR Number:</strong> {doctorData.mcr_number}</p>
                <p><strong>First Name:</strong> {doctorData.first_name}</p>
                <p><strong>Last Name:</strong> {doctorData.last_name}</p>
                <p><strong>Department:</strong> {doctorData.department}</p>
                <p><strong>Designation:</strong> {doctorData.designation}</p>
                <p><strong>Email:</strong> {doctorData.email}</p>
              </div>
            ) : (
              <p>No doctor data found</p>
            )}
          </div>
        </div>
        <div className="staff-home-div-right">
          <div className="staff-home-div-right-base"></div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default StaffHomePage;
