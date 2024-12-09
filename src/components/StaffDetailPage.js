import "../styles/staffdetailpage.css";
import Navbar from "./Navbar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv";
import { FaRedo } from "react-icons/fa";
import "react-confirm-alert/src/react-confirm-alert.css";
import React from "react";
import AddNewContract from "./AddNewContract";
import AddNewPostings from "./AddNewPostings";
import StaffDetails from "./StaffDetails";
import AddNewNonInst from "./AddNewNonInst";

const StaffDetailPage = () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generic Constants
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const { mcr_number } = useParams();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffContractDetails, setStaffContractDetails] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [postings, setPostings] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [nonInstitutional, setNonInstitutional] = useState([]);
  const [totalTrainingHours, setTotalTrainingHours] = useState(0);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Reset Button Functions
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleReset = () => {
    setSelectedYears([]);
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // HR Read-only mode check - Fetch user role from token on initial load
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const [userRole, setUserRole] = useState("");
  const handleRestrictedAction = () => {
    if (userRole === "hr") {
      toast.error("Access Denied: Please contact management to make changes.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const { role } = JSON.parse(atob(token.split(".")[1])); // Decode JWT to get role
      setUserRole(role);
    }
  }, []);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Filter Postings by Selected Years
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const filteredPostings = postings.filter((posting) =>
    selectedYears.includes(posting.academic_year.toString())
  );

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Filter Non-Institutional Activities by Selected Years
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const filteredNonInstitutional = nonInstitutional.filter((activity) =>
    selectedYears.includes(activity.academic_year.toString())
  );

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Filter Contracts by Selected Years
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const updatedFilteredContracts = contracts.filter((contract) => {
      const startYear = new Date(contract.contract_start_date).getFullYear();
      const endYear = new Date(contract.contract_end_date).getFullYear();

      // Check if any selected year is within the contract period
      return selectedYears.some((year) => year >= startYear && year <= endYear);
    });
    setFilteredContracts(updatedFilteredContracts);
  }, [selectedYears, contracts]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Fetch Contracts Data using mcr_number
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

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Fetch Postings Data using mcr_number
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
        setPostings([]);
      } else {
        setPostings(response.data);
      }
    } catch (error) {
      console.error("Error fetching postings:", error);
      toast.error("Failed to fetch postings");
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Fetch Non-Institutional Data using mcr_number
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // useEffect to REFETCH contracts, postings, and non-institutional data when mcr_number changes
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    fetchContracts();
    fetchPostings();
    fetchNonInstitutional(); // Fetch non-institutional data
  }, [mcr_number]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to toggle years using buttons
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // useEffect to calculate total training hours based on selected years
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const total = filteredContracts.reduce((acc, contract) => {
      return (
        acc +
        selectedYears.reduce((yearSum, year) => {
          const yearKey = `training_hours_${year}`;
          return yearSum + (parseFloat(contract[yearKey]) || 0);
        }, 0)
      );
    }, 0);

    setTotalTrainingHours(total);
  }, [selectedYears, filteredContracts]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // useEffect to retrieve data from contracts
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to update postings
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleUpdatePostings = async () => {
    try {
      const token = localStorage.getItem("token");
      const updatedPostings = filteredPostings.filter(
        (posting) => posting.total_training_hour !== "" && posting.rating !== ""
      );

      await axios.put(
        "http://localhost:3001/postings/update",
        {
          postings: updatedPostings,
          recalculateTrainingHours: true, // Flag to trigger recalculation
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Postings updated successfully.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error updating postings:", error);
      toast.error("Failed to update postings.");
    }
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to update FTE
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleFTEUpdate = async () => {
    const fteUpdates = [];

    filteredContracts.forEach((contract) => {
      selectedYears.forEach((year) => {
        const fteValue = contract[`fte_${year}`];
        if (fteValue) {
          fteUpdates.push({
            mcrNumber: contract.mcr_number,
            school_name: contract.school_name,
            year: year, // Selected year from the button
            fteValue: parseFloat(fteValue).toFixed(2),
          });
        }
      });
    });

    try {
      await axios.put("http://localhost:3001/contracts/update-fte", {
        fteUpdates,
      });
      toast.success("FTE values updated successfully.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error updating FTE values:", error);
      toast.error("Failed to update FTE values.");
    }
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Render
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <>
      {" "}
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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>Select Year(s)</h2>
          <div className="year-buttons-container">
            {[
              "2014",
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
          </div>{" "}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="toggle-add-contract-button"
            onClick={handleReset}
          >
            <FaRedo /> Reset
          </motion.button>
          <AddNewPostings />
          <AddNewContract />
          <AddNewNonInst />
          {/* ⚠️CONTRACT TABLE⚠️ */}
          <h2>Contract(s)</h2>
          <div className="contracts-table-container">
            {selectedYears.length === 0 ? (
              <table className="posting-detail-table">
                <tbody>
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Please select a year to view Contracts.
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : filteredContracts.length === 0 ? (
              <table className="posting-detail-table">
                <tbody>
                  <tr>
                    <td
                      colSpan="5"
                      style={{ textAlign: "center", color: "red" }}
                    >
                      No contracts found for the selected year(s).
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="staff-detail-table">
                <thead>
                  <tr>
                    <th>Contract Detail</th>
                    {filteredContracts.map((contract, index) => (
                      <th key={index}>{contract?.school_name || "N/A"}</th>
                    ))}
                  </tr>
                </thead>
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
                    {filteredContracts.map((contract, index) => (
                      <td key={index}>
                        {contract?.status || "No Contract Found"}
                      </td>
                    ))}
                  </tr>{" "}
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
                  {/* Training Hours Rows for Selected Years */}
                  {selectedYears.includes("2022") && (
                    <tr>
                      <th>Training Hours in 2022</th>
                      {filteredContracts.map((contract, index) => (
                        <td key={index}>
                          {contract.training_hours_2022 || "0"}
                        </td>
                      ))}
                    </tr>
                  )}
                  {selectedYears.includes("2023") && (
                    <tr>
                      <th>Training Hours in 2023</th>
                      {filteredContracts.map((contract, index) => (
                        <td key={index}>
                          {contract.training_hours_2023 || "0"}
                        </td>
                      ))}
                    </tr>
                  )}
                  {selectedYears.includes("2024") && (
                    <tr>
                      <th>Training Hours in 2024</th>
                      {filteredContracts.map((contract, index) => (
                        <td key={index}>
                          {contract.training_hours_2024 || "0"}
                        </td>
                      ))}
                    </tr>
                  )}
                  {/* Total Training Hours */}
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
              </table>
            )}
          </div>
        </motion.div>
        <motion.div
          className="staff-info-container-right"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* ⚠️FTE Table⚠️ */}
          <h2>FTE per Academic Year</h2>
          <div className="contracts-table-container">
            {selectedYears.length === 0 ? (
              <table className="posting-detail-table">
                <tbody>
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Please select a year to view FTE.
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : filteredContracts.length === 0 ? (
              <table className="posting-detail-table">
                <tbody>
                  <tr>
                    <td
                      colSpan="5"
                      style={{ textAlign: "center", color: "red" }}
                    >
                      No FTE data found for the selected year(s).
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="staff-detail-table">
                <thead>
                  <tr>
                    <th>FTE</th>
                    {filteredContracts.map((contract, index) => (
                      <th key={index}>{contract.school_name || "N/A"}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedYears.map((year) => (
                    <tr key={year}>
                      <th>FTE in {year}</th>
                      {filteredContracts.map((contract, index) => (
                        <td key={index}>
                          <input
                            type="text"
                            placeholder={contract[`fte_${year}`] || "0.00"}
                            value={contract[`fte_${year}`] || ""}
                            onChange={(e) => {
                              const updatedFTE = e.target.value;
                              setFilteredContracts((prevContracts) =>
                                prevContracts.map((c, i) =>
                                  i === index
                                    ? { ...c, [`fte_${year}`]: updatedFTE }
                                    : c
                                )
                              );
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {selectedYears.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              className="update-fte-button"
              onClick={
                userRole === "hr" ? handleRestrictedAction : handleFTEUpdate
              }
            >
              Update FTE
            </motion.button>
          )}

          {/* ⚠️Postings Table⚠️ */}
          <h2>Postings</h2>
          <div className="postings-table-container">
            {selectedYears.length === 0 ? (
              <table className="posting-detail-table">
                <tbody>
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Please select a year to view Postings.
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : filteredPostings.length === 0 ? (
              <table className="posting-detail-table">
                <tbody>
                  <tr>
                    <td
                      colSpan="5"
                      style={{ textAlign: "center", color: "red" }}
                    >
                      No postings found for the selected year(s).
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="posting-detail-table">
                <thead>
                  <tr>
                    <th>Academic Year</th>
                    <th>School</th>
                    <th>Training Hours</th>
                    <th>Posting Number</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPostings.map((posting) => (
                    <tr key={posting.id}>
                      <td>{posting.academic_year || "N/A"}</td>
                      <td>{posting.school_name || "N/A"}</td>
                      <td>
                        <input
                          type="number"
                          value={posting.total_training_hour || ""} // Ensure this is bound to the posting's unique value
                          onChange={(e) => {
                            const updatedValue = e.target.value;

                            // Update only the specific posting with the matching id
                            setPostings((prevPostings) =>
                              prevPostings.map(
                                (p) =>
                                  p.id === posting.id
                                    ? {
                                        ...p,
                                        total_training_hour: updatedValue,
                                      } // Update only the matching posting
                                    : p // Leave others unchanged
                              )
                            );
                          }}
                        />
                      </td>
                      <td>{posting.posting_number || "N/A"}</td>
                      <td>
                        <input
                          type="number"
                          step="0.5"
                          value={posting.rating || ""}
                          onChange={(e) => {
                            const updatedRating = e.target.value;

                            // Update only the specific posting with the matching id
                            setPostings((prevPostings) =>
                              prevPostings.map((p) =>
                                p.id === posting.id
                                  ? { ...p, rating: updatedRating }
                                  : p
                              )
                            );
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {selectedYears.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              className="update-fte-button"
              onClick={
                userRole === "hr"
                  ? handleRestrictedAction
                  : handleUpdatePostings
              }
            >
              Update Postings
            </motion.button>
          )}

          {/* ⚠️Non-Institutional Activities⚠️ */}
          <div>
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
                        <th>Training Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNonInstitutional.map((activity, index) => (
                        <tr key={`${activity.academic_year}-${index}`}>
                          <td>{activity.academic_year || "N/A"}</td>
                          <td>{activity.teaching_categories || "N/A"}</td>
                          <td>{activity.role || "N/A"}</td>
                          <td>{activity.activity_type || "N/A"}</td>
                          <td>{activity.medium || "N/A"}</td>
                          <td>{activity.host_country || "N/A"}</td>
                          <td>{activity.honorarium || "N/A"}</td>
                          <td>{activity.training_hours || "0"}</td>
                        </tr>
                      ))}
                      <tr>
                        <th colSpan={4}>
                          Total Non-Institutional Training Hours for Selected
                          Year(s)
                        </th>
                        <td colSpan={4}>
                          {filteredNonInstitutional
                            .reduce((sum, activity) => {
                              return (
                                sum +
                                (selectedYears.includes(
                                  activity.academic_year?.toString()
                                )
                                  ? parseFloat(activity.training_hours) || 0
                                  : 0)
                              );
                            }, 0)
                            .toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <table className="posting-detail-table">
                    <tbody>
                      <tr>
                        <td
                          colSpan="5"
                          style={{ textAlign: "center", color: "red" }}
                        >
                          No Non-Institutional activities found for the selected
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
                        Please select a year to view Non-Institutional
                        activities.
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </motion.div>{" "}
      </motion.div>{" "}
    </>
  );
};

export default StaffDetailPage;
