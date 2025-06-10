import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../images/cgh_logo.png";
import "../styles/studentnavbar.css";

const StudentNavbar = () => {
  const location = useLocation();
  const nav = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    nav("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="CGH Logo" className="navbar-logo" />
        <div className="navbar-title">
          <h4>Changi</h4>
          <h4>General Hospital</h4>
        </div>
      </div>
      <div className="navbar-links">
        <Link
          to="/student-home"
          className={location.pathname === "/student-home" ? "active" : ""}
        >
          Home
        </Link>
        <Link
          to="/student-timetable"
          className={location.pathname === "/student-timetable" ? "active" : ""}
        >
          Timetable
        </Link>
        <button onClick={handleLogout} className="logout-button">
          Log Out
        </button>
      </div>
    </nav>
  );
};

export default StudentNavbar;
