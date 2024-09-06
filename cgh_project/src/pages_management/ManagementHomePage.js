import "../styles/managementhomepage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";

const ManagementHomePage = () => {
  return (
    <>
      <Navbar homeRoute={"/management-home"} />
      <div className="management-home-page">
        <h1>Management Home Page</h1>
      </div>
      <Footer />
    </>
  );
};

export default ManagementHomePage;
