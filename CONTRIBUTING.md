# Contributing to simple-proxy-id

Thank you for your interest in contributing to `simple-proxy-id`! We welcome contributions from the community.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Plugin Development](#plugin-development)

---

## 📜 Code of Conduct

This project follows a Code of Conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When creating a bug report, include:**
- Clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Node.js version and OS
- Code sample or test case

**Example:**
```markdown
**Bug Description:**
Proxy returns 500 error when target server is unreachable

**Steps to Reproduce:**
1. Create proxy: `createProxy({ target: 'http://localhost:9999', port: 3000 })`
2. Make request: `curl http://localhost:3000/test`
3. Observe error

**Expected:** 502 Bad Gateway
**Actual:** 500 Internal Server Error

**Environment:**
- Node.js: v18.0.0
- OS: Windows 11
- simple-proxy-id: v1.1.0
```

### Suggesting Features

We love feature suggestions! Please check [ROADMAP.md](ROADMAP.md) first to see if it's already planned.

**When suggesting a feature, include:**
- Clear use case and problem it solves
- Proposed API (code examples)
- Alternative solutions you've considered
- Whether you're willing to implement it

**Example:**
```markdown
**Feature Request: Response Caching**

**Use Case:**
Reduce load on backend by caching GET responses

**Proposed API:**
```js
const server = createProxy({
  target: 'http://api.example.com',
  cache: {
    enabled: true,
    ttl: 300,  // 5 minutes
    maxSize: 100
  }
});
```

**Alternatives:**
- External caching layer (Redis)
- CDN caching

**Implementation:**
I'm willing to implement this feature.
```

### Improving Documentation

Documentation improvements are always welcome!

- Fix typos or clarify unclear sections
- Add more examples
- Improve API documentation
- Translate documentation (future)

---

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Git

### Setup Steps

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/simple-proxy-id.git
   cd simple-proxy-id
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Run benchmark** (optional)
   ```bash
   npm run benchmark
   ```

6. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

---

## 📁 Project Structure

```
simple-proxy-id/
├── src/
│   ├── index.js              # Core proxy implementation
│   ├── logger.js             # Logger plugin entry point
│   ├── attack-detector.js    # Attack detector plugin entry point
│   └── plugins/              # Plugin implementations
│       ├── logger.js         # Logger plugin
│       └── attack-detector.js # Attack detector plugin
├── test/
│   ├── index.test.js         # Core proxy tests
│   ├── logger.test.js        # Logger plugin tests
│   └── test-attack-detector.js # Attack detector tests
├── example/
│   ├── standalone.js         # Basic standalone example
│   ├── express.js            # Express middleware example
│   ├── standalone-with-logger.js
│   ├── standalone-with-attack-detector.js
│   └── ...                   # More examples
├── benchmark/
│   └── autocannon-benchmark.js # Performance benchmark
├── index.d.ts                # TypeScript definitions
├── CHANGELOG.md              # Version history
├── ROADMAP.md                # Future plans
├── CONTRIBUTING.md           # This file
└── README.md                 # Main documentation
```

---

## 📝 Coding Guidelines

### Style Guide

We follow standard JavaScript conventions:

**Variables & Functions:**
```js
// Use camelCase
const proxyServer = createProxy();
function forwardRequest() {}

// Use descriptive names
const targetUrl = 'http://api.example.com';  // Good
const t = 'http://api.example.com';          // Bad
```

**Constants:**
```js
// Use UPPER_SNAKE_CASE for true constants
const DEFAULT_PORT = 3000;
const ERROR_TIMEOUT = 'Gateway Timeout';
```

**Private Functions:**
```js
// Prefix with underscore (if not exported)
function _parseTargetUrl(url) {}
function _filterHeaders(headers) {}
```

### Code Quality

- **Keep it simple** - Favor readability over cleverness
- **Zero dependencies** - Core library has zero production dependencies
- **Document complex logic** - Add comments for non-obvious code
- **Error handling** - Use try-catch and provide helpful error messages
- **Performance** - Consider connection pooling and keep-alive

**Example:**
```js
// Good: Clear and documented
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

// Bad: Unclear and undocumented
function fh(h) {
  const f = {};
  for (const [k, v] of Object.entries(h)) {
    if (!BH.includes(k.toLowerCase())) f[k] = v;
  }
  return f;
}
```

### JSDoc Comments

Add JSDoc comments for all public functions and methods:

```js
/**
 * Create standalone HTTP/HTTPS proxy server
 * @param {Object} options - Proxy configuration
 * @param {string} options.target - Target URL to proxy (required, fixed)
 * @param {boolean} options.changeOrigin - Set Host header to target (default: false)
 * @param {number} options.port - Port for proxy server (default: 3000)
 * @returns {http.Server} HTTP Server instance
 */
function createProxy(options = {}) {
    // Implementation
}
```

---

## 🧪 Testing Guidelines

### Writing Tests

- Every feature must have tests
- Every bug fix must have a regression test
- Aim for high code coverage (>80%)

**Test Structure:**
```js
describe("Feature Name", () => {
    let proxyServer;
    let targetServer;

    beforeAll(() => {
        // Setup target server
        targetServer = http.createServer((req, res) => {
            res.writeHead(200);
            res.end('OK');
        });
        targetServer.listen(9000);
    });

    afterAll(() => {
        // Cleanup
        if (proxyServer) proxyServer.close();
        if (targetServer) targetServer.close();
    });

    it("should forward requests to target", async () => {
        // Arrange
        proxyServer = createProxy({
            target: 'http://localhost:9000',
            port: 9001
        });

        // Act
        const response = await request('http://localhost:9001').get('/test');

        // Assert
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('OK');
    });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Naming

- Use descriptive test names
- Follow pattern: "should [expected behavior] when [condition]"

```js
// Good
it("should return 200 when target is reachable", () => {});
it("should return 504 on timeout", () => {});
it("should preserve request headers", () => {});

// Bad
it("works", () => {});
it("test proxy", () => {});
```

---

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `perf` - Performance improvements
- `chore` - Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat: add response caching support"
git commit -m "feat(logger): add JSON format option"

# Bug fix
git commit -m "fix: prevent connection leak on timeout"
git commit -m "fix(attack-detector): handle undefined user-agent"

# Performance
git commit -m "perf: optimize header filtering"

# Documentation
git commit -m "docs: update README with caching examples"

# Test
git commit -m "test: add tests for circuit breaker"

# Refactor
git commit -m "refactor: simplify middleware chaining"
```

### Commit Message Body

For complex changes, add a body:

```
feat: add circuit breaker support

Implements circuit breaker pattern to prevent cascade failures.
Automatically stops forwarding when target is down.

- Add circuit breaker plugin
- Configurable failure threshold
- Auto-recovery support
- Add tests and documentation
```

---

## 🔄 Pull Request Process

### Before Submitting

1. ✅ **Tests pass** - `npm test` succeeds
2. ✅ **Code is formatted** - Follow style guide
3. ✅ **Documentation updated** - Update README if needed
4. ✅ **Commits follow guidelines** - Use conventional commits
5. ✅ **Branch is up to date** - Rebase on latest main

### PR Checklist

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Performance improvement
- [ ] Documentation update

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally
- [ ] I have checked my code and corrected any misspellings
```

### PR Title

Follow conventional commits format:

```
feat: add response caching
fix: prevent memory leak in connection pool
docs: improve attack detector documentation
perf: optimize URL parsing
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, PR will be merged
4. Your contribution will be included in the next release

---

## 🔌 Plugin Development

### Plugin Guidelines

Plugins should:
- ✅ Be self-contained
- ✅ Work as middleware (req, res, next)
- ✅ Have their own tests
- ✅ Be well-documented
- ✅ Follow the same coding standards

### Plugin Structure

```js
// src/plugins/example-plugin.js

/**
 * Example Plugin
 * @param {Object} options - Plugin configuration
 * @returns {Function} Middleware function
 */
function createExamplePlugin(options = {}) {
    const { customOption } = options;

    // Return middleware function
    return (req, res, next) => {
        // Plugin logic
        console.log('Example plugin:', customOption);

        // Call next to continue middleware chain
        next();
    };
}

module.exports = createExamplePlugin;
```

### Plugin Entry Point

Create entry point for easy require:

```js
// src/example-plugin.js
module.exports = require('./plugins/example-plugin');
```

### Plugin Testing

Create separate test file:

```js
// test/example-plugin.test.js

const createExamplePlugin = require('../src/example-plugin');

describe('Example Plugin', () => {
    it('should work as middleware', () => {
        const plugin = createExamplePlugin({ customOption: 'value' });

        // Test implementation
    });
});
```

### Plugin Documentation

Add plugin documentation to README:

```markdown
### Example Plugin

Description of what the plugin does.

**Usage:**
```js
const createExamplePlugin = require('simple-proxy-id/example-plugin');

const examplePlugin = createExamplePlugin({
    customOption: 'value'
});

// Use with Express
app.use(examplePlugin);

// Or with standalone
const server = createProxy({
    target: 'http://api.example.com',
    plugins: [examplePlugin]  // Future feature
});
```

**Options:**
- `customOption` - Description of option
```

---

## 🎯 Priority Areas

We especially welcome contributions in these areas (see [ROADMAP.md](ROADMAP.md)):

### High Priority (v1.2.0)
- [ ] Circuit breaker implementation
- [ ] Health check plugin
- [ ] Response caching
- [ ] Request size limiting
- [ ] Retry logic

### Medium Priority (v1.3.0)
- [ ] IP whitelist/blacklist
- [ ] Rate limiting plugin
- [ ] CORS plugin
- [ ] SSL/TLS termination

### Performance (v1.4.0)
- [ ] Compression support
- [ ] HTTP/2 support
- [ ] Clustering

---

## 📞 Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/ibnushahraa/simple-proxy-id/discussions)
- **Bug reports?** Open an [Issue](https://github.com/ibnushahraa/simple-proxy-id/issues)
- **Need help with PR?** Tag maintainers in your PR comments

---

## 🙏 Recognition

Contributors will be recognized in:
- CHANGELOG.md for their contributions
- README.md contributors section (coming soon)
- GitHub contributors page

---

## 📜 License

By contributing to `simple-proxy-id`, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
