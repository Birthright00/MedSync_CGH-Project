import React, { useState, useEffect } from 'react';
import '../styles/studentmanagement.css';
import Navbar from '../components/Navbar';
import UploadStudent from '../components/UploadStudent';
import API_BASE_URL from '../apiConfig';

const StudentData = () => {
  const [filters, setFilters] = useState({
    matricNo: '',
    name: '',
    gender: '',
    mobile: '',
    email: '',
    academicYear: '',
  });

  const [currentSchoolFilter, setCurrentSchoolFilter] = useState('all');
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/students`)
      .then((res) => res.json())
      .then((data) => {
        setAllStudents(data);
        setFilteredStudents(data);
      })
      .catch((err) => {
        console.error('Failed to fetch students:', err);
      });
  }, []);

  useEffect(() => {
    filterStudents();
  }, [filters, currentSchoolFilter]);

  const filterStudents = () => {
    let results = allStudents;

    if (currentSchoolFilter !== 'all') {
      results = results.filter((s) => s.school === currentSchoolFilter);
    }

    results = results.filter((s) => {
      const matchesGeneric =
        s.user_id?.toLowerCase().includes(filters.matricNo.toLowerCase()) &&
        s.name?.toLowerCase().includes(filters.name.toLowerCase()) &&
        s.mobile_no?.toLowerCase().includes(filters.mobile.toLowerCase()) &&
        s.email?.toLowerCase().includes(filters.email.toLowerCase());

      const matchesGender = !filters.gender || s.gender === filters.gender;
      const matchesYear = !filters.academicYear || s.academicYear === filters.academicYear;

      return matchesGeneric && matchesGender && matchesYear;
    });

    setFilteredStudents(results);
  };

  const resetFilters = () => {
    setFilters({
      matricNo: '',
      name: '',
      gender: '',
      mobile: '',
      email: '',
      academicYear: '',
    });
    setCurrentSchoolFilter('all');
    setFilteredStudents(allStudents);
  };

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Navbar homeRoute="/student-data" />
      <div className="container">
        <h1 className="page-title">Student Data</h1>
        <div className="content-wrapper">
          <div className="filter-panel">
            <div className="filter-title">Filter by Student</div>
            {['matricNo', 'name', 'mobile', 'email'].map((field) => (
              <div className="filter-group" key={field}>
                <label className="filter-label">{field.replace(/^\w/, (c) => c.toUpperCase())}</label>
                <input
                  type="text"
                  className="filter-input"
                  value={filters[field]}
                  onChange={(e) => updateFilter(field, e.target.value)}
                />
              </div>
            ))}
            <div className="filter-group">
              <label className="filter-label">Gender</label>
              <select
                className="filter-input"
                value={filters.gender}
                onChange={(e) => updateFilter('gender', e.target.value)}
              >
                <option value="">All Genders</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Academic Year</label>
              <select
                className="filter-input"
                value={filters.academicYear}
                onChange={(e) => updateFilter('academicYear', e.target.value)}
              >
                <option value="">All Years</option>
                <option value="2023/2024">2023/2024</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
              </select>
            </div>
          </div>

          <div className="vertical-panel-stack">
            <div className="filter-panel">
              <div className="filter-title">Filter by School</div>
              <div className="school-filter">
                {['all', 'Duke-NUS', 'NUS YLL', 'NTU LKC'].map((type) => (
                  <button
                    key={type}
                    className={`school-button ${currentSchoolFilter === type ? 'active' : ''}`}
                    onClick={() => setCurrentSchoolFilter(type)}
                  >
                    {type === 'all' ? 'All Schools' : type}
                  </button>
                ))}
              </div>
              <div className="filter-actions">
                <button className="action-button reset-button" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </div>

            <UploadStudent />
          </div>

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Matric No</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Mobile No</th>
                  <th>Email</th>
                  <th>School</th>
                  <th>Academic Year</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.slice(0, entriesPerPage).map((student, i) => (
                  <tr key={student.user_id}>
                    <td>{i + 1}</td>
                    <td className="student-id">{student.user_id}</td>
                    <td>{student.name}</td>
                    <td>{student.gender}</td>
                    <td>{student.mobile_no}</td>
                    <td className="email">{student.email}</td>
                    <td>{student.school}</td>
                    <td>{student.academicYear || '-'}</td>
                    <td>{formatDate(student.start_date)}</td>
                    <td>{formatDate(student.end_date)}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, entriesPerPage - filteredStudents.length) }).map((_, idx) => (
                  <tr className="empty-rows" key={`empty-${idx}`}>
                    <td colSpan="10"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <div className="entries-info">Entries per page: {entriesPerPage}</div>
              <div className="page-controls">
                {[10, 20, 50, 100, filteredStudents.length].map((num) => (
                  <button
                    key={num}
                    className={`page-button ${entriesPerPage === num ? 'active' : ''}`}
                    onClick={() => setEntriesPerPage(num)}
                  >
                    {num === filteredStudents.length ? 'All' : num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentData;
