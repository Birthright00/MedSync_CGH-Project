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

const LoginPage = () => {
  const nav = useNavigate();
  const [username, usernameupdate] = useState("");
  const [password, passwordupdate] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Quick Regex Revision

  // ^ = start of string
  // [Mm] = [ ] allows the choice of M or m
  // Together they mean first character must be either M or m

  // \d = any digit
  // {5} = exactly 5 digits

  // [A-Za-z] = any single alphabetic letter, regardless of case

  // $ = end of string

  const validateMCRNumber = (mcrNumber) => {
    const mcrPattern = /^[Mm]\d{5}[A-Za-z]$/;
    return mcrPattern.test(mcrNumber); // Returns true if it matches, false otherwise
  };

  //-----------------------------------------------------------------/
  // TBC --> Not sure if we want to allow anyone to register //
  const handleSignUp = () => {
    nav("/signup-page");
  };
  //-----------------------------------------------------------------/

  // Sign in & Authentication handler function
  const handleSignIn = async (e) => {
    e.preventDefault(); // e.preventDefault() is called to prevent the default form submission behavior, which would reload the page.

    // Making sure users select a role
    if (!selectedRole) {
      toast.warn("Please select a role (Management or Staff)");
      return;
    }
    if (!validateMCRNumber(username)) {
      toast.error(
        <div>
          <p>Invalid MCR Number. It must meet the following criteria:</p>
          <ul>
            <li>Start with 'M' or 'm'</li>
            <li>Followed by 5 digits (0-9)</li>
            <li>End with a letter (A-Z, a-z)</li>
            <li>Total of 7 characters</li>
          </ul>
        </div>
      );
      return;
    }

    //-----------------------------------------------------------------/
    // API Call to Backend for Login
    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mcr_number: username,
          password: password,
          selectedRole: selectedRole,
        }),
      });
      //-----------------------------------------------------------------/

      // The response is the object returned from the backend after the login attempt.
      // The .json() method is used to convert the response body from JSON format to a JavaScript object.
      const data = await response.json();

      //-----------------------------------------------------------------/
      // Handling Responses
      if (response.ok) {
        // Store the token in localStorage
        localStorage.setItem("token", data.token); // Save the JWT token in localStorage
        // Successful login
        toast.success("Login successful! Welcome Back!");
        setTimeout(() => {
          nav(data.role === "management" ? "/management-home" : "/staff-home");
        }, 1000); // Small delay for toast visibility
      } else {
        // Handle specific status codes and show custom toast messages
        switch (response.status) {
          case 403:
            toast.error("Access Denied: Please double check your role.");
            break;
          case 401:
            toast.error("Login failed : Incorrect password.");
            break;
          case 404:
            toast.error("Login failed : User not found.");
            break;
          case 500:
            toast.error("Internal Server Error. Please try again later.");
            break;
          default:
            toast.error(
              data.error || "Login failed. Please check your credentials."
            );
        }
      }
    } catch (err) {
      console.error("Error logging in:", err);
      toast.error("Unable to connect to the server. Please try again later.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword); // Toggle password visibility
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
          <form className="login-form" onSubmit={handleSignIn}>
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

              {/* <div className="toggle-password">
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={{
                    marginTop: "10px",
                    cursor: "pointer",
                    border: "none",
                    background: "none",
                  }}
                >
                  <img
                    className="toggle-password-img"
                    src={showPassword ? hide_pw : show_pw} // Toggle between the show and hide images
                    alt={showPassword ? "Hide Password" : "Show Password"}
                  />
                </button>
              </div> */}
            </div>

            <div className="card_footer">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="submit"
                className="signin_button"
              >
                Login
              </motion.button>
              <h5 className="forget_pw">Forget password</h5>
              <h5 className="forget_pw" onClick={handleSignUp}>
                Sign Up
              </h5>
            </div>
          </form>
        </div>
      </motion.div>

      <Footer />
    </>
  );
};

export default LoginPage;
