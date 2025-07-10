import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import API_BASE_URL from '../apiConfig';

const UploadStudent = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [school, setSchool] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(); // ✅ Add ref

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setSelectedFile(file);
    };

    const handleUpload = () => {
        if (!selectedFile || !school) {
            alert("Please select a file and a school.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const parsedData = XLSX.utils.sheet_to_json(sheet);

            const requiredFields = ['Matric No', 'Name'];
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
                    body: JSON.stringify({ students: parsedData, school }),
                });

                const result = await response.json();
                alert(result.message || 'Upload successful!');

                // ✅ Reset state and file input
                setSelectedFile(null);
                setSchool('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                window.location.reload(); // Optional: for better UX, you can refetch instead
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

            <label>Select School</label>
            <select
                className="filter-input"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                required
            >
                <option value="">Select School</option>
                <option value="Duke NUS">Duke NUS</option>
                <option value="NUS YLL">NUS YLL</option>
                <option value="NTU LKC">NTU LKC</option>
            </select>

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
