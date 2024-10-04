import "../styles/staffdetailpage.css"; // Create a new CSS file for this page
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate for navigation
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CSVLink } from "react-csv"; // Import CSVLink

const StaffDetailPage = () => {
  const { mcr_number } = useParams(); // Get the MCR number from route params
  const [staffDetails, setStaffDetails] = useState({
    mcr_number: "",
    first_name: "",
    last_name: "",
    department: "",
    appointment: "",
    teaching_training_hours: "",
    email: "",
    deleted: 0, // Include deleted field in the state
  });
  const [newContract, setNewContract] = useState({
    school_name: "",
    start_date: "Start Date",
    end_date: "End Date",
    status: "",
  });

  const [contracts, setContracts] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const combinedData = contracts.map((contract) => ({
    "MCR Number": staffDetails.mcr_number,
    "First Name": staffDetails.first_name,
    "Last Name": staffDetails.last_name,
    Department: staffDetails.department,
    Appointment: staffDetails.appointment,
    Email: staffDetails.email,
    "Teaching Training Hours": staffDetails.teaching_training_hours,
    "Contract School Name": contract.school_name,
    "Contract Start Date": contract.start_date,
    "Contract End Date": contract.end_date,
    "Contract Status": contract.status,
    "Promotion History":
      promotions.length > 0
        ? promotions
            .map(
              (promotion) =>
                `${promotion.new_title} (From: ${
                  promotion.previous_title
                } on ${new Date(
                  promotion.promotion_date
                ).toLocaleDateString()})`
            )
            .join(", ")
        : "No Promotions",
  }));

  const navigate = useNavigate(); // Use navigate to redirect after delete

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
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to fetch contracts");
    }
  };

  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:3001/promotions/${mcr_number}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPromotions(response.data);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      toast.error("Failed to fetch promotions");
    }
  };

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
      await axios.post(
        `http://localhost:3001/new-contracts/${mcr_number}`,
        newContract,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("New contract added successfully!");
      setNewContract({
        school_name: "",
        start_date: "",
        end_date: "",
        status: "",
      }); // Reset the form fields
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(
        "Error adding new contract:",
        error.response ? error.response.data : error
      );
      toast.error("Failed to add new contract");
    }
  };

  // Function to handle deletion
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this staff?")) {
      return; // If user cancels the action, don't proceed with deletion
    }

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
  };

  // Function to handle restoration
  const handleRestore = async () => {
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
  };

  const [loading, setLoading] = useState(true);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return `${year}-${month}-${day} | ${hours}${minutes}H`;
  };

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
    fetchPromotions(); // Ensure only one call
    fetchContracts();
    fetchStaffDetails();
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
      <div className="staff-detail-page">
        <div className="staff-info-container">
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
                <th>Appointment</th>
                <td>
                  <input
                    type="text"
                    name="appointment"
                    value={staffDetails.appointment}
                    onChange={handleInputChange}
                  />
                </td>
              </tr>
              <tr>
                <th>Teaching Training Hours</th>
                <td>
                  <input
                    type="number"
                    name="teaching_training_hours"
                    value={staffDetails.teaching_training_hours}
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
        </div>

        <div className="staff-info-container">
          <h2>Contracts</h2>
          <div className="contracts-table-container">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length > 0 ? (
                  contracts.map((contract, index) => (
                    <tr key={index}>
                      <td>{contract.school_name}</td>
                      <td>
                        {new Date(contract.start_date).toLocaleDateString()}
                      </td>
                      <td>
                        {new Date(contract.end_date).toLocaleDateString()}
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
          </div>{" "}
          <h2>Add New Contract</h2>
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
              <option value="SingHealth Residency">SingHealth Residency</option>
              <option value="SUTD">SUTD</option>
              <option value="NUS Yong Loo Lin School of Medicine">
                NUS Yong Loo Lin School of Medicine
              </option>
              <option value="NTU LKC">NTU LKC</option>
            </select>
            <input
              type="text"
              placeholder="Start Date"
              value={newContract.start_date}
              onFocus={(e) => (e.target.type = "date")} // Change type to date on focus
              onBlur={(e) => (e.target.type = "text")} // Revert back to text on blur if no date selected
              onChange={(e) =>
                setNewContract({ ...newContract, start_date: e.target.value })
              }
            />

            <input
              type="date"
              placeholder="End Date"
              value={newContract.end_date}
              onFocus={(e) => (e.target.type = "date")} // Change type to date on focus
              onBlur={(e) => (e.target.type = "text")} // Revert back to text on blur if no date selected
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
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="add-contract-button"
            onClick={handleNewContract}
          >
            Add New Contract
          </motion.button>
          <h2>Promotions</h2>
          <div className="contracts-table-container">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>New Title</th>
                  <th>Previous Title</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length > 0 ? (
                  promotions.map((promotion, index) => (
                    <tr key={index}>
                      <td>{promotion.new_title}</td>
                      <td>{promotion.previous_title}</td>
                      <td>
                        {new Date(
                          promotion.promotion_date
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">No promotions found for this doctor.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <CSVLink
            data={combinedData}
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
          </CSVLink>
        </div>
      </div>
    </>
  );
};

export default StaffDetailPage;
