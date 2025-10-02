const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');
const createLogger = require('../src/plugins/logger');

// Test log directory
const TEST_LOG_DIR = path.join(__dirname, 'test-logs');

describe('Logger Plugin', () => {
  // Cleanup test logs before and after tests
  beforeEach(() => {
    if (fs.existsSync(TEST_LOG_DIR)) {
      const files = fs.readdirSync(TEST_LOG_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(TEST_LOG_DIR, file));
      });
      fs.rmdirSync(TEST_LOG_DIR);
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_LOG_DIR)) {
      const files = fs.readdirSync(TEST_LOG_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(TEST_LOG_DIR, file));
      });
      fs.rmdirSync(TEST_LOG_DIR);
    }
  });

  describe('Basic Logging', () => {
    test('should create log directory if not exists', async () => {
      const app = express();

      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      await request(app).get('/test').expect(200);

      // Check if log directory was created
      expect(fs.existsSync(TEST_LOG_DIR)).toBe(true);
    });

    test('should write log entry to file', async () => {
      const app = express();

      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      app.get('/test-path', (req, res) => {
        res.status(200).json({ message: 'success' });
      });

      await request(app).get('/test-path').expect(200);

      // Wait a bit for file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if log file exists
      const files = fs.readdirSync(TEST_LOG_DIR);
      expect(files.length).toBe(1);

      // Read log file content
      const logFile = path.join(TEST_LOG_DIR, files[0]);
      const content = fs.readFileSync(logFile, 'utf8');

      // Verify log entry format
      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/); // Timestamp
      expect(content).toContain('GET');
      expect(content).toContain('/test-path');
      expect(content).toContain('200');
      expect(content).toMatch(/\d+ms/); // Duration
    });

    test('should log correct status codes', async () => {
      const app = express();

      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      app.get('/success', (req, res) => res.status(200).send('OK'));
      app.get('/created', (req, res) => res.status(201).send('Created'));
      app.get('/not-found', (req, res) => res.status(404).send('Not Found'));
      app.get('/error', (req, res) => res.status(500).send('Error'));

      await request(app).get('/success').expect(200);
      await request(app).get('/created').expect(201);
      await request(app).get('/not-found').expect(404);
      await request(app).get('/error').expect(500);

      // Wait for file writes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Read log file
      const files = fs.readdirSync(TEST_LOG_DIR);
      const logFile = path.join(TEST_LOG_DIR, files[0]);
      const content = fs.readFileSync(logFile, 'utf8');

      expect(content).toContain('200');
      expect(content).toContain('201');
      expect(content).toContain('404');
      expect(content).toContain('500');
    });
  });

  describe('IP Detection', () => {
    test('should capture IP from socket', async () => {
      const app = express();

      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      app.get('/test', (req, res) => res.send('OK'));

      await request(app).get('/test').expect(200);

      // Wait for file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Read log file
      const files = fs.readdirSync(TEST_LOG_DIR);
      const logFile = path.join(TEST_LOG_DIR, files[0]);
      const content = fs.readFileSync(logFile, 'utf8');

      // Should contain an IP (may be IPv6 ::ffff:127.0.0.1 or IPv4)
      expect(content).toMatch(/\d+\.\d+\.\d+\.\d+|::[\da-f:]+/i);
    });

    test('should prioritize CF-Connecting-IP header', async () => {
      const app = express();

      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      app.get('/test', (req, res) => res.send('OK'));

      await request(app)
        .get('/test')
        .set('CF-Connecting-IP', '1.2.3.4')
        .set('X-Forwarded-For', '5.6.7.8')
        .expect(200);

      // Wait for file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Read log file
      const files = fs.readdirSync(TEST_LOG_DIR);
      const logFile = path.join(TEST_LOG_DIR, files[0]);
      const content = fs.readFileSync(logFile, 'utf8');

      // Should use CF-Connecting-IP
      expect(content).toContain('1.2.3.4');
      expect(content).not.toContain('5.6.7.8');
    });

    test('should use X-Forwarded-For if CF header not present', async () => {
      const app = express();

      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      app.get('/test', (req, res) => res.send('OK'));

      await request(app)
        .get('/test')
        .set('X-Forwarded-For', '9.10.11.12, 13.14.15.16')
        .expect(200);

      // Wait for file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Read log file
      const files = fs.readdirSync(TEST_LOG_DIR);
      const logFile = path.join(TEST_LOG_DIR, files[0]);
      const content = fs.readFileSync(logFile, 'utf8');

      // Should use first IP from X-Forwarded-For
      expect(content).toContain('9.10.11.12');
    });

    test('should use X-Real-IP if other headers not present', async () => {
      const app = express();

      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      app.get('/test', (req, res) => res.send('OK'));

      await request(app)
        .get('/test')
        .set('X-Real-IP', '17.18.19.20')
        .expect(200);

      // Wait for file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Read log file
      const files = fs.readdirSync(TEST_LOG_DIR);
      const logFile = path.join(TEST_LOG_DIR, files[0]);
      const content = fs.readFileSync(logFile, 'utf8');

      // Should use X-Real-IP
      expect(content).toContain('17.18.19.20');
    });
  });

  describe('Log File Management', () => {
    test('should create daily log files with correct naming', async () => {
      const app = express();

      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      app.get('/test', (req, res) => res.send('OK'));

      await request(app).get('/test').expect(200);

      // Wait for file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check file name format (YYYY-MM-DD.log)
      const files = fs.readdirSync(TEST_LOG_DIR);
      expect(files.length).toBe(1);
      expect(files[0]).toMatch(/^\d{4}-\d{2}-\d{2}\.log$/);
    });

    test('should append to existing log file on same day', async () => {
      const app = express();

      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      app.get('/test', (req, res) => res.send('OK'));

      // Make 3 requests
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);

      // Wait for file writes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still have only 1 file
      const files = fs.readdirSync(TEST_LOG_DIR);
      expect(files.length).toBe(1);

      // File should contain 3 log entries
      const logFile = path.join(TEST_LOG_DIR, files[0]);
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(3);
    });
  });

  describe('Log Cleanup', () => {
    test('should delete old log files', async () => {
      // Create log directory
      if (!fs.existsSync(TEST_LOG_DIR)) {
        fs.mkdirSync(TEST_LOG_DIR, { recursive: true });
      }

      // Create old log file (10 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      const oldFileName = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}.log`;
      const oldFilePath = path.join(TEST_LOG_DIR, oldFileName);
      fs.writeFileSync(oldFilePath, 'old log entry\n', 'utf8');

      // Set file modification time to 10 days ago
      const oldTime = oldDate.getTime();
      fs.utimesSync(oldFilePath, oldTime / 1000, oldTime / 1000);

      // Create recent log file (2 days ago)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 2);
      const recentFileName = `${recentDate.getFullYear()}-${String(recentDate.getMonth() + 1).padStart(2, '0')}-${String(recentDate.getDate()).padStart(2, '0')}.log`;
      const recentFilePath = path.join(TEST_LOG_DIR, recentFileName);
      fs.writeFileSync(recentFilePath, 'recent log entry\n', 'utf8');

      // Initialize logger with maxDays=7
      const app = express();
      app.use(createLogger({
        logDir: TEST_LOG_DIR,
        maxDays: 7
      }));

      // Wait for cleanup to run
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check files
      const files = fs.readdirSync(TEST_LOG_DIR);

      // Old file should be deleted, recent file should remain
      expect(files).not.toContain(oldFileName);
      expect(files).toContain(recentFileName);
    });
  });
});
