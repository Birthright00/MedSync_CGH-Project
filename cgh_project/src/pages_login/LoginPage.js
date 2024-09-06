import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../images/cgh_logo.png";
import management from "../images/management.png";
import staff from "../images/staff.png";
import Footer from "../components/footer";
import "../styles/loginpage.css";

const LoginPage = () => {
  const nav = useNavigate();
  const [username, usernameupdate] = useState("");
  const [password, passwordupdate] = useState("");
  const [selectedRole, setSelectedRole] = useState(null); // State to track selected role
  const handleSignIn = () => {
    if (selectedRole === "management") {
      nav("/management-home");
    } else if (selectedRole === "staff") {
      nav("/staff-home");
    }
  };
  return (
    <>
      <motion.div
        className="login-page"
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="login-div">
          <form className="login-form">
            <img src={logo} alt="logo" />
            <div className="login-card">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${
                  selectedRole === "management" ? "selected" : ""
                }`}
                type="button"
                onClick={() => setSelectedRole("management")}
              >
                <img src={management} alt="management" />
                Management
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${
                  selectedRole === "staff" ? "selected" : ""
                }`}
                type="button"
                onClick={() => setSelectedRole("staff")}
              >
                <img src={staff} alt="staff" />
                Staff
              </motion.button>
            </div>

            <div className="card-body">
              <div className="form-group">
                <input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => usernameupdate(e.target.value)}
                  className="username"
                  type="text"
                />
              </div>
              <div className="form-group">
                <input
                  placeholder="Password"
                  value={password}
                  onChange={(e) => passwordupdate(e.target.value)}
                  className="password"
                  type="password"
                />
              </div>
            </div>

            <div className="card_footer">
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                type="submit"
                className="signin_button"
                onClick={handleSignIn}
              >
                Sign in
              </motion.button>
              <h5 className="forget_pw">Forget password</h5>
            </div>
          </form>
        </div>
      </motion.div>
      <Footer />
    </>
  );
};

export default LoginPage;
