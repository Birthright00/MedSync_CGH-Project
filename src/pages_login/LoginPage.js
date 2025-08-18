/**
 * LoginPage Component
 * 
 * Main authentication page for the CGH Project system.
 * Supports multi-role login for:
 * - Management (EDO) - uses ADID (lowercase letters only)
 * - Staff (Doctors/Nurses) - uses MCR/SNB numbers (M/N + 5 digits + 1 letter)
 * - Students - uses email addresses (validated email format)
 * - HR - uses ADID format (same as management)
 * 
 * Features:
 * - Role-based input validation
 * - JWT token authentication
 * - Responsive design with framer-motion animations
 * - Toast notifications for user feedback
 * - Password visibility toggle
 * - Automatic redirection based on user role
 */

// Dependencies Imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // For smooth animations
import { ToastContainer, toast } from "react-toastify"; // For user notifications
import API_BASE_URL from '../apiConfig'; // Backend API configuration

// Components Imports
import Footer from "../components/footer";

// CSS Imports
import "react-toastify/dist/ReactToastify.css"; // Toast notification styles
import "../styles/loginpage.css"; // Custom login page styles

// Images Imports - Role-specific icons and UI elements
import logo from "../images/cgh_logo.png";
import staff from "../images/staff.png";
import management from "../images/management.png";
import show_pw from "../images/show_pw.png"; // Show password icon
import hide_pw from "../images/hide_pw.png"; // Hide password icon
import white_management from "../images/management_white.png"; // Selected state icon
import white_staff from "../images/staff_white.png"; // Selected state icon
import hr from "../images/hr.png";
import hr_white from "../images/hr_white.png"; // Selected state icon
import student from "../images/student.png";
import white_student from "../images/student_white.png"; // Selected state icon


