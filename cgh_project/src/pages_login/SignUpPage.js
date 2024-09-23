// Dependencies Imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";

// Components Imports
import Footer from "../components/footer";

// CSS Imports
import "react-toastify/dist/ReactToastify.css";
import "../styles/loginpage.css";

// Images Imports
import logo from "../images/cgh_logo.png";
import staff from "../images/staff.png";
import management from "../images/management.png";
import show_pw from "../images/show_pw.png";
import hide_pw from "../images/hide_pw.png";

const SignUpPage = () => {
  const nav = useNavigate();
  const [username, usernameupdate] = useState("");
  const [password, passwordupdate] = useState("");
  const [cfrmpassword, cfrmpasswordupdate] = useState("");
  const [selectedRole, setSelectedRole] = useState(null); // State to track selected role
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  // console.log("Selected role:", selectedRole);
  const validateMCRNumber = (mcrNumber) => {
    const mcrPattern = /^[Mm]\d{5}[A-Za-z]$/;
    return mcrPattern.test(mcrNumber); // Returns true if it matches, false otherwise
  };

  const handleBack = () => {
    nav("/");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword); // Toggle password visibility
  };

  const handleSignUp = async (e) => {
    e.preventDefault(); // e.preventDefault() is called to prevent the default form submission behavior, which would reload the page.

    // Makes sure a role is selected
    if (!selectedRole) {
      toast.warn("Please select a role (Management or Staff)");
      return;
    }

    // Makes sure all fields are filled
    if (!username || !password || !cfrmpassword) {
      toast.warn("Please enter all the fields");
      return;
    }
    if (!validateMCRNumber(username)) {
      toast.error(
        "Invalid MCR Number. It must start with 'M', followed by 5 digits, and end with a letter."
      );
      return;
    }

    if (password !== cfrmpassword) {
      toast.warn("Passwords do not match");
      return;
    }

    // API Call to Backend for Signup
    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mcr_number: username,
          password: password,
          role: selectedRole,
        }),
      });
      const data = await response.json();
      // console.log(data);
      if (response.ok) {
        toast.success("Signup Successful");
        nav("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      // console.log(error);
      toast.error("Signup Failed");
    }
  };

  return (
    <>
      <ToastContainer />

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
                  placeholder="Enter MCR Number"
                  value={username}
                  onChange={(e) => usernameupdate(e.target.value)}
                  className="username"
                  type="text"
                />
              </div>
              <div className="form-group">
                <div className="password-container">
                  <input
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => passwordupdate(e.target.value)}
                    className="password"
                    type={showPassword ? "text" : "password"} // Conditionally toggle between text and password type
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="toggle-password-btn"
                  >
                    <img
                      className="toggle-password-img"
                      src={showPassword ? show_pw : hide_pw} // Toggle between the show and hide images
                      alt={showPassword ? "Hide Password" : "Show Password"}
                    />
                  </button>
                </div>
              </div>
              <div className="form-group">
                <div className="password-container">
                  <input
                    placeholder="Confirm Password"
                    value={cfrmpassword}
                    onChange={(e) => cfrmpasswordupdate(e.target.value)}
                    className="password"
                    type={showPassword ? "text" : "password"} // Conditionally toggle between text and password type
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="toggle-password-btn"
                  >
                    <img
                      className="toggle-password-img"
                      src={showPassword ? show_pw : hide_pw} // Toggle between the show and hide images
                      alt={showPassword ? "Hide Password" : "Show Password"}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="card_footer">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="submit"
                className="signin_button"
                onClick={handleSignUp}
              >
                Sign Up
              </motion.button>
            </div>
            <div className="card_footer">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="submit"
                className="signin_button"
                onClick={handleBack}
              >
                Back to login
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default SignUpPage;
