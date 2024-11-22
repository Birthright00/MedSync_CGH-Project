import "../styles/staffdetailpage.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { confirmAlert } from "react-confirm-alert"; // Import the confirmation alert library
import "react-confirm-alert/src/react-confirm-alert.css";
import React from "react";

const StaffDetails = () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generic Constants
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const { mcr_number } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedYears, setSelectedYears] = useState([]);
  const [postings, setPostings] = useState([]);
  const [userRole, setUserRole] = useState("");

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return `${year}-${month}-${day} @ ${hours}${minutes}H`;
  };

  // useState to hold new staff details
  const [staffDetails, setStaffDetails] = useState({
    mcr_number: "",
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    fte: "",
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
  // Fetch staff details
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  }, [mcr_number]); // Add mcr_number as a dependency to avoid re-fetching on every render

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to handle form submission
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      const dataToSubmit = {
        ...staffDetails,
      };

      await axios.put(
        `http://localhost:3001/staff/${mcr_number}`,
        dataToSubmit,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Staff details updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(
        "Error updating staff details:",
        error.response ? error.response.data : error
      );
      toast.error("Failed to update staff details");
    }
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to handle Delete Staff with confirmation
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleDelete = () => {
    confirmAlert({
      title: "❗Confirm Deletion❗",
      message: (
        <div>
          <p>Are you sure you want to delete this staff?</p>
          <p
            style={{ fontWeight: "bold", color: "#ca4700", marginTop: "10px" }}
          ></p>
        </div>
      ),
      buttons: [
        {
          label: "Yes, Delete it!",
          onClick: async () => {
            try {
              const token = localStorage.getItem("token");
              await axios.delete(`http://localhost:3001/staff/${mcr_number}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              toast.success("Staff details deleted successfully!");
              setTimeout(() => {
                navigate("/management-home");
              }, 1000);
            } catch (error) {
              console.error(
                "Error deleting staff details:",
                error.response ? error.response.data : error
              );
              toast.error("Failed to delete staff details");
            }
          },
          style: {
            backgroundColor: "#ca4700", // Red background
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            margin: "0 10px",
            fontSize: "14px",
            fontWeight: "bold",
            transition: "background-color 0.3s",
          },
        },
        {
          label: "Cancel",
          onClick: () => {},
          style: {
            backgroundColor: "#cccccc", // Light grey background
            color: "black",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            margin: "0 10px",
            fontSize: "14px",
            fontWeight: "bold",
            transition: "background-color 0.3s",
          }, // Grey button styling
        },
      ],
    });
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to Restore Staff Details with Confirmation
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleRestore = () => {
    confirmAlert({
      title: "Confirm Restoration",
      message: `Are you sure you want to restore this staff?`,
      buttons: [
        {
          label: "Yes, Restore it!",
          onClick: async () => {
            try {
              const token = localStorage.getItem("token");
              await axios.put(
                `http://localhost:3001/restore/${mcr_number}`,
                {},
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              toast.success("Staff details restored successfully!");
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } catch (error) {
              console.error("Error restoring staff details:", error);
              toast.error("Failed to restore staff details");
            }
          },
        },
        {
          label: "Cancel",
          onClick: () => {},
        },
      ],
    });
  };
  const filteredPostings =
    selectedYears.length > 0
      ? postings.filter((posting) =>
          selectedYears.includes(posting.academic_year.toString())
        )
      : [];

  // Remove any early return statements that would prevent the useEffect hook from executing
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

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Render
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <>
      <ToastContainer />
      <motion.div
        className="staff-info-container"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2>General Details {staffDetails.deleted === 1 ? "(Deleted)" : ""}</h2>
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
                  disabled
                  className="staff-detail-input"
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

        {/* Update Details Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="update-button"
          onClick={userRole === "hr" ? handleRestrictedAction : handleSubmit}
        >
          <FaEdit /> Update Details
        </motion.button>
        {staffDetails.deleted === 1 ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="restore-button"
            onClick={handleRestore}
          >
            Restore
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="delete-button"
            onClick={userRole === "hr" ? handleRestrictedAction : handleDelete}
          >
            <FaTrash /> Delete This Staff
          </motion.button>
        )}
      </motion.div>
    </>
  );
};

export default StaffDetails;
