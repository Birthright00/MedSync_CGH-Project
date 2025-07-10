import "./App.css";
import { ToastContainer } from 'react-toastify';
import ScrollToTop from "./components/ScrollToTop";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LoginPage from "./pages_login/LoginPage";
import ManagementHomePage from "./pages_management/ManagementHomePage";
import SignUpPage from "./pages_login/SignUpPage";
import StaffDetailPage from "./components/StaffDetailPage";
import Entry from "./components/Entry";
import HomePage from "./pages_login/HomePage";
import AboutUs from "./components/AboutUs";
import NurseManagementHomePage from "./pages_management/NurseManagementHomePage";
import NurseDetailsPage from "./components/NurseDetailsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Scheduler from "./scheduling/DoctorScheduler-MainPage";
import SchedulerLanding from "./scheduling/SchedulerLanding";
import StudentHomePage from "./pages_student/StudentHomePage";
import StudentTimetable from "./pages_student/StudentTimetable";
import NotificationWatcher from './components/NotificationWatcher';
import UserManagementLanding from "./user_management/UserManagementLanding";
import CreateNewSession from './scheduling/CreateNewSession'; // adjust path if needed
import StaffTimetable from "./staff/StaffTimetable";
import StudentManagement from "./pages_management/StudentManagement";
import 'react-toastify/dist/ReactToastify.css';
import { Toast } from "bootstrap";

function App() {
  const location = useLocation();
  return (
    <div className="App">
      <ToastContainer />
      <ScrollToTop />

      {/* Conditionally render NotificationWatcher */}
      {["/home", "/timetable"].some(path => location.pathname.startsWith(path)) && (
        <NotificationWatcher />
      )}
      <Routes>
        <Route exact path="/" element={<LoginPage />} />
        <Route exact path="/management-home" element={<ManagementHomePage />} />
        <Route exact path="/signup-page" element={<SignUpPage />} />
        <Route exact path="/staff/:mcr_number" element={<StaffDetailPage />} />
        <Route exact path="/entry" element={<Entry />} />
        <Route exact path="/home" element={<HomePage />} />
        <Route exact path="/about-us" element={<AboutUs />} />

        <Route exact path="/nurse-homepage" element={<NurseManagementHomePage />} />
        <Route exact path="/nurse/:snb_number" element={<NurseDetailsPage />} />

        <Route path="/student-home" element={<StudentHomePage />} />
        <Route exact path="/student-timetable" element={<StudentTimetable />} />

        <Route path="/student-management" element={<StudentManagement />} />

        <Route exact path="/timetable" element={
          <ProtectedRoute allowedRoles={["management"]}>
            <SchedulerLanding />
          </ProtectedRoute>
        } />
        <Route exact path="/timetable/scheduling" element={
          <ProtectedRoute allowedRoles={["management"]}>
            <Scheduler />
          </ProtectedRoute>
        } />

        <Route path="/timetable/create" element={<CreateNewSession />} />

        {/*  
        <Route path="/timetable/create" element={
          <iframe
            src="/CreateNewSession.html"
            style={{ width: "100%", height: "100vh", border: "none" }}
            title="Create New Session"
          />
        } /> */}
        
        <Route path="/timetable/users-management" element={<UserManagementLanding />} />


        {/* For Staff */}
        <Route exact path="/staff-timetable" element={<StaffTimetable />} />


      </Routes>
    </div>
  );
}

export default App;
