import Navbar from "./Navbar";
import "../styles/aboutus.css";
import handsome from "../images/handsome.png";
import handsome2 from "../images/handsome2.png";
import handsome3 from "../images/handsome3.png";
import handsome4 from "../images/handsome4.png";
import { motion } from "framer-motion";

const AboutUs = () => {
  return (
    <>
      <Navbar />
      <motion.div
        className="aboutuspage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h1>#1 Intern</h1>
        <h2>Best Webapp ever!</h2>
        <div className="image-container">
          <motion.img
            src={handsome}
            alt="handsome"
            animate={{ rotateY: 360 }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.img
            src={handsome2}
            alt="handsome2"
            animate={{
              rotateZ: [0, 15, -15, 0],
              x: [0, 20, -20, 0],
              scale: [1, 1.2, 0.9, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.img
            src={handsome3}
            alt="handsome3"
            animate={{
              rotateX: 360,
              y: [0, -30, 30, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.img
            src={handsome4}
            alt="handsome4"
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 0.8, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </>
  );
};

export default AboutUs;
