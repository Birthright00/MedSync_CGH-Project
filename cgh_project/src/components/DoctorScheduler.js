import "../styles/scheduler.css";
import Navbar from "../components/Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useEffect } from "react";
import axios from "axios";

const Scheduler = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <>
      <Navbar homeRoute={"/management-home"} />
      <div className="staff-home-page">
        <h2>Doctor Scheduler</h2>{" "}
        <div className="calendar-container">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            inline
          />
        </div>
      </div>
    </>
  );
};

export default Scheduler;
