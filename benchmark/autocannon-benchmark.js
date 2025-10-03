const http = require('http');
const autocannon = require('autocannon');
const { createProxy } = require('../src/index');

console.log('=== Autocannon Benchmark - Simple Proxy ===\n');

// Create a simple mock backend server
const backendServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello from backend', timestamp: Date.now() }));
});

backendServer.listen(9000, () => {
  console.log('Backend server running on port 9000');

  // Create proxy server
  const proxyServer = createProxy({
    target: 'http://localhost:9000',
    changeOrigin: true,
    port: 9001
  });

  console.log('\nStarting autocannon benchmark in 2 seconds...\n');

  setTimeout(() => {
    runBenchmark();
  }, 2000);
});

function runBenchmark() {
  console.log('Benchmark Configuration:');
  console.log('- Duration: 10 seconds');
  console.log('- Connections: 100');
  console.log('- Pipelining: 1');
  console.log('- Target: http://localhost:9001\n');
  console.log('Running autocannon...\n');

  const instance = autocannon({
    url: 'http://localhost:9001',
    connections: 100,        // Number of concurrent connections
    pipelining: 1,           // Number of pipelined requests
    duration: 10,            // Duration in seconds
    timeout: 10              // Request timeout in seconds
  }, (err, result) => {
    if (err) {
      console.error('Benchmark error:', err);
      process.exit(1);
    }

    console.log('\n========================================');
    console.log('Autocannon Benchmark Results');
    console.log('========================================');
    console.log(`Duration: ${result.duration}s`);
    console.log(`Total Requests: ${result.requests.total}`);
    console.log(`Requests/sec: ${result.requests.average}`);
    console.log(`Bytes/sec: ${formatBytes(result.throughput.average)}`);
    console.log('\nLatency (ms):');
    console.log(`- Average: ${result.latency.mean}ms`);
    console.log(`- Median (p50): ${result.latency.p50}ms`);
    console.log(`- p75: ${result.latency.p75}ms`);
    console.log(`- p90: ${result.latency.p90}ms`);
    console.log(`- p95: ${result.latency.p95}ms`);
    console.log(`- p99: ${result.latency.p99}ms`);
    console.log(`- p99.9: ${result.latency.p999}ms`);
    console.log(`- Max: ${result.latency.max}ms`);
    console.log('\nErrors:');
    console.log(`- Total: ${result.errors}`);
    console.log(`- Timeouts: ${result.timeouts}`);
    console.log('========================================\n');

    process.exit(0);
  });

  // Track progress
  autocannon.track(instance, {
    renderProgressBar: true,
    renderResultsTable: false
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B/s';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB/s';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB/s';
}
