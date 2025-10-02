# simple-proxy-id

[![npm version](https://img.shields.io/npm/v/simple-proxy-id.svg?style=flat-square)](https://www.npmjs.com/package/simple-proxy-id)
[![npm downloads](https://img.shields.io/npm/dm/simple-proxy-id.svg?style=flat-square)](https://www.npmjs.com/package/simple-proxy-id)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![CI](https://github.com/ibnushahraa/simple-proxy-id/actions/workflows/test.yml/badge.svg)](https://github.com/ibnushahraa/simple-proxy-id/actions)

🔒 A **secure HTTP/HTTPS proxy** for Node.js with **zero dependencies** and **fixed target**.
Think of it as a **safe reverse proxy** that prevents open proxy abuse.

---

## ✨ Features

- Standalone HTTP/HTTPS proxy server.
- Express middleware for proxy.
- Fixed target (secure by default, cannot be changed from requests).
- Optional `changeOrigin` to set Host header.
- Automatic error handling.
- Logger plugin with daily rotating logs.
- IP detection (Cloudflare Tunnel compatible).
- TypeScript definitions included.
- Zero dependencies.

---

## 📦 Installation

```bash
npm install simple-proxy-id
```

---

## 🚀 Usage

### Basic Usage (Standalone)

```js
const { createProxy } = require('simple-proxy-id');

// Create proxy server
const server = createProxy({
  target: 'https://jsonplaceholder.typicode.com',
  changeOrigin: true,
  port: 3000
});

// Access: http://localhost:3000/posts
```

### Express Middleware

```js
const express = require('express');
const { createProxyMiddleware } = require('simple-proxy-id');

const app = express();

// Proxy for path /api/*
app.use('/api', createProxyMiddleware({
  target: 'https://jsonplaceholder.typicode.com',
  changeOrigin: true
}));

app.listen(3000);

// Access: http://localhost:3000/api/posts
```

### With Logger Plugin

```js
const express = require('express');
const { createProxyMiddleware } = require('simple-proxy-id');
const createLogger = require('simple-proxy-id/src/plugins/logger');

const app = express();

// Enable request logging
app.use(createLogger({
  logDir: './logs',
  maxDays: 7
}));

app.use('/api', createProxyMiddleware({
  target: 'https://jsonplaceholder.typicode.com',
  changeOrigin: true
}));

app.listen(3000);
```

## 🧪 Testing

```bash
npm test
```

Jest is used for testing. All tests must pass before publishing.

---

## 📂 Project Structure

```
src/       → main source code
  plugins/ → logger plugin
test/      → jest test suite
example/   → usage examples
```

---

## 📜 API

### `createProxy(options)`

Create a standalone HTTP/HTTPS proxy server.

**Parameters:**
- `target` (string, required): Target URL to proxy
- `changeOrigin` (boolean, optional): Set Host header to target (default: false)
- `port` (number, optional): Port for proxy server (default: 3000)

**Returns:** `http.Server` instance

**Example:**
```js
const server = createProxy({
  target: 'https://api.example.com',
  changeOrigin: true,
  port: 8080
});
```

### `createProxyMiddleware(options)`

Create Express middleware for proxy.

**Parameters:**
- `target` (string, required): Target URL to proxy
- `changeOrigin` (boolean, optional): Set Host header to target (default: false)

**Returns:** Express middleware function

**Example:**
```js
app.use('/api', createProxyMiddleware({
  target: 'https://api.github.com',
  changeOrigin: true
}));
```

### `createLogger(options)`

Create logger middleware for tracking requests.

**Parameters:**
- `logDir` (string, optional): Directory to store log files (default: './logs')
- `maxDays` (number, optional): Days to keep logs before auto-cleanup (default: 7)

**Returns:** Express/Connect middleware function

**Example:**
```js
const createLogger = require('simple-proxy-id/src/plugins/logger');

app.use(createLogger({
  logDir: './logs',
  maxDays: 14
}));
```

**Log Format:**
```
[2025-10-02 14:30:45] 192.168.1.100 GET /api/users 200 125ms
```

**Features:**
- Daily rotating log files (YYYY-MM-DD.log)
- Captures real IP (supports Cloudflare Tunnel)
- Automatic cleanup of old logs
- Zero dependencies

---

## 🔒 Security

This library is designed with **security-first principles**:

**The proxy target is fixed in code and cannot be changed by external requests.**

| Attack Vector | Protected |
|--------------|-----------|
| Request headers manipulation | ✅ |
| Query string injection | ✅ |
| Request body tampering | ✅ |
| Open proxy abuse | ✅ |

**IP Detection Priority (Logger Plugin):**

When logging requests, the logger detects the real client IP in this order:
1. `CF-Connecting-IP` header (Cloudflare Tunnel)
2. `X-Forwarded-For` header (Proxy/Load Balancer)
3. `X-Real-IP` header (Nginx proxy)
4. `socket.remoteAddress` (Direct connection)

---

## 📄 License

[MIT](LICENSE) © 2025
