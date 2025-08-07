import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "../styles/aboutus.css";
import {
  profile,
  projects,
  photoGallery,
  skills,
  startups,
} from "./AboutUsContent";

import ProjectModal from "./AboutUsProjectModal";


const AboutUs = () => {

  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <>
      <Navbar />
      <section className="hero">
        <h1>Meet Edward</h1>
        <p>
          The Intern
        </p>
      </section>

      <div className="container">
        {/* Developer Profile */}
        <section className="profile-section">
          <div className="profile-image">
            <img
              src={profile.photo}
              alt={profile.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          </div>
          <div className="profile-info">
            <h2>{profile.name}</h2>
            <div className="role">{profile.role}</div>
            <p>{profile.bio}</p>
            <div className="skill-category">
              <h3>Design & Tools</h3>
              <div className="skill-tags">
                {profile.tools.map((tool, i) => (
                  <span key={i} className="skill-tag">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Personal Projects */}
        <section className="journey-section">
          <h2 className="section-title">Personal Projects</h2>
          <div className="startup-grid">
            {projects.map((proj, i) => (
              <div
                className="startup-card"
                key={i}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedProject(proj)}
              >
                <h3>{proj.title}</h3>
                <span className={`status ${proj.statusClass}`}>
                  {proj.status}
                </span>
                <p>{proj.description}</p>
              </div>
            ))}
          </div>

        </section>

        {/* Photography Portfolio */}
        <section className="gallery-section">
          <h2 className="section-title">Photography Portfolio</h2>
          <p
            style={{
              textAlign: "center",
              color: "#666",
              marginBottom: "2rem",
            }}
          >
            A collection of moments captured through my lens, showcasing the
            artistic vision that influences my development work.
          </p>
          <div className="gallery-grid">
            {photoGallery.map((item, i) => (
              <div
                key={i}
                className="gallery-item"
                data-title={item.title}
                style={{
                  backgroundImage: `url(${item.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ))}
          </div>
        </section>

        {/* Startup Experience */}
        <section className="startup-section">
          <h2 className="section-title">Startup Experience</h2>

          {/* Current Ventures */}
          <h3 style={{ color: "#4a90e2", marginBottom: "1rem", textAlign: "center" }}>
            Current Ventures
          </h3>
          <div className="startup-grid">
            {startups.current.map((s, i) => (
              <div className="startup-card" key={i}>
                {s.logo && (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-image"
                  >
                    <img
                      src={s.logo}
                      alt={`${s.name} logo`}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: "10px",
                      }}
                    />
                  </a>

                )}
                <h3>{s.name}</h3>
                <span className={`status ${s.status}`}>
                  {s.status === "active" ? "Active" : "Completed"}
                </span>
                <p>{s.description}</p>
              </div>
            ))}
          </div>

          {/* Previous Ventures */}
          <h3 style={{ color: "#666", margin: "3rem 0 1rem 0", textAlign: "center" }}>
            Previous Experience
          </h3>
          <div className="startup-grid">
            {startups.previous.map((s, i) => (
              <div className="startup-card" key={i}>
                <h3>{s.name}</h3>
                <span className={`status ${s.status}`}>
                  {s.status === "active" ? "Active" : "Completed"}
                </span>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </section>



        {/* Technical Skills */}
        <section className="skills-section">
          <h2 className="section-title">Technical Expertise</h2>
          <div className="skills-grid">
            {skills.map((section, i) => (
              <div key={i} className="skill-category">
                <h3>{section.category}</h3>
                <div className="skill-tags">
                  {section.tags.map((tag, j) => (
                    <span key={j} className="skill-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <h2>Let's Connect</h2>
          <p>
            Interested in collaborating or learning more about my work? I'd love
            to hear from you.
          </p>
          <div className="contact-links">
            <a href="#" className="contact-link">
              📧 Email
            </a>
            <a href="#" className="contact-link">
              💼 LinkedIn
            </a>
            <a href="#" className="contact-link">
              📸 Portfolio
            </a>
            <a href="#" className="contact-link">
              💻 GitHub
            </a>
          </div>
        </section>

        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}

      </div>
    </>
  );
};

export default AboutUs;
