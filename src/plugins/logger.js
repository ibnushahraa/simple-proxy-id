const fs = require('fs');
const { promises: fsPromises } = require('fs');
const path = require('path');

/**
 * Extract client IP address from request
 * Supports Cloudflare Tunnel and other proxy scenarios
 * @param {Object} req - HTTP request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  // Cloudflare provides client IP in CF-Connecting-IP header
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }

  // Check X-Forwarded-For (proxy/load balancer)
  if (req.headers['x-forwarded-for']) {
    const ips = req.headers['x-forwarded-for'].split(',');
    return ips[0].trim(); // First IP is the original client
  }

  // Check X-Real-IP (nginx proxy)
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }

  // Fallback to socket remote address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date time to YYYY-MM-DD HH:mm:ss
 * @param {Date} date - Date object
 * @returns {string} Formatted datetime string
 */
function formatDateTime(date) {
  const dateStr = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get log file path for a given date
 * @param {string} logDir - Log directory path
 * @param {Date} date - Date object
 * @returns {string} Log file path
 */
function getLogFilePath(logDir, date) {
  const fileName = `${formatDate(date)}.log`;
  return path.join(logDir, fileName);
}

/**
 * Clean up old log files
 * @param {string} logDir - Log directory path
 * @param {number} maxDays - Maximum days to keep logs
 */
function cleanupOldLogs(logDir, maxDays) {
  try {
    if (!fs.existsSync(logDir)) {
      return;
    }

    const files = fs.readdirSync(logDir);
    const now = new Date();
    const cutoffTime = now.getTime() - (maxDays * 24 * 60 * 60 * 1000);

    files.forEach(file => {
      if (!file.endsWith('.log')) {
        return;
      }

      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);

      // Delete if older than maxDays
      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
        console.log(`[Logger] Deleted old log file: ${file}`);
      }
    });
  } catch (err) {
    console.error('[Logger] Error cleaning up logs:', err.message);
  }
}

/**
 * Write log entry to file (async with queue)
 * @param {string} logDir - Log directory path
 * @param {string} logEntry - Log entry string
 */
async function writeLog(logDir, logEntry) {
  try {
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      await fsPromises.mkdir(logDir, { recursive: true });
    }

    const now = new Date();
    const logFile = getLogFilePath(logDir, now);

    // Append log entry to file (async, non-blocking)
    await fsPromises.appendFile(logFile, logEntry + '\n', 'utf8');
  } catch (err) {
    console.error('[Logger] Error writing log:', err.message);
  }
}

/**
 * Create logger middleware for proxy
 * @param {Object} options - Logger options
 * @param {string} options.logDir - Directory to store log files (default: './logs')
 * @param {number} options.maxDays - Maximum days to keep logs (default: 7)
 * @returns {Function} Express/Connect middleware function
 */
function createLogger(options = {}) {
  const logDir = options.logDir || path.join(process.cwd(), 'logs');
  const maxDays = options.maxDays || 7;

  // Run cleanup on initialization
  cleanupOldLogs(logDir, maxDays);

  // Track cleanup timer to prevent multiple schedulers
  let cleanupTimer = null;

  // Schedule cleanup daily at midnight
  const scheduleCleanup = () => {
    // Clear any existing timer to prevent race conditions
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    cleanupTimer = setTimeout(() => {
      cleanupOldLogs(logDir, maxDays);
      scheduleCleanup(); // Reschedule for next day
    }, msUntilMidnight);

    // Allow Node.js to exit if this is the only timer running
    // This prevents test runner warnings about open handles
    if (cleanupTimer.unref) {
      cleanupTimer.unref();
    }
  };

  scheduleCleanup();

  // Return middleware function
  return (req, res, next) => {
    const startTime = Date.now();
    const ip = getClientIP(req);
    const method = req.method;
    const url = req.url;

    // Intercept response
    const originalEnd = res.end;
    res.end = function(...args) {
      // Calculate duration
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const timestamp = formatDateTime(new Date());

      // Create log entry: [timestamp] IP METHOD PATH STATUS DURATION
      const logEntry = `[${timestamp}] ${ip} ${method} ${url} ${statusCode} ${duration}ms`;

      // Write to log file
      writeLog(logDir, logEntry);

      // Call original end
      originalEnd.apply(res, args);
    };

    next();
  };
}

module.exports = createLogger;
