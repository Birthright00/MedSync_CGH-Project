import React, { useState } from 'react';
import '../styles/studentpopup.css';

const StudentPopup = ({ student, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({ ...student });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      onDelete(formData.user_id);
    }
  };

  return (
    <div className="student-popup-overlay">
      <div className="student-popup">
        <h2>Edit Student</h2>

        <form>
          <div className="form-group full-width">
            <label>Matric No</label>
            <input
              name="user_id"
              value={formData.user_id || ''}
              onChange={handleChange}
              type="text"
              disabled
            />
          </div>

          <div className="form-group full-width">
            <label>Name</label>
            <input
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              type="text"
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender || ''}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mobile No</label>
            <input
              name="mobile_no"
              value={formData.mobile_no || ''}
              onChange={handleChange}
              type="text"
            />
          </div>

          <div className="form-group full-width">
            <label>Email</label>
            <input
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              type="text"
            />
          </div>

          <div className="form-group">
            <label>School</label>
            <input
              name="school"
              value={formData.school || ''}
              onChange={handleChange}
              type="text"
            />
          </div>

          <div className="form-group">
            <label>Academic Year</label>
            <input
              name="academicYear"
              value={formData.academicYear || ''}
              onChange={handleChange}
              type="text"
            />
          </div>

          {/* New Field: Year of Study */}
          <div className="form-group">
            <label>Year Of Study</label>
            <input
              name="yearofstudy"
              value={formData.yearofstudy || ''}
              onChange={handleChange}
              type="text"
            />
          </div>

          {/* New Field: Program */}
          <div className="form-group">
            <label>Program</label>
            <input
              name="program_name"
              value={formData.program_name || ''}
              onChange={handleChange}
              type="text"
            />
          </div>


          <div className="form-group">
            <label>Start Date</label>
            <input
              name="start_date"
              value={formData.start_date ? formData.start_date.split('T')[0] : ''}
              onChange={handleChange}
              type="date"
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              name="end_date"
              value={formData.end_date ? formData.end_date.split('T')[0] : ''}
              onChange={handleChange}
              type="date"
            />
          </div>

          <div className="form-group">
            <label>Recess Start Date</label>
            <input
              name="recess_start_date"
              value={formData.recess_start_date ? formData.recess_start_date.split('T')[0] : ''}
              onChange={handleChange}
              type="date"
            />
          </div>

          <div className="form-group">
            <label>Recess End Date</label>
            <input
              name="recess_end_date"
              value={formData.recess_end_date ? formData.recess_end_date.split('T')[0] : ''}
              onChange={handleChange}
              type="date"
            />
          </div>
        </form>

        <div className="student-popup-buttons">
          <button className="save" onClick={handleSave}>Save</button>
          <button className="delete" onClick={handleDelete}>Delete</button>
          <button className="close" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default StudentPopup;
