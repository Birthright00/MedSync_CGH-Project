import "../styles/staffdetailpage.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";

const AddNewPostings = () => {
  const { mcr_number } = useParams(); // Get the MCR number from route params
  const [isPostingFormOpen, setPostingFormOpen] = useState(false);
  const [contracts, setContracts] = useState([]); // Store contract data
  const [schoolNames, setSchoolNames] = useState([]); // Store unique school names
  const [userRole, setUserRole] = useState(""); // Track user role

  // Fetch user role from token on initial load
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
  const [newPosting, setNewPosting] = useState({
    mcr_number: mcr_number, // Set from URL params
    academic_year: "",
    school_name: "",
    posting_number: "",
    total_training_hour: "",
    rating: "",
  });

  const [postingStatus, setPostingStatus] = useState(""); // Status for posting number check
  const [postingMessage, setPostingMessage] = useState(""); // Message for posting number availability
  const [contractErrorMessage, setContractErrorMessage] = useState(""); // Error message for academic year validation

  // Fetch contracts to display the existing contracts
  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3001/contracts/${mcr_number}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setContracts(response.data);

      // Extract unique school names
      const uniqueSchoolNames = Array.from(
        new Set(response.data.map((contract) => contract.school_name))
      );
      setSchoolNames(uniqueSchoolNames);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to fetch contracts");
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleNewPostingInputChange = async (event) => {
    const { name, value } = event.target;
    setNewPosting({
      ...newPosting,
      [name]: value,
    });

    // Validate academic year against contract dates when both school and academic year are selected
    if (name === "academic_year" || name === "school_name") {
      validateContractForAcademicYear(
        newPosting.school_name,
        value || newPosting.academic_year
      );
    }

    if (
      name === "posting_number" &&
      newPosting.mcr_number &&
      newPosting.school_name &&
      newPosting.academic_year
    ) {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:3001/postings/check?mcr_number=${newPosting.mcr_number}&school_name=${newPosting.school_name}&academic_year=${newPosting.academic_year}&posting_number=${value}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 200) {
          setPostingStatus("taken");
          setPostingMessage(
            "Posting number already exists for this MCR number, school, and academic year."
          );
          toast.error(
            "Posting number already exists for this MCR number, school, and academic year."
          );
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setPostingStatus("available");
          setPostingMessage("Posting number is available");
          toast.success("Posting number is available");
        } else {
          setPostingStatus("error");
          setPostingMessage("Error checking posting number");
          toast.error("Error checking posting number");
        }
      }
    }
  };

  // Function to validate if the selected academic year falls within the contract period
  const validateContractForAcademicYear = (selectedSchool, selectedYear) => {
    if (!selectedSchool || !selectedYear) return;

    const contract = contracts.find(
      (contract) => contract.school_name === selectedSchool
    );

    if (contract) {
      const startYear = new Date(contract.contract_start_date).getFullYear();
      const endYear = new Date(contract.contract_end_date).getFullYear();
      const academicYear = parseInt(selectedYear, 10);

      if (academicYear < startYear || academicYear > endYear) {
        toast.error(
          "This user does not have a contract with this school in the selected academic year."
        );
        setContractErrorMessage(
          "This user does not have a contract with this school in the selected academic year."
        );
      } else {
        setContractErrorMessage(""); // Clear error message if valid
      }
    }
  };

  const handleNewPosting = async () => {
    if (
      !newPosting.academic_year ||
      !newPosting.school_name ||
      !newPosting.total_training_hour ||
      !newPosting.rating
    ) {
      toast.error("Please fill all required fields before submitting");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:3001/postings`,
        newPosting,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201) {
        toast.success("New posting added successfully!");
        setNewPosting({
          mcr_number: mcr_number,
          academic_year: "",
          school_name: "",
          posting_number: "",
          total_training_hour: "",
          rating: "",
        });
        setPostingStatus(""); // Reset posting status
        setPostingMessage(""); // Reset message
        setContractErrorMessage(""); // Reset error message
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Error adding new posting:", error);
      toast.error("Failed to add new posting");
    }
  };

  return (
    <div>
      <ToastContainer />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="toggle-add-contract-button"
        onClick={() => setPostingFormOpen((prev) => !prev)}
      >
        {isPostingFormOpen ? "Close" : "Add New Postings"}
      </motion.button>
      {isPostingFormOpen && (
        <div>
          <div className="contract-input-container">
            <div className="input-group">
              <label>School Name:</label>
              <select
                name="school_name"
                value={newPosting.school_name}
                onChange={handleNewPostingInputChange}
              >
                <option value="">Select School</option>
                {schoolNames.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="contract-input-container">
            <div className="input-group">
              <label>Academic Year:</label>
              <select
                name="academic_year"
                value={newPosting.academic_year}
                onChange={handleNewPostingInputChange}
              >
                <option value="">Select Academic Year</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>
          <div className="contract-input-container">
            {contractErrorMessage && (
              <div
                style={{
                  color: "red",
                  marginTop: "5px",
                  justifyContent: "center",
                }}
              >
                {contractErrorMessage}
              </div>
            )}
          </div>
          <div className="contract-input-container">
            <div className="input-group">
              <label>Posting Number:</label>
              <input
                type="number"
                name="posting_number"
                placeholder="Posting Number"
                value={newPosting.posting_number}
                onChange={handleNewPostingInputChange}
              />
            </div>
          </div>
          {/* <div className="contract-input-container">
            <div className="input-group">
              {postingMessage && (
                <div
                  className={`posting-message ${
                    postingStatus === "taken" ? "taken" : "available"
                  }`}
                >
                  <p>{postingMessage}</p>
                </div>
              )}
            </div>
          </div> */}
          <div className="contract-input-container">
            <div className="input-group">
              <label>Training Hours:</label>
              <input
                type="number"
                name="total_training_hour"
                placeholder="Training Hours"
                value={newPosting.total_training_hour}
                onChange={handleNewPostingInputChange}
              />
            </div>
          </div>
          <div className="contract-input-container">
            <div className="input-group">
              <label>Rating:</label>
              <input
                type="number"
                name="rating"
                placeholder="Rating"
                step="0.5"
                value={newPosting.rating}
                onChange={handleNewPostingInputChange}
              />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="add-contract-button"
            onClick={userRole === "hr" ? handleRestrictedAction : handleNewPosting}
          >
            Submit
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default AddNewPostings;
