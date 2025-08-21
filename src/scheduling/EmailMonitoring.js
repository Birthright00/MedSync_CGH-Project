import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/createSession.css';
import Navbar from '../components/Navbar';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const EmailMonitoring = () => {
    const [emailProfiles, setEmailProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState('edward');
    const [monitoringStatus, setMonitoringStatus] = useState('stopped');
    const [needsAuth, setNeedsAuth] = useState(false);
    const [profileInfo, setProfileInfo] = useState(null);
    const [logs, setLogs] = useState([]);
    const [adminEmailMappings, setAdminEmailMappings] = useState({});
    const [configError, setConfigError] = useState(false);
    const [pollingInterval, setPollingInterval] = useState(null);

    useEffect(() => {
        // Load admin email mappings from config
        loadAdminEmailMappings();
        
        // Cleanup polling interval on component unmount
        return () => {
            stopPolling();
        };
    }, []);

    useEffect(() => {
        // Load available profiles when admin mappings are loaded
        if (Object.keys(adminEmailMappings).length > 0) {
            const profiles = Object.keys(adminEmailMappings);
            setEmailProfiles(profiles);
            
            // Check monitoring status
            checkMonitoringStatus();
            
            // Check authentication status for selected profile
            checkAuthStatus();
        }
    }, [selectedProfile, adminEmailMappings]);

    const loadAdminEmailMappings = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin-emails`);
            setAdminEmailMappings(response.data);
            setConfigError(false);
        } catch (error) {
            console.error("Failed to load admin email mappings:", error);
            setConfigError(true);
            setAdminEmailMappings({});
        }
    };

    const checkMonitoringStatus = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/email-monitoring/status`);
            setMonitoringStatus(response.data.status);
            if (response.data.profile) {
                setSelectedProfile(response.data.profile);
            }
            if (response.data.logs) {
                setLogs(response.data.logs);
            }
        } catch (error) {
            console.error('Error checking monitoring status:', error);
        }
    };

    const checkAuthStatus = async () => {
        const adminInfo = adminEmailMappings[selectedProfile];
        
        if (!adminInfo || !adminInfo.profile) {
            return; // Skip if admin mappings not loaded yet or profile property missing
        }
        
        try {
            const response = await axios.get(`${API_BASE_URL}/api/check-auth-status/${adminInfo.profile}`);
            
            if (response.data.authenticated) {
                setNeedsAuth(false);
                setProfileInfo({
                    sender_email: adminInfo.email,
                    sender_name: adminInfo.name
                });
            } else {
                setNeedsAuth(true);
                setProfileInfo({
                    sender_email: adminInfo.email,
                    sender_name: adminInfo.name
                });
            }
        } catch (error) {
            console.error("Auth check error:", error);
            // ✅ Always set needsAuth to true when there's an error (authentication failed/not found)
            setNeedsAuth(true);
            // ✅ Still set profile info for display, but mark as not authenticated
            if (adminInfo.email && adminInfo.name) {
                setProfileInfo({
                    sender_email: adminInfo.email,
                    sender_name: adminInfo.name
                });
            }
        }
    };

    const handleAuthenticateEmail = async () => {
        const adminInfo = adminEmailMappings[selectedProfile];

        if (!adminInfo || !adminInfo.profile) {
            alert("❌ Admin profile not found or incomplete. Please try again.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/authenticate-email`, {
                profile: adminInfo.profile,
                sender_email: adminInfo.email,
                sender_name: adminInfo.name
            });

            if (response.data.success) {
                alert("✅ Authentication started! Please complete the sign-in process in your browser.");
                
                // Poll for authentication completion
                setTimeout(() => {
                    checkAuthStatus();
                }, 5000);
            } else {
                alert(`❌ Failed to start authentication: ${response.data.error}`);
            }
        } catch (error) {
            console.error("Authentication error:", error);
            alert("❌ Authentication failed. Please try again.");
        }
    };

    const startPolling = () => {
        // Clear any existing interval
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        
        // Start polling every 2 seconds for real-time updates
        const interval = setInterval(() => {
            checkMonitoringStatus();
        }, 2000);
        
        setPollingInterval(interval);
    };

    const stopPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
        }
    };

    const handleStartMonitoring = async () => {
        if (needsAuth) {
            alert("❌ Please authenticate the email profile first.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/email-monitoring/start`, {
                profile: selectedProfile
            });

            if (response.data.success) {
                alert("✅ Email monitoring started!");
                setMonitoringStatus('running');
                setLogs([]); // Clear previous logs for fresh start
                
                // Start polling for real-time updates
                startPolling();
            } else {
                alert(`❌ Failed to start monitoring: ${response.data.error}`);
            }
        } catch (error) {
            console.error("Start monitoring error:", error);
            alert("❌ Failed to start monitoring. Please try again.");
        }
    };

    const handleStopMonitoring = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/email-monitoring/stop`);

            if (response.data.success) {
                alert("✅ Email monitoring stopped!");
                setMonitoringStatus('stopped');
                
                // Stop polling for updates
                stopPolling();
                
                // Keep the logs visible after stopping (don't clear them)
            } else {
                alert(`❌ Failed to stop monitoring: ${response.data.error}`);
            }
        } catch (error) {
            console.error("Stop monitoring error:", error);
            alert("❌ Failed to stop monitoring. Please try again.");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="create-session-container">
                <h1>🤖 Email Monitoring & LLM Processing</h1>
            
            {configError && (
                <div className="form-box" style={{ backgroundColor: '#fee', borderColor: '#fcc' }}>
                    <h2 className="section-title" style={{ color: '#c33' }}>❌ Configuration Error</h2>
                    <p style={{ color: '#c33' }}>
                        Failed to load admin email configuration from config file. Please check:
                    </p>
                    <ul style={{ color: '#c33', marginLeft: '1rem' }}>
                        <li>The <code>src/config/admin-emails.json</code> file exists</li>
                        <li>The file contains valid JSON format</li>
                        <li>The backend server is running</li>
                    </ul>
                    <button 
                        className="btn-secondary" 
                        onClick={loadAdminEmailMappings}
                        style={{ marginTop: '1rem' }}
                    >
                        🔄 Retry Loading Configuration
                    </button>
                </div>
            )}
            
            <div className="form-box">
                <h2 className="section-title">📧 Email Profile Configuration</h2>
                
                <div className="form-group">
                    <label>Select Email Profile:</label>
                    <select 
                        value={selectedProfile} 
                        onChange={(e) => setSelectedProfile(e.target.value)}
                        disabled={monitoringStatus === 'running' || Object.keys(adminEmailMappings).length === 0}
                    >
                        {Object.keys(adminEmailMappings).length === 0 ? (
                            <option value="">Loading profiles...</option>
                        ) : emailProfiles.length === 0 ? (
                            <option value="">No profiles available</option>
                        ) : (
                            emailProfiles.map(profile => (
                                <option key={profile} value={profile}>
                                    {adminEmailMappings[profile]?.name} ({adminEmailMappings[profile]?.email})
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {profileInfo && (
                    <div className="form-group">
                        <label>Profile Info:</label>
                        <div style={{ padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
                            <strong>{profileInfo.sender_name}</strong> &lt;{profileInfo.sender_email}&gt;
                            {needsAuth ? (
                                <span style={{ color: 'red', marginLeft: '1rem' }}>❌ Not Authenticated</span>
                            ) : (
                                <span style={{ color: 'green', marginLeft: '1rem' }}>✅ Authenticated</span>
                            )}
                        </div>
                    </div>
                )}

                {needsAuth && (
                    <div className="form-group">
                        <button 
                            className="btn-primary" 
                            onClick={handleAuthenticateEmail}
                            disabled={monitoringStatus === 'running'}
                        >
                            🔑 Authenticate Email
                        </button>
                        <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                            Click to start the authentication process for this email profile.
                        </small>
                    </div>
                )}
            </div>

            <div className="form-box">
                <h2 className="section-title">🔄 Monitoring Controls</h2>
                
                <div className="form-group">
                    <label>Status:</label>
                    <div style={{ padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
                        {monitoringStatus === 'running' ? (
                            <span style={{ color: 'green' }}>
                                🟢 Running (Profile: {selectedProfile})
                                {pollingInterval && <span style={{ marginLeft: '0.5rem', fontSize: '0.9em' }}>📡 Live Updates</span>}
                            </span>
                        ) : (
                            <span style={{ color: 'red' }}>🔴 Stopped</span>
                        )}
                    </div>
                </div>

                <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        className="btn-primary" 
                        onClick={handleStartMonitoring}
                        disabled={monitoringStatus === 'running' || needsAuth}
                    >
                        ▶️ Start Monitoring
                    </button>
                    
                    <button 
                        className="btn-secondary" 
                        onClick={handleStopMonitoring}
                        disabled={monitoringStatus === 'stopped'}
                    >
                        ⏹️ Stop Monitoring
                    </button>

                    <button 
                        className="btn-secondary" 
                        onClick={checkMonitoringStatus}
                    >
                        🔄 Refresh Status
                    </button>
                </div>

                <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
                    The monitoring system will automatically process incoming emails containing keywords: 
                    tutorial, tutor, reschedule, change, available, availability
                </small>
            </div>

            {logs.length > 0 && (
                <div className="form-box">
                    <h2 className="section-title">📋 Recent Activity</h2>
                    <div style={{ 
                        background: '#f8f9fa', 
                        padding: '1rem', 
                        borderRadius: '4px', 
                        maxHeight: '300px', 
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                    }}>
                        {logs.map((log, index) => (
                            <div key={index} style={{ marginBottom: '0.5rem' }}>
                                <span style={{ color: '#666' }}>[{log.timestamp}]</span> {log.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default EmailMonitoring;