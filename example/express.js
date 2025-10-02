const express = require('express');
const { createProxyMiddleware } = require('../src/index');

const app = express();
const PORT = 3000;

// Middleware for logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Regular route (not proxied)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to simple-proxy-id',
    endpoints: {
      '/': 'This page',
      '/api/*': 'Proxy to JSONPlaceholder',
      '/github/*': 'Proxy to GitHub API',
      '/local': 'Local route without proxy'
    }
  });
});

// Local route without proxy
app.get('/local', (req, res) => {
  res.json({
    message: 'This is a local route, not proxied',
    timestamp: new Date().toISOString()
  });
});

// Proxy to JSONPlaceholder for path /api/*
app.use('/api', createProxyMiddleware({
  target: 'https://jsonplaceholder.typicode.com',
  changeOrigin: true
}));

// Proxy to GitHub API for path /github/*
app.use('/github', createProxyMiddleware({
  target: 'https://api.github.com',
  changeOrigin: true
}));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Express app with proxy running at http://localhost:${PORT}`);
  console.log('\nUsage examples:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/local`);
  console.log(`  curl http://localhost:${PORT}/api/posts`);
  console.log(`  curl http://localhost:${PORT}/api/users/1`);
  console.log(`  curl http://localhost:${PORT}/github/users/github`);
  console.log('\nPress Ctrl+C to stop the server');
});
