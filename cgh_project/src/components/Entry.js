import React, { useState } from "react";
import "../styles/staffdetailpage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { motion } from "framer-motion";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Function to format date values for display in datetime-local input fields
const formatDateTime = (dateStr) => {
  if (!dateStr) return ""; // Return empty string if date is null or undefined
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Ensure two digits for month
  const day = ("0" + date.getDate()).slice(-2); // Ensure two digits for day
  const hours = ("0" + date.getHours()).slice(-2); // Ensure two digits for hours
  const minutes = ("0" + date.getMinutes()).slice(-2); // Ensure two digits for minutes
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const Entry = () => {
  // State to manage staff details for the form inputs
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

  // Function to validate input fields before submission
  const validateFields = () => {
    const mcrRegex = /^[Mm]\d{5}[A-Za-z]$/;
    const nameMaxLength = 50;
    const emailRegex = /\S+@\S+\.\S+/;

    console.log("Validating fields...");

    if (!mcrRegex.test(staffDetails.mcr_number)) {
      toast.error("MCR Number must follow the pattern: MxxxxxA");
      return false;
    }

    if (
      staffDetails.first_name.length > nameMaxLength ||
      staffDetails.last_name.length > nameMaxLength ||
      staffDetails.department.length > nameMaxLength ||
      staffDetails.appointment.length > nameMaxLength
    ) {
      toast.error(
        "First Name, Last Name, Department, and Appointment should not exceed 50 characters"
      );
      return false;
    }

    if (!Number.isInteger(parseInt(staffDetails.teaching_training_hours))) {
      toast.error("Teaching Training Hours must be an integer");
      return false;
    }

    if (!emailRegex.test(staffDetails.email)) {
      toast.error("Invalid email format");
      return false;
    }

    const requiredFields = [
      "mcr_number",
      "first_name",
      "last_name",
      "department",
      "appointment",
      "teaching_training_hours",
      "email",
    ];

    for (const field of requiredFields) {
      if (!staffDetails[field]) {
        toast.error(`${field.replace(/_/g, " ")} is required`);
        return false;
      }
    }

    console.log("All fields validated successfully!");
    return true;
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!validateFields()) return; // Stop submission if validation fails

    try {
      console.log("Formatting dates...");

      const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toISOString().slice(0, 19).replace("T", " ");
      };

      const dataToSubmit = {
        ...staffDetails,
        start_date: formatDate(staffDetails.start_date),
        end_date: formatDate(staffDetails.end_date),
        renewal_start_date: formatDate(staffDetails.renewal_start_date),
        renewal_end_date: formatDate(staffDetails.renewal_end_date),
        teaching_training_hours:
          parseInt(staffDetails.teaching_training_hours, 10) || 0,
      };

      console.log("Data to be submitted:", dataToSubmit);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing!");
        return;
      }

      console.log("Sending POST request to backend...");

      const response = await axios.post(
        "http://localhost:3001/entry",
        dataToSubmit,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Server response:", response.data);

      if (response.status === 201) {
        toast.success("New staff details added successfully!");
        setStaffDetails({
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
      } else {
        toast.error("Failed to submit staff details. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error submitting staff details:",
        error.response ? error.response.data : error
      );
      toast.error("Failed to submit staff details");
    }
  };

  // Function to handle input changes and update the state
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStaffDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

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
            </tbody>
          </table>
        </div>

        {/* ------------------------------------------------------- */}
        {/* End of Left Form */}
        {/* ------------------------------------------------------- */}

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
                <th>Email Address</th>
                <td>
                  <input
                    type="email"
                    name="email"
                    value={staffDetails.email}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>{" "}
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
                <th>Created At</th>
                <td>{formatDateTime(staffDetails.created_at)}</td>
              </tr>
              <tr>
                <th>Last Updated At</th>
                <td>{formatDateTime(staffDetails.updated_at)}</td>
              </tr>
              <tr>
                <th>Created By</th>
                <td>{staffDetails.created_by}</td>
              </tr>
              <tr>
                <th>Last Updated By</th>
                <td>{staffDetails.updated_by}</td>
              </tr>
            </tbody>
          </table>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="update-button"
            onClick={handleSubmit}
          >
            Add New Staff
          </motion.button>
        </div>
      </div>
      {/* <Footer /> */}
    </>
  );
};

export default Entry;
