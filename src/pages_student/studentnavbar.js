import { useLocation, useNavigate } from "react-router-dom";
import logo from "../images/cgh_logo.png";
import "../styles/studentnavbar.css";
import { motion } from "framer-motion";

const StudentNavbar = () => {
  const location = useLocation();
  const nav = useNavigate();

  const handleHome = () => nav("/student-home");
  const handleTimetable = () => nav("/student-timetable");
  const handleLogout = () => {
    localStorage.removeItem("token");
    nav("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="CGH Logo" className="navbar-logo" />
      </div>
      <div className="navbar-links">
        <motion.button
          className={`navbarbutton ${location.pathname === "/student-home" ? "active" : ""}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleHome}
        >
          Home
        </motion.button>

        <motion.button
          className={`navbarbutton ${location.pathname === "/student-timetable" ? "active" : ""}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleTimetable}
        >
          Timetable
        </motion.button>

        <motion.button
          className="navbarbutton"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
        >
          Log Out
        </motion.button>
      </div>
    </nav>
  );
};

export default StudentNavbar;
