import React, { useState, useEffect } from 'react';
import '../styles/studentmanagement.css';
import Navbar from '../components/Navbar';
import UploadStudent from '../components/UploadStudent';
import StudentPopup from '../components/StudentDataPopup';
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
    const [currentProgramFilter, setCurrentProgramFilter] = useState('all');
    const [allStudents, setAllStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [currentPage, setCurrentPage] = useState(1); // current page number
    const currentUserADID = localStorage.getItem("adid");



    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        fetch(`${API_BASE_URL}/students?adid=${currentUserADID}`)
            .then((res) => res.json())
            .then((data) => {
                setAllStudents(data);
                setFilteredStudents(data);
            })
            .catch((err) => {
                console.error('Failed to fetch students:', err);
            });
    }, [currentUserADID]);

    useEffect(() => {
        filterStudents();
    }, [filters, currentSchoolFilter, currentProgramFilter]);

    useEffect(() => {
        if (showPopup) {
            document.body.style.overflow = 'hidden'; // Disable scroll
        } else {
            document.body.style.overflow = 'auto'; // Re-enable scroll
        }

        return () => {
            document.body.style.overflow = 'auto'; // Clean up on unmount
        };
    }, [showPopup]);


    const filterStudents = () => {
        let results = allStudents;

        if (currentSchoolFilter !== 'all') {
            results = results.filter((s) => s.school === currentSchoolFilter);
        }
        if (currentProgramFilter !== 'all') {
            results = results.filter((s) => s.program_name === currentProgramFilter);
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
        setCurrentPage(1); // Reset to page 1 when filters change
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

    // Compute students for the current page
    const indexOfLastStudent = currentPage * entriesPerPage;
    const indexOfFirstStudent = indexOfLastStudent - entriesPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);


    return (
        <>
            <Navbar homeRoute="/student-data" />
            <div className="container">
                <h1 className="page-title">Student Data</h1>
                <div className="content-wrapper">
                    <div className="filter-panel">
                        <div className="filter-title">Filter by Student</div>
                        {['matricNo', 'name', 'mobile', 'email'].map((field) => {
                            const labelMap = {
                                matricNo: 'Matric Number',
                                name: 'Name',
                                mobile: 'Mobile No',
                                email: 'Email'
                            };

                            return (
                                <div className="filter-group" key={field}>
                                    <label className="filter-label">{labelMap[field] || field}</label>
                                    <input
                                        type="text"
                                        className="filter-input"
                                        value={filters[field]}
                                        onChange={(e) => updateFilter(field, e.target.value)}
                                    />
                                </div>
                            );
                        })}

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
                                {['all', 'Duke NUS', 'NUS YLL', 'NTU LKC'].map((type) => (
                                    <button
                                        key={type}
                                        className={`school-button ${currentSchoolFilter === type ? 'active' : ''}`}
                                        onClick={() => setCurrentSchoolFilter(type)}
                                    >
                                        {type === 'all' ? 'All Schools' : type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-panel">
                            <div className="filter-title">Filter by Program Full Name / Specialty</div>
                            <select
                                className="filter-input"
                                value={currentProgramFilter}
                                onChange={(e) => setCurrentProgramFilter(e.target.value)}
                            >
                                <option value="all">All Programs</option>
                                <option value="General Medicine">General Medicine</option>
                                <option value="Geriatic Surgery">Geriatic Surgery</option>
                            </select>
                        </div>

                        <UploadStudent />
                    </div>

                    <div className="data-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>School</th>
                                    <th>Program</th>
                                    <th>Year Of Study</th>
                                    <th>Matric No</th>
                                    <th>Name</th>
                                    <th>Gender</th>
                                    <th>Mobile No</th>
                                    <th>Email</th>
                                    <th>Academic Year</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentStudents.map((student, i) => (
                                    <tr key={student.user_id} onClick={() => {
                                        setSelectedStudent(student);
                                        setShowPopup(true);
                                    }}>
                                        <td>{indexOfFirstStudent + i + 1}</td>
                                        <td>{student.school}</td>
                                        <td>{student.program_name}</td>
                                        <td>{student.yearofstudy} </td>
                                        <td className="student-id">{student.user_id}</td>
                                        <td>{student.name}</td>
                                        <td>{student.gender}</td>
                                        <td>{student.mobile_no}</td>
                                        <td className="email">{student.email}</td>
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
                                        onClick={() => {
                                            setEntriesPerPage(num);
                                            setCurrentPage(1); // Reset to page 1 when page size changes
                                        }}
                                    >
                                        {num === filteredStudents.length ? 'All' : num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pagination-pages">
                            {Array.from({ length: Math.ceil(filteredStudents.length / entriesPerPage) }, (_, idx) => (
                                <button
                                    key={idx + 1}
                                    className={`page-button ${currentPage === idx + 1 ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(idx + 1)}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>

                    </div>
                </div>
            </div>

            {showPopup && (
                <StudentPopup
                    student={selectedStudent}
                    onClose={() => setShowPopup(false)}
                    onSave={(updatedStudent) => {
                        fetch(`${API_BASE_URL}/update-student`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updatedStudent),
                        })
                            .then((res) => res.json())
                            .then(() => {
                                setShowPopup(false);
                                window.location.reload(); // Optional: for better UX, you can refetch instead
                            });
                    }}
                    onDelete={(userId) => {
                        fetch(`${API_BASE_URL}/delete-student/${userId}`, { method: 'DELETE' })
                            .then(() => {
                                setShowPopup(false);
                                window.location.reload();
                            });
                    }}
                />
            )}

        </>
    );
};

export default StudentData;
