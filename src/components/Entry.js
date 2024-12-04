import React, { useState, useEffect } from "react";
import "../styles/entry.css";
import Navbar from "./Navbar";
import { motion } from "framer-motion";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Entry = () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generic Constants
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const [mcrStatus, setMcrStatus] = useState(""); // "available" or "taken"
  const [mcrMessage, setMcrMessage] = useState("");
  const [userRole, setUserRole] = useState("");

  // useState to hold new staff details
  const [staffDetails, setStaffDetails] = useState({
    mcr_number: "",
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    email: "",
  });

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // HR Read-only mode check - Fetch user role from token on initial load
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const { role } = JSON.parse(atob(token.split(".")[1])); // Decode JWT to get role
      setUserRole(role);
    }
  }, []);

  const handleRestrictedAction = () => {
    toast.error("Access Denied: Please contact management to make changes.");
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // MCR Live Field Validation Availability Check
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
      staffDetails.designation.length > nameMaxLength
    ) {
      toast.error(
        "First Name, Last Name, Department, and Designation should not exceed 50 characters"
      );
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
      "designation",
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

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to handle form submission
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleSubmit = async () => {
    if (!validateFields()) return; // Stop submission if validation fails

    try {
      console.log("Formatting dates...");

      const dataToSubmit = {
        ...staffDetails,
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
          designation: "",
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

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to handle form reset
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleReset = () => {
    setStaffDetails({
      mcr_number: "",
      first_name: "",
      last_name: "",
      department: "",
      designation: "",
      email: "",
    });
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to handle input changes
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    const mcrRegex = /^[Mm]\d{5}[A-Za-z]$/;

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found");
      return;
    }

    // If the field is mcr_number, check the format and then check availability
    if (name === "mcr_number") {
      setMcrStatus(""); // Clear status on input change
      setMcrMessage("MCR Number must follow the pattern: MxxxxxA"); // Show requirements by default

      // Only perform availability check if the input matches the required length and pattern
      if (value.length === 7 && mcrRegex.test(value)) {
        try {
          const response = await axios.get(
            `http://localhost:3001/staff/${value}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          // If response status is 200, it means the MCR number is taken
          if (response.status === 200) {
            setMcrStatus("taken");
            setMcrMessage("MCR number is already taken");
          }
        } catch (err) {
          // If error response status is 404, the MCR number is available
          if (err.response && err.response.status === 404) {
            setMcrStatus("available");
            setMcrMessage("MCR number is available");
          } else {
            // Handle other possible errors
            setMcrStatus("error");
            setMcrMessage("Error checking MCR number");
          }
        }
      } else if (value.length === 7 && !mcrRegex.test(value)) {
        setMcrStatus("error");
        setMcrMessage("MCR Number must follow the pattern: MxxxxxA");
      }
    }

    // Update state for staff details
    setStaffDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Render
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <>
      <ToastContainer />
      <Navbar homeRoute="/management-home" />
      <div className="entry-page">
        <div className="entry-form-container">
          <h2>Add New Doctor</h2>
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
                  {/* Always display requirements or availability status */}
                  <div
                    className={`mcr-message ${
                      mcrStatus === "available"
                        ? "available"
                        : mcrStatus === "taken"
                        ? "taken"
                        : ""
                    }`}
                  >
                    {mcrMessage}
                  </div>
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
                  <div className="contract-input-container">
                    <select
                      name="department"
                      value={staffDetails.department}
                      onChange={handleInputChange}
                    >
                      <option value="">Department</option>{" "}
                      {/* Placeholder option */}
                      <option value="A&E">A&E</option>
                      <option value="General Surgery">General Surgery</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Orthopaedics">Orthopaedics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Urology">Urology</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                      <option value="Otolaryngology">
                        Otolaryngology (ENT)
                      </option>
                      <option value="Paediatrics">Paediatrics</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Obstetrics & Gynaecology">
                        Obstetrics & Gynaecology
                      </option>
                      <option value="Radiology">Radiology</option>
                      <option value="Anaesthesiology">Anaesthesiology</option>
                      <option value="Nephrology">Nephrology</option>
                      <option value="Haematology">Haematology</option>
                      <option value="Oncology">Oncology</option>
                      <option value="Rheumatology">Rheumatology</option>
                      <option value="Plastic Surgery">Plastic Surgery</option>
                      <option value="Infectious Diseases">
                        Infectious Diseases
                      </option>
                      <option value="Geriatric Medicine">
                        Geriatric Medicine
                      </option>
                    </select>
                  </div>
                </td>
              </tr>

              <tr>
                <th>Designation</th>
                <td>
                  <input
                    type="text"
                    name="designation"
                    value={staffDetails.designation}
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
          </table>{" "}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="update-button"
            onClick={handleReset}
          >
            Reset
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="add-contract-button"
            onClick={userRole === "hr" ? handleRestrictedAction : handleSubmit}
          >
            Add New Staff
          </motion.button>
        </div>

        {/* ------------------------------------------------------- */}
        {/* End of Left Form */}
        {/* ------------------------------------------------------- */}

        {/* <div className="staff-info-container">
          <h2>Staff Details</h2>
          <table className="staff-detail-table">
            <tbody>
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
        </div> */}
      </div>
      {/* <Footer /> */}
    </>
  );
};

export default Entry;
