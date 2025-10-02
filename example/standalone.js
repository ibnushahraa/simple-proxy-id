const { createProxy } = require('../src/index');

// Example 1: Simple proxy to public API (without logger)
console.log('=== Example 1: Proxy to JSONPlaceholder (No Logger) ===');
const server1 = createProxy({
  target: 'https://jsonplaceholder.typicode.com',
  changeOrigin: true,
  port: 3000
});

// Example 2: Proxy with logger enabled
// Uncomment to run
/*
console.log('\n=== Example 2: Proxy with Logger ===');
const server2 = createProxy({
  target: 'https://jsonplaceholder.typicode.com',
  changeOrigin: true,
  port: 3001,
  logger: {
    logDir: './logs',
    maxDays: 7
  }
});
*/

// Example 3: Proxy to different API
// Uncomment to run
/*
console.log('\n=== Example 3: Proxy to GitHub API ===');
const server3 = createProxy({
  target: 'https://api.github.com',
  changeOrigin: true,
  port: 3002,
  logger: {
    logDir: './github-logs',
    maxDays: 30
  }
});
*/

console.log('\nHow to test:');
console.log('curl http://localhost:3000/posts');
console.log('curl http://localhost:3000/users/1');
console.log('\nTo test with logger, uncomment Example 2 and run:');
console.log('curl http://localhost:3001/posts');
console.log('Then check ./logs directory for log files');
console.log('\nPress Ctrl+C to stop the server');
