/**
 * MotionCore — Detector Evaluation
 * ----------------------------------
 * Run: node tests/evaluate.js
 *
 * This is the script you'll use once you've collected real labeled
 * sequences (see docs/CALIBRATION.md). Right now it runs on a tiny
 * synthetic example just to prove the pipeline works end-to-end —
 * the numbers below are NOT real accuracy claims.
 *
 * Replace `syntheticData` with sequences loaded from your own
 * recorded JSON exports once you have them.
 */
import { evaluateDetector } from '../core/motion-engine.js';

function makeFlatSequence(g, durationMs = 3000, intervalMs = 50) {
  const samples = [];
  for (let t = 0; t < durationMs; t += intervalMs) {
    samples.push({ x: g, y: 0, z: 1, t });
  }
  return samples;
}

function makeFallSequence() {
  // Walking (~1.1g noise) -> impact spike -> stillness
  const samples = [];
  let t = 0;
  for (let i = 0; i < 20; i++, t += 50) {
    samples.push({ x: 0.1 + Math.random() * 0.1, y: 0, z: 1.1, t });
  }
  samples.push({ x: 4.0, y: 0, z: 1, t }); // impact (magnitude ≈ 3.1g, clears 2.5g threshold)
  t += 50;
  for (let i = 0; i < 30; i++, t += 50) {
    samples.push({ x: 0.02, y: 0, z: 1.0, t }); // stillness
  }
  return samples;
}

function makeActiveSequence() {
  // High motion throughout, e.g. jogging — should NOT trigger
  const samples = [];
  let t = 0;
  for (let i = 0; i < 60; i++, t += 50) {
    samples.push({ x: 0.3 + Math.random() * 1.0, y: 0.2, z: 1.2, t });
  }
  return samples;
}

const syntheticData = [
  { label: 'fall', samples: makeFallSequence() },
  { label: 'fall', samples: makeFallSequence() },
  { label: 'normal', samples: makeActiveSequence() },
  { label: 'normal', samples: makeActiveSequence() },
  { label: 'normal', samples: makeFlatSequence(0.05) },
];

const results = evaluateDetector(syntheticData);

console.log('--- MotionCore Detector Evaluation (SYNTHETIC DATA — not real accuracy) ---');
console.log(results);
console.log('\nReplace syntheticData in this file with real recorded sequences before');
console.log('citing any accuracy numbers publicly.');
