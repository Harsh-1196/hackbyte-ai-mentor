import { spawnSync } from 'child_process';
import fs from 'fs';
import { performance } from 'perf_hooks';

console.log('=== STARTING BUILD BENCHMARK (N=3) ===');

const runs = 3;
const durations = [];
let lastStdout = '';

for (let i = 1; i <= runs; i++) {
  console.log(`\n--- Build Run ${i}/${runs} ---`);
  const start = performance.now();
  const res = spawnSync('cmd.exe', ['/c', 'npm.cmd run build'], {
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024
  });
  const duration = (performance.now() - start) / 1000;
  durations.push(duration);
  console.log(`Run ${i} completed in ${duration.toFixed(2)}s with exit code ${res.status}`);
  if (res.status !== 0) {
    console.error(`Build failed in run ${i}:`, res.stderr);
  }
  lastStdout = res.stdout;
}

durations.sort((a, b) => a - b);
const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
const median = durations[Math.floor(durations.length / 2)];
const min = durations[0];
const max = durations[durations.length - 1];

// Parse route table from last build output
const routeLines = [];
const lines = lastStdout.split('\n');
let capturing = false;
for (const line of lines) {
  if (line.includes('Route (app)')) {
    capturing = true;
  }
  if (capturing) {
    routeLines.push(line);
    if (line.includes('First Load JS shared by all')) {
      capturing = false;
    }
  }
}

const result = {
  sample_size: runs,
  durations_seconds: durations,
  mean_seconds: mean,
  median_seconds: median,
  min_seconds: min,
  max_seconds: max,
  route_table: routeLines.join('\n')
};

fs.writeFileSync(
  'benchmarks/hackbyte-ai-mentor/raw_outputs/build_benchmark.json',
  JSON.stringify(result, null, 2),
  'utf8'
);

console.log('\n=== BUILD BENCHMARK SUMMARY ===');
console.log(`Runs: ${runs}`);
console.log(`Durations: ${durations.map(d => d.toFixed(2) + 's').join(', ')}`);
console.log(`Mean: ${mean.toFixed(2)}s`);
console.log(`Median: ${median.toFixed(2)}s`);
console.log(`Min: ${min.toFixed(2)}s`);
console.log(`Max: ${max.toFixed(2)}s`);
