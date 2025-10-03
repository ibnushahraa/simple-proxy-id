/**
 * Attack Detector Plugin - Configuration Examples
 *
 * This file shows different configuration examples for the attack-detector plugin.
 * For full working examples, see:
 * - standalone-with-attack-detector.js (standalone HTTP server)
 * - express-with-attack-detector.js (Express.js integration)
 */

const createAttackDetector = require('../src/attack-detector');

// ============================================
// Example 1: Basic Configuration
// ============================================
const basicDetector = createAttackDetector({
  path: '/api/login',           // Monitor specific path
  statusCode: 401,               // Monitor unauthorized responses
  threshold: 5,                  // Trigger after 5 failed attempts
  timeWindow: 1000,              // Within 1 second
  onTrigger: (data) => {
    console.log('Attack detected from IP:', data.ip);
    console.log('Failed attempts:', data.hits);
  }
});

// ============================================
// Example 2: RegExp Path Matching
// ============================================
const regexDetector = createAttackDetector({
  path: /^\/api\/.*/,            // Monitor all paths starting with /api/
  statusCode: 404,               // Monitor not found responses
  threshold: 10,                 // Trigger after 10 hits
  timeWindow: 2000,              // Within 2 seconds
  onTrigger: (data) => {
    console.log('Path scanning detected!');
    console.log('Scanned path:', data.path);
  }
});

// ============================================
// Example 3: Integration with Cloudflare API
// ============================================
const cloudflareDetector = createAttackDetector({
  path: '/admin',
  statusCode: 403,
  threshold: 3,
  timeWindow: 1000,
  onTrigger: async (data) => {
    console.log(`Blocking IP ${data.ip} via Cloudflare...`);

    // Uncomment to use:
    // const fetch = require('node-fetch');
    // const response = await fetch('https://api.cloudflare.com/client/v4/user/firewall/access_rules/rules', {
    //   method: 'POST',
    //   headers: {
    //     'X-Auth-Email': 'your-email@example.com',
    //     'X-Auth-Key': 'your-cloudflare-api-key',
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     mode: 'block',
    //     configuration: { target: 'ip', value: data.ip },
    //     notes: `Auto-blocked: ${data.hits} failed attempts on ${data.path}`
    //   })
    // });
    // console.log('Cloudflare response:', await response.json());
  }
});

// ============================================
// Example 4: Integration with Mikrotik API
// ============================================
const mikrotikDetector = createAttackDetector({
  path: '/api/login',
  statusCode: 401,
  threshold: 5,
  timeWindow: 1000,
  onTrigger: async (data) => {
    console.log(`Blocking IP ${data.ip} via Mikrotik...`);

    // Uncomment to use:
    // const fetch = require('node-fetch');
    // const auth = Buffer.from('admin:password').toString('base64');
    // const response = await fetch('http://your-mikrotik-ip/rest/ip/firewall/address-list/add', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${auth}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     list: 'blacklist',
    //     address: data.ip,
    //     comment: `Auto-blocked: ${data.hits} failed attempts`
    //   })
    // });
    // console.log('Mikrotik response:', await response.json());
  }
});

// ============================================
// Example 5: Multiple Status Codes Monitoring
// ============================================

// Monitor unauthorized access
const unauthorizedDetector = createAttackDetector({
  path: /^\/api\/.*/,
  statusCode: 401,
  threshold: 5,
  timeWindow: 1000,
  onTrigger: (data) => console.log('Unauthorized attempts:', data)
});

// Monitor forbidden access
const forbiddenDetector = createAttackDetector({
  path: /^\/admin\/.*/,
  statusCode: 403,
  threshold: 3,
  timeWindow: 1000,
  onTrigger: (data) => console.log('Forbidden access attempts:', data)
});

// Monitor not found (scanning)
const notFoundDetector = createAttackDetector({
  path: /^\/.*\.php$/,           // Monitor PHP file scanning
  statusCode: 404,
  threshold: 5,
  timeWindow: 1000,
  onTrigger: (data) => console.log('PHP scanning detected:', data)
});

console.log('✅ Attack Detector Configuration Examples');
console.log('==========================================');
console.log('See standalone-with-attack-detector.js for standalone usage');
console.log('See express-with-attack-detector.js for Express.js usage');
console.log('==========================================\n');
