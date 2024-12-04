import React from "react";
import "../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <hr className="footer-divider" />
      <div className="footer-container">
        <div className="footer-right">
          <div className="footer-column">
            <h4>About Us</h4>
            <ul>
              <li>
                <a href="#">Corporate Profile</a>
              </li>
              <li>
                <a href="#">Visitor Information</a>
              </li>
              <li>
                <a href="#">Newsroom</a>
              </li>
              <li>
                <a href="#">Patient's Rights and Responsibilities</a>
              </li>
              <li>
                <a href="#">Events</a>
              </li>
              <li>
                <a href="#">Contact Us</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Patient Care</h4>
            <ul>
              <li>
                <a href="#">Conditions & Treatments</a>
              </li>
              <li>
                <a href="#">Find a Doctor</a>
              </li>
              <li>
                <a href="#">Specialities & Services</a>
              </li>
              <li>
                <a href="#">Community Partners</a>
              </li>
              <li>
                <a href="#">Your Clinic Visit</a>
              </li>
              <li>
                <a href="#">Your Hospital Stay</a>
              </li>
              <li>
                <a href="#">E-Services</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Research</h4>
            <ul>
              <li>
                <a href="#">Research in CGH</a>
              </li>
              <li>
                <a href="#">Core Facilities</a>
              </li>
              <li>
                <a href="#">SingHealth Research</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Education</h4>
            <ul>
              <li>
                <a href="#">Undergraduate</a>
              </li>
              <li>
                <a href="#">Postgraduate</a>
              </li>
              <li>
                <a href="#">Professional Development</a>
              </li>
              <li>
                <a href="#">TRaCS</a>
              </li>
              <li>
                <a href="#">SingHealth Academy</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Careers</h4>
            <ul>
              <li>
                <a href="#">Why Choose Us</a>
              </li>
              <li>
                <a href="#">Career Choices</a>
              </li>
              <li>
                <a href="#">Job Opportunities</a>
              </li>
              <li>
                <a href="#">Sponsorships</a>
              </li>
              <li>
                <a href="#">Career Events</a>
              </li>
              <li>
                <a href="#">Contact Us</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <a href="/terms-of-use">Terms of Use</a> |{" "}
        <a href="/privacy-policy">Privacy Policy</a>
        <p>Copyright © 2024 Changi General Hospital</p>
      </div>
    </footer>
  );
};

export default Footer;
