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

const AddNewContract = () => {
  const { mcr_number } = useParams(); // Get the MCR number from route params
  const [contracts, setContracts] = useState([]);
  const [isContractFormOpen, setContractFormOpen] = useState(false);

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
  return (
    <div>
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

          {/* <div className="input-group">
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
              </div> */}

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
    </div>
  );
};

export default AddNewContract;
