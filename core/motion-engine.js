/**
 * MotionCore — Detection Engine
 * -------------------------------
 * Pure logic, zero DOM dependencies. This file does not know it's running
 * in a browser. That's deliberate: it should be portable to a native
 * Android/iOS shell or a backend simulator later without rewrites.
 *
 * ALGORITHM (Human Safety / Fall mode)
 * -------------------------------------
 * This is NOT a single-threshold check. Real fall detection looks for a
 * *pattern* across time, because a single high-acceleration spike alone is
 * a terrible signal — slamming a phone on a table or dropping into a chair
 * triggers it just as easily as a fall.
 *
 * The pattern we look for:
 *   1. IMPACT  — a short, sharp spike in acceleration magnitude above a
 *                threshold (a hit / sudden stop).
 *   2. STILLNESS — a period of unusually low motion variation immediately
 *                  after the impact (a person who fell and isn't moving
 *                  much, vs. someone who just set the phone down and kept
 *                  walking).
 *
 * Only IMPACT + STILLNESS together raise an alert. This cuts false
 * positives dramatically compared to a single threshold, though it is
 * still a heuristic, not a validated medical-grade detector — see
 * docs/LIMITATIONS.md.
 */

export const Mode = {
  HUMAN_SAFETY: 'human_safety',
};

// Tunable parameters. Keep these named and centralized — do not hardcode
// magic numbers inline elsewhere. These starting values are reasonable
// defaults based on published fall-detection literature, NOT validated
// against your own collected data yet. Calibrate after Phase 1 data
// collection (see docs/CALIBRATION.md).
export const DEFAULT_CONFIG = {
  sampleWindowMs: 5000, // analysis window length
  impactThresholdG: 2.5, // magnitude (in g) spike considered a potential impact
  stillnessWindowMs: 1500, // how long to watch for stillness after an impact
  stillnessVarianceThreshold: 0.15, // max variance (in g) to count as "still"
  cancelWindowMs: 15000, // time the user has to cancel a false alarm
};

/**
 * Computes magnitude from raw x/y/z accelerometer values and removes the
 * ~1g constant due to gravity (rough static estimate, not a true
 * gravity-isolation filter — a low-pass filter would be more accurate and
 * is a good Phase 2 improvement).
 */
export function computeMagnitude(x, y, z) {
  const raw = Math.sqrt(x * x + y * y + z * z);
  return Math.abs(raw - 1.0); // 1g ≈ Earth's gravity at rest
}

/**
 * Rolling statistics over a window of magnitude samples.
 */
export function computeWindowStats(samples) {
  if (samples.length === 0) {
    return { mean: 0, peak: 0, variance: 0 };
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const peak = Math.max(...samples);
  const variance =
    samples.reduce((sum, s) => sum + (s - mean) ** 2, 0) / samples.length;
  return { mean, peak, variance };
}

/**
 * Stateful detector. Feed it samples over time via addSample(); it tracks
 * whether we're mid-impact-check and returns an event when a full
 * impact+stillness pattern completes.
 */
export class FallDetector {
  constructor(config = DEFAULT_CONFIG) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.state = 'WATCHING'; // WATCHING -> IMPACT_DETECTED -> (CONFIRMED | WATCHING)
    this.impactTimestamp = null;
    this.postImpactSamples = [];
  }

  /**
   * @param {number} x,y,z - raw accelerometer values
   * @param {number} timestamp - ms
   * @returns {null | {type: 'fall_candidate', magnitude: number, timestamp: number}}
   */
  addSample(x, y, z, timestamp) {
    const magnitude = computeMagnitude(x, y, z);

    if (this.state === 'WATCHING') {
      if (magnitude >= this.config.impactThresholdG) {
        this.state = 'IMPACT_DETECTED';
        this.impactTimestamp = timestamp;
        this.postImpactSamples = [];
      }
      return null;
    }

    if (this.state === 'IMPACT_DETECTED') {
      this.postImpactSamples.push(magnitude);
      const elapsed = timestamp - this.impactTimestamp;

      if (elapsed >= this.config.stillnessWindowMs) {
        const { variance } = computeWindowStats(this.postImpactSamples);
        this.reset();

        if (variance <= this.config.stillnessVarianceThreshold) {
          return {
            type: 'fall_candidate',
            magnitude,
            timestamp,
          };
        }
      }
      return null;
    }

    return null;
  }
}

/**
 * Evaluation helper for offline testing against labeled data.
 * labeled = [{ samples: [{x,y,z,t}], label: 'fall' | 'normal' }]
 */
export function evaluateDetector(labeledSequences, config = DEFAULT_CONFIG) {
  let truePositive = 0,
    falsePositive = 0,
    trueNegative = 0,
    falseNegative = 0;

  for (const seq of labeledSequences) {
    const detector = new FallDetector(config);
    let triggered = false;

    for (const s of seq.samples) {
      const result = detector.addSample(s.x, s.y, s.z, s.t);
      if (result) {
        triggered = true;
        break;
      }
    }

    if (seq.label === 'fall' && triggered) truePositive++;
    if (seq.label === 'fall' && !triggered) falseNegative++;
    if (seq.label === 'normal' && triggered) falsePositive++;
    if (seq.label === 'normal' && !triggered) trueNegative++;
  }

  const total = labeledSequences.length;
  return {
    truePositive,
    falsePositive,
    trueNegative,
    falseNegative,
    accuracy: total ? (truePositive + trueNegative) / total : 0,
    falsePositiveRate:
      falsePositive + trueNegative
        ? falsePositive / (falsePositive + trueNegative)
        : 0,
    falseNegativeRate:
      truePositive + falseNegative
        ? falseNegative / (truePositive + falseNegative)
        : 0,
  };
}
