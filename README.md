# 積分右左どっち？

[日本語](README_ja.md)

Play: https://sogataro.github.io/integral-cards/

## Features
- Two face-down cards, 3–7 random draws, including the integral. Operators have a 30% chance when eligible.
- Adjacent factors multiply; division toggles denominator mode.
- Indefinite and definite integrals; symbolic alternative-answer verification.
- Japanese / English, full screen, help, settings and changelog.
- FB button to send comments and bug reports.

## Usage
Select a card, continue, and start solving. Enter expressions using `*`, `^`, `sin(x)`, `log(x)` or `ln(x)`, `exp(x)` and `abs(x)`. Indefinite answers require `+C` or `+c`. Real numbers and radians only. Zoom is supported on phones.

## Local development
Node.js 18 or later, no installation needed:
```
node server.cjs
node --test
```
Open http://localhost:8018/ or the computer's LAN address on a phone on the same network. A static HTTP server also works. No CDN or remote mathematical service is used.

## Stored data
Only level, language and changelog read status are stored in localStorage under `integral-cards/`. Problems and answers are not saved. Feedback is sent to Google Apps Script only when you press Send; message, optional contact, app name, version and language are included.

## Mathematical limits
Nerdamer 1.1.13 is bundled under its MIT license (`vendor/package/license.txt`). A dedicated Worker is terminated after 9 seconds. Answers are verified by differentiation, simplification and expansion, with a second pass for supported trigonometric identities. Numerical counterexamples disprove equality; numerical agreement never proves it. This is symbolic verification, not a language-model reasoning service.

Non-elementarity is established only for nonzero constant multiples of `sin(x)/x`, `cos(x)/x`, `exp(x)/x` and `1/log(x)`. Other unresolved cases remain undetermined. Definite bounds are [1,2] or [1,3]; trigonometric cards switch them to [π/6,π/3] or [π/6,π/2], evaluated exactly. Potential singularities in card factors cause an undetermined improper-integral result, even if cancellation might remove them. This avoids incorrect endpoint-only evaluation. Approximate decimal answers that cannot be disproved remain undetermined; exact answers are preferred.

## License
MIT. Copyright (c) 2026 Yu Kamimizu.

Level 2 adds sin(2*x), cos(2*x), sin(x^2), cos(x^2), log(x+1), and exp(2*x). Function buttons insert editable arguments; changing level starts a new game.
