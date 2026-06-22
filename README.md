# MotionCore

A motion-based fall detection prototype for phones. Detects impact + post-impact stillness patterns from accelerometer data and logs events locally.

**Status: early prototype.** Detection accuracy has not been validated against real-world labeled data. Do not rely on this as a safety device yet.

## What this actually does right now

- Reads live accelerometer data in the browser
- Runs a two-stage detection pattern: impact spike → stillness check (not just a single threshold — see `core/motion-engine.js` for why that distinction matters)
- Shows a 15-second cancel window before logging a confirmed event, so you can dismiss false alarms
- Logs events locally (browser storage) with optional GPS tagging
- Exports event logs as JSON or CSV
- Lets you tune detection sensitivity live

## What this does NOT do yet

- No backend, no accounts, no syncing across devices
- No real alerting (SMS/push to emergency contacts) — confirmed events currently just log to console + local storage
- No background detection — if the browser tab isn't active, detection stops. This is a real limitation of browser-based sensors; a native app is required for always-on use
- No validated accuracy numbers. The default thresholds in `core/motion-engine.js` are reasonable starting points from general fall-detection literature, not numbers proven on this codebase

## Project structure

```
core/
  motion-engine.js   — detection algorithm, pure logic, no DOM dependencies
  sensor-source.js   — browser sensor access wrapper
web/
  index.html         — UI
  app.js             — wires sensor + engine + UI together
  style.css
tests/
  evaluate.js        — offline accuracy evaluation against labeled sequences
docs/
  ROADMAP.md         — longer-term vision, explicitly separated from current state
  LIMITATIONS.md
  CALIBRATION.md     — how to collect your own labeled data and tune thresholds
```

`core/` has zero DOM dependencies on purpose — it's meant to be portable to a native app shell later without rewriting the detection logic.

## Running it locally

```bash
cd web
python3 -m http.server 8000
# open http://localhost:8000 on a phone browser (sensors need a real device)
```

Note: iOS requires HTTPS for motion sensor access outside of `localhost`. For phone testing over your local network, use a tool like `ngrok` or deploy to any static host.

## Running the evaluation script

```bash
node tests/evaluate.js
```

Currently runs against synthetic test sequences just to prove the evaluation pipeline works. Replace with your own recorded data before trusting any accuracy number — see `docs/CALIBRATION.md`.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for where this is headed — multi-domain expansion, native app, ML model. That's future work, intentionally kept separate from this README's description of current capability.

## License

MIT — see `LICENSE`.
