import "../styles/staffdetailpage.css"; // Create a new CSS file for this page
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const StaffDetailPage = () => {
  const { mcr_number } = useParams(); // Get the MCR number from route params
  const [staffDetails, setStaffDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  // Utility function to format dates
  // Utility function to format the date to YYYYMMDD
  // Utility function to format the date as YYYY-MM-DD-TIME
  const formatDateTime = (dateStr) => {
    if (!dateStr) return null;

    // Create a new Date object from the string
    const date = new Date(dateStr);

    // Get year, month, and day parts
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2); // Add leading zero to month
    const day = ("0" + date.getDate()).slice(-2); // Add leading zero to day

    // Get hours and minutes, adding leading zeros if needed
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);

    // Return the formatted date in YYYY-MM-DD-TIME (e.g., 2024-12-31-16:00)
    return `${year}-${month}-${day}-${hours}:${minutes}`;
  };

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:3001/staff/${mcr_number}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStaffDetails(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching staff details:", error);
        setLoading(false);
      }
    };

    fetchStaffDetails();
  }, [mcr_number]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!staffDetails) {
    return <div>No staff data found</div>;
  }

  return (
    <>
      <Navbar homeRoute="/management-home" />
      <div className="staff-detail-page">
        <div className="staff-info-container">
          <h2>Staff Details</h2>
          <table className="staff-detail-table">
            <tbody>
              <tr>
                <th>MCR Number</th>
                <td>{staffDetails.mcr_number}</td>
              </tr>
              <tr>
                <th>First Name</th>
                <td>{staffDetails.first_name}</td>
              </tr>
              <tr>
                <th>Last Name</th>
                <td>{staffDetails.last_name}</td>
              </tr>
              <tr>
                <th>Department</th>
                <td>{staffDetails.department}</td>
              </tr>
              <tr>
                <th>Appointment</th>
                <td>{staffDetails.appointment}</td>
              </tr>
              <tr>
                <th>Teaching Training Hours</th>
                <td>{staffDetails.teaching_training_hours}</td>
              </tr>
              <tr>
                <th>Start Date</th>
                <td>
                  {staffDetails.start_date
                    ? formatDateTime(staffDetails.start_date)
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <th>End Date</th>
                <td>
                  {staffDetails.end_date
                    ? formatDateTime(staffDetails.end_date)
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <th>Renewal Start Date</th>
                <td>
                  {staffDetails.renewal_start_date
                    ? formatDateTime(staffDetails.renewal_start_date)
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <th>Renewal End Date</th>
                <td>
                  {staffDetails.renewal_end_date
                    ? formatDateTime(staffDetails.renewal_end_date)
                    : "N/A"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="staff-info-container">
          <h2>Staff Details</h2>
          <table className="staff-detail-table">
            <tbody>
            <tr>
                <th>Email Address</th>
                <td>{staffDetails.email}</td>
              </tr>
              <tr>
                <th>TBC</th>
                <td>TBC</td>
              </tr>
              <tr>
                <th>TBC</th>
                <td>TBC</td>
              </tr>
              <tr>
                <th>TBC</th>
                <td>TBC</td>
              </tr>
              <tr>
                <th>TBC</th>
                <td>TBC</td>
              </tr>
              <tr>
                <th>TBC</th>
                <td>TBC</td>
              </tr>
              <tr>
                <th>TBC</th>
                <td>TBC</td>
              </tr>
              <tr>
                <th>TBC</th>
                <td>TBC</td>
              </tr>
              <tr>
                <th>TBC</th>
                <td>TBC</td>
              </tr>{" "}
              <tr>
                <th>TBC</th>
                <td>TBC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default StaffDetailPage;
