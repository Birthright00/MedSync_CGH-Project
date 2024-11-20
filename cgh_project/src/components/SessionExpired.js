import React from "react";
import { useNavigate } from "react-router-dom";

const SessionExpired = () => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate("/"); // Redirect to login page
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>An unexpected error occurred</h1>
      <p>Please refresh the page or re-login.</p>
      <button onClick={handleLoginRedirect} style={{ marginTop: "1rem" }}>
        Go to Login
      </button>
    </div>
  );
};

export default SessionExpired;
