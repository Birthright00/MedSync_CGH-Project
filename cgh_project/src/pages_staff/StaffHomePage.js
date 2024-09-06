import "../styles/staffhomepage.css";
import Navbar from "../components/Navbar";

const StaffHomePage = () => {
  return (
    <>
      <Navbar homeRoute={"/staff-home"} />
      <div className="staff-home-page">
        <h1>Staff Home Page</h1>
      </div>
    </>
  );
};

export default StaffHomePage;
