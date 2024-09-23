import "../styles/staffdetailpage.css"; // Create a new CSS file for this page
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StaffDetailPage = () => {
  const { mcr_number } = useParams(); // Get the MCR number from route params
  const [staffDetails, setStaffDetails] = useState({
    mcr_number: "",
    first_name: "",
    last_name: "",
    department: "",
    appointment: "",
    teaching_training_hours: "",
    start_date: "",
    end_date: "",
    renewal_start_date: "",
    renewal_end_date: "",
    email: "",
  });
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      // Send PUT request to update staff details
      const dataToSubmit = {
        ...staffDetails,
        start_date: staffDetails.start_date
          ? new Date(staffDetails.start_date)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ")
          : null,
        end_date: staffDetails.end_date
          ? new Date(staffDetails.end_date)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ")
          : null,
        renewal_start_date: staffDetails.renewal_start_date
          ? new Date(staffDetails.renewal_start_date)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ")
          : null,
        renewal_end_date: staffDetails.renewal_end_date
          ? new Date(staffDetails.renewal_end_date)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ")
          : null,
      };

      await axios.put(
        `http://localhost:3001/staff/${mcr_number}`,
        dataToSubmit,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Staff details updated successfully!");
    } catch (error) {
      console.error(
        "Error updating staff details:",
        error.response ? error.response.data : error
      );
      toast.error("Failed to update staff details");
    }
  };

  const [loading, setLoading] = useState(true);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return ""; // Return empty string if date is null or undefined

    const date = new Date(dateStr);

    // Get year, month, day, hours, and minutes, adding leading zeros where necessary
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2); // Ensure two digits for month
    const day = ("0" + date.getDate()).slice(-2); // Ensure two digits for day
    const hours = ("0" + date.getHours()).slice(-2); // Ensure two digits for hours
    const minutes = ("0" + date.getMinutes()).slice(-2); // Ensure two digits for minutes

    // Format it as YYYY-MM-DDTHH:MM (required for datetime-local input type)
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStaffDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!staffDetails) {
    return <div>No staff data found</div>;
  }

  return (
    <>
    <ToastContainer />
      <Navbar homeRoute="/management-home" />
      <div className="staff-detail-page">
        <div className="staff-info-container">
          <h2>Staff Details</h2>
          <table className="staff-detail-table">
            <tbody>
              <tr>
                <th>MCR Number</th>
                <td>
                  <input
                    type="text"
                    name="mcr_number"
                    value={staffDetails.mcr_number}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>First Name</th>
                <td>
                  <input
                    type="text"
                    name="first_name"
                    value={staffDetails.first_name}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Last Name</th>
                <td>
                  <input
                    type="text"
                    name="last_name"
                    value={staffDetails.last_name}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Department</th>
                <td>
                  <input
                    type="text"
                    name="department"
                    value={staffDetails.department}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Appointment</th>
                <td>
                  <input
                    type="text"
                    name="appointment"
                    value={staffDetails.appointment}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Teaching Training Hours</th>
                <td>
                  <input
                    type="number"
                    name="teaching_training_hours"
                    value={staffDetails.teaching_training_hours}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Start Date</th>
                <td>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formatDateTime(staffDetails.start_date)}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>End Date</th>
                <td>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formatDateTime(staffDetails.end_date)}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Renewal Start Date</th>
                <td>
                  <input
                    type="datetime-local"
                    name="renewal_start_date"
                    value={formatDateTime(staffDetails.renewal_start_date)}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Renewal End Date</th>
                <td>
                  <input
                    type="datetime-local"
                    name="renewal_end_date"
                    value={formatDateTime(staffDetails.renewal_end_date)}
                    onChange={handleInputChange}
                  />
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
                <td>
                  <input
                    type="email"
                    name="email"
                    value={staffDetails.email}
                    onChange={handleInputChange}
                  />
                </td>
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
            </tbody>
          </table>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="update-button"
            onClick={handleSubmit}
          >
            Submit
          </motion.button>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default StaffDetailPage;
