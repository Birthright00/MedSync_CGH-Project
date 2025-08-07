// src/apiConfig.js

let hostname = window.location.hostname;
let protocol = window.location.protocol;

// Optional fallback for offline/local dev environments
if (!hostname || hostname === '') {
  hostname = 'localhost';
}

const FRONTEND_BASE_URL = `${protocol}//${hostname}:3000`;  // frontend

export default FRONTEND_BASE_URL;
