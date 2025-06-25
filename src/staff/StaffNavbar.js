import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import "../styles/navbar.css";
import logo from "../images/cgh_logo.png";

const StaffNavbar = () => {
  const nav = useNavigate();
  const location = useLocation();
  const navbarRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        setUserRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const handleLogOut = () => {
    localStorage.clear();
    nav("/");
  };

  const handleHome = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        const mcrNumber = decodedToken.id;

        if (userRole === "staff") {
          nav(`/staff/${mcrNumber}`);
        } else {
          nav("/home");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        nav("/");
      }
    } else {
      nav("/");
    }
  };

  const handleScheduler = () => {
    nav("/staff-timetable");
  };

  const handleAboutUs = () => {
    nav("/about-us");
  };

  const handleBackNav = () => {
    nav(-1);
  };

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
          onClick={handleHome}
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
          onClick={handleBackNav}
        >
          Back
        </motion.button>

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

export default StaffNavbar;