const LoginPage = () => {
  // Navigation hook for redirecting users after successful login
  const nav = useNavigate();
  
  // State Management for Form Data
  const [username, usernameupdate] = useState(""); // Stores username/email input
  const [password, passwordupdate] = useState(""); // Stores password input
  const [selectedRole, setSelectedRole] = useState(null); // Tracks which role button is selected
  
  // Helper function to check if a specific role is currently selected
  const isRoleSelected = (role) => selectedRole === role;

  // UI State Management
  const [showPassword, setShowPassword] = useState(false); // Controls password visibility toggle
  const [isMgmtHovered, setIsMgmtHovered] = useState(false); // Management button hover state
  const [isStaffHovered, setIsStaffHovered] = useState(false); // Staff button hover state

  /**
   * Username Validation Function
   * 
   * Validates user input based on the selected role using regex patterns.
   * Each role has specific format requirements for security and data integrity.
   * 
   * Regex Pattern Explanation:
   * - ^ = start of string
   * - $ = end of string
   * - \d = any digit (0-9)
   * - {5} = exactly 5 occurrences
   * - [A-Za-z] = any single alphabetic letter
   * - [Mm] = either M or m
   * - + = one or more occurrences
   * 
   * @param {string} username - The input to validate
   * @param {string} role - The selected user role
   * @returns {boolean} - True if username matches role requirements
   */
  const validateUsername = (username, role) => {
    // Management/HR ADID Pattern: Only lowercase alphabets (e.g., "johndoe")
    // Ensures consistent formatting and prevents injection attacks
    const adidPattern = /^[a-z]+$/;

    // Staff MCR/SNB Pattern: Professional registration numbers
    // MCR (Medical Council Registration): M + 5 digits + 1 letter (e.g., "M12345A")
    // SNB (Singapore Nursing Board): N + 5 digits + 1 letter (e.g., "N54321B")
    const mcrOrSnbPattern = /^[Mm]\d{5}[A-Za-z]$|^[Nn]\d{5}[A-Za-z]$/;

    // Student Email Pattern: Standard email validation
    // Allows students to log in using their institutional email addresses
    const studentPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Role-based validation logic
    switch (role) {
      case "management":
        return adidPattern.test(username); // Validate ADID format
      case "staff":
        return mcrOrSnbPattern.test(username); // Validate professional registration numbers
      case "student":
        return studentPattern.test(username); // Validate email format
      case "hr":
        return adidPattern.test(username); // HR uses same format as management
      default:
        return false; // Invalid if no role selected or unrecognized role
    }
  };

  /**
   * Development Helper Function
   * 
   * Navigates to the signup page for creating new user accounts.
   * This is primarily used during development and testing phases.
   */
  const handleSignUp = () => {
    nav("/signup-page");
  };

  /**
   * Main Authentication Handler
   * 
   * Processes user login requests with comprehensive validation and error handling.
   * Supports role-based authentication and automatic redirection based on user type.
   * 
   * Authentication Flow:
   * 1. Validate role selection and input format
   * 2. Normalize username (lowercase for student emails)
   * 3. Send credentials to backend API
   * 4. Store authentication tokens and user data
   * 5. Redirect to appropriate dashboard based on role
   * 
   * Special Handling for Students:
   * - Students authenticate with email addresses
   * - Backend returns matric number as user_id for session lookups
   * - This maintains compatibility with existing database structure
   * 
   * @param {Event} e - Form submission event
   */
  const handleSignIn = async (e) => {
    e.preventDefault(); // Prevent default form submission and page reload

    // Role Selection Validation
    if (!selectedRole) {
      toast.warn("Please select a role (Management, Staff, Student or HR)");
      return;
    }

    // Username Normalization
    // Students use emails (convert to lowercase for consistency)
    // Other roles maintain original case sensitivity
    const normalizedUsername = selectedRole === 'student' ? username.toLowerCase() : username;

    // Backend Authentication Request
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: normalizedUsername, // Contains email for students, ID for others
          password: password,
          selectedRole: selectedRole,
        }),
      });

      const data = await response.json();

      // Successful Authentication Handling
      if (response.ok) {
        // Store authentication data in browser's local storage
        localStorage.setItem("token", data.token); // JWT token for API requests
        localStorage.setItem("adid", data.user_id); // Legacy compatibility
        localStorage.setItem("user_id", data.user_id); // Primary user identifier
        console.log("ID Saved:", data.user_id);

        // User feedback notification
        toast.success("Login successful! Welcome Back!");
        
        // Delayed navigation to allow toast visibility
        setTimeout(() => {
          // Extract user ID from JWT token for staff routing
          const decodedToken = JSON.parse(atob(data.token.split(".")[1]));
          const mcr_number = decodedToken.id;

          // Role-based Navigation Logic
          if (selectedRole === "management" || selectedRole === "hr") {
            nav("/home"); // Management dashboard
          } else if (selectedRole === "staff") {
            nav(`/staff/${mcr_number}`); // Staff-specific page with professional ID
          } else if (selectedRole === "student") {
            nav("/student-home"); // Student portal
          }

        }, 1000); // 1 second delay for better UX
      } else {
        // Error Handling with Specific HTTP Status Codes
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
      // Network/Connection Error Handling
      console.error("Error logging in:", err);
      toast.error("Unable to connect to the server. Please try again later.");
    }
  };

  /**
   * Password Visibility Toggle
   * 
   * Allows users to show/hide password text for better usability
   * while maintaining security best practices.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // JSX Component Render
  return (
    <>
      {/* Toast Notification Container - Displays user feedback messages */}
      <ToastContainer />

      {/* Main Login Page Container with Fade-in Animation */}
      <motion.div
        className="login-page"
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Login Form Container with Scale-in Animation */}
        <motion.div
          className="login-div"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Main Login Form */}
          <form className="login-form" onSubmit={handleSignIn}>
            {/* Hospital/Organization Logo */}
            <img src={logo} alt="CGH Logo" />
            
            {/* Role Selection Button Container */}
            <motion.div
              className="login-card"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Management/EDO Role Button */}
              <motion.button
                whileHover={{ scale: 1.1 }} // Hover animation
                whileTap={{ scale: 0.9 }} // Click animation
                className={`login-button ${selectedRole === "management" ? "selected" : ""}`}
                type="button"
                onClick={() => setSelectedRole("management")}
              >
                <img
                  src={
                    isMgmtHovered || isRoleSelected("management")
                      ? white_management // Selected/hover state icon
                      : management // Default state icon
                  }
                  alt="Management Role"
                />
                EDO {/* Executive Development Office */}
              </motion.button>

              {/* Staff (Doctor/Nurse) Role Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${selectedRole === "staff" ? "selected" : ""}`}
                type="button"
                onClick={() => setSelectedRole("staff")}
              >
                <img
                  src={
                    isStaffHovered || isRoleSelected("staff")
                      ? white_staff // Selected/hover state icon
                      : staff // Default state icon
                  }
                  alt="Medical Staff Role"
                />
                Doctor/Nurse
              </motion.button>

              {/* Student Role Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${selectedRole === "student" ? "selected" : ""}`}
                type="button"
                onClick={() => setSelectedRole("student")}
              >
                <img
                  src={isRoleSelected("student") ? white_student : student}
                  alt="Student Role"
                />
                Student
              </motion.button>

              {/* Human Resources Role Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`login-button ${selectedRole === "hr" ? "selected" : ""}`}
                type="button"
                onClick={() => setSelectedRole("hr")}
              >
                <img
                  src={isStaffHovered || isRoleSelected("hr") ? hr_white : hr}
                  alt="Human Resources Role"
                />
                Human Resource
              </motion.button>
            </motion.div>

            {/* Login Form Input Section */}
            <div className="card-body">
              {/* Username/Email Input Field */}
              <div className="form-group">
                <input
                  placeholder={
                    selectedRole === "staff" ? "MCR / SNB" :
                      selectedRole === "student" ? "Email" :
                        "ADID"
                  } // Dynamic placeholder based on selected role
                  value={username}
                  onChange={(e) => usernameupdate(e.target.value)}
                  className="username"
                  type="text"
                />
              </div>

              {/* Password Input Field with Visibility Toggle */}
              <div className="form-group">
                <input
                  placeholder="Password"
                  value={password}
                  onChange={(e) => passwordupdate(e.target.value)}
                  className="password"
                  type={showPassword ? "text" : "password"} // Toggle between text and password input types
                />
                {/* Password Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="toggle-password-btn"
                >
                  <img
                    className="toggle-password-img"
                    src={showPassword ? show_pw : hide_pw} // Eye icon changes based on visibility state
                    alt={showPassword ? "Hide Password" : "Show Password"}
                  />
                </button>
              </div>
            </div>

            {/* Login Submit Button */}
            <motion.button
              whileHover={{ scale: 1.1 }} // Hover animation
              whileTap={{ scale: 0.9 }} // Click animation
              type="submit"
              className="signin_button"
            >
              Login
            </motion.button>

            {/* Footer Links */}
            <div className="card_footer">
              <h5 className="forget_pw">Forget password</h5> {/* Future implementation */}
              <h5 className="forget_pw" onClick={handleSignUp}>
                Sign Up (For Dev Only) {/* Development helper link */}
              </h5>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
};

export default LoginPage;
