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
import { confirmAlert } from "react-confirm-alert"; // Import the confirmation alert library
import "react-confirm-alert/src/react-confirm-alert.css";
import React from "react";

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
  const [filteredPostings, setFilteredPostings] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);

  // Filter contracts based on selected years
  useEffect(() => {
    const updatedFilteredContracts = contracts.filter((contract) => {
      const startYear = new Date(contract.contract_start_date)
        .getFullYear()
        .toString();
      const endYear = new Date(contract.contract_end_date)
        .getFullYear()
        .toString();

      return (
        selectedYears.includes(startYear) || selectedYears.includes(endYear)
      );
    });

    console.log("Filtered Contracts:", updatedFilteredContracts); // Debug: Check filtered contracts

    setFilteredContracts(updatedFilteredContracts);
  }, [selectedYears, contracts]);

  const [staffDetails, setStaffDetails] = useState({
    mcr_number: "",
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    fte: "",
    email: "",
  });

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

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3001/contracts/${mcr_number}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setContracts(response.data); // Update the contract data in state
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to fetch contracts");
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
      setPostings(response.data); // Set the postings data
    } catch (error) {
      console.error("Error fetching postings:", error);
      toast.error("Failed to fetch postings");
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchPostings(); // Fetch postings when component loads
  }, [mcr_number]);

  // ########################################## //
  // Filter by year total training hours
  // ########################################## //
  useEffect(() => {
    const updatedFilteredPostings = postings.filter((posting) =>
      selectedYears.includes(posting.academic_year.toString())
    );

    console.log("Selected Years:", selectedYears); // Debug: Check selected years
    console.log("Filtered Postings:", updatedFilteredPostings); // Debug: Check filtered postings

    setFilteredPostings(updatedFilteredPostings);
  }, [selectedYears, postings]);

  const handleYearToggle = (year) => {
    setSelectedYears((prevSelectedYears) =>
      prevSelectedYears.includes(year)
        ? prevSelectedYears.filter((y) => y !== year)
        : [...prevSelectedYears, year]
    );
  };
  // ########################################## //
  // Add new Contract Section
  // ########################################## //
  const [newContract, setNewContract] = useState({
    school_name: "",
    start_date: "",
    end_date: "",
    status: "",
    training_hours: "",
    training_hours_2022: "",
    training_hours_2023: "",
    training_hours_2024: "",
    total_training_hours: 0,
    prev_title: "",
    new_title: "",
  });

  const [isContractFormOpen, setContractFormOpen] = useState(false);
  const calculateTotalTrainingHours = (contract) => {
    const {
      training_hours,
      training_hours_2022,
      training_hours_2023,
      training_hours_2024,
    } = contract;

    const total =
      parseFloat(training_hours || 0) +
      parseFloat(training_hours_2022 || 0) +
      parseFloat(training_hours_2023 || 0) +
      parseFloat(training_hours_2024 || 0);

    return total;
  };

  const handleNewContractInputChange = async (e) => {
    const { name, value } = e.target;

    // Update the new contract details
    const updatedContract = {
      ...newContract,
      [name]: value,
    };

    // If the selected field is school_name, fetch the contract details
    if (name === "school_name" && value) {
      try {
        const token = localStorage.getItem("token");

        // Make an API call to get the contract details for the selected school
        const response = await axios.get(
          `http://localhost:3001/contracts/${mcr_number}/${value}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // If contract exists, update all relevant fields
        if (response.status === 200) {
          const {
            contract_start_date,
            contract_end_date,
            prev_title,
            status,
            training_hours_2022,
            training_hours_2023,
            training_hours_2024,
          } = response.data;

          // Store the dates in the backend-friendly format (YYYY-MM-DD)
          updatedContract.start_date = contract_start_date || "";
          updatedContract.end_date = contract_end_date || "";
          updatedContract.prev_title = prev_title || "";
          updatedContract.status = status || "";
          updatedContract.training_hours_2022 = training_hours_2022 || 0;
          updatedContract.training_hours_2023 = training_hours_2023 || 0;
          updatedContract.training_hours_2024 = training_hours_2024 || 0;
        }
      } catch (error) {
        console.error("Error fetching contract details:", error);
        toast.error("Failed to fetch contract details");
      }
    }

    // Calculate the total training hours
    updatedContract.total_training_hours =
      calculateTotalTrainingHours(updatedContract);

    setNewContract(updatedContract);
  };

  const handleNewContract = async () => {
    if (
      !newContract.school_name ||
      !newContract.start_date ||
      !newContract.end_date ||
      !newContract.status
    ) {
      toast.error("Please fill all contract fields before submitting");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const contractData = {
        school_name: newContract.school_name,
        contract_start_date: newContract.start_date,
        contract_end_date: newContract.end_date,
        status: newContract.status,
        training_hours: newContract.training_hours, // Include training_hours
        prev_title: newContract.prev_title, // Include prev_title
        new_title: newContract.new_title, // Include new_title
        training_hours_2022: newContract.training_hours_2022, // Include training_hours_2022
        training_hours_2023: newContract.training_hours_2023, // Include training_hours_2023
        training_hours_2024: newContract.training_hours_2024, // Include training_hours_2024
      };

      // POST request to add the new contract
      await axios.post(
        `http://localhost:3001/contracts/${mcr_number}`,
        contractData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("New contract added successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      setNewContract({
        school_name: "",
        contract_start_date: "",
        contract_end_date: "",
        status: "",
        training_hours: "", // Reset the form fields after submission
        prev_title: "",
        new_title: "",
        training_hours_2022: "",
        training_hours_2023: "",
        training_hours_2024: "",
      });

      // Fetch contracts again to update the displayed table
      fetchContracts();
    } catch (error) {
      console.error("Error adding new contract:", error);
      toast.error("Failed to add new contract");
    }
  };
  // ########################################## //
  // End of Add New Contract Section
  // ########################################## //

  // ########################################## //
  // General Staff Details
  // ########################################## //
  // Update Staff Details
  // ########################################## //
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

  // ########################################## //
  // Delete Staff
  // ########################################## //
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

  // ########################################## //
  // Restore Staff Details with Confirmation
  // ########################################## //
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

  // ############################################
  // useEffect to retrieve data from main_data
  // ############################################
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
  }, [mcr_number]);

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
        <motion.div
          className="staff-info-container"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>Staff Details {staffDetails.deleted === 1 ? "(Deleted)" : ""}</h2>
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
                <th>FTE</th>
                <td>
                  <input
                    type="email"
                    name="email"
                    value={staffDetails.fte}
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

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="update-button"
            onClick={handleSubmit}
          >
            Update Details
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              className="delete-button"
              onClick={handleDelete}
            >
              Delete
            </motion.button>
          )}
        </motion.div>

        <motion.div
          className="staff-info-container-right"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {" "}
          <h2>Select Year(s)</h2>
          <table className="staff-detail-table">
            <th colSpan={3}>
              <div>
                {[
                  "2013",
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
                  <label key={year} style={{ marginRight: "10px" }}>
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={() => handleYearToggle(year)}
                    />
                    {year}
                  </label>
                ))}
              </div>
            </th>
          </table>
          <h2>Contracts</h2>
          <table className="staff-detail-table">
            <thead>
              <tr>
                <th>Contract Detail</th>
                {filteredContracts.length > 0 ? (
                  filteredContracts.map((contract, index) => (
                    <th key={index}>{contract.school_name}</th>
                  ))
                ) : (
                  <th>No Contract Found</th>
                )}
              </tr>
            </thead>
            {filteredContracts.length > 0 ? (
              <tbody>
                <tr>
                  <th>Start Date</th>
                  {filteredContracts.map((contract, index) => (
                    <td key={index}>
                      {new Date(
                        contract.contract_start_date
                      ).toLocaleDateString()}
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
                    <td key={index}>{contract.status}</td>
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
                      <td key={index}>{contract.training_hours_2022 || "0"}</td>
                    ))}
                  </tr>
                )}
                {selectedYears.includes("2023") && (
                  <tr>
                    <th>Total Training Hours in 2023</th>
                    {filteredContracts.map((contract, index) => (
                      <td key={index}>{contract.training_hours_2023 || "0"}</td>
                    ))}
                  </tr>
                )}
                {selectedYears.includes("2024") && (
                  <tr>
                    <th>Total Training Hours in 2024</th>
                    {filteredContracts.map((contract, index) => (
                      <td key={index}>{contract.training_hours_2024 || "0"}</td>
                    ))}
                  </tr>
                )}
                {/* <tr>
                <th>Total Training Hours in 2022</th>
                {staffContractDetails.map((contract, index) => (
                  <td key={index}>{contract.training_hours_2022}</td>
                ))}
              </tr>
              <tr>
                <th>Total Training Hours in 2023</th>
                {staffContractDetails.map((contract, index) => (
                  <td key={index}>{contract.training_hours_2023}</td>
                ))}
              </tr>
              <tr>
                <th>Total Training Hours in 2024</th>
                {staffContractDetails.map((contract, index) => (
                  <td key={index}>{contract.training_hours_2024}</td>
                ))}
              </tr>
              <tr>
                <th>Total Training Hours</th>
                {staffContractDetails.map((contract, index) => (
                  <td key={index}>{contract.total_training_hours}</td>
                ))}
              </tr> */}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No Contract Found
                  </td>
                </tr>
              </tbody>
            )}
          </table>
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="toggle-add-contract-button"
            onClick={() => setContractFormOpen((prev) => !prev)}
          >
            {isContractFormOpen ? "Close" : "Add New Contract"}
          </motion.button>
          {isContractFormOpen && (
            <div className="contract-input-container">
              <div className="input-group">
                <label>School Name:</label>
                <select
                  value={newContract.school_name}
                  onChange={handleNewContractInputChange}
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
              </div>

              <div className="input-group">
                <label>Start Date:</label>
                <input
                  type="text"
                  placeholder="Start Date"
                  value={formatDateTime(newContract.start_date)}
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => (e.target.type = "text")}
                  onChange={(e) =>
                    setNewContract({
                      ...newContract,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>End Date:</label>
                <input
                  type="text"
                  placeholder="End Date"
                  value={formatDateTime(newContract.end_date)}
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => (e.target.type = "text")}
                  onChange={(e) =>
                    setNewContract({
                      ...newContract,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>Status:</label>
                <select
                  value={newContract.status}
                  onChange={(e) =>
                    setNewContract({ ...newContract, status: e.target.value })
                  }
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Lapse">Lapse</option>
                  <option value="New">New</option>
                  <option value="Program Closure">Program Closure</option>
                  <option value="Renewal">Renewal</option>
                </select>
              </div>

              {/* <div className="input-group">
                <label>Training Hours for this Contract:</label>
                <input
                  type="float"
                  placeholder="Training Hours for this Contract"
                  name="training_hours"
                  value={newContract.training_hours}
                  onChange={handleNewContractInputChange}
                />
              </div> */}

              <div className="input-group">
                <label>Training Hours in 2022:</label>
                <input
                  type="float"
                  placeholder="Training Hours in 2022"
                  name="training_hours_2022"
                  value={newContract.training_hours_2022}
                  onChange={handleNewContractInputChange}
                />
              </div>

              <div className="input-group">
                <label>Training Hours in 2023:</label>
                <input
                  type="float"
                  placeholder="Training Hours in 2023"
                  name="training_hours_2023"
                  value={newContract.training_hours_2023}
                  onChange={handleNewContractInputChange}
                />
              </div>

              <div className="input-group">
                <label>Training Hours in 2024:</label>
                <input
                  type="float"
                  placeholder="Training Hours in 2024"
                  name="training_hours_2024"
                  value={newContract.training_hours_2024}
                  onChange={handleNewContractInputChange}
                />
              </div>

              <div className="input-group">
                <label>Total Training Hours:</label>
                <input
                  type="number"
                  name="total_training_hours"
                  placeholder="Total Training Hours"
                  value={newContract.total_training_hours}
                  readOnly
                />
              </div>

              <div className="input-group">
                <label>Previous Title:</label>
                <input
                  type="text"
                  placeholder="Previous Title"
                  value={newContract.prev_title}
                  onChange={(e) =>
                    setNewContract({
                      ...newContract,
                      prev_title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-group">
                <label>New Title:</label>
                <input
                  type="text"
                  placeholder="New Title"
                  value={newContract.new_title}
                  onChange={(e) =>
                    setNewContract({
                      ...newContract,
                      new_title: e.target.value,
                    })
                  }
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                className="add-contract-button"
                onClick={handleNewContract}
              >
                Submit
              </motion.button>
            </div>
          )}{" "}
          <h2>Postings</h2>
          <div className="postings-table-container">
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
                {filteredPostings.length > 0 ? (
                  filteredPostings.map((posting) => (
                    <tr
                      key={`${posting.academic_year}-${posting.posting_number}`}
                    >
                      <td>{posting.academic_year}</td>
                      <td>{posting.posting_number}</td>
                      <td>{posting.total_training_hour}</td>
                      <td>{posting.school_name}</td>
                      <td>{posting.rating}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No postings found for selected years.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default StaffDetailPage;
