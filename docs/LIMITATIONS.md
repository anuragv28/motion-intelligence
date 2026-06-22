# Limitations

Honest accounting of what's not solved yet. Worth keeping updated as the project evolves — vague or absent limitations sections are a common reason technical reviewers distrust early-stage projects.

- **No validated accuracy.** Default thresholds are starting points from general literature, not numbers proven against this codebase's own data.
- **Gravity removal is approximate.** `computeMagnitude` subtracts a static 1g estimate rather than using a proper low-pass filter to isolate gravity, which is less accurate during sustained tilting (e.g. someone lying down normally vs. after a fall).
- **Browser-only sensor access is unreliable.** Detection stops if the tab isn't in the foreground/active. A native app is required for real always-on use.
- **No distinction between "phone fell" and "person fell."** A dropped phone produces a similar impact+stillness signature to a person falling while the phone stays in their pocket. This is a known hard problem in fall detection generally, not unique to this implementation.
- **Single accelerometer axis set.** No gyroscope fusion yet, which would help distinguish rotational falls from linear drops.
- **No theft/security mode validation.** That use case needs a different signal pattern (sudden pickup + sustained movement) and isn't built or tested yet — see ROADMAP.md.
