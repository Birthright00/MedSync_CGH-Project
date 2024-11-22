import "./App.css";
import ScrollToTop from "./components/ScrollToTop";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages_login/LoginPage";
import ManagementHomePage from "./pages_management/ManagementHomePage";
import StaffHomePage from "./pages_staff/StaffHomePage";
import SignUpPage from "./pages_login/SignUpPage";
import StaffDetailPage from "./components/StaffDetailPage";
import Entry from "./components/Entry";
import HomePage from "./pages_login/HomePage";
import AboutUs from "./components/AboutUs";
function App() {
  return (
    <div className="App">
      <ScrollToTop />
      <Routes>
        <Route exact path="/" element={<LoginPage />} />
        <Route exact path="/management-home" element={<ManagementHomePage />} />
        <Route exact path="/staff-home" element={<StaffHomePage />} />
        <Route exact path="/signup-page" element={<SignUpPage />} />
        <Route exact path="/staff/:mcr_number" element={<StaffDetailPage />} />
        <Route exact path="/entry" element={<Entry />} />
        <Route exact path="/home" element={<HomePage />} />
        <Route exact path="/about-us" element={<AboutUs />} />
      </Routes>
    </div>
  );
}

export default App;
