# Roadmap

This is where MotionCore is headed — explicitly separated from the README's description of what exists today. Nothing in this file is implemented yet.

## Phase 1 — Validate the core detector (current phase)
- Collect labeled motion sequences (real falls — simulated safely — vs. normal activity)
- Run `tests/evaluate.js` against real data, publish real false-positive/false-negative rates
- Tune `core/motion-engine.js` thresholds based on that data, not guesses

## Phase 2 — Make it a real product
- Backend: accounts, event sync across devices
- Real alerting: SMS/push notification to emergency contacts on confirmed events
- Native app (Android first) for background/always-on detection — browser tabs can't reliably detect motion when the phone is locked

## Phase 3 — Expand domains
Only after Phase 1 + 2 are solid for Human Safety:
- Road Intelligence (pothole/harsh-brake detection)
- Security (unauthorized movement / theft)
- Smart home, industrial, wearable contexts

## Long-term
- Move from threshold-based detection to a trained model (the labeled dataset from Phase 1 is what makes this possible)
- Explore B2B channels (senior living facilities, fleet safety) once individual-consumer accuracy is proven
