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

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Functions for Navbar Buttons navigation
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const handleLogOut = () => {
    localStorage.clear();
    nav("/");
  };

  const handleHome = () => {
    nav("/home"); // Navigate to the provided homeRoute
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
