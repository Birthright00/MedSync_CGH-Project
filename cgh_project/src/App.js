import "./App.css";
import ScrollToTop from "./components/ScrollToTop";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages_login/LoginPage";
import ManagementHomePage from "./pages_management/ManagementHomePage";
import StaffHomePage from "./pages_staff/StaffHomePage";
function App() {
  return (
    <Router>
      <div className="App">
        <ScrollToTop/>
        <Routes>
          <Route exact path="/" element={<LoginPage />} />
          <Route exact path="/management-home" element={<ManagementHomePage />} />
          <Route exact path="/staff-home" element={<StaffHomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
