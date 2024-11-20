import "../styles/staffdetailpage.css";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPlus, FaTimes, FaPaperPlane } from "react-icons/fa";
import React from "react";

const AddNewNonInstitutionalActivity = () => {
  const { mcr_number } = useParams();
  const [isActivityFormOpen, setActivityFormOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const { role } = JSON.parse(atob(token.split(".")[1])); // Decode JWT to get role
      setUserRole(role);
    }
  }, []);

  const handleRestrictedAction = () => {
    toast.error("Access Denied: Please contact management to make changes.");
  };
  const [newActivity, setNewActivity] = useState({
    mcr_number: mcr_number,
    teaching_categories: "",
    role: "",
    activity_type: "",
    medium: "",
    host_country: "",
    honorarium: "",
    academic_year: "",
    training_hours: "", // Add this field
  });

  const teachingCategoriesOptions = [
    "Postgraduate Teaching",
    "Undergraduate Teaching",
    "Other Teaching",
    "Publication/ Research",
    "Non-Education",
  ];

  const roleOptions = [
    "Lecturer/ Instructor",
    "Speaker/ Presenter",
    "Examiner",
    "Mentor/ Proctor",
    "Author",
    "Reviewer",
    "Attendee/ Participant",
    "Others",
  ];

  const activityTypeOptions = [
    "Course/ Lecture/ Workshop",
    "Conference/ Seminar/ Symposium",
    "Journal Club/ Orientation/ Department Meeting/ Group Discussion",
    "Interview (Publicity/ Public Awareness)",
    "Award",
    "Appointment",
    "Promotion",
    "Publication",
    "Research",
    "Others",
  ];

  const mediumOptions = ["In-Person", "Virtual", "Pre-recorded"];

  const hostCountryOptions = ["Singapore", "Overseas"];

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewActivity({
      ...newActivity,
      [name]: value,
    });
  };

  const handleNewActivitySubmit = async () => {
    if (
      !newActivity.teaching_categories ||
      !newActivity.role ||
      !newActivity.activity_type ||
      !newActivity.medium ||
      !newActivity.host_country ||
      !newActivity.honorarium ||
      !newActivity.academic_year ||
      !newActivity.training_hours // Include training_hours in validation
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:3001/non_institutional`,
        newActivity,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201) {
        toast.success("New non-institutional activity added successfully!");
        setNewActivity({
          mcr_number: mcr_number,
          teaching_categories: "",
          role: "",
          activity_type: "",
          medium: "",
          host_country: "",
          honorarium: "",
          academic_year: "",
        });
        window.location.reload();
      }
    } catch (error) {
      console.error("Error adding new activity:", error);
      toast.error("Failed to add activity");
    }
  };

  return (
    <div>
      <ToastContainer />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        className="toggle-add-contract-button"
        onClick={() => setActivityFormOpen((prev) => !prev)}
      >
        {isActivityFormOpen ? <FaTimes /> : <FaPlus />}
        {isActivityFormOpen ? "Close" : "Add New Non-Institutional Activity"}
      </motion.button>
      {isActivityFormOpen && (
        <div>
          <div className="contract-input-container">
            {" "}
            <div className="input-group">
              <label>Academic Year:</label>
              <select
                name="academic_year"
                value={newActivity.academic_year}
                onChange={handleInputChange}
              >
                <option value="">Select Academic Year</option>
                {Array.from({ length: 5 }, (_, index) => 2020 + index).map(
                  (year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="input-group">
              <label>Teaching Categories:</label>
              <select
                name="teaching_categories"
                value={newActivity.teaching_categories}
                onChange={handleInputChange}
              >
                <option value="">Select Teaching Category</option>
                {teachingCategoriesOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Role:</label>
              <select
                name="role"
                value={newActivity.role}
                onChange={handleInputChange}
              >
                <option value="">Select Role</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Activity Type:</label>
              <select
                name="activity_type"
                value={newActivity.activity_type}
                onChange={handleInputChange}
              >
                <option value="">Select Activity Type</option>
                {activityTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Medium:</label>
              <select
                name="medium"
                value={newActivity.medium}
                onChange={handleInputChange}
              >
                <option value="">Select Medium</option>
                {mediumOptions.map((medium) => (
                  <option key={medium} value={medium}>
                    {medium}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Host Country:</label>
              <select
                name="host_country"
                value={newActivity.host_country}
                onChange={handleInputChange}
              >
                <option value="">Select Host Country</option>
                {hostCountryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Honorarium:</label>
              <input
                type="number"
                name="honorarium"
                value={newActivity.honorarium}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-group">
              <label>Training Hours:</label>
              <input
                type="number"
                name="training_hours"
                value={newActivity.training_hours || ""}
                onChange={handleInputChange}
                min="0"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={
                userRole === "hr"
                  ? handleRestrictedAction
                  : handleNewActivitySubmit
              }
              className="add-contract-button"
            >
              <FaPaperPlane /> Submit
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddNewNonInstitutionalActivity;
