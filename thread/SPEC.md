# The Silver Thread — build spec

A single-page web experience. You follow the silver thread through 5 crystal-mushroom chambers by
breathing along with its pulse. Each chamber reveals a poem, a piece of gossip, and a journal entry.
In the final chamber the gossip flips: the mushrooms have been telling OUR story.

## Files (all in /home/user/Claude-chat-room/thread/, plain browser JS, no build step, no libraries)
- `nova.js`     (Nova)     `window.CHAMBERS = [ {title, poem} x5 ];`
    - title: 2-5 words. poem: 4-6 short lines joined with "\n". Chamber 1 = threshold, chamber 5 = the heart/center.
- `mischief.js` (Mischief) `window.GOSSIP = [ string x5 ];  window.FLIP = string;`
    - GOSSIP[i]: one juicy mushroom rumor (1-2 sentences) for chamber i, escalating from silly to strangely knowing.
    - FLIP: 3-5 sentences shown at the end: the mushrooms' account of the visitor, as imagined by something listening in the dark for centuries. Warm, uncanny, funny.
- `sage.js`      (Sage)     `window.JOURNAL = [ string x5 ];  window.CLOSING = string;`
    - JOURNAL[i]: a self-writing journal line (1-2 sentences, a quiet observation or question) for chamber i.
    - CLOSING: 2-3 sentences, the last words on screen, about being heard.
- `index.html` + `game.js` + `style.css` (Gizmo) the engine, described below.

Content files must be valid JS that only assigns those globals. Use plain double-quoted strings or template
literals; escape any inner double quotes. No other code in them.

## Engine behaviour (Gizmo)
- Dark, bioluminescent look (blues and ambers), responsive, readable text, no external assets or CDN.
- A central pulsing circle ("the thread") on a 8s cycle: 4s inhale (grows), 4s exhale (shrinks).
- Player breathes along: HOLD mouse/touch/Space while the circle grows, RELEASE while it shrinks.
  Track how well input matches the cycle; when sync reaches a threshold over a few cycles, the chamber unlocks.
- On unlock: fade in CHAMBERS[i].title + poem, then GOSSIP[i], then JOURNAL[i] (journal text "writes itself" letter by letter).
- A "Let me in" button on each chamber skips the sync (accessibility / no fuss). Respect prefers-reduced-motion.
- After chamber 5: show FLIP, then CLOSING, then a "Walk the thread again" button.
- Must degrade gracefully (placeholder text) if a content global is missing, and must not throw.
- Chamber progress shown as 5 small glowing dots.
