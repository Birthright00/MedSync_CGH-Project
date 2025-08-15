// Dependencies Imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import API_BASE_URL from '../apiConfig';

// Components Imports
import Footer from "../components/footer";

// CSS Imports
import "react-toastify/dist/ReactToastify.css";
import "../styles/signuppage.css";

// Images Imports
import logo from "../images/cgh_logo.png";
import staff from "../images/staff.png";
import management from "../images/management.png";
import show_pw from "../images/show_pw.png";
import hide_pw from "../images/hide_pw.png";
import hr from "../images/hr.png";
import hr_white from "../images/hr_white.png";
import student from "../images/student.png";
import white_student from "../images/student_white.png";

const SignUpPage = () => {
  const nav = useNavigate();
  const [username, usernameupdate] = useState("");
  const [password, passwordupdate] = useState("");
  const [cfrmpassword, cfrmpasswordupdate] = useState("");
  const [selectedRole, setSelectedRole] = useState(null); // State to track selected role
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  // console.log("Selected role:", selectedRole);
  const validateUsername = (username, role) => {
    // Management (ADID): lowercase alphabets only (no spaces, numbers, or uppercase letters)
    const adidPattern = /^[a-z]+$/;

    // Staff (MCR or SNB):
    // MCR: M or m + 5 digits + 1 letter (e.g. M12345A)
    // SNB: N or n + 5 digits + 1 letter (e.g. N54321B)
    const mcrOrSnbPattern = /^[Mm]\d{5}[A-Za-z]$|^[Nn]\d{5}[A-Za-z]$/;

    // Student: A followed by 7 digits and ending with a capital letter (e.g. A0284226A)
    const studentPattern = /^[A-Z]\d{7}[A-Z]$/;

    // HR: follow same rule as management (only lowercase alphabets)
    const hrPattern = /^[a-z]+$/;

    if (role === "management") return adidPattern.test(username);
    if (role === "staff") return mcrOrSnbPattern.test(username);
    if (role === "student") return studentPattern.test(username);
    if (role === "hr") return hrPattern.test(username);

    return false;
  };

  const validatePassword = (password) => {
    const pwPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return pwPattern.test(password);
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
    // ----------------------------------------------------------------------------------------//
    // Comment out this part for easier account creation
    // ⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️
    // ----------------------------------------------------------------------------------------//

    // if (!validateMCRNumber(username)) {
    //   toast.error(
    //     <div>
    //       <p>Invalid MCR Number. It must meet the following criteria:</p>
    //       <ul>
    //         <li>Start with 'M' or 'm'</li>
    //         <li>Followed by 5 digits (0-9)</li>
    //         <li>End with a letter (A-Z, a-z)</li>
    //         <li>Total of 7 characters</li>
    //       </ul>
    //     </div>
    //   );
    //   return;
    // }

    // if (!validatePassword(password)) {
    //   toast.error(
    //     <div>
    //       <p>Password must meet the following requirements:</p>
    //       <ul>
    //         <li>Minimum 8 characters</li>
    //         <li>At least one lowercase letter</li>
    //         <li>At least one uppercase letter</li>
    //         <li>At least one digit (0-9)</li>
    //         <li>At least one special character</li>
    //       </ul>
    //     </div>
    //   );
    //   return;
    // }

    // ----------------------------------------------------------------------------------------//
    // ⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️⬆️
    // Comment out this part for easier account creation
    // ----------------------------------------------------------------------------------------//

    // ----------------------------------------------------------------------------------------//
    // Comment out this part for easier account creation
    // ⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️⬇️
    // ----------------------------------------------------------------------------------------//
    if (!validateUsername(username, selectedRole)) {
      let message = "Invalid username format.";

      if (selectedRole === "management")
        message = "ADID must contain only lowercase letters with no spaces.";
      else if (selectedRole === "staff")
        message = "Staff ID must be M/N followed by 5 digits and a letter (e.g. M12345A).";
      else if (selectedRole === "student")
        message = "Matric No must be in the format A followed by 7 digits and 1 uppercase letter (e.g. A0284226A).";
      else if (selectedRole === "hr")
        message = "HR ID must contain only lowercase letters.";

      toast.error(message);
      return;
    }


    if (password !== cfrmpassword) {
      toast.warn("Passwords do not match");
      return;
    }

    // API Call to Backend for Signup
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: username,
          password: password,
          role: selectedRole,
        }),
      });
      const data = await response.json();
      // console.log(data);
      if (response.ok) {
        toast.success("Signup Successful");
        setTimeout(() => {
          nav("/");
        }, 1000); // Small delay for toast visibility
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
                className={`login-button ${selectedRole === "management" ? "selected" : ""
                  }`}
                type="button"
                onClick={() => setSelectedRole("management")}
              >
                <img src={management} alt="management" />
                EDO
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${selectedRole === "staff" ? "selected" : ""
                  }`}
                type="button"
                onClick={() => setSelectedRole("staff")}
              >
                <img src={staff} alt="staff" />
                Staff
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${selectedRole === "student" ? "selected" : ""
                  }`}
                type="button"
                onClick={() => setSelectedRole("student")}
              >
                <img src={student} alt="student" />
                Student
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${selectedRole === "hr" ? "selected" : ""
                  }`}
                type="button"
                onClick={() => setSelectedRole("hr")}
              >
                <img src={hr} alt="hr" />
                Human Resource
              </motion.button>
            </div>

            <div className="card-body">
              <div className="form-group">
                <input
                  placeholder={
                    selectedRole === "student"
                      ? "Enter Matric No (e.g. A*******A)"
                      : selectedRole === "management" || selectedRole === "staff"
                        ? "Enter MCR / ADID (e.g. M*****A)"
                        : "Enter HR ID"
                  }
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
