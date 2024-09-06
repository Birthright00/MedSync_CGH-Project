import "../styles/staffhomepage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";

const StaffHomePage = () => {
  return (
    <>
      <Navbar homeRoute={"/staff-home"} />
      <div className="staff-home-page">
        <div className="staff-home-div-left">
          <div className="staff-home-div-left-base"></div>
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
