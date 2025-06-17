// src/apiConfig.js

const isLocalhost = window.location.hostname === 'localhost';
const API_BASE_URL = isLocalhost
  ? 'http://localhost:3001'
  : 'http://192.168.19.248:3001';

export default API_BASE_URL;
