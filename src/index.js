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

// Create HTTP/HTTPS agents with keep-alive for connection pooling
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  maxFreeSockets: 256,
  timeout: 30000
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  maxFreeSockets: 256,
  timeout: 30000
});

// Pre-compute error responses for better performance
const ERROR_TIMEOUT = JSON.stringify({
  error: 'Gateway Timeout',
  message: 'Target server took too long to respond'
});

const ERROR_PROXY = JSON.stringify({
  error: 'Proxy Error',
  message: 'An error occurred during proxy request'
});

/**
 * Helper: Forward request to target without dependencies (optimized)
 * @param {Object} clientReq - Client request
 * @param {Object} clientRes - Client response
 * @param {Object} targetParsed - Pre-parsed target URL
 * @param {boolean} changeOrigin - Whether to change origin header
 * @param {Object} agent - HTTP/HTTPS agent for connection pooling
 */
function forwardRequest(clientReq, clientRes, targetParsed, changeOrigin, agent) {
  // Prepare options for target request
  const options = {
    hostname: targetParsed.hostname,
    port: targetParsed.port,
    path: clientReq.url,
    method: clientReq.method,
    headers: filterHeaders(clientReq.headers),
    agent: agent
  };

  // Change origin if requested
  if (changeOrigin) {
    options.headers.host = targetParsed.host;
  } else {
    // Remove host header from client to avoid conflicts
    delete options.headers.host;
  }

  // Choose http or https
  const protocol = targetParsed.isHttps ? https : http;

  // Create request to target
  const proxyReq = protocol.request(options, (proxyRes) => {
    // Forward status and headers from target to client
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Stream response body from target to client
    proxyRes.pipe(clientRes);
  });

  // Enable TCP_NODELAY for lower latency
  proxyReq.setNoDelay(true);

  // Set timeout for proxy request (30 seconds)
  proxyReq.setTimeout(30000, () => {
    console.error('Proxy Error: Request timeout');
    proxyReq.destroy();

    if (!clientRes.headersSent) {
      clientRes.writeHead(504, { 'Content-Type': 'application/json' });
      clientRes.end(ERROR_TIMEOUT);
    }
  });

  // Error handling
  proxyReq.on('error', (err) => {
    console.error('Proxy Error:', err.message);

    if (!clientRes.headersSent) {
      clientRes.writeHead(500, { 'Content-Type': 'application/json' });
      clientRes.end(ERROR_PROXY);
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
 * @param {Object|Array} options.attackDetector - Attack detector configuration (optional, single or array)
 * @param {string|RegExp} options.attackDetector.path - Path to monitor
 * @param {number} options.attackDetector.statusCode - Status code to monitor
 * @param {number} options.attackDetector.threshold - Max hits before trigger
 * @param {number} options.attackDetector.timeWindow - Time window in ms
 * @param {Function} options.attackDetector.onTrigger - Callback function
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
    logger: loggerOptions,
    attackDetector: attackDetectorOptions
  } = options;

  // Parse and cache target URL (performance optimization)
  let targetParsed;
  try {
    const targetUrl = new URL(target);
    const isHttps = targetUrl.protocol === 'https:';
    targetParsed = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      host: targetUrl.host,
      isHttps: isHttps
    };
  } catch (err) {
    throw new Error('Target must be a valid URL');
  }

  // Select appropriate agent based on protocol (performance optimization)
  const agent = targetParsed.isHttps ? httpsAgent : httpAgent;

  // Setup logger if enabled
  let loggerMiddleware = null;
  if (loggerOptions) {
    const createLogger = require('./logger');
    loggerMiddleware = createLogger(loggerOptions);
  }

  // Setup attack detector(s) if enabled
  let attackDetectorMiddlewares = [];
  if (attackDetectorOptions) {
    const createAttackDetector = require('./attack-detector');
    const detectors = Array.isArray(attackDetectorOptions) ? attackDetectorOptions : [attackDetectorOptions];
    attackDetectorMiddlewares = detectors.map(opts => createAttackDetector(opts));
  }

  // Create HTTP server
  const server = http.createServer((req, res) => {
    // Chain middlewares: logger -> attack detectors -> proxy
    let index = 0;

    const next = () => {
      // Apply logger first
      if (index === 0 && loggerMiddleware) {
        index++;
        return loggerMiddleware(req, res, next);
      }

      // Apply attack detectors
      const detectorIndex = loggerMiddleware ? index - 1 : index;
      if (detectorIndex < attackDetectorMiddlewares.length) {
        index++;
        return attackDetectorMiddlewares[detectorIndex](req, res, next);
      }

      // Finally, forward request with cached target and agent
      forwardRequest(req, res, targetParsed, changeOrigin, agent);
    };

    next();
  });

  // Start server
  server.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
    console.log(`Forwarding requests to: ${target}`);
    if (loggerOptions) {
      console.log(`Logger enabled: ${loggerOptions.logDir || './logs'}`);
    }
    if (attackDetectorOptions) {
      const count = Array.isArray(attackDetectorOptions) ? attackDetectorOptions.length : 1;
      console.log(`Attack detector enabled: ${count} detector(s)`);
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

  // Parse and cache target URL (performance optimization)
  let targetParsed;
  try {
    const targetUrl = new URL(target);
    const isHttps = targetUrl.protocol === 'https:';
    targetParsed = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      host: targetUrl.host,
      isHttps: isHttps
    };
  } catch (err) {
    throw new Error('Target must be a valid URL');
  }

  // Select appropriate agent based on protocol (performance optimization)
  const agent = targetParsed.isHttps ? httpsAgent : httpAgent;

  // Return middleware function
  return (req, res, next) => {
    // Override res.status and res.json for Express compatibility
    const originalEnd = res.end;
    const errorHandler = (err) => {
      console.error('Proxy Error:', err.message);

      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(ERROR_PROXY);
      }
    };

    try {
      forwardRequest(req, res, targetParsed, changeOrigin, agent);

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
