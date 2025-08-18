/**
 * SignUpPage Component
 * 
 * User registration page for the CGH Project system.
 * Primarily used for development and testing purposes to create new user accounts.
 * 
 * Supported Roles:
 * - Management (EDO) - uses ADID (lowercase letters only)
 * - Staff (Doctors/Nurses) - uses MCR/SNB numbers (M/N + 5 digits + 1 letter)
 * - Students - uses email addresses (validated email format)
 * - HR - uses ADID format (same as management)
 * 
 * Features:
 * - Multi-role user registration
 * - Role-based input validation with real-time feedback
 * - Password confirmation matching
 * - Responsive design with framer-motion animations
 * - Toast notifications for user feedback
 * - Password visibility toggle for both password fields
 * - Form validation with detailed error messages
 * 
 * Security Features:
 * - Input sanitization and validation
 * - Role-based format enforcement
 * - Password strength requirements (currently disabled for development)
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
import "../styles/signuppage.css"; // Custom signup page styles

// Images Imports - Role-specific icons and UI elements
import logo from "../images/cgh_logo.png";
import staff from "../images/staff.png";
import management from "../images/management.png";
import show_pw from "../images/show_pw.png"; // Show password icon
import hide_pw from "../images/hide_pw.png"; // Hide password icon
import hr from "../images/hr.png";
import hr_white from "../images/hr_white.png"; // Selected state icon
import student from "../images/student.png";
import white_student from "../images/student_white.png"; // Selected state icon

const SignUpPage = () => {
  // Navigation hook for redirecting users after registration
  const nav = useNavigate();
  
  // State Management for Form Data
  const [username, usernameupdate] = useState(""); // Stores username/email input
  const [password, passwordupdate] = useState(""); // Stores password input
  const [cfrmpassword, cfrmpasswordupdate] = useState(""); // Stores password confirmation
  const [selectedRole, setSelectedRole] = useState(null); // Tracks which role is selected
  const [showPassword, setShowPassword] = useState(false); // Controls password visibility for both fields

  /**
   * Username Validation Function
   * 
   * Validates user input based on the selected role using regex patterns.
   * Identical to LoginPage validation to ensure consistency across the application.
   * 
   * @param {string} username - The input to validate
   * @param {string} role - The selected user role
   * @returns {boolean} - True if username matches role requirements
   */
  const validateUsername = (username, role) => {
    // Management/HR ADID Pattern: Only lowercase alphabets (e.g., "johndoe")
    const adidPattern = /^[a-z]+$/;

    // Staff Professional Registration Numbers:
    // MCR (Medical Council Registration): M + 5 digits + 1 letter (e.g., "M12345A")
    // SNB (Singapore Nursing Board): N + 5 digits + 1 letter (e.g., "N54321B")
    const mcrOrSnbPattern = /^[Mm]\d{5}[A-Za-z]$|^[Nn]\d{5}[A-Za-z]$/;

    // Student Email Pattern: Standard email validation
    const studentPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // HR Pattern: Same as management (lowercase alphabets only)
    const hrPattern = /^[a-z]+$/;

    // Role-based validation
    switch (role) {
      case "management":
        return adidPattern.test(username);
      case "staff":
        return mcrOrSnbPattern.test(username);
      case "student":
        return studentPattern.test(username);
      case "hr":
        return hrPattern.test(username);
      default:
        return false;
    }
  };

  /**
   * Password Strength Validation Function
   * 
   * Validates password strength using comprehensive regex patterns.
   * Currently disabled in the signup flow for development convenience,
   * but can be re-enabled for production use.
   * 
   * Requirements:
   * - Minimum 8 characters
   * - At least one lowercase letter
   * - At least one uppercase letter
   * - At least one digit
   * - At least one special character (@$!%*?&)
   * 
   * @param {string} password - The password to validate
   * @returns {boolean} - True if password meets all requirements
   */
  const validatePassword = (password) => {
    const pwPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return pwPattern.test(password);
  };

  /**
   * Navigation Helper Function
   * 
   * Returns user to the login page when back button is clicked.
   */
  const handleBack = () => {
    nav("/");
  };

  /**
   * Password Visibility Toggle Function
   * 
   * Controls the visibility of both password fields simultaneously
   * for consistent user experience.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * User Registration Handler
   * 
   * Processes new user account creation with comprehensive validation.
   * Includes role-based validation, password confirmation, and API integration.
   * 
   * Registration Flow:
   * 1. Validate role selection and required fields
   * 2. Validate username format based on selected role
   * 3. Confirm password match
   * 4. Normalize username for consistency
   * 5. Submit registration data to backend API
   * 6. Handle response and redirect on success
   * 
   * Special Student Handling:
   * - Students register with email addresses
   * - Email is normalized to lowercase for consistency
   * - Email is stored in both user_id and email fields in database
   * 
   * @param {Event} e - Form submission event
   */
  const handleSignUp = async (e) => {
    e.preventDefault(); // Prevent default form submission and page reload

    // Role Selection Validation
    if (!selectedRole) {
      toast.warn("Please select a role (Management, Staff, Student, or HR)");
      return;
    }

    // Required Fields Validation
    if (!username || !password || !cfrmpassword) {
      toast.warn("Please enter all the fields");
      return;
    }

    /* 
     * DISABLED VALIDATION SECTION (For Development Convenience)
     * 
     * The following validation blocks are commented out to allow easier account creation
     * during development and testing phases. In production, consider re-enabling these
     * validations for enhanced security.
     * 
     * Disabled Validations:
     * - MCR Number format validation (legacy)
     * - Password strength requirements
     */

    // Username Format Validation (ACTIVE)
    // This validation remains active to ensure data integrity
    if (!validateUsername(username, selectedRole)) {
      let message = "Invalid username format.";

      // Role-specific error messages for better user guidance
      switch (selectedRole) {
        case "management":
          message = "ADID must contain only lowercase letters with no spaces.";
          break;
        case "staff":
          message = "Staff ID must be M/N followed by 5 digits and a letter (e.g. M12345A).";
          break;
        case "student":
          message = "Please enter a valid email address (e.g. student@example.com).";
          break;
        case "hr":
          message = "HR ID must contain only lowercase letters.";
          break;
      }

      toast.error(message);
      return;
    }

    // Password Confirmation Validation
    if (password !== cfrmpassword) {
      toast.warn("Passwords do not match");
      return;
    }

    // Backend Registration Request
    try {
      // Username normalization for consistency
      const normalizedUsername = selectedRole === 'student' ? username.toLowerCase() : username;
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: normalizedUsername, // Primary identifier
          email: selectedRole === 'student' ? normalizedUsername : '', // Email field for students
          password: password,
          role: selectedRole,
        }),
      });
      
      const data = await response.json();

      // Registration Success Handling
      if (response.ok) {
        toast.success("Signup Successful");
        // Redirect to login page after brief delay
        setTimeout(() => {
          nav("/");
        }, 1000);
      } else {
        // Registration Error Handling
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      // Network/Connection Error Handling
      console.error("Registration error:", error);
      toast.error("Signup Failed - Unable to connect to server");
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
                      ? "Enter Email (e.g. student@example.com)"
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
