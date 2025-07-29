import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import API_BASE_URL from '../apiConfig';

const UploadStudent = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(); // ✅ Add ref

    const currentUserADID = localStorage.getItem("adid");
    console.log("ADID in UploadStudent:", currentUserADID);



    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setSelectedFile(file);
    };

    const handleUpload = () => {
        if (!selectedFile) {
            alert("Please select a file.");
            return;
        }

        const normalizeHeader = (header) => {
            const firstLine = header.split('\n')[0].trim().toLowerCase().replace(/\.+$/, '');

            const map = {
                'phase': 'yearofstudy',
                'posting discipline': 'program_name',
                'cg': 'cg',
                'matric no': 'user_id',
                'matric no.': 'user_id',
                'name': 'name',
                'gender': 'gender',
                'mobile no.': 'mobile_no',
                'nus email': 'email',
                'ntu email': 'email',
                'duke nus email': 'email',
                'med school': 'school',
                'posting start date': 'start_date',
                'posting end date': 'end_date',
                'recess start date': 'recess_start_date',
                'recess end date': 'recess_end_date',
            };

            return map[firstLine] || firstLine.replace(/\s+/g, '_');
        };

        const normalizePhase = (phaseValue) => {
            if (!phaseValue) return '';

            const value = String(phaseValue).trim().toUpperCase();

            const romanToNumber = {
                'I': 1,
                'II': 2,
                'III': 3,
                'IV': 4,
                'V': 5
            };

            let numericPhase = romanToNumber[value] || value;

            // Ensure numericPhase is 1-5
            if (['1', '2', '3', '4', '5'].includes(String(numericPhase))) {
                return `M${numericPhase}`;
            }

            return ''; // fallback if invalid
        };


        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const headers = raw[0].map(normalizeHeader);

            
            const rows = raw.slice(1).filter(r => r.some(cell => cell !== undefined && cell !== ''));

            const parsedData = rows.map(row => {
                const obj = {};
                headers.forEach((h, i) => {
                    obj[h] = row[i] ?? '';
                });

                // Normalize the 'yearofstudy' (phase) column
                if (obj.yearofstudy) {
                    obj.yearofstudy = normalizePhase(obj.yearofstudy);
                }

                return obj;
            });

            // Fill down merged values (Excel merged cells)
            const columnsToFillDown = ['start_date', 'end_date', 'recess_start_date', 'recess_end_date'];

            columnsToFillDown.forEach(col => {
                let lastValue = '';
                parsedData.forEach(row => {
                    if (row[col] === undefined || row[col] === '' || row[col] === 'Nil') {
                        row[col] = lastValue;
                    } else {
                        lastValue = row[col];
                    }
                });
            });


            console.log("✅ Headers parsed:", headers);
            console.log("✅ First row parsed:", parsedData[0]);


            const requiredFields = ['user_id', 'name', 'gender', 'email', 'start_date', 'end_date', 'cg', 'school', 'program_name', 'yearofstudy'];
            const missingFields = requiredFields.filter(f => !(f in parsedData[0]));
            if (missingFields.length > 0) {
                alert(`Missing required columns: ${missingFields.join(', ')}`);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/upload-student-data`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ students: parsedData, adid: currentUserADID }),
                });

                const result = await response.json();
                alert(result.message || 'Upload successful!');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                window.location.reload();
            } catch (err) {
                console.error('Upload failed:', err);
                alert('Upload failed. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        reader.readAsArrayBuffer(selectedFile);
    };


    return (
        <div className="filter-panel">
            <div className="filter-title">Upload Student Excel</div>

            <input
                ref={fileInputRef} // ✅ Attach ref to input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                className="filter-input"
                style={{ marginTop: '10px' }}
            />

            {selectedFile && (
                <p style={{ fontSize: '12px', marginTop: '10px' }}>
                    Selected: {selectedFile.name}
                </p>
            )}

            <button
                className="action-button"
                style={{
                    marginTop: '10px',
                    backgroundColor: '#66db34',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'background-color 0.3s',
                    opacity: loading ? 0.6 : 1
                }}
                onClick={handleUpload}
                disabled={!selectedFile || loading}
            >
                {loading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
    );
};

export default UploadStudent;
