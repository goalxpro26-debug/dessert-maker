# Sweet Treats: Dessert Shop

An original HTML5 dessert-shop game. Mechanics only inspired by guided
dessert-making: follow each customer's recipe card step by step
(Bowl → Pour → Pipe → Sprinkle → Fruit → Serve), earn coins, and spend
them on shop upgrades. No copied art, code, names, characters, or assets
from Dessert DIY or any other game — every title, customer, dessert,
drawing, and melody here is original.

## Files

- `index.html` — the whole game: plain HTML5 + vanilla JS + Canvas,
  single self-contained file, no engine, no external assets, no network.
- `test.js` — headless real-click test (Playwright + the system Chromium).
- `test-shots/` — screenshots captured by the test run.

## How to play

1. Open `index.html` in any modern browser (desktop or mobile).
   No server or build step is needed; double-clicking the file works.
2. Tap **Start Serving**. Each customer shows a recipe card at the top.
3. Tap the six kitchen stations in exactly that order. A correct step
   adds 2 coins and builds the dessert on the plate; a wrong tap costs
   patience. Serve before the patience bar empties for a tip.
4. After each served customer, tap **Shop Upgrades** to buy:
   - **Cozy Chairs** — +25% customer patience per level (max 3)
   - **Golden Spoon** — +50% tips per level (max 3)
   - **Lucky Sugar Jar** — +4 coins per served customer, per level (max 3)
5. Difficulty rises across the 20 customers: orders grow from 3 steps
   to 6, and later customers are less patient.
6. Soft fail state only: if a customer's patience runs out, they leave
   and you lose one of 3 hearts; the same customer returns with fresh
   patience. Losing all 3 hearts offers a retry of that customer —
   progress is not wiped.
7. Serve all 20 customers to win the **Golden Whisk**.

Controls: mouse click or touch tap on the station buttons. Pause
(❚❚ button, top right) and mute (speaker button) are available during play.
Audio is synthesized WebAudio SFX plus an original C-major pentatonic
melody written for this game — no copyrighted music.

## How to run the test

```bash
cd ~/workspace/playables-inspired/dessert-maker
NODE_PATH=~/workspace/tools/pw-shot/node_modules node test.js \
  "file:///home/hatch/workspace/playables-inspired/dessert-maker/index.html" test-shots
```

Requires the `playwright-core` package in `~/workspace/tools/pw-shot/`
and the system Chromium at `/opt/meta-chromium/chrome`.

## Test results (headless, real clicks — Nov 6, 2026)

`test.js`: **13/13 checks passed, 0 page/console errors.**

- Loads, menu screen shown.
- Start → playing, customer 1 Pip, "Berry Cloud Cup", 3-step order.
- Wrong tap: wrong count +1, step unchanged, patience drops.
- Correct steps in order → Served screen, coins earned (27 after
  customer 1: 6 step coins + 21 base + tip).
- Shop overlay opens and closes back to the Served screen.
- Next → customer 2 (Momo, "Cocoa Swirl Sundae").
- Pause → paused; Resume → playing; mute toggles on.
- Full playthrough, customers 2–20 served by real canvas clicks →
  **WIN screen ("Golden Whisk!")**, final score 1160, coins 645,
  20/20 customers served.
- Play Again → customer 1, coins/score reset to 0.
- Screenshots in `test-shots/`: menu, customer 1, served, shop,
  customer 10, customer 20, win — visually checked; customer, recipe
  card, patience bar, dessert plate, and station buttons all render.

Supplemental upgrade check (separate headless run, `/tmp/buy-test.js`):
after customers 1–2 (56 coins), buying Lucky Sugar Jar cost 40 coins
(56 → 16) and raised it to level 1 — purchase logic verified live.
Screenshot: `test-shots/08-shop-bought.png`.

### Not exercised by the automated test

- The patience-timeout / heart-loss / game-over-retry path: the test
  plays fast enough that no customer ever times out, so that branch is
  code-reviewed only, not headlessly triggered. It is a soft fail
  (same customer retried, hearts refilled on retry).
- Sound: WebAudio code runs with no errors in headless Chrome, but the
  headless run is muted (`--mute-audio`), so the melody/SFX were not
  audibly verified — check sound in a real browser.

## Originality note

All customers (Pip, Momo, Lila, … Wren), desserts (Berry Cloud Cup,
Cocoa Swirl Sundae, … Grand Gala Dessert), character art, dessert
drawings, and the music melody are original to this game, drawn and
composed here. Nothing was copied from Dessert DIY or any existing game.
