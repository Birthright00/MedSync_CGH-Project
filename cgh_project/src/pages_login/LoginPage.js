import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../images/cgh_logo.png";
import management from "../images/management.png";
import staff from "../images/staff.png";
import Footer from "../components/footer";
import "../styles/loginpage.css";

// Testing Accounts
// {
//   "mcr_number": "M12345A",
//   "email": "user1@example.com",
//   "password": "management",
//   "role": "management"
// }

// {
//   "mcr_number": "M67890B",
//   "email": "user2@example.com",
//   "password": "staff",
//   "role": "staff"
// }

const LoginPage = () => {
  const nav = useNavigate();
  const [username, usernameupdate] = useState("");
  const [password, passwordupdate] = useState("");
  const [selectedRole, setSelectedRole] = useState(null); // State to track selected role

  const handleSignUp = () => {
    nav("/signup-page");
  };

  const handleSignIn = async (e) => {
    // Prevent page refresh on form submit
    e.preventDefault();

    // Validate if a role is selected
    if (!selectedRole) {
      alert("Please select a role (Management or Staff) before logging in.");
      return; // Stop the function if no role is selected
    }

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mcr_number: username,
          password: password,
          selectedRole: selectedRole, // Send selected role to the backend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login ok!");
        console.log("Selected role:", selectedRole); // Log selected role

        // Use the role from the backend response for navigation
        if (data.role === "management") {
          nav("/management-home");
        } else if (data.role === "staff") {
          nav("/staff-home");
        } else {
          alert("Invalid role received");
        }
      } else {
        alert(data.error); // Show error if login failed
      }
    } catch (err) {
      console.error("Error logging in:", err);
      alert("Login failed, please try again.");
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
          {/* Attach onSubmit to form and prevent default submission */}
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
                <input
                  placeholder="Enter Password"
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
