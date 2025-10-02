const { createProxy } = require('../src/index');

console.log('=== Standalone Proxy with Logger ===\n');

// Create standalone proxy with logger enabled
const server = createProxy({
  target: 'https://jsonplaceholder.typicode.com',
  changeOrigin: true,
  port: 3000,
  logger: {
    logDir: './logs',
    maxDays: 7
  }
});

console.log('\nLogger features:');
console.log('- Logs every request with: [timestamp] IP METHOD PATH STATUS DURATION');
console.log('- Supports Cloudflare Tunnel (CF-Connecting-IP header)');
console.log('- Daily log files (YYYY-MM-DD.log)');
console.log('- Auto cleanup old logs after 7 days');

console.log('\nHow to test:');
console.log('1. curl http://localhost:3000/posts');
console.log('2. curl http://localhost:3000/users/1');
console.log('3. Check ./logs directory for today\'s log file');
console.log('4. View logs: cat logs/$(date +%Y-%m-%d).log');

console.log('\nPress Ctrl+C to stop the server');
