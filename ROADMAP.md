# Roadmap

This document outlines the planned features and improvements for simple-proxy-id.

---

## Current Version: v1.1.0

**Released Features:**
- ✅ Standalone HTTP/HTTPS proxy server
- ✅ Express middleware support
- ✅ Fixed target security
- ✅ Logger plugin with daily rotating logs
- ✅ Attack detector plugin for brute force protection
- ✅ Performance optimizations (connection pooling, keep-alive)
- ✅ High performance: ~1,660 req/s with 60ms avg latency

---

## Priority 1 - Critical Features (v1.2.0)

**Focus:** Production readiness and reliability

### 1. Circuit Breaker
- Detect when target server is down or slow
- Automatically stop forwarding requests temporarily
- Configurable failure threshold and timeout
- Auto-recovery when target is back online
- Prevents cascade failures

**Use case:** Protect proxy from overloading when backend is struggling

### 2. Health Check
- Periodic health check to target server
- Configurable interval and timeout
- HTTP/HTTPS endpoint monitoring
- Auto-detect target availability
- Integrate with circuit breaker

**Use case:** Proactive monitoring of backend health

### 3. Response Caching
- Cache responses based on URL and method
- Configurable TTL (time-to-live)
- Cache invalidation support
- Memory-based cache (in-memory)
- Reduce load on target server

**Use case:** Improve performance for frequently accessed resources

### 4. Request Size Limiting
- Limit maximum request body size
- Prevent large payload attacks
- Configurable limit per route or globally
- Return 413 (Payload Too Large) when exceeded
- Essential security feature

**Use case:** Protect against DoS attacks with large payloads

### 5. Retry Logic
- Auto-retry failed requests to target
- Configurable retry count and backoff strategy
- Exponential backoff support
- Only retry on safe methods (GET, HEAD, OPTIONS)
- Improve reliability

**Use case:** Handle transient network failures gracefully

---

## Priority 2 - Security Enhancements (v1.3.0)

**Focus:** Advanced security and access control

### 6. IP Whitelist/Blacklist
- Whitelist: Only allow specific IPs
- Blacklist: Block specific IPs
- Support CIDR notation (e.g., 192.168.1.0/24)
- Dynamic IP list management
- Integrate with attack detector

**Use case:** Restrict proxy access to trusted sources

### 7. Request Throttling (Rate Limiting)
- Built-in rate limiting per IP
- Global rate limiting support
- Configurable window and max requests
- Token bucket or sliding window algorithm
- Return 429 (Too Many Requests) when exceeded

**Use case:** Prevent abuse and ensure fair usage

### 8. CORS Plugin
- Cross-Origin Resource Sharing support
- Configurable allowed origins, methods, headers
- Preflight request handling
- Credentials support
- Common requirement for APIs

**Use case:** Enable browser-based API access

### 9. SSL/TLS Termination
- HTTPS proxy server support
- SSL certificate configuration
- Support for Let's Encrypt certificates
- HTTP to HTTPS redirect option
- Secure communication

**Use case:** Terminate SSL at proxy level

---

## Priority 3 - Performance (v1.4.0)

**Focus:** Speed and scalability

### 10. Compression
- gzip compression support
- brotli compression support
- Automatic compression based on Accept-Encoding
- Configurable compression level
- Reduce bandwidth usage

**Use case:** Improve response time for large payloads

### 11. HTTP/2 Support
- HTTP/2 protocol support
- Multiplexing for better performance
- Server push support (optional)
- Backward compatible with HTTP/1.1
- Modern protocol support

**Use case:** Leverage modern browser capabilities

### 12. Clustering
- Multi-process support
- Utilize all CPU cores
- Load balancing across workers
- Graceful restart support
- Horizontal scaling

**Use case:** Handle high traffic with multiple cores

---

## Priority 4 - Advanced Features (v1.5.0)

**Focus:** Enterprise-grade capabilities

### 13. Load Balancing
- Support multiple target servers
- Round-robin algorithm
- Least connections algorithm
- Weighted load balancing
- Health check integration
- Sticky sessions support

**Use case:** Distribute traffic across multiple backends

### 14. WebSocket Support
- Proxy WebSocket connections
- Upgrade request handling
- Bidirectional communication
- Connection persistence
- Real-time application support

**Use case:** Support real-time applications (chat, notifications)

### 15. Request/Response Transformation
- Modify request headers before forwarding
- Modify response headers before sending
- Request body transformation
- Response body transformation
- Plugin-based transformation hooks

**Use case:** Add/remove headers, modify payloads on the fly

---

## Release Timeline

| Version | Priority | Target Date | Status |
|---------|----------|-------------|--------|
| v1.1.0  | Current  | 2025-10-03  | ✅ Released |
| v1.2.0  | Priority 1 | Q1 2026 | 📋 Planned |
| v1.3.0  | Priority 2 | Q2 2026 | 📋 Planned |
| v1.4.0  | Priority 3 | Q3 2026 | 📋 Planned |
| v1.5.0  | Priority 4 | Q4 2026 | 📋 Planned |

---

## Community Feedback

We welcome community input on this roadmap! If you have suggestions or would like to see specific features prioritized, please:

1. Open an issue on GitHub
2. Start a discussion in GitHub Discussions
3. Submit a pull request with your implementation

---

## Contributing

Interested in contributing to these features? Check out our [CONTRIBUTING.md](CONTRIBUTING.md) guide.

---

**Legend:**
- ✅ Released
- 🚧 In Progress
- 📋 Planned
- 💡 Under Consideration
