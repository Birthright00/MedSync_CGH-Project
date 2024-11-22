import "../styles/staffdetailpage.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus, FaTimes, FaPaperPlane } from "react-icons/fa";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
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
  const [academicYearOptions, setAcademicYearOptions] = useState([]);

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
  // Fetch contracts to display the existing schools to add new postings
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
  // Function to handle input changes
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleNewPostingInputChange = async (event) => {
    const { name, value } = event.target;
    setNewPosting({
      ...newPosting,
      [name]: value,
    });

    // When a school is selected, fetch the next posting number
    if (name === "school_name" && value) {
      const selectedSchoolContract = contracts.find(
        (contract) => contract.school_name === value
      );

      if (selectedSchoolContract) {
        const startYear = new Date(
          selectedSchoolContract.contract_start_date
        ).getFullYear();
        const endYear = new Date(
          selectedSchoolContract.contract_end_date
        ).getFullYear();
        const years = [];
        for (let year = startYear; year <= endYear; year++) {
          years.push(year);
        }
        setAcademicYearOptions(years);

        // Fetch the highest posting number for this school and mcr_number
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
      } else {
        setAcademicYearOptions([]);
        toast.error("No contract exists for the selected school.");
      }
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to handle form submission
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  // Function to handle confirmation of submitssion of new posting
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleSubmitConfirmation = () => {
    if (
      !newPosting.academic_year ||
      !newPosting.school_name ||
      !newPosting.total_training_hour ||
      !newPosting.posting_number
    ) {
      toast.error("All fields except Rating are required.");
      return;
    }
    const confirmationMessage = newPosting.rating ? (
      "⚠️Are you sure you want to submit this posting?⚠️"
    ) : (
      <div>
        ⚠️Are you sure you want to submit this posting?⚠️
        <br />
        Note : You did not input any ratings for this posting.
      </div>
    );

    // Show confirmation dialog with the appropriate message
    confirmAlert({
      title: "Confirm Submission",
      message: (
        <div style={{ whiteSpace: "pre-line" }}>{confirmationMessage}</div>
      ),
      buttons: [
        {
          label: "Yes",
          onClick: handleNewPosting,
        },
        {
          label: "No",
          onClick: () => {},
        },
      ],
    });
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Render
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
        {" "}
        {isPostingFormOpen ? <FaTimes /> : <FaPlus />}
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
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
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
              userRole === "hr"
                ? handleRestrictedAction
                : handleSubmitConfirmation
            }
          >
            <FaPaperPlane /> Submit
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default AddNewPostings;
