import React from "react";
import "../styles/aboutusprojectmodal.css";

const ProjectModal = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{project.title}</h2>
        <p>{project.description}</p>

        {project.images && project.images.length > 0 && (
          <div className="modal-images">
            {project.images.map((img, i) => (
              <img key={i} src={img} alt={`screenshot-${i}`} />
            ))}
          </div>
        )}

        <button className="modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ProjectModal;
