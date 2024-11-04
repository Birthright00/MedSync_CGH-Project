import "../styles/staffdetailpage.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import React from "react";
const AddNewPostings = () => {
  // ########################################## //
  // Generic Constants
  // ########################################## //
  const { mcr_number } = useParams(); // Get the MCR number from route params
  const [postings, setPostings] = useState([]); // State to hold postings data
  const [isPostingFormOpen, setPostingFormOpen] = useState(false);

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
  const fetchPostings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3001/postings?mcr_number=${mcr_number}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPostings(response.data); // Set the postings data
    } catch (error) {
      console.error("Error fetching postings:", error);
      toast.error("Failed to fetch postings");
    }
  };

  // ########################################## //
  // Add new Postings Section
  // ########################################## //
  const [newPosting, setNewPosting] = useState({
    mcr_number: "",
    academic_year: "",
    school_name: "",
    posting_number: "",
    total_training_hour: "",
    rating: "", // Add the rating field here
  });

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="toggle-add-contract-button"
        onClick={() => setPostingFormOpen((prev) => !prev)}
      >
        {isPostingFormOpen ? "Close" : "Add New Postings"}
      </motion.button>
      {isPostingFormOpen && (
        <>
          <>
            <div className="contract-input-container">
              <div className="input-group">
                <label>School Name:</label>
                <select
                  // value={newContract.school_name}
                  // onChange={handleNewContractInputChange}
                  name="school_name"
                >
                  <option value="">Select School</option>
                  <option value="Duke NUS">Duke NUS</option>
                  <option value="SingHealth Residency">
                    SingHealth Residency
                  </option>
                  <option value="SUTD">SUTD</option>
                  <option value="NUS Yong Loo Lin School">
                    NUS Yong Loo Lin School
                  </option>
                  <option value="NTU LKC">NTU LKC</option>
                </select>
              </div>{" "}
            </div>
            <div className="contract-input-container">
              <div className="input-group">
                <label>Academic Year:</label>
                <select
                  // value={newContract.academic_year}
                  // onChange={handleNewContractInputChange}
                  name="academic_year"
                >
                  <option value="">Select Academic Year</option>
                  <option value="2022-2023">2022-2023</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                </select>
              </div>{" "}
            </div>
          </>
          <div>
            <div className="contract-input-container">
              <div className="input-group">
                <label>Training Hours:</label>
                <input
                  type="number"
                  name="total_training_hour"
                  placeholder="Training Hours"
                  // value={newContract.total_training_hour}
                  // onChange={handleNewContractInputChange}
                />
              </div>{" "}
            </div>
            <div className="contract-input-container">
              <div className="input-group">
                <label>Rating:</label>
                <input
                  type="number"
                  name="rating"
                  placeholder="Rating"
                  // value={newContract.rating}
                  // onChange={handleNewContractInputChange}
                />
              </div>{" "}
            </div>{" "}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              className="add-contract-button"
              // onClick={handleNewContract}
            >
              Submit
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
};

export default AddNewPostings;
