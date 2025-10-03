const http = require('http');
const createAttackDetector = require('../src/attack-detector');

console.log('Testing Attack Detector Plugin...\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    testsFailed++;
  }
}

// Test 1: Middleware creation
console.log('Test 1: Create attack detector middleware');
try {
  const detector = createAttackDetector({
    path: '/test',
    statusCode: 404,
    threshold: 3,
    timeWindow: 1000,
    onTrigger: () => {}
  });
  assert(typeof detector === 'function', 'Should return a middleware function');
} catch (err) {
  assert(false, 'Should create middleware without error: ' + err.message);
}

// Test 2: Validate required parameters
console.log('\nTest 2: Validate required parameters');
try {
  createAttackDetector({});
  assert(false, 'Should throw error when path is missing');
} catch (err) {
  assert(err.message === 'path is required', 'Should validate path parameter');
}

try {
  createAttackDetector({ path: '/test' });
  assert(false, 'Should throw error when statusCode is missing');
} catch (err) {
  assert(err.message === 'statusCode is required', 'Should validate statusCode parameter');
}

try {
  createAttackDetector({ path: '/test', statusCode: 404 });
  assert(false, 'Should throw error when threshold is missing');
} catch (err) {
  assert(err.message === 'threshold must be a positive number', 'Should validate threshold parameter');
}

try {
  createAttackDetector({ path: '/test', statusCode: 404, threshold: 5 });
  assert(false, 'Should throw error when onTrigger is missing');
} catch (err) {
  assert(err.message === 'onTrigger must be a function', 'Should validate onTrigger parameter');
}

// Test 3: Middleware functionality with mock request/response
console.log('\nTest 3: Test middleware functionality');

let triggerCalled = false;
let triggerData = null;

const detector = createAttackDetector({
  path: '/login',
  statusCode: 401,
  threshold: 3,
  timeWindow: 1000,
  onTrigger: (data) => {
    triggerCalled = true;
    triggerData = data;
  }
});

// Mock request/response
function createMockReqRes(url, statusCode, ip = '127.0.0.1') {
  const req = {
    url: url,
    method: 'POST',
    headers: {
      'x-forwarded-for': ip,
      'user-agent': 'test-agent'
    },
    socket: { remoteAddress: ip }
  };

  const res = {
    statusCode: statusCode,
    headersSent: false,
    writeHead: function(code) {
      this.statusCode = code;
      return this;
    },
    end: function() {
      // Mock end
    }
  };

  return { req, res };
}

// Simulate 3 failed login attempts
triggerCalled = false;
for (let i = 0; i < 3; i++) {
  const { req, res } = createMockReqRes('/login', 401, '192.168.1.100');
  const originalEnd = res.end;

  detector(req, res, () => {
    // Call the overridden end to simulate response completion
    res.end();
    originalEnd.call(res);
  });
}

// Give some time for async operations
setTimeout(() => {
  assert(triggerCalled === true, 'Should trigger callback after threshold reached');
  assert(triggerData !== null, 'Should pass data to callback');
  assert(triggerData.ip === '192.168.1.100', 'Should capture correct IP address');
  assert(triggerData.hits === 3, 'Should count 3 hits');
  assert(triggerData.path === '/login', 'Should capture correct path');
  assert(triggerData.userAgent === 'test-agent', 'Should capture user agent');

  // Test 4: Path matching with different paths
  console.log('\nTest 4: Test path filtering');

  let trigger2Called = false;
  const detector2 = createAttackDetector({
    path: '/admin',
    statusCode: 403,
    threshold: 2,
    onTrigger: () => { trigger2Called = true; }
  });

  // Hit different path - should not trigger
  for (let i = 0; i < 3; i++) {
    const { req, res } = createMockReqRes('/other', 403);
    const originalEnd = res.end;

    detector2(req, res, () => {
      res.end();
      originalEnd.call(res);
    });
  }

  setTimeout(() => {
    assert(trigger2Called === false, 'Should not trigger for non-matching paths');

    // Test 5: RegExp path matching
    console.log('\nTest 5: Test RegExp path matching');

    let trigger3Called = false;
    const detector3 = createAttackDetector({
      path: /^\/api\/.*/,
      statusCode: 404,
      threshold: 2,
      onTrigger: () => { trigger3Called = true; }
    });

    // Hit matching regex path
    for (let i = 0; i < 2; i++) {
      const { req, res } = createMockReqRes('/api/users', 404);
      const originalEnd = res.end;

      detector3(req, res, () => {
        res.end();
        originalEnd.call(res);
      });
    }

    setTimeout(() => {
      assert(trigger3Called === true, 'Should trigger for RegExp matching paths');

      // Summary
      console.log('\n========================================');
      console.log('Test Summary:');
      console.log(`✅ Passed: ${testsPassed}`);
      console.log(`❌ Failed: ${testsFailed}`);
      console.log('========================================\n');

      if (testsFailed > 0) {
        process.exit(1);
      }
    }, 100);
  }, 100);
}, 100);
