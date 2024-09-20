import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../images/cgh_logo.png";
import management from "../images/management.png";
import staff from "../images/staff.png";
import Footer from "../components/footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/loginpage.css";
import show_pw from "../images/show_pw.png";
import hide_pw from "../images/hide_pw.png";

const LoginPage = () => {
  const nav = useNavigate();
  const [username, usernameupdate] = useState("");
  const [password, passwordupdate] = useState("");
  const [selectedRole, setSelectedRole] = useState(null); // State to track selected role
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleSignUp = () => {
    nav("/signup-page");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.warn(
        "Please select a role (Management or Staff) before logging in."
      );
      return;
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
          selectedRole: selectedRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successful login
        toast.success("Login successful!");
        setTimeout(() => {
          nav(data.role === "management" ? "/management-home" : "/staff-home");
        }, 1000); // Small delay for toast visibility
      } else {
        // Display error toast if login fails
        toast.error(
          data.error || "Login failed, please check your credentials."
        );
      }
    } catch (err) {
      console.error("Error logging in:", err);
      toast.error("Login failed, please try again.");
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
                <input
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => passwordupdate(e.target.value)}
                  className="password"
                  type={showPassword ? "text" : "password"} // Conditionally toggle between text and password type
                />
              </div>
              <div className="toggle-password">
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
