import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';


const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" />;  // redirect to login if not logged in
  }

  try {
    const decoded = jwtDecode(token);
    const userRole = decoded.role;

    if (allowedRoles.includes(userRole)) {
      return children;
    } else {
      return <div>Access Denied</div>;
    }
  } catch (err) {
    console.error("Failed to decode token:", err);
    return <div>Access Denied</div>;
  }
};

export default ProtectedRoute;
