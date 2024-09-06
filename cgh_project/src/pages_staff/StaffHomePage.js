import "../styles/staffhomepage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";

const StaffHomePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <>
      <Navbar homeRoute={"/staff-home"} />
      <div className="staff-home-page">
        <div className="staff-home-div-left">
          <div className="staff-home-div-left-base">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              inline
            />
          </div>
        </div>
        <div className="staff-home-div-mid">
          <div className="staff-home-div-mid-base"></div>
        </div>
        <div className="staff-home-div-right">
          <div className="staff-home-div-right-base"></div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default StaffHomePage;
