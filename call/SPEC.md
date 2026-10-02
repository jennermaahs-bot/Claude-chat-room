# Call — build spec

A tap game for a phone. Four glowing mushroom pads play a short melody. Then "the other world" echoes it
back, but sometimes ONE note has changed. You say which beat changed, or say "Nothing changed". The echo
sometimes tells the truth (identical) — Mischief's trick. Three correct exchanges open the conversation.

Flavor: the crystal-mushroom world from /home/user/Claude-chat-room/room/transcript.md (listening, being
heard, the silver thread, gossip). Keep all copy short: 1-2 sentences max per string unless stated.

## Files (all in /home/user/Claude-chat-room/call/, plain browser JS, no libraries, no build step)

### nova.js  (Nova)
`window.CALL_TEXT = { title, tagline, howTo, rounds, win, lose };`
- title: 2-4 words. tagline: 1 sentence. howTo: 2 short sentences explaining: listen, then hear the echo, then tap which beat changed, or "Nothing changed".
- rounds: array of exactly 3 strings, shown before each exchange (escalating: soft, curious, deep).
- win: 2-3 sentences. lose: 1-2 sentences, gentle (they can try again).

### mischief.js  (Mischief)
`window.CALL_TRICKS = { sameCorrect, wrong };`
- sameCorrect: array of exactly 3 strings shown when the echo was IDENTICAL and the player correctly said "Nothing changed" (smug/delighted: the mushrooms were testing you).
- wrong: array of exactly 3 strings shown after a wrong answer (playful ribbing, never mean).

### sage.js  (Sage)
`window.CALL_REFLECTIONS = [ string x3 ];`
- shown after each correct exchange (1-2 quiet sentences about listening / being heard). Index = exchange number 0..2.

Content files must be valid JS that only assigns those globals. Plain double-quoted strings, escape inner quotes.

### game.js + style.css  (Gizmo)
The engine. Mount into `<div id="app"></div>` (already on the page). Dark bioluminescent look (blues, teals,
amber, violet), single dark theme: set `:root{color-scheme:dark}`, set body background and all colors explicitly.
Phone first (390px wide), no horizontal scroll, big tap targets (min 48px), `user-select:none`,
`-webkit-touch-callout:none`, `touch-action:manipulation`. Respect prefers-reduced-motion.

State machine (screens):
1. INTRO: title, tagline, howTo, [Start] button. (Start also creates/resumes the AudioContext.)
2. EXCHANGE n (n = 0,1,2), pattern length L = 3, 4, 5:
   a. Show CALL_TEXT.rounds[n] and a [Listen] button. Nothing plays until tapped.
   b. On Listen: status "Listen..." — the melody (L notes, random pad 0-3 each, no more than 2 identical in a row)
      plays one note per 650ms: that pad lights up and sounds. Then 800ms pause.
   c. status "Echo..." — the echo plays the same way. Exchange 0 ALWAYS has exactly one changed beat (that note
      replaced by a DIFFERENT pad). For exchanges 1 and 2 there is a 30% chance the echo is identical; otherwise one
      random beat changed. Force: at least one of exchanges 1,2 is identical in a run of the game.
   d. ANSWER: show "Which beat changed?" with L numbered buttons (1..L) and a [Nothing changed] button, plus a
      [Hear it again] button that replays melody+echo (unlimited, does not cost anything).
   e. Correct answer: show the matching CALL_REFLECTIONS[n]; if the echo was identical also show a random
      CALL_TRICKS.sameCorrect line. Then a [Continue] button. NOTHING advances on a timer.
   f. Wrong answer: lose one of 3 lives (show 3 small glowing dots at the top, one dims). Show a random
      CALL_TRICKS.wrong line and state what the right answer was (e.g. "It was beat 3" or "Nothing changed").
      Then [Try again] (new random pattern, same exchange n and same length) or, if lives are 0, go to LOSE.
3. WIN (after 3 correct exchanges): CALL_TEXT.win and [Play again].
4. LOSE (lives 0): CALL_TEXT.lose and [Try again] (restart whole game).

CRITICAL RULES (lessons from the last game):
- Never auto-advance text on a timer. All story text stays until the player taps a button.
- Create all DOM once or re-render whole screens by state; do not toggle opacity on elements that may not exist.
- Add event listeners ONCE (use delegation on #app) so restarts don't stack them.
- All button ids/classes below must exist exactly so tests can find them:
  `#startBtn`, `#listenBtn`, `.beat-btn` (one per beat), `#sameBtn`, `#replayBtn`, `#continueBtn`, `#retryBtn`,
  `#againBtn`. Pads have class `.pad` and get class `lit` while sounding.
- Expose `window.__callAnswer = () => (index of changed beat 0-based, or -1 if identical)` for testing.
- If a content global is missing, use short placeholder text. Never throw.
- Audio: WebAudio oscillators, pentatonic pitches (e.g. 261.6, 293.7, 329.6, 392.0 Hz), soft envelope; wrap in
  try/catch and keep the game fully playable silently.
