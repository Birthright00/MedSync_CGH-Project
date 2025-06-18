// src/apiConfig.js

let hostname = window.location.hostname;
let protocol = window.location.protocol;

// Optional fallback for offline/local dev environments
if (!hostname || hostname === '') {
  hostname = 'localhost';
}

const API_BASE_URL = `${protocol}//${hostname}:3001`;

export default API_BASE_URL;
