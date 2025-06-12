import "./App.css";
import { ToastContainer } from 'react-toastify';
import ScrollToTop from "./components/ScrollToTop";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages_login/LoginPage";
import ManagementHomePage from "./pages_management/ManagementHomePage";
import SignUpPage from "./pages_login/SignUpPage";
import StaffDetailPage from "./components/StaffDetailPage";
import Entry from "./components/Entry";
import HomePage from "./pages_login/HomePage";
import AboutUs from "./components/AboutUs";
import NurseManagementHomePage from "./pages_management/NurseManagementHomePage";
import NurseDetailsPage from "./components/NurseDetailsPage";
import Scheduler from "./scheduling/DoctorScheduler-MainPage";
import StudentHomePage from "./pages_student/StudentHomePage";
import StudentTimetable from "./pages_student/StudentTimetable";
import NotificationWatcher from './components/NotificationWatcher';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div className="App">
      <ScrollToTop />
      <NotificationWatcher />
      <Routes>
        <Route exact path="/" element={<LoginPage />} />
        <Route exact path="/management-home" element={<ManagementHomePage />} />
        <Route exact path="/signup-page" element={<SignUpPage />} />
        <Route exact path="/staff/:mcr_number" element={<StaffDetailPage />} />
        <Route exact path="/entry" element={<Entry />} />
        <Route exact path="/home" element={<HomePage />} />
        <Route exact path="/about-us" element={<AboutUs />} />
        <Route
          exact
          path="/nurse-homepage"
          element={<NurseManagementHomePage />}
        />
        <Route exact path="/nurse/:snb_number" element={<NurseDetailsPage />} />
        <Route path="/student-home" element={<StudentHomePage />} /> 
        <Route exact path="/student-timetable" element={<StudentTimetable />} />
        <Route exact path="/scheduler" element={<Scheduler />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;
