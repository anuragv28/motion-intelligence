# Calibration: Collecting Real Data and Tuning Thresholds

This is the most important unfinished work in the project. Everything else builds on this.

## 1. Add a "recording mode" (small code addition)

Add a labeled-recording mode to `web/app.js` that, instead of running detection, just logs raw `{x, y, z, t}` samples for a fixed duration along with a label you choose before recording (`fall` or `normal`). Export each recording as its own JSON file via the existing `downloadFile` helper.

## 2. Record fall sequences — SAFELY

- Simulate falls onto a mattress, couch cushion, or padded floor. Never simulate a real fall onto a hard surface.
- Vary the fall type: forward, backward, sideways, sitting-down-hard.
- Record at least 20-30 sequences to start.

## 3. Record normal-activity sequences

These matter just as much as fall sequences — they're what teaches the detector what NOT to trigger on:
- Walking, jogging, climbing stairs
- Sitting down normally, setting the phone on a table
- Dropping the phone onto a soft surface without a person falling
- Picking the phone up quickly from a pocket

## 4. Run evaluation

Load your recorded sequences into `tests/evaluate.js` (replace `syntheticData`) and run:

```bash
node tests/evaluate.js
```

Look at `falsePositiveRate` and `falseNegativeRate` specifically — not just overall accuracy, which can hide a detector that's bad at one and lucky on the other.

## 5. Tune

Adjust `impactThresholdG` and `stillnessVarianceThreshold` in `core/motion-engine.js`, re-run evaluation, repeat. Keep notes on what you changed and why — this becomes the calibration record you'd eventually want to show anyone evaluating the product seriously.

## 6. Only then update README claims

Once you have real numbers from real data, you can replace "accuracy has not been validated" in the README with the actual figures — and you should cite the sample size alongside them.
