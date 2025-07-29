// generate-qr.js

const qrcode = require('qrcode-terminal');

// Get your machine's LAN IP automatically
const { networkInterfaces } = require('os');
const nets = networkInterfaces();

let ipAddress = 'localhost';  // fallback
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      ipAddress = net.address;
    }
  }
}

const url = `http://${ipAddress}:3000`;

console.log(`Your frontend is running at: ${url}`);
qrcode.generate(url, { small: true });
