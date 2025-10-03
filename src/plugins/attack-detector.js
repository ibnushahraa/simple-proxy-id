const url = require('url');

/**
 * Attack Detector Plugin
 * Monitors request patterns and triggers callback when threshold is exceeded
 *
 * @param {Object} options - Configuration options
 * @param {string|RegExp} options.path - Path to monitor (string for exact match, RegExp for pattern)
 * @param {number} options.statusCode - HTTP status code to monitor (e.g., 401, 403, 404)
 * @param {number} options.threshold - Maximum allowed hits within time window
 * @param {number} options.timeWindow - Time window in milliseconds (default: 1000)
 * @param {Function} options.onTrigger - Callback function triggered when threshold exceeded
 *   Receives: { ip, hits, path, timestamp, userAgent }
 * @returns {Function} Middleware function
 */
function createAttackDetector(options = {}) {
  const {
    path: targetPath,
    statusCode,
    threshold,
    timeWindow = 1000,
    onTrigger
  } = options;

  // Validate required options
  if (!targetPath) {
    throw new Error('path is required');
  }
  if (!statusCode) {
    throw new Error('statusCode is required');
  }
  if (!threshold || threshold <= 0) {
    throw new Error('threshold must be a positive number');
  }
  if (typeof onTrigger !== 'function') {
    throw new Error('onTrigger must be a function');
  }

  // Store hits per IP: { ip: [timestamp1, timestamp2, ...] }
  const hitTracker = new Map();

  // Helper: Check if path matches
  const matchPath = (requestPath) => {
    if (targetPath instanceof RegExp) {
      return targetPath.test(requestPath);
    }
    return requestPath === targetPath;
  };

  // Helper: Clean old timestamps outside time window
  const cleanOldHits = (timestamps, now) => {
    return timestamps.filter(ts => now - ts < timeWindow);
  };

  // Middleware function
  return (req, res, next) => {
    const requestPath = url.parse(req.url).pathname;

    // Check if path matches monitoring criteria
    if (!matchPath(requestPath)) {
      return next();
    }

    // Get client IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.headers['x-real-ip'] ||
               req.socket.remoteAddress ||
               req.connection.remoteAddress;

    // Intercept response to monitor status code
    const originalWriteHead = res.writeHead;
    const originalEnd = res.end;

    let statusCodeSent = null;

    // Override writeHead to capture status code
    res.writeHead = function(code, ...args) {
      statusCodeSent = code;
      return originalWriteHead.apply(res, [code, ...args]);
    };

    // Override end to process after response is sent
    res.end = function(...args) {
      // If writeHead wasn't called, check statusCode property
      if (!statusCodeSent) {
        statusCodeSent = res.statusCode;
      }

      // Check if status code matches monitoring criteria
      if (statusCodeSent === statusCode) {
        const now = Date.now();

        // Get existing hits for this IP or create new array
        let hits = hitTracker.get(ip) || [];

        // Clean old hits outside time window
        hits = cleanOldHits(hits, now);

        // Add current hit
        hits.push(now);

        // Update tracker
        hitTracker.set(ip, hits);

        // Check if threshold exceeded
        if (hits.length >= threshold) {
          // Trigger callback
          try {
            onTrigger({
              ip,
              hits: hits.length,
              path: requestPath,
              timestamp: now,
              userAgent: req.headers['user-agent'] || 'unknown'
            });
          } catch (err) {
            console.error('Attack Detector: Error in onTrigger callback:', err.message);
          }

          // Clear hits for this IP after triggering
          hitTracker.delete(ip);
        }
      }

      // Call original end
      return originalEnd.apply(res, args);
    };

    next();
  };
}

module.exports = createAttackDetector;
