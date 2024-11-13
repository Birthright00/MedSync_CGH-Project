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

const AddNewContract = () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generic Constants
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const { mcr_number } = useParams();
  const [isContractFormOpen, setContractFormOpen] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [userRole, setUserRole] = useState("");
  // useState to hold new contract details
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
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to fetch contracts");
    }
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Contract Form - Submitting New Contract
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Function to Calculate total training hours
  const calculateTotalTrainingHours = (contract) => {
    const {
      training_hours,
      training_hours_2022,
      training_hours_2023,
      training_hours_2024,
    } = contract;
    return (
      parseFloat(training_hours || 0) +
      parseFloat(training_hours_2022 || 0) +
      parseFloat(training_hours_2023 || 0) +
      parseFloat(training_hours_2024 || 0)
    );
  };

  // Function to handle new contract form input changes
  const handleNewContractInputChange = async (e) => {
    const { name, value } = e.target;
    const updatedContract = { ...newContract, [name]: value };

    // Auto-populate if a school is selected
    if (name === "school_name" && value) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:3001/contracts/${mcr_number}/${value}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

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

          // Set pre-existing data with correct SQL `DATE` format
          updatedContract.start_date = contract_start_date
            ? contract_start_date.split("T")[0]
            : "";
          updatedContract.end_date = contract_end_date
            ? contract_end_date.split("T")[0]
            : "";
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

  // Function to handle submitting new contract
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
        training_hours: newContract.training_hours,
        prev_title: newContract.prev_title,
        new_title: newContract.new_title,
        training_hours_2022: newContract.training_hours_2022,
        training_hours_2023: newContract.training_hours_2023,
        training_hours_2024: newContract.training_hours_2024,
      };

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
        start_date: "",
        end_date: "",
        status: "",
        training_hours: "",
        prev_title: "",
        new_title: "",
        training_hours_2022: "",
        training_hours_2023: "",
        training_hours_2024: "",
      });
      fetchContracts();
    } catch (error) {
      console.error("Error adding new contract:", error);
      toast.error("Failed to add new contract");
    }
  };

  // Function to handle confirmation of submitting new contract
  const handleSubmitConfirmation = () => {
    if (
      !newContract.school_name ||
      !newContract.start_date ||
      !newContract.end_date ||
      !newContract.status
    ) {
      toast.error("Please fill all contract fields before submitting");
      return;
    }

    confirmAlert({
      title: "Confirm Submission",
      message: "⚠️Are you sure you want to submit this contract?⚠️",
      buttons: [
        {
          label: "Yes",
          onClick: handleNewContract,
        },
        {
          label: "No",
          onClick: () => {},
        },
      ],
    });
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div>
      <ToastContainer />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="toggle-add-contract-button"
        onClick={() => setContractFormOpen((prev) => !prev)}
      >
        {" "}
        {isContractFormOpen ? <FaTimes /> : <FaPlus />}
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
              <option value="SingHealth Residency">SingHealth Residency</option>
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
              type="date"
              name="start_date"
              value={newContract.start_date}
              onChange={handleNewContractInputChange}
            />
          </div>

          <div className="input-group">
            <label>End Date:</label>
            <input
              type="date"
              name="end_date"
              value={newContract.end_date}
              onChange={handleNewContractInputChange}
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
            onClick={
              userRole === "hr"
                ? handleRestrictedAction
                : handleSubmitConfirmation
            }
          >
            <FaPaperPlane />
            Submit
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default AddNewContract;
