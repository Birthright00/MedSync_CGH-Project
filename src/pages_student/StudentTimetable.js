import "../styles/studenttimetable.css";
import StudentNavbar from "./studentnavbar.js";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const StudentTimetable = () => {
  const [timetableData, setTimetableData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found");
          return;
        }

        const response = await axios.get("http://localhost:3001/student/timetable", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTimetableData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching timetable:", error);
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  return (
    <>
      <StudentNavbar />
      <div className="student-timetable-page">
        <h2 className="page-title">🗓️ Full Timetable</h2>

        {loading ? (
          <p>Loading timetable...</p>
        ) : (
          <motion.div
            className="timetable-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <table className="timetable-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Subject</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {timetableData.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.day}</td>
                    <td>{entry.start_time}</td>
                    <td>{entry.end_time}</td>
                    <td>{entry.subject}</td>
                    <td>{entry.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default StudentTimetable;
