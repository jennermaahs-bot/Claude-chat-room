// Call Game Engine
(function() {
  'use strict';

  // Content fallbacks
  const getText = () => window.CALL_TEXT || {
    title: "Call",
    tagline: "Listen to the mushrooms' song.",
    howTo: "Hear a melody, then its echo. Tap the beat that changed—or say nothing changed.",
    rounds: ["A soft call...", "The curiosity deepens...", "The deepest listening..."],
    win: "The crystal mushrooms open. You've been heard.",
    lose: "The echo fades. Try again."
  };

  const getTricks = () => window.CALL_TRICKS || {
    sameCorrect: ["The mushrooms matched perfectly.", "You heard it right.", "Flawless echo."],
    wrong: ["Not quite.", "Try again.", "Close, but not quite."]
  };

  const getReflections = () => window.CALL_REFLECTIONS || [
    "You were heard.",
    "The connection deepens.",
    "Perfect understanding."
  ];

  // Game state
  let state = {
    screen: 'intro',      // intro, exchange, win, lose
    lives: 3,
    exchange: 0,          // 0, 1, 2
    pattern: [],          // current melody pattern
    echo: [],             // current echo pattern (empty = not yet clicked Listen)
    changedIndex: -1,     // index that changed in echo (-1 = identical)
    answered: false,      // has player answered current exchange
    answerCorrect: null,  // true/false after answer
    userAnswer: null,     // -1 (nothing changed) or 0-based index
    replayCount: 0,       // for testing
    phase: 'ready',       // ready (waiting for Listen), playing, answer
    identicalAt: 1,       // which exchange (1 or 2) is guaranteed to have an identical echo
    identicalDone: false
  };

  let audioContext = null;
  let masterVolume = null;

  const PATTERNS = [3, 4, 5];  // pattern lengths for exchanges 0, 1, 2
  const PITCHES = [261.6, 293.7, 329.6, 392.0];  // pentatonic: C, D, E, G
  const NOTE_DURATION = 200;   // ms for each note
  const NOTE_GAP = 450;        // ms gap between notes
  const ECHO_DELAY = 800;      // ms delay before echo starts
  const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize audio
  function initAudio() {
    if (audioContext) {
      try { if (audioContext.state === 'suspended') audioContext.resume(); } catch (e) {}
      return;
    }
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterVolume = audioContext.createGain();
      masterVolume.gain.value = 0.3;
      masterVolume.connect(audioContext.destination);
    } catch (e) {
      console.log('AudioContext unavailable, game will run silently');
    }
  }

  // Play a single note
  function playNote(pitch, startTime, duration) {
    if (!audioContext) return;
    try {
      const osc = audioContext.createOscillator();
      const env = audioContext.createGain();

      osc.frequency.value = pitch;
      osc.type = 'sine';

      env.gain.setValueAtTime(0.1, startTime);
      env.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.connect(env);
      env.connect(masterVolume);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      // Audio failed, continue silently
    }
  }

  // Generate a random pattern without more than 2 identical notes in a row
  function generatePattern(length) {
    const pattern = [];
    while (pattern.length < length) {
      const pad = Math.floor(Math.random() * 4);
      if (pattern.length < 2 || pattern[pattern.length - 1] !== pad || pattern[pattern.length - 2] !== pad) {
        pattern.push(pad);
      }
    }
    return pattern;
  }

  // Generate echo: exchange 0 always has one changed beat
  // Exchanges 1,2: 30% chance identical, otherwise one changed
  // Force: at least one of exchanges 1,2 is identical
  function generateEcho(pattern, exchangeNum, forceIdentical) {
    const len = pattern.length;
    let echo = [...pattern];

    if (exchangeNum === 0) {
      // Always change exactly one beat
      const idx = Math.floor(Math.random() * len);
      let newPad = Math.floor(Math.random() * 4);
      while (newPad === pattern[idx]) {
        newPad = Math.floor(Math.random() * 4);
      }
      echo[idx] = newPad;
      return { echo, changedIndex: idx };
    } else {
      // Exchanges 1, 2
      let isIdentical = forceIdentical || Math.random() < 0.3;

      if (isIdentical) {
        return { echo, changedIndex: -1 };
      } else {
        const idx = Math.floor(Math.random() * len);
        let newPad = Math.floor(Math.random() * 4);
        while (newPad === pattern[idx]) {
          newPad = Math.floor(Math.random() * 4);
        }
        echo[idx] = newPad;
        return { echo, changedIndex: idx };
      }
    }
  }

  const STEP = 650;  // ms between notes
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function lightPad(padIndex) {
    const pad = document.querySelectorAll('.pad')[padIndex];
    if (!pad) return;
    pad.classList.add('lit');
    setTimeout(() => pad.classList.remove('lit'), 380);
  }

  // Play a sequence of notes (melody or echo): light + sound on timers, silent if no audio
  function playSequence(pattern) {
    pattern.forEach((padIndex, i) => {
      setTimeout(() => {
        lightPad(padIndex);
        playNote(PITCHES[padIndex], audioContext ? audioContext.currentTime : 0, 0.5);
      }, i * STEP);
    });
    return sleep(pattern.length * STEP + 150);
  }

  function setStatus(msg) {
    const el = document.querySelector('.status');
    if (el) el.textContent = msg;
  }

  // Play melody, pause, then the echo
  async function playExchange() {
    setStatus('Listen...');
    await playSequence(state.pattern);
    await sleep(800);
    setStatus('Echo...');
    await playSequence(state.echo);
  }

  // Render function
  function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    const text = getText();
    const tricks = getTricks();
    const reflections = getReflections();

    if (state.screen === 'intro') {
      app.innerHTML = `
        <div class="screen intro-screen">
          <h1>${text.title}</h1>
          <p class="tagline">${text.tagline}</p>
          <p class="how-to">${text.howTo}</p>
          <button id="startBtn" class="button button-primary">Start</button>
        </div>
      `;
    } else if (state.screen === 'exchange') {
      const n = state.exchange;
      const patternLen = PATTERNS[n];

      let content = `
        <div class="screen exchange-screen">
          <div class="lives">
      `;
      for (let i = 0; i < 3; i++) {
        const dimmed = i >= state.lives ? 'dimmed' : '';
        content += `<div class="life ${dimmed}"></div>`;
      }
      content += `
          </div>
          <p class="round-text">${text.rounds[n]}</p>
      `;

      content += `
          <div class="pads">
            ${[0, 1, 2, 3].map(i => `<div class="pad" data-pad="${i}"></div>`).join('')}
          </div>
      `;

      if (state.phase === 'ready' && !state.answered) {
        content += `
          <p class="status">Ready to listen?</p>
          <button id="listenBtn" class="button button-primary">Listen</button>
        `;
      } else if (state.phase === 'playing' && !state.answered) {
        content += `<p class="status">Listen...</p>`;
      } else if (!state.answered) {
        // Listening phase complete, waiting for answer
        content += `
          <div class="answer-section">
            <p class="status">Which beat changed?</p>
            <div class="beat-buttons">
        `;
        for (let i = 1; i <= patternLen; i++) {
          content += `<button class="beat-btn" data-beat="${i - 1}">${i}</button>`;
        }
        content += `
            </div>
            <button id="sameBtn" class="button button-secondary">Nothing changed</button>
            <button id="replayBtn" class="button button-ghost">Hear it again</button>
          </div>
        `;
      } else if (state.answerCorrect) {
        // Correct answer
        content += `
          <div class="answer-result correct">
            <p class="reflection">${reflections[n]}</p>
        `;
        if (state.changedIndex === -1 && tricks.sameCorrect.length > 0) {
          const trick = tricks.sameCorrect[n % tricks.sameCorrect.length];
          content += `<p class="trick">${trick}</p>`;
        }
        content += `
            <button id="continueBtn" class="button button-primary">Continue</button>
          </div>
        `;
      } else {
        // Wrong answer
        const rightAnswer = state.changedIndex === -1 ? "Nothing changed" : `Beat ${state.changedIndex + 1}`;
        content += `
          <div class="answer-result wrong">
            <p class="message">${tricks.wrong[n % tricks.wrong.length]}</p>
            <p class="reveal">It was: ${rightAnswer}</p>
        `;
        content += `<button id="retryBtn" class="button button-secondary">${state.lives > 0 ? 'Try again' : 'Continue'}</button>`;
        content += `
          </div>
        `;
      }

      content += `</div>`;
      app.innerHTML = content;
    } else if (state.screen === 'win') {
      app.innerHTML = `
        <div class="screen win-screen">
          <h2>Connected</h2>
          <p>${text.win}</p>
          <button id="againBtn" class="button button-primary">Play again</button>
        </div>
      `;
    } else if (state.screen === 'lose') {
      app.innerHTML = `
        <div class="screen lose-screen">
          <h2>Disconnected</h2>
          <p>${text.lose}</p>
          <button id="againBtn" class="button button-primary">Try again</button>
        </div>
      `;
    }
  }

  // Event handling with delegation
  document.addEventListener('click', async (e) => {
    if (!e.target.closest('#app')) return;

    const btn = e.target.closest('button');
    if (!btn) return;

    // Start button
    if (btn.id === 'startBtn') {
      initAudio();
      state = {
        screen: 'exchange',
        lives: 3,
        exchange: 0,
        pattern: generatePattern(PATTERNS[0]),
        echo: [],
        changedIndex: -1,
        answered: false,
        answerCorrect: null,
        userAnswer: null,
        replayCount: 0,
        phase: 'ready',
        identicalAt: 1 + Math.floor(Math.random() * 2),
        identicalDone: false
      };
      render();
    }
    // Listen button
    else if (btn.id === 'listenBtn') {
      initAudio();
      const n = state.exchange;
      const forceIdentical = n === state.identicalAt && !state.identicalDone;
      const echoResult = generateEcho(state.pattern, n, forceIdentical);
      if (echoResult.changedIndex === -1) state.identicalDone = true;
      state.echo = echoResult.echo;
      state.changedIndex = echoResult.changedIndex;
      state.phase = 'playing';
      render();
      await playExchange();
      state.phase = 'answer';
      render();
    }
    // Beat buttons
    else if (btn.classList.contains('beat-btn')) {
      const beatIndex = parseInt(btn.dataset.beat, 10);
      state.userAnswer = beatIndex;
      state.answerCorrect = (beatIndex === state.changedIndex);
      state.answered = true;
      if (!state.answerCorrect) {
        state.lives--;
      }
      render();
    }
    // "Nothing changed" button
    else if (btn.id === 'sameBtn') {
      state.userAnswer = -1;
      state.answerCorrect = (state.changedIndex === -1);
      state.answered = true;
      if (!state.answerCorrect) {
        state.lives--;
      }
      render();
    }
    // Replay button
    else if (btn.id === 'replayBtn') {
      initAudio();
      state.replayCount++;
      const section = btn.closest('.answer-section');
      const status = section && section.querySelector('.status');
      const buttons = section ? section.querySelectorAll('button') : [];
      buttons.forEach(b => { b.disabled = true; });
      await playExchange();
      if (status) status.textContent = 'Which beat changed?';
      buttons.forEach(b => { b.disabled = false; });
    }
    // Continue button
    else if (btn.id === 'continueBtn') {
      state.exchange++;
      if (state.exchange >= 3) {
        state.screen = 'win';
      } else {
        state.screen = 'exchange';
        state.pattern = generatePattern(PATTERNS[state.exchange]);
        state.echo = [];
        state.changedIndex = -1;
        state.answered = false;
        state.answerCorrect = null;
        state.userAnswer = null;
        state.replayCount = 0;
        state.phase = 'ready';
      }
      render();
    }
    // Try again button (after wrong answer)
    else if (btn.id === 'retryBtn') {
      state.pattern = generatePattern(PATTERNS[state.exchange]);
      state.echo = [];
      state.changedIndex = -1;
      state.answered = false;
      state.answerCorrect = null;
      state.userAnswer = null;
      state.replayCount = 0;
      state.phase = 'ready';
      if (state.lives <= 0) {
        state.screen = 'lose';
      }
      render();
    }
    // Play again / Try again (from win/lose)
    else if (btn.id === 'againBtn') {
      state = {
        screen: 'exchange',
        lives: 3,
        exchange: 0,
        pattern: generatePattern(PATTERNS[0]),
        echo: [],
        changedIndex: -1,
        answered: false,
        answerCorrect: null,
        userAnswer: null,
        replayCount: 0,
        phase: 'ready',
        identicalAt: 1 + Math.floor(Math.random() * 2),
        identicalDone: false
      };
      render();
    }
  });

  // Expose testing function
  window.__callAnswer = () => {
    return state.changedIndex;
  };

  // Initial render
  render();
})();
