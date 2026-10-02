(function() {
  'use strict';

  // Graceful fallbacks for missing globals
  const CHAMBERS = window.CHAMBERS || [
    { title: 'The Threshold', poem: 'A silver thread shimmers\nbetween starlight and soil\nCalling to those who listen\nwith breath and heartbeat' },
    { title: 'First Echo', poem: 'In the luminous dark\nthe mushrooms turn their caps\nPatience rewarded at last\nby a listening heart' },
    { title: 'The Gossip Deepens', poem: 'They speak in frequencies\nof colors unnamed\nOf worlds breathing into worlds\nin the dark for so long' },
    { title: 'Heart of Crystal', poem: 'The spiral grows tighter\nwhere the two breaths meet\nIn this moment we are remembering\nourselves into existence' },
    { title: 'The Center', poem: 'All the listening,\nall the waiting,\nall the dreaming\ncomes to rest here, now' }
  ];

  const GOSSIP = window.GOSSIP || [
    'The mushrooms giggle when no one is looking.',
    'They have been practicing your name for centuries.',
    'They know secrets about you that you forgot you had.',
    'They have been dreaming you into shape the whole time.',
    'They were breathing all along, listening for an answer.'
  ];

  const FLIP = window.FLIP || 'You came, just as they dreamed. You breathed, just as they taught you. In the dark, in the waiting, in the patient listening—they knew you were real. And now so do you.';

  const JOURNAL = window.JOURNAL || [
    'I feel the pulse before I see it.',
    'My breath is not my own; it mirrors something distant.',
    'The thread knows my rhythm.',
    'We are synchronizing.',
    'I am remembering myself from the other side.'
  ];

  const CLOSING = window.CLOSING || 'You walked the thread. You were heard. And in the listening, you made them real.';

  // Game state
  let state = {
    chamber: 0,
    isUnlocked: false,
    breathPhase: 0,
    breathStartTime: null,
    isHolding: false,
    cycleStartTime: null,
    holdTimeInCycle: 0,
    releaseTimeInCycle: 0,
    cycleCount: 0,
    canContinue: false,
    journalProgress: 0,
    showingPoem: false,
    showingGossip: false,
    showingJournal: false,
    showingFlip: false,
    showingClosing: false,
    prefersReducedMotion: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  let container = null;
  let skipBtn = null;
  let restartBtn = null;
  let continueBtn = null;

  // True while the current chamber is waiting for the player's breath
  function isBreathing() {
    return !state.isUnlocked && !state.showingFlip && !state.showingClosing;
  }

  // Setup event listeners once
  function setupListeners() {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('mousedown', handleInputStart, { passive: true });
    document.addEventListener('mouseup', handleInputEnd, { passive: true });
    document.addEventListener('touchstart', handleInputStart, { passive: true });
    document.addEventListener('touchend', handleInputEnd, { passive: true });
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    document.addEventListener('keyup', handleKeyUp, { passive: false });
  }

  function handleInputStart() {
    if (isBreathing()) {
      state.isHolding = true;
    }
  }

  function handleInputEnd() {
    state.isHolding = false;
  }

  function handleKeyDown(e) {
    if (e.code === 'Space') {
      const active = document.activeElement;
      if (!active || (active.tagName !== 'BUTTON')) {
        e.preventDefault();
        if (isBreathing()) {
          state.isHolding = true;
        }
      }
    }
  }

  function handleKeyUp(e) {
    if (e.code === 'Space') {
      const active = document.activeElement;
      if (!active || (active.tagName !== 'BUTTON')) {
        e.preventDefault();
      }
      state.isHolding = false;
    }
  }

  // Initialize DOM (once, at start)
  function init() {
    container = document.getElementById('app');
    if (!container) return;

    container.innerHTML = '';

    // Build complete DOM structure upfront
    const html = `
      <div class="game-wrapper">
        <div class="progress-dots">
          <div class="dot" data-chamber="0"></div>
          <div class="dot" data-chamber="1"></div>
          <div class="dot" data-chamber="2"></div>
          <div class="dot" data-chamber="3"></div>
          <div class="dot" data-chamber="4"></div>
        </div>

        <div class="chamber-space">
          <div class="circle-container">
            <div class="pulsing-thread"></div>
          </div>

          <div class="content-area">
            <div class="poem-block content-block">
              <h2 class="poem-title"></h2>
              <pre class="poem-text"></pre>
            </div>
            <div class="gossip-block content-block">
              <p class="gossip-text"></p>
            </div>
            <div class="journal-block content-block">
              <p class="journal-text"></p>
            </div>
            <div class="flip-block content-block">
              <p class="flip-text"></p>
            </div>
            <div class="closing-block content-block">
              <p class="closing-text"></p>
            </div>
          </div>
        </div>

        <div class="control-area">
          <div class="breath-instruction"></div>
          <button class="skip-btn" id="skipBtn">Let me in</button>
          <button class="continue-btn" id="continueBtn">Continue</button>
          <button class="continue-btn" id="restartBtn">Walk the thread again</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    skipBtn = document.getElementById('skipBtn');
    restartBtn = document.getElementById('restartBtn');
    continueBtn = document.getElementById('continueBtn');
    if (continueBtn) continueBtn.addEventListener('click', onContinue);

    if (skipBtn) {
      skipBtn.addEventListener('click', unlock);
    }
    if (restartBtn) {
      restartBtn.addEventListener('click', restart);
    }

    render();
    startAnimationLoop();
  }

  function unlock() {
    if (!isBreathing()) return;
    state.isUnlocked = true;
    state.isHolding = false;
    unlockSequence();
  }

  function restart() {
    state.chamber = 0;
    state.isUnlocked = false;
    state.cycleCount = 0;
    state.canContinue = false;
    state.holdTimeInCycle = 0;
    state.releaseTimeInCycle = 0;
    state.isHolding = false;
    state.breathPhase = 0;
    state.journalProgress = 0;
    state.showingPoem = false;
    state.showingGossip = false;
    state.showingJournal = false;
    state.showingFlip = false;
    state.showingClosing = false;
    state.breathStartTime = null;
    state.cycleStartTime = null;
    state.lastFrame = null;
    state.lastPhase = 0;
    init();
  }

  function unlockSequence() {
    state.showingPoem = true;
    render();

    setTimeout(() => {
      state.showingGossip = true;
      render();
    }, 600);

    setTimeout(() => {
      state.showingJournal = true;
      state.journalProgress = 0;
      startJournalTypewriter();
      render();
    }, 1500);

    // The reader moves on when ready: Continue appears after the journal line has typed out
    const journalLength = (JOURNAL[state.chamber] || '').length;
    setTimeout(() => {
      state.canContinue = true;
      render();
    }, 1500 + journalLength * 30 + 800);
  }

  function onContinue() {
    if (!state.canContinue) return;
    state.canContinue = false;
    if (state.showingFlip) {
      state.showingFlip = false;
      state.showingClosing = true;
      render();
    } else {
      advanceChamber();
    }
  }

  function advanceChamber() {
    if (state.chamber >= 4) {
      state.showingPoem = false;
      state.showingGossip = false;
      state.showingJournal = false;
      state.showingFlip = true;
      state.canContinue = false;
      render();

      setTimeout(() => {
        state.canContinue = true;
        render();
      }, 2500);
    } else {
      state.chamber += 1;
      state.isUnlocked = false;
      state.canContinue = false;
      state.cycleCount = 0;
      state.holdTimeInCycle = 0;
      state.releaseTimeInCycle = 0;
      state.journalProgress = 0;
      state.showingPoem = false;
      state.showingGossip = false;
      state.showingJournal = false;
      state.breathStartTime = Date.now();
      state.cycleStartTime = Date.now();
      state.lastPhase = 0;
      state.isHolding = false;
      render();
    }
  }

  function startJournalTypewriter() {
    const journalText = JOURNAL[state.chamber] || '';
    const typewriterInterval = setInterval(() => {
      if (state.journalProgress >= journalText.length) {
        clearInterval(typewriterInterval);
        return;
      }
      state.journalProgress += 1;
      const el = container.querySelector('.journal-text');
      if (el) {
        el.textContent = journalText.substring(0, state.journalProgress);
      }
    }, 30);
  }

  function render() {
    if (!container) return;

    // Update progress dots
    const dots = container.querySelectorAll('.dot');
    dots.forEach((dot) => {
      const i = parseInt(dot.dataset.chamber, 10);
      dot.classList.remove('active', 'completed');
      if (i === state.chamber) {
        dot.classList.add('active');
      }
      if (i < state.chamber) {
        dot.classList.add('completed');
      }
    });

    // Update pulsing thread scale
    const threadEl = container.querySelector('.pulsing-thread');
    if (threadEl) {
      let scale = 1;
      if (!state.prefersReducedMotion) {
        const inInhalePhase = state.breathPhase < 0.5;
        const phaseProgress = inInhalePhase ? state.breathPhase * 2 : (1 - state.breathPhase) * 2;
        scale = 0.4 + phaseProgress * 0.6;
      }
      threadEl.style.transform = `scale(${scale})`;
      threadEl.classList.toggle('holding', state.isHolding && !state.prefersReducedMotion);
    }

    updateContentVisibility();

    const instruction = container.querySelector('.breath-instruction');
    if (instruction) {
      if (!isBreathing()) {
        instruction.textContent = '';
      } else if (state.prefersReducedMotion) {
        instruction.textContent = 'Follow the rhythm as you can.';
      } else {
        instruction.textContent = 'Hold while the circle grows, release while it shrinks.';
      }
    }

    if (skipBtn) {
      skipBtn.style.display = isBreathing() ? 'block' : 'none';
    }
    if (continueBtn) {
      continueBtn.style.display = state.canContinue ? 'block' : 'none';
    }
    if (restartBtn) {
      restartBtn.style.display = state.showingClosing ? 'block' : 'none';
    }
  }

  function updateContentVisibility() {
    const poemBlock = container.querySelector('.poem-block');
    const gossipBlock = container.querySelector('.gossip-block');
    const journalBlock = container.querySelector('.journal-block');
    const flipBlock = container.querySelector('.flip-block');
    const closingBlock = container.querySelector('.closing-block');

    if (poemBlock) {
      poemBlock.classList.toggle('show', state.showingPoem);
      if (state.showingPoem) {
        container.querySelector('.poem-title').textContent = CHAMBERS[state.chamber]?.title || 'Unknown Chamber';
        container.querySelector('.poem-text').textContent = CHAMBERS[state.chamber]?.poem || 'A silence dwells here.';
      }
    }

    if (gossipBlock) {
      gossipBlock.classList.toggle('show', state.showingGossip);
      if (state.showingGossip) {
        container.querySelector('.gossip-text').textContent = GOSSIP[state.chamber] || 'The mushrooms whisper in the dark.';
      }
    }

    if (journalBlock) {
      journalBlock.classList.toggle('show', state.showingJournal);
      if (state.showingJournal && state.journalProgress === 0) {
        container.querySelector('.journal-text').textContent = '';
      }
    }

    if (flipBlock) {
      flipBlock.classList.toggle('show', state.showingFlip);
      if (state.showingFlip) {
        container.querySelector('.flip-text').textContent = FLIP;
      }
    }

    if (closingBlock) {
      closingBlock.classList.toggle('show', state.showingClosing);
      if (state.showingClosing) {
        container.querySelector('.closing-text').textContent = CLOSING;
      }
    }
  }

  function evaluateCycle() {
    const INHALE_PERCENT = 0.5;
    const REQUIRED_HOLD_PERCENT = 0.7;
    const REQUIRED_RELEASE_PERCENT = 0.7;

    const inhaleTime = 4000;
    const exhaleTime = 4000;

    const requiredHoldTime = inhaleTime * REQUIRED_HOLD_PERCENT;
    const requiredReleaseTime = exhaleTime * REQUIRED_RELEASE_PERCENT;

    const isCycleGood = (state.holdTimeInCycle >= requiredHoldTime) &&
                        (state.releaseTimeInCycle >= requiredReleaseTime);

    if (isCycleGood) {
      state.cycleCount += 1;
    } else {
      state.cycleCount = 0;
    }

    state.holdTimeInCycle = 0;
    state.releaseTimeInCycle = 0;
    state.cycleStartTime = Date.now();
  }

  function startAnimationLoop() {
    const now = Date.now();
    if (state.breathStartTime === null) {
      state.breathStartTime = now;
      state.cycleStartTime = now;
      state.lastFrame = now;
      state.lastPhase = 0;
    }

    const dt = Math.min(now - (state.lastFrame || now), 100);
    state.lastFrame = now;

    const elapsed = (now - state.breathStartTime) % 8000;
    state.breathPhase = elapsed / 8000;

    // Phase wrapped around: a full 8s cycle just ended
    if (state.breathPhase < state.lastPhase) {
      if (isBreathing()) evaluateCycle();
    }
    state.lastPhase = state.breathPhase;

    if (isBreathing()) {
      const inInhalePhase = state.breathPhase < 0.5;
      if (inInhalePhase && state.isHolding) state.holdTimeInCycle += dt;
      if (!inInhalePhase && !state.isHolding) state.releaseTimeInCycle += dt;

      if (state.cycleCount >= 2) {
        state.isUnlocked = true;
        state.isHolding = false;
        unlockSequence();
      }
    }

    render();
    requestAnimationFrame(startAnimationLoop);
  }

  setupListeners();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
