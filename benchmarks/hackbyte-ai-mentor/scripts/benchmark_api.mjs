import autocannon from 'autocannon';
import fs from 'fs';

console.log('=== STARTING HTTP API BENCHMARKS (AUTOCANNON) ===\n');

async function runAutocannon(options) {
  return new Promise((resolve, reject) => {
    autocannon(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function run() {
  const tests = [
    { name: 'root_c10', title: 'GET / (Concurrency=10)', connections: 10, duration: 10, url: 'http://localhost:3000/' },
    { name: 'root_c50', title: 'GET / (Concurrency=50)', connections: 50, duration: 10, url: 'http://localhost:3000/' },
    { name: 'root_c100', title: 'GET / (Concurrency=100)', connections: 100, duration: 10, url: 'http://localhost:3000/' },
    { 
      name: 'api_submit_validation_c10', 
      title: 'POST /api/code/submit validation (Concurrency=10)', 
      connections: 10, 
      duration: 10, 
      url: 'http://localhost:3000/api/code/submit',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '', language: 0 }) // triggers fast 400 validation error boundary
    },
    { 
      name: 'api_submit_validation_c50', 
      title: 'POST /api/code/submit validation (Concurrency=50)', 
      connections: 50, 
      duration: 10, 
      url: 'http://localhost:3000/api/code/submit',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '', language: 0 })
    }
  ];

  const results = {};

  for (const t of tests) {
    console.log(`Running: ${t.title}...`);
    const res = await runAutocannon({
      url: t.url,
      connections: t.connections,
      duration: t.duration,
      method: t.method || 'GET',
      headers: t.headers,
      body: t.body
    });

    results[t.name] = {
      title: t.title,
      connections: t.connections,
      duration_seconds: t.duration,
      total_requests: res.requests.total,
      req_per_sec_mean: res.requests.average,
      req_per_sec_p50: res.requests.p50,
      req_per_sec_p99: res.requests.p99,
      latency_p50_ms: res.latency.p50,
      latency_p95_ms: res.latency.p97_5, // autocannon gives p97_5
      latency_p99_ms: res.latency.p99,
      latency_mean_ms: res.latency.average,
      latency_min_ms: res.latency.min,
      latency_max_ms: res.latency.max,
      errors: res.errors,
      timeouts: res.timeouts,
      non2xx_responses: res.non2xx
    };

    console.log(`  -> Req/sec: ${res.requests.average.toFixed(1)}, Latency p50: ${res.latency.p50}ms, p99: ${res.latency.p99}ms, Total: ${res.requests.total} reqs`);
  }

  fs.writeFileSync(
    'benchmarks/hackbyte-ai-mentor/raw_outputs/api_benchmarks.json',
    JSON.stringify(results, null, 2),
    'utf8'
  );

  console.log('\n=== ALL API BENCHMARKS COMPLETED ===');
}

run().catch(console.error);
