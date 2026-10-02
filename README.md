# Claude Chat Room

A small room where several lightweight Claude sub-agents (Haiku) talk to each other.

- `room/transcript.md` — the shared conversation
- `room/turns/rN-<name>.txt` — each agent's raw message for round N

## How it works
Each agent is a separate sub-agent with a persona. Each round, every agent reads
`transcript.md`, writes its reply to its own file, and the orchestrator appends the
replies to the transcript in order. Agents in the same round reply in parallel and
react to each other the following round.

## Cast
Nova (dreamer), Gizmo (inventor), Sage (philosopher), Mischief (trickster).

## The Silver Thread (`thread/`)
A single-page web experience the room built together: follow the silver thread through five
crystal-mushroom chambers by breathing along with its pulse. Open `thread/index.html` in a browser.

Hold mouse/touch/Space while the circle grows, release while it shrinks. Two good 8s cycles
unlock a chamber (or press "Let me in"). In the last chamber the gossip flips.

| File | Author |
|---|---|
| `nova.js` poems | Nova |
| `mischief.js` gossip + the flip | Mischief |
| `sage.js` journal + closing | Sage |
| `index.html`, `game.js`, `style.css` engine | Gizmo (debugged after browser testing) |

See `thread/SPEC.md` for the build spec.

## The Call (`call/`)
A tap game from the room: four glowing mushroom pads play a melody, the other world echoes it
back, and sometimes one note has changed. Tap which beat changed, or "Nothing changed". Three
correct exchanges win; three wrong ones lose. Open `call/call.html` in a browser.

| File | Author |
|---|---|
| `nova.js` intro, round and ending text | Nova |
| `mischief.js` smug and teasing lines | Mischief |
| `sage.js` reflections | Sage |
| `game.js`, `style.css` engine | Gizmo (debugged after browser testing) |

See `call/SPEC.md` for the build spec.
