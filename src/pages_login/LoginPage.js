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
import "../styles/loginpage.css";

// Images Imports
import logo from "../images/cgh_logo.png";
import staff from "../images/staff.png";
import management from "../images/management.png";
import show_pw from "../images/show_pw.png";
import hide_pw from "../images/hide_pw.png";
import white_management from "../images/management_white.png";
import white_staff from "../images/staff_white.png";
import hr from "../images/hr.png";
import hr_white from "../images/hr_white.png";
import student from "../images/student.png";
import white_student from "../images/student_white.png";


const LoginPage = () => {
  const nav = useNavigate(); // For navigation after successful login
  const [username, usernameupdate] = useState(""); // State for username input
  const [password, passwordupdate] = useState(""); // State for password input
  const [selectedRole, setSelectedRole] = useState(null); // State for role selection
  const isRoleSelected = (role) => selectedRole === role;

  const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility
  const [isMgmtHovered, setIsMgmtHovered] = useState(false); // Hover state for management button
  const [isStaffHovered, setIsStaffHovered] = useState(false); // Hover state for staff button

  // Quick Regex Revision

  // ^ = start of string
  // [Mm] = [ ] allows the choice of M or m
  // Together they mean first character must be either M or m

  // \d = any digit
  // {5} = exactly 5 digits

  // [A-Za-z] = any single alphabetic letter, regardless of case

  // $ = end of string

  // Function to validate usernames based on the selected role
  const validateUsername = (username, role) => {
    // For Management (ADID): Only lowercase alphabets, no spaces, numbers, or uppercase letters
    const adidPattern = /^[a-z]+$/;

    // For Staff (MCR or SNB):
    // MCR number: M or m followed by 5 digits and 1 letter
    // SNB number: N or n followed by 5 digits and 1 letter
    const mcrOrSnbPattern = /^[Mm]\d{5}[A-Za-z]$|^[Nn]\d{5}[A-Za-z]$/;

    // For Student: Follows its own pattern such that, it i A-Z, a-z, 0-9, and no spaces
    const studentPattern = /^[A-Z]\d{7}[A-Z]$/; // e.g. A0284226A
    // Note: Adjust the studentPattern based on your actual requirements


    // Check the pattern based on the selected role
    if (role === "management") {
      return adidPattern.test(username); // Validate ADID for management
    } else if (role === "staff") {
      return mcrOrSnbPattern.test(username); // Validate MCR or SNB for staff
    } else if (role === "student") {
      return studentPattern.test(username); // Validate student username
    }
    if (role === "hr") return adidPattern.test(username); // Assuming HR follows management pattern

    return false; // Invalid if no role is selected or pattern doesn't match
  };

  //-----------------------------------------------------------------/ 
  // For Dev only //
  const handleSignUp = () => {
    nav("/signup-page");
  };
  //-----------------------------------------------------------------/

  // Sign in & Authentication handler function
  // This helps to filter out Management (Admin) Vs Doctors and Nurses
  // This function makes sure when management is clicked, only adid can be typed
  // when staff is clicked, only mcr or snb number can be typed
  // For adid, their role MUST BE management
  // for mcr and snb number, their roles MUST BE STAFF

  const handleSignIn = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // Making sure users select a role
    if (!selectedRole) {
      toast.warn("Please select a role (Management, Staff, Student or HR)");
      return;
    }

    const normalizedUsername = selectedRole === 'student' ? username.toUpperCase() : username;

    // API Call to Backend for Login
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: normalizedUsername, // Use normalized username for student
          password: password,
          selectedRole: selectedRole,
        }),
      });

      const data = await response.json();

      // Handling Responses
      if (response.ok) {
        // Store the token in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("adid", data.user_id);
        localStorage.setItem("user_id", data.user_id);  // For student timetable
        console.log("ID Saved:", data.user_id);

        // Successful login
        toast.success("Login successful! Welcome Back!");
        setTimeout(() => {
          // Decode the token to get the mcr_number for staff
          const decodedToken = JSON.parse(atob(data.token.split(".")[1])); // Decode JWT payload
          const mcr_number = decodedToken.id; // Extract mcr_number from token payload

          // Redirect logic:
          if (selectedRole === "management" || selectedRole === "hr") {
            nav("/home"); // For management or HR
          } else if (selectedRole === "staff") {
            nav(`/staff/${mcr_number}`); // For staff (doctor/nurse), goes to their specific page
          } else if (selectedRole === "student") {
            nav("/student-home"); // For students
          }

        }, 1000); // Small delay for toast visibility
      } else {
        // Handle specific status codes and show custom toast messages
        switch (response.status) {
          case 403:
            toast.error("Access Denied: Please double check your role.");
            break;
          case 401:
            toast.error("Login failed: Incorrect password.");
            break;
          case 404:
            toast.error("Login failed: User not found.");
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
        <motion.div
          className="login-div"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <form className="login-form" onSubmit={handleSignIn}>
            <img src={logo} alt="logo" />
            <motion.div
              className="login-card"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${selectedRole === "management" ? "selected" : ""
                  }`}
                type="button"
                onClick={() => setSelectedRole("management")}
              >
                <img
                  src={
                    isMgmtHovered || isRoleSelected("management")
                      ? white_management
                      : management
                  }
                  alt="management"
                />
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
                <img
                  src={
                    isStaffHovered || isRoleSelected("staff")
                      ? white_staff
                      : staff
                  }
                  alt="staff"
                />
                Doctor/Nurse
              </motion.button>{" "}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${selectedRole === "student" ? "selected" : ""}`}
                type="button"
                onClick={() => setSelectedRole("student")}
              >
                <img
                  src={isRoleSelected("student") ? white_student : student}
                  alt="student"
                />
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
                <img
                  src={isStaffHovered || isRoleSelected("hr") ? hr_white : hr}
                  alt="hr"
                />
                Human Resource
              </motion.button>
            </motion.div>

            <div className="card-body">
              <div className="form-group">
                <input
                  placeholder={
                    selectedRole === "staff" ? "MCR / SNB" :
                      selectedRole === "student" ? "Matric No" :
                        "ADID"
                  }
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
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="submit"
              className="signin_button"
            >
              Login
            </motion.button>
            <div className="card_footer">
              <h5 className="forget_pw">Forget password</h5>
              <h5 className="forget_pw" onClick={handleSignUp}>
                Sign Up (For Dev Only)
              </h5>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
};

export default LoginPage;
