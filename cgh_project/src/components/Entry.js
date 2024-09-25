import "../styles/staffdetailpage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Entry = () => {
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

  const validateFields = () => {
    const mcrRegex = /^[Mm]\d{5}[A-Za-z]$/;
    const nameMaxLength = 50;
    const emailRegex = /\S+@\S+\.\S+/;

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

    // Ensure all fields are filled
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
        toast.error(`\ ${field.replace(/_/g, " ")} is required`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return; // Stop submission if validation fails

    try {
      const token = localStorage.getItem("token");

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

      // Send POST request to create new staff details
      await axios.post("http://localhost:3001/entry", dataToSubmit, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("New staff details added successfully!");

      // Clear the form after successful submission
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
    } catch (error) {
      console.error(
        "Error submitting staff details:",
        error.response ? error.response.data : error
      );
      toast.error("Failed to submit staff details");
    }
  };

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
          <h2>Add New Staff</h2>
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
                    value={staffDetails.start_date}
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
                    value={staffDetails.end_date}
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
                    value={staffDetails.renewal_start_date}
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
                    value={staffDetails.renewal_end_date}
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
          <h2>Add New Staff</h2>
          <table className="staff-detail-table">
            <tbody>
              <tr>
                <th>Email</th>
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
            onClick={handleSubmit}
          >
            Add New Staff
          </motion.button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Entry;
