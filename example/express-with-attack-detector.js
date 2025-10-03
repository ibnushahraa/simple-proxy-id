const express = require('express');
const { createProxyMiddleware } = require('../src/index');
const createAttackDetector = require('../src/attack-detector');

const app = express();

console.log('=== Express with Attack Detector ===\n');

// Create attack detector for login endpoint
const loginAttackDetector = createAttackDetector({
  path: '/api/login',           // Monitor login endpoint
  statusCode: 401,               // Monitor unauthorized responses
  threshold: 5,                  // Trigger after 5 failed attempts
  timeWindow: 1000,              // Within 1 second
  onTrigger: (data) => {
    console.log('\n🚨 BRUTE FORCE ATTACK DETECTED ON LOGIN!');
    console.log('=====================================');
    console.log('IP Address:', data.ip);
    console.log('Failed Attempts:', data.hits);
    console.log('Target Path:', data.path);
    console.log('User-Agent:', data.userAgent);
    console.log('Timestamp:', new Date(data.timestamp).toISOString());
    console.log('=====================================\n');

    // Block IP via your firewall/API
    // Example: Cloudflare, Mikrotik, iptables, etc.
  }
});

// Create attack detector for 404 scanning
const scanDetector = createAttackDetector({
  path: /^\/api\/.*/,            // Monitor all API paths with RegExp
  statusCode: 404,               // Monitor not found responses
  threshold: 10,                 // Trigger after 10 not found hits
  timeWindow: 2000,              // Within 2 seconds
  onTrigger: (data) => {
    console.log('\n🚨 PATH SCANNING DETECTED!');
    console.log('=====================================');
    console.log('IP Address:', data.ip);
    console.log('Scan Attempts:', data.hits);
    console.log('Last Path:', data.path);
    console.log('User-Agent:', data.userAgent);
    console.log('=====================================\n');

    // Block IP via your firewall/API
  }
});

// Apply attack detectors as Express middleware
app.use(loginAttackDetector);
app.use(scanDetector);

// Mock login endpoint (for demonstration)
app.post('/api/login', (req, res) => {
  // Simulate failed login
  res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid credentials'
  });
});

// Proxy middleware for other API requests
app.use('/api', createProxyMiddleware({
  target: 'https://jsonplaceholder.typicode.com',
  changeOrigin: true
}));

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Express with Attack Detector',
    endpoints: {
      '/api/posts': 'Proxied to JSONPlaceholder',
      '/api/login': 'Mock login endpoint (always returns 401)'
    },
    attackDetection: {
      loginPath: '/api/login (401) - 5 hits in 1 second',
      scanPath: '/api/* (404) - 10 hits in 2 seconds'
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Express server with attack detector running on port ${PORT}`);
  console.log(`\nProtected endpoints:`);
  console.log(`- Login: POST http://localhost:${PORT}/api/login`);
  console.log(`- API Proxy: http://localhost:${PORT}/api/posts`);
  console.log(`\nAttack detection active:`);
  console.log(`- Login brute force: 5 failed attempts in 1 second`);
  console.log(`- Path scanning: 10 not found in 2 seconds`);
  console.log(`\nHow to test:`);
  console.log(`1. Trigger login detector: for i in {1..5}; do curl -X POST http://localhost:${PORT}/api/login; done`);
  console.log(`2. Trigger scan detector: for i in {1..10}; do curl http://localhost:${PORT}/api/fake$i; done`);
  console.log(`\nPress Ctrl+C to stop the server`);
});
