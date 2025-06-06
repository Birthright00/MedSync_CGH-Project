import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import "../styles/navbar.css";
import logo from "../images/cgh_logo.png";

const Navbar = ({ homeRoute }) => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Generic Constants
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const nav = useNavigate();
  const location = useLocation();
  const navbarRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const [userRole, setUserRole] = useState("");

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Decode the token to get user role
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
        setUserRole(decodedToken.role); // Assuming 'role' is part of the token payload
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Functions for Navbar Buttons navigation
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleLogOut = () => {
    localStorage.clear();
    nav("/");
  };

  const handleHome = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
        const mcrNumber = decodedToken.id;

        if (userRole === "staff") {
          nav(`/staff/${mcrNumber}`); // Doctors go to their staff details page
        } else {
          nav("/home"); // Other roles go to the homepage
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        nav("/"); // Fallback to login if decoding fails
      }
    } else {
      nav("/"); // Fallback to login if no token is found
    }
  };

  const handleBackNav = () => {
    nav(-1);
  };

  const handleEntry = () => {
    nav("/entry");
  };

  const handleAboutUs = () => {
    nav("/about-us");
  };

  const handleScheduler = () => {
    nav("/scheduler");
  };

  const handleTimetable = () => {
    nav("/timetable");
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Render
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <motion.nav
      className={`navbar ${isSticky ? "sticky-nav" : ""}`}
      ref={navbarRef}
    >
      <div className="navbar_contents">
        <img src={logo} alt="logo" />
        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleHome} // Handle Home navigation
        >
          Home
        </motion.button>

        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleScheduler}
        >
          Schedule
        </motion.button>

        {/* <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleEntry}
        >
          Entry
        </motion.button> */}
        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleAboutUs}
        >
          About Me
        </motion.button>

        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          onClick={handleTimetable}  // or replace with your actual route
        >
          Timetable
        </motion.button>

        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBackNav} // Handle Back navigation
        >
          Back
        </motion.button>{" "}

        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogOut}
        >
          Log Out
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
