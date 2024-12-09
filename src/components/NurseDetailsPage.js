import "../styles/staffdetailpage.css";
import Navbar from "./Navbar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaRedo } from "react-icons/fa";
import React from "react";
import AddNewContract from "./AddNewContract";
import NurseDetails from "./NurseDetails";

const NurseDetailsPage = () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generic Constants
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const { snb_number } = useParams(); // Updated to use `snb_number` instead of `mcr_number`
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYears, setSelectedYears] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
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
  // Render
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
        <NurseDetails />
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
        </motion.div>
      </motion.div>
    </>
  );
};

export default NurseDetailsPage;
