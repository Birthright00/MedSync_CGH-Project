import "../styles/staffhomepage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useEffect } from "react";
import axios from "axios";

const StaffHomePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/database");
        console.log(response.data);
        setData(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

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
