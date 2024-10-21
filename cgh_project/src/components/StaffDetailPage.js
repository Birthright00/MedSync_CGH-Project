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

const StaffDetailPage = () => {
  // ########################################## //
  // Generic Constants
  // ########################################## //
  const { mcr_number } = useParams(); // Get the MCR number from route params
  const navigate = useNavigate(); // Use navigate to redirect after delete
  const [newContract, setNewContract] = useState({
    school_name: "",
    start_date: "",
    end_date: "",
    status: "",
  });
  const [contracts, setContracts] = useState([]);
  const [isContractFormOpen, setContractFormOpen] = useState(false);

  const [staffDetails, setStaffDetails] = useState({
    mcr_number: "",
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    fte: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [staffContractDetails, setStaffContractDetails] = useState({
    school_name: "",
    contract_end_date: "",
    contract_start_date: "",
    status: "",
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

  // ########################################## //
  // Adding New Contract
  // ########################################## //
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
      };

      // Log contract data to ensure values are correct
      console.log("Contract Data being sent: ", contractData);

      // POST request to add the new contract
      await axios.post(
        `http://localhost:3001/new-contracts/${mcr_number}`,
        contractData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("New contract added successfully!");
      setNewContract({
        school_name: "",
        contract_start_date: "",
        contract_end_date: "",
        status: "",
      });

      // Fetch contracts again to update the displayed table
      fetchContracts();
    } catch (error) {
      console.error("Error adding new contract:", error);
      toast.error("Failed to add new contract");
    }
  };

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
          className="staff-info-container"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {" "}
          <h2>Contracts</h2>
          <table className="staff-detail-table">
            <thead>
              <tr>
                <th>Institution Name</th> {/* Custom name for "School Name" */}
                <th>Start Date</th>
                <th>End Date</th>
                <th>Contract Status</th> {/* Custom name for "Status" */}
              </tr>
            </thead>

            <tbody>
              {staffContractDetails.length > 0 ? (
                staffContractDetails.map((contract, index) => (
                  <tr key={index}>
                    <th>{contract.school_name}</th>
                    <td>
                      {new Date(
                        contract.contract_start_date
                      ).toLocaleDateString()}
                    </td>
                    <td>
                      {new Date(
                        contract.contract_end_date
                      ).toLocaleDateString()}
                    </td>
                    <td>{contract.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No contracts found for this doctor.</td>
                </tr>
              )}
            </tbody>
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
              <select
                value={newContract.school_name}
                onChange={(e) =>
                  setNewContract({
                    ...newContract,
                    school_name: e.target.value,
                  })
                }
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

              <input
                type="text"
                placeholder="Start Date"
                value={newContract.start_date}
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
                onChange={(e) =>
                  setNewContract({ ...newContract, start_date: e.target.value })
                }
              />

              <input
                type="text"
                placeholder="End Date"
                value={newContract.end_date}
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
                onChange={(e) =>
                  setNewContract({ ...newContract, end_date: e.target.value })
                }
              />

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

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                className="add-contract-button"
                onClick={handleNewContract}
              >
                Submit
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
};

export default StaffDetailPage;
