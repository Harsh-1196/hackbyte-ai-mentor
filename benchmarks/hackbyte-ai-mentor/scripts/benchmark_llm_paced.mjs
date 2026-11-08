import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import { performance } from 'perf_hooks';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const prompts = [
  'Explain how hash map collision resolution works with chaining vs open addressing in 2 concise sentences.',
  'What is the time complexity of building a binary heap from an array using Floyds build-heap algorithm and why?',
  'Explain how Redis achieves single-threaded high throughput using I/O multiplexing in 2 sentences.',
  'What is the difference between optimistic and pessimistic locking in database transaction isolation?',
  'Explain how consistent hashing minimizes key remapping when cache nodes are added or removed.'
];

async function run() {
  console.log('=== RUNNING PACED LLM BENCHMARK (N=5, 14s spacing to respect 5 RPM Free Tier Quota) ===');
  const results = [];
  const latencies = [];

  for (let i = 0; i < prompts.length; i++) {
    console.log(`Prompt ${i + 1}/${prompts.length}...`);
    const start = performance.now();
    try {
      const resp = await textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompts[i] }] }],
        generationConfig: { maxOutputTokens: 250, temperature: 0.1 }
      });
      const latency = performance.now() - start;
      const text = resp.response.text();
      latencies.push(latency);
      results.push({ prompt: prompts[i], latency_ms: latency, status: 'SUCCESS', length: text.length });
      console.log(`-> SUCCESS in ${latency.toFixed(0)}ms (${text.length} chars)`);
    } catch (e) {
      const latency = performance.now() - start;
      results.push({ prompt: prompts[i], latency_ms: latency, status: 'ERROR', error: e.message });
      console.log(`-> ERROR: ${e.message}`);
    }

    if (i < prompts.length - 1) {
      console.log('Waiting 14s for quota reset...');
      await new Promise(r => setTimeout(r, 14000));
    }
  }

  latencies.sort((a, b) => a - b);
  const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const median = latencies[Math.floor(latencies.length / 2)];
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  const summary = {
    sample_size: prompts.length,
    success_rate_percent: (latencies.length / prompts.length) * 100,
    mean_ms: mean,
    median_ms: median,
    min_ms: min,
    max_ms: max,
    p95_ms: p95,
    results
  };

  fs.writeFileSync(
    'benchmarks/hackbyte-ai-mentor/raw_outputs/llm_paced_benchmark.json',
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  console.log('Finished paced benchmark:', summary);
}

run();
