import "../styles/staffdetailpage.css";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import { FaEdit, FaTrash } from "react-icons/fa";
import "react-confirm-alert/src/react-confirm-alert.css";
import React from "react";
import AddNewContract from "./AddNewContract";
import AddNewPostings from "./AddNewPostings";
import StaffDetails from "./StaffDetails";

const StaffDetailPage = () => {
  // ########################################## //
  // Generic Constants
  // ########################################## //
  const { mcr_number } = useParams(); // Get the MCR number from route params
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffContractDetails, setStaffContractDetails] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [postings, setPostings] = useState([]); // State to hold postings data
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [postingStatus, setPostingStatus] = useState(""); // Status of posting number check
  const [postingMessage, setPostingMessage] = useState(""); // Message for posting number check
  const [nonInstitutional, setNonInstitutional] = useState([]); // State to hold non-institutional data
  const [userRole, setUserRole] = useState(""); // Track user role

  // Fetch user role from token on initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const { role } = JSON.parse(atob(token.split(".")[1])); // Decode JWT to get role
      setUserRole(role);
    }
  }, []);
  const filteredPostings =
    selectedYears.length > 0
      ? postings.filter((posting) =>
          selectedYears.includes(posting.academic_year.toString())
        )
      : [];

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

  // ########################################## //
  // Generic Button Functions
  // ########################################## //

  const handleReset = () => {
    setSelectedYears([]);
    // setFilteredPostings([]); // Clear postings when reset
  };

  // ########################################## //
  // Filter Functions
  // ########################################## //
  useEffect(() => {
    const updatedFilteredContracts = contracts.filter((contract) => {
      // Convert contract start and end dates to year numbers
      const startYear = new Date(contract.contract_start_date).getFullYear();
      const endYear = new Date(contract.contract_end_date).getFullYear();

      // Check if any selected year falls within the contract period
      return selectedYears.some((year) => year >= startYear && year <= endYear);
    });

    setFilteredContracts(updatedFilteredContracts);
  }, [selectedYears, contracts]);

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3001/contracts/${mcr_number}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.length === 0) {
        toast.info("No contracts found");
        setContracts([]); // Set contracts to an empty array
      } else {
        setContracts(response.data); // Update the contract data in state
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      console.error("Error details:", error.response); // Log error response details

      if (error.response) {
        // Backend responded with a status outside of 2xx range
        const statusCode = error.response.status;
        if (statusCode === 404) {
          toast.error("No contracts found for this user (404)");
        } else if (statusCode >= 400 && statusCode < 500) {
          toast.error("Client error: Failed to fetch contracts");
        } else if (statusCode >= 500) {
          toast.error("Server error: Failed to fetch contracts");
        }
      } else if (error.request) {
        // No response received from the backend
        toast.error("No response from the server. Check network or server.");
      } else {
        // Other errors (like configuration issues)
        toast.error("Error setting up request for contracts");
      }
    }
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
      if (response.data.length === 0) {
        toast.info("No postings found");
        setPostings([]); // Set postings to an empty array
      } else {
        setPostings(response.data); // Set the postings data
      }
    } catch (error) {
      console.error("Error fetching postings:", error);
      toast.error("Failed to fetch postings");
    }
  };
  const fetchNonInstitutional = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3001/non_institutional/${mcr_number}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNonInstitutional(response.data.length > 0 ? response.data : []);
    } catch (error) {
      toast.error("Failed to fetch non-institutional data");
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchPostings();
    fetchNonInstitutional(); // Fetch non-institutional data
  }, [mcr_number]);

  // ########################################## //
  // Filter by year total training hours
  // ########################################## //

  // Function to handle year selection and deselection
  const handleYearToggle = (year) => {
    setSelectedYears((prevSelectedYears) => {
      if (prevSelectedYears.includes(year)) {
        // Remove the year if it's being unchecked
        return prevSelectedYears.filter((y) => y !== year);
      } else {
        // Add the year if it's being checked
        return [...prevSelectedYears, year];
      }
    });
  };

  const [totalTrainingHours, setTotalTrainingHours] = useState(0);

  useEffect(() => {
    // Calculate the total training hours based on selected years
    const total = filteredContracts.reduce((acc, contract) => {
      return (
        acc +
        selectedYears.reduce((yearSum, year) => {
          const yearKey = `training_hours_${year}`;
          return yearSum + (parseFloat(contract[yearKey]) || 0);
        }, 0)
      );
    }, 0);

    setTotalTrainingHours(total); // Update the total training hours in state
  }, [selectedYears, filteredContracts]);

  // ############################################
  // useEffect to retrieve data from contracts
  // ############################################
  useEffect(() => {
    const fetchStaffContracts = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:3001/contracts/${mcr_number}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStaffContractDetails(response.data);
        setLoading(false);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching staff details:", error);
        setLoading(false);
      }
    };

    fetchStaffContracts();
  }, [mcr_number]);

  const handleRestrictedAction = () => {
    if (userRole === "hr") {
      toast.error("Access Denied: Please contact management to make changes.");
    }
  };
  const filteredNonInstitutional =
    selectedYears.length > 0
      ? nonInstitutional.filter((activity) => {
          console.log(
            "Activity academic year:",
            activity.academic_year,
            "Selected years:",
            selectedYears
          );
          return selectedYears.includes(activity.academic_year?.toString());
        })
      : nonInstitutional;

  return (
    <>
      <ToastContainer />
      <Navbar homeRoute="/management-home" />
      <motion.div
        className="staff-detail-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <StaffDetails />
        <motion.div
          className="staff-info-container-right"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {" "}
          <h2>Select Year(s)</h2>
          <div className="year-buttons-container">
            {[
              "2015",
              "2016",
              "2017",
              "2018",
              "2019",
              "2020",
              "2021",
              "2022",
              "2023",
              "2024",
              "2025",
            ].map((year) => (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                key={year}
                onClick={() => handleYearToggle(year)}
                className={`year-button ${
                  selectedYears.includes(year) ? "selected" : ""
                }`}
              >
                {year}
              </motion.button>
            ))}
          </div>
          <h2>Contracts</h2>
          <div className="contracts-table-container">
            <table className="staff-detail-table">
              <thead>
                <tr>
                  <th>Contract Detail</th>
                  {filteredContracts && filteredContracts.length > 0 ? (
                    filteredContracts.map((contract, index) => (
                      <th key={index}>{contract?.school_name || "N/A"}</th>
                    ))
                  ) : (
                    <th>No Contract Found</th>
                  )}
                </tr>
              </thead>
              {filteredContracts && filteredContracts.length > 0 ? (
                <tbody>
                  <tr>
                    <th>Start Date</th>
                    {filteredContracts.map((contract, index) => (
                      <td key={index}>
                        {contract?.contract_start_date
                          ? new Date(
                              contract.contract_start_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>End Date</th>
                    {filteredContracts.map((contract, index) => (
                      <td key={index}>
                        {new Date(
                          contract.contract_end_date
                        ).toLocaleDateString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Status</th>
                    {filteredContracts?.map((contract, index) => (
                      <td key={index}>
                        {contract?.status || "No Contract Found"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Previous Title</th>
                    {filteredContracts.map((contract, index) => (
                      <td key={index}>{contract.prev_title}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>New Title</th>
                    {filteredContracts.map((contract, index) => (
                      <td key={index}>{contract.new_title}</td>
                    ))}
                  </tr>

                  {selectedYears.includes("2022") && (
                    <tr>
                      <th>Total Training Hours in 2022</th>
                      {filteredContracts.map((contract, index) => (
                        <td key={index}>
                          {contract.training_hours_2022 || "0"}
                        </td>
                      ))}
                    </tr>
                  )}
                  {selectedYears.includes("2023") && (
                    <tr>
                      <th>Total Training Hours in 2023</th>
                      {filteredContracts.map((contract, index) => (
                        <td key={index}>
                          {contract.training_hours_2023 || "0"}
                        </td>
                      ))}
                    </tr>
                  )}
                  {selectedYears.includes("2024") && (
                    <tr>
                      <th>Total Training Hours in 2024</th>
                      {filteredContracts.map((contract, index) => (
                        <td key={index}>
                          {contract.training_hours_2024 || "0"}
                        </td>
                      ))}
                    </tr>
                  )}
                  <tr>
                    <th>Total Training Hours for Selected Year(s)</th>
                    {filteredContracts.map((contract, index) => (
                      <td key={index}>
                        {selectedYears
                          .reduce((sum, year) => {
                            const yearKey = `training_hours_${year}`;
                            return sum + (parseFloat(contract[yearKey]) || 0);
                          }, 0)
                          .toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Overall Total Training Hours for all contracts</th>
                    <td colSpan={filteredContracts.length}>
                      {totalTrainingHours.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Please select a year to view Contracts.
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
          {/* <CSVLink
            filename={`staff_details_${mcr_number}.csv`}
            className="csv-link"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              className="download-button"
            >
              Download
            </motion.button>
          </CSVLink> */}
          {/* Add New Contract Form */}
          <AddNewContract />
          {/* Add New Contract Form */}
          <h2>Postings</h2>
          <div className="postings-table-container">
            {filteredPostings && filteredPostings.length > 0 ? (
              <table className="posting-detail-table">
                <thead>
                  <tr>
                    <th>Academic Year</th>
                    <th>Posting Number</th>
                    <th>Training Hours</th>
                    <th>School</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPostings.map((posting) => (
                    <tr
                      key={`${posting.academic_year}-${posting.posting_number}`}
                    >
                      <td>{posting.academic_year || "N/A"}</td>
                      <td>{posting.posting_number || "N/A"}</td>
                      <td>{posting.total_training_hour || "N/A"}</td>
                      <td>{posting.school_name || "N/A"}</td>
                      <td>{posting.rating || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="posting-detail-table">
                <tbody>
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Please select a year to view Postings.
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <AddNewPostings />{" "}
          <div>
            {" "}
            <h2>Non-Institutional Activities</h2>
            <div className="non-institutional-table-container">
              {selectedYears.length > 0 ? (
                filteredNonInstitutional &&
                filteredNonInstitutional.length > 0 ? (
                  <table className="staff-detail-table">
                    <thead>
                      <tr>
                        <th>Academic Year</th>
                        <th>Teaching Categories</th>
                        <th>Role</th>
                        <th>Activity Type</th>
                        <th>Medium</th>
                        <th>Host Country</th>
                        <th>Honorarium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNonInstitutional.map((activity, index) => (
                        <tr key={index}>
                          <td>{activity.academic_year || "N/A"}</td>
                          <td>{activity.teaching_categories || "N/A"}</td>
                          <td>{activity.role || "N/A"}</td>
                          <td>{activity.activity_type || "N/A"}</td>
                          <td>{activity.medium || "N/A"}</td>
                          <td>{activity.host_country || "N/A"}</td>
                          <td>{activity.honorarium || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="posting-detail-table">
                    <tbody>
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
                          No non-institutional activities found for the selected
                          year(s).
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )
              ) : (
                <table className="posting-detail-table">
                  <tbody>
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        Please select a year to view non-institutional
                        activities.
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="toggle-add-contract-button"
            onClick={handleReset}
          >
            Reset
          </motion.button>
        </motion.div>{" "}
      </motion.div>{" "}
    </>
  );
};

export default StaffDetailPage;
