import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import "../styles/navbar.css";
import logo from "../images/cgh_logo.png";

const Navbar = ({ homeRoute }) => {
  const nav = useNavigate();
  const location = useLocation();
  const navbarRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);

  const handleLogOut = () => {
    localStorage.clear();
    nav("/");
  };

  const handleHome = () => {
    nav(homeRoute); // Navigate to the provided homeRoute
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        >
          Entry
        </motion.button>
        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Profile
        </motion.button>
        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogOut}
        >
          Log Out
        </motion.button>
        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => nav(-1)} // Handle Back navigation
        >
          Back
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
