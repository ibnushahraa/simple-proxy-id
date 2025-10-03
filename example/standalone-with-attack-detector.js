const { createProxy } = require('../src/index');

console.log('=== Standalone Proxy with Attack Detector ===\n');

// Create standalone proxy with attack detector enabled
const server = createProxy({
  target: 'https://jsonplaceholder.typicode.com',
  changeOrigin: true,
  port: 3000,
  attackDetector: {
    path: '/posts/999',          // Monitor non-existent path
    statusCode: 404,              // Monitor not found responses
    threshold: 3,                 // Trigger after 3 hits
    timeWindow: 2000,             // Within 2 seconds
    onTrigger: (data) => {
      console.log('\n🚨 ATTACK DETECTED!');
      console.log('=====================================');
      console.log('IP Address:', data.ip);
      console.log('Failed Attempts:', data.hits);
      console.log('Target Path:', data.path);
      console.log('User-Agent:', data.userAgent);
      console.log('Timestamp:', new Date(data.timestamp).toISOString());
      console.log('=====================================\n');

      // Here you can call external APIs to block the IP
      // Example: Cloudflare API, Mikrotik API, iptables, etc.
    }
  }
});

console.log('\nAttack detector features:');
console.log('- Monitors specific paths for suspicious activity');
console.log('- Tracks hits per IP address');
console.log('- Triggers callback when threshold exceeded');
console.log('- Supports exact path or RegExp pattern matching');

console.log('\nHow to test:');
console.log('1. Hit the monitored path 3 times quickly:');
console.log('   curl http://localhost:3000/posts/999');
console.log('   curl http://localhost:3000/posts/999');
console.log('   curl http://localhost:3000/posts/999');
console.log('2. Watch for attack detection alert');
console.log('3. Normal requests still work: curl http://localhost:3000/posts');

console.log('\nPress Ctrl+C to stop the server');
