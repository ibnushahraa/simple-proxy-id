const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Headers that should not be forwarded to target
 * These headers can cause issues or security problems
 */
const BLOCKED_HEADERS = [
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'proxy-connection',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer'
];

/**
 * Filter and sanitize headers before forwarding
 * @param {Object} headers - Original headers
 * @returns {Object} Filtered headers
 */
function filterHeaders(headers) {
  const filtered = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    // Skip blocked headers
    if (BLOCKED_HEADERS.includes(lowerKey)) {
      continue;
    }

    // Copy safe headers
    filtered[key] = value;
  }

  return filtered;
}

/**
 * Helper: Forward request to target without dependencies
 */
function forwardRequest(clientReq, clientRes, targetUrl, changeOrigin = false) {
  const target = new URL(targetUrl);
  const isHttps = target.protocol === 'https:';

  // Prepare options for target request
  const options = {
    hostname: target.hostname,
    port: target.port || (isHttps ? 443 : 80),
    path: clientReq.url,
    method: clientReq.method,
    headers: filterHeaders(clientReq.headers)
  };

  // Change origin if requested
  if (changeOrigin) {
    options.headers.host = target.host;
  } else {
    // Remove host header from client to avoid conflicts
    delete options.headers.host;
  }

  // Choose http or https
  const protocol = isHttps ? https : http;

  // Create request to target
  const proxyReq = protocol.request(options, (proxyRes) => {
    // Forward status and headers from target to client
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Stream response body from target to client
    proxyRes.pipe(clientRes);
  });

  // Set timeout for proxy request (30 seconds)
  proxyReq.setTimeout(30000, () => {
    console.error('Proxy Error: Request timeout');
    proxyReq.destroy();

    if (!clientRes.headersSent) {
      clientRes.writeHead(504, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({
        error: 'Gateway Timeout',
        message: 'Target server took too long to respond'
      }));
    }
  });

  // Error handling
  proxyReq.on('error', (err) => {
    console.error('Proxy Error:', err.message);

    if (!clientRes.headersSent) {
      clientRes.writeHead(500, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({
        error: 'Proxy Error',
        message: 'An error occurred during proxy request'
      }));
    }
  });

  // Stream request body from client to target
  clientReq.pipe(proxyReq);
}

/**
 * Create standalone HTTP/HTTPS proxy server
 * @param {Object} options - Proxy configuration
 * @param {string} options.target - Target URL to proxy (required, fixed)
 * @param {boolean} options.changeOrigin - Set Host header to target (default: false)
 * @param {number} options.port - Port for proxy server (default: 3000)
 * @param {Object} options.logger - Logger configuration (optional)
 * @param {string} options.logger.logDir - Directory to store log files (default: './logs')
 * @param {number} options.logger.maxDays - Maximum days to keep logs (default: 7)
 * @returns {http.Server} HTTP Server instance
 */
function createProxy(options = {}) {
  if (!options.target) {
    throw new Error('Target URL is required');
  }

  const {
    target,
    changeOrigin = false,
    port = 3000,
    logger: loggerOptions
  } = options;

  // Validate target is a valid URL
  try {
    new URL(target);
  } catch (err) {
    throw new Error('Target must be a valid URL');
  }

  // Setup logger if enabled
  let loggerMiddleware = null;
  if (loggerOptions) {
    const createLogger = require('./plugins/logger');
    loggerMiddleware = createLogger(loggerOptions);
  }

  // Create HTTP server
  const server = http.createServer((req, res) => {
    // Apply logger middleware if enabled
    if (loggerMiddleware) {
      loggerMiddleware(req, res, () => {
        forwardRequest(req, res, target, changeOrigin);
      });
    } else {
      forwardRequest(req, res, target, changeOrigin);
    }
  });

  // Start server
  server.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
    console.log(`Forwarding requests to: ${target}`);
    if (loggerOptions) {
      console.log(`Logger enabled: ${loggerOptions.logDir || './logs'}`);
    }
  });

  return server;
}

/**
 * Create Express middleware for proxy
 * @param {Object} options - Proxy configuration
 * @param {string} options.target - Target URL to proxy (required, fixed)
 * @param {boolean} options.changeOrigin - Set Host header to target (default: false)
 * @returns {Function} Express middleware function
 */
function createProxyMiddleware(options = {}) {
  if (!options.target) {
    throw new Error('Target URL is required');
  }

  const {
    target,
    changeOrigin = false
  } = options;

  // Validate target is a valid URL
  try {
    new URL(target);
  } catch (err) {
    throw new Error('Target must be a valid URL');
  }

  // Return middleware function
  return (req, res, next) => {
    // Override res.status and res.json for Express compatibility
    const originalEnd = res.end;
    const errorHandler = (err) => {
      console.error('Proxy Error:', err.message);

      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Proxy Error',
          message: 'An error occurred during proxy request'
        }));
      }
    };

    try {
      forwardRequest(req, res, target, changeOrigin);

      // Intercept error from forwardRequest
      res.on('error', errorHandler);
    } catch (err) {
      errorHandler(err);
    }
  };
}

module.exports = {
  createProxy,
  createProxyMiddleware
};
