import "../styles/staffdetailpage.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import { confirmAlert } from "react-confirm-alert"; // Import the confirmation alert library
import API_BASE_URL from '../apiConfig';
import "react-confirm-alert/src/react-confirm-alert.css";
import React from "react";

const NurseDetails = () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generic Constants
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const { snb_number } = useParams(); // Changed to use `snb_number`
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [editHistory, setEditHistory] = useState([]); // Add a state to store the edit history
  const [isEditHistoryOpen, setIsEditHistoryOpen] = useState(false);

  const toggleEditHistory = () => {
    setIsEditHistoryOpen(!isEditHistoryOpen);
  };

  // useState to hold nurse details
  const [nurseDetails, setNurseDetails] = useState({
    snb_number: "",
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
  // Fetch nurse details
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const fetchNurseDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE_URL}/nurse/${snb_number}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        const data = response.data;
  
        setNurseDetails(data);
  
        // Check if update_history is already an array or needs to be parsed
        if (typeof data.update_history === "string") {
          console.log("Parsing update_history as JSON...");
          const parsedHistory = JSON.parse(data.update_history);
          setEditHistory(Array.isArray(parsedHistory) ? parsedHistory : []);
        } else if (Array.isArray(data.update_history)) {
          setEditHistory(data.update_history);
        } else {
          console.warn(
            "Unexpected format for update_history:",
            data.update_history
          );
          setEditHistory([]);
        }
  
        setLoading(false);
      } catch (error) {
        console.error("Error fetching nurse details:", error);
        setLoading(false);
      }
    };
  
    fetchNurseDetails();
  }, [snb_number]);
  

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to handle form submission
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authentication token found. Please log in.");
        return;
      }

      const dataToSubmit = {
        ...nurseDetails,
      };

      await axios.put(
        `${API_BASE_URL}/main_data_nurses/${snb_number}`, // Updated API endpoint
        dataToSubmit,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Nurse details updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(
        "Error updating nurse details:",
        error.response ? error.response.data : error
      );
      if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in again.");
        navigate("/login"); // Redirect to login page
      } else {
        toast.error("Failed to update nurse details");
      }
    }
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to handle Delete Nurse with confirmation
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleDelete = () => {
    confirmAlert({
      title: "❗Confirm Deletion❗",
      message: "Are you sure you want to delete this nurse?",
      buttons: [
        {
          label: "Yes, Delete it!",
          onClick: async () => {
            try {
              const token = localStorage.getItem("token");
              await axios.delete(
                `${API_BASE_URL}/main_data_nurses/${snb_number}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              toast.success("Nurse details deleted successfully!");
              setTimeout(() => {
                navigate("/nurse-management-home");
              }, 1000);
            } catch (error) {
              console.error(
                "Error deleting nurse details:",
                error.response ? error.response.data : error
              );
              toast.error("Failed to delete nurse details");
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNurseDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!nurseDetails) {
    return <div>No nurse data found</div>;
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
        <h2>General Details</h2>
        <table className="staff-detail-table">
          <tbody>
            <tr>
              <th>SNB Number</th>
              <td>
                <input
                  type="text"
                  name="snb_number"
                  value={nurseDetails.snb_number}
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
                  value={nurseDetails.first_name}
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
                  value={nurseDetails.last_name}
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
                  value={nurseDetails.department}
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
                  value={nurseDetails.designation}
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
                  value={nurseDetails.email}
                  onChange={handleInputChange}
                />
              </td>
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
        <button onClick={toggleEditHistory} className="view-edit-button">
          {isEditHistoryOpen ? "Hide Edit History" : "View Edit History"}
        </button>
        {isEditHistoryOpen && (
          <div className="view-edit-container">
            <h2>Edit History</h2>
            <table className="posting-detail-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Updated By</th>
                  <th>Updated At</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(editHistory) && editHistory.length > 0 ? (
                  editHistory.map((entry, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{entry.updated_by || "N/A"}</td>
                      <td>{new Date(entry.updated_at).toLocaleString()}</td>
                      <td>
                        {entry.details
                          ? Object.entries(entry.details).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <strong>{key}:</strong> {value}
                                </div>
                              )
                            )
                          : "No details available"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No edit history found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="delete-button"
          onClick={userRole === "hr" ? handleRestrictedAction : handleDelete}
        >
          <FaTrash /> Delete This Nurse
        </motion.button>
      </motion.div>
    </>
  );
};

export default NurseDetails;
