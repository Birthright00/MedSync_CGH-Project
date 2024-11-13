import "../styles/staffdetailpage.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";

const AddNewPostings = () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generic Constants
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const { mcr_number } = useParams();
  const [isPostingFormOpen, setPostingFormOpen] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [schoolNames, setSchoolNames] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [contractErrorMessage, setContractErrorMessage] = useState(""); // Error message for academic year validation
  // useState to hold new posting details
  const [newPosting, setNewPosting] = useState({
    mcr_number: mcr_number, // Set from URL params
    academic_year: "",
    school_name: "",
    posting_number: "",
    total_training_hour: "",
    rating: "",
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
  // Fetch contracts to display the existing contracts
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Postings Form - Submitting New Postings
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to handle input changes in the new posting form
  const handleNewPostingInputChange = async (event) => {
    const { name, value } = event.target;
    setNewPosting({
      ...newPosting,
      [name]: value,
    });

    // Check for school selection to auto-populate the next posting number
    if (name === "school_name" && value) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:3001/postings?mcr_number=${mcr_number}&school_name=${value}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const postings = response.data;

        // Determine the next posting number based on the current max
        const maxPostingNumber = postings.reduce(
          (max, posting) => Math.max(max, posting.posting_number),
          0
        );
        setNewPosting((prev) => ({
          ...prev,
          posting_number: maxPostingNumber + 1,
        }));
      } catch (error) {
        console.error("Error fetching postings:", error);
        toast.error("Failed to retrieve posting numbers");
      }
    }

    // Validate academic year against contract dates when both school and academic year are selected
    if (name === "academic_year" || name === "school_name") {
      validateContractForAcademicYear(
        newPosting.school_name,
        value || newPosting.academic_year
      );
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

  // Function to handle submission of new posting
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
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
                readOnly // Set as read-only
              />
            </div>
          </div>
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
            onClick={
              userRole === "hr" ? handleRestrictedAction : handleNewPosting
            }
          >
            Submit
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default AddNewPostings;
