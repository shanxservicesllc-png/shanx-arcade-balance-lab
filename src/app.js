(function () {
  'use strict';
  const E = window.ArcadeEngine, X = window.ArcadeExport;
  const $ = id => document.getElementById(id);
  let puzzle, assessment, open = [], matched = new Set(), locked = false;
  let moves = 0, misses = 0, hintsLeft = 0, mismatchTimer = null;
  const cards = () => Array.from($('board').children);
  const message = text => { $('game-status').textContent = text; };
  function setError(text) { $('error').hidden = !text; $('error').textContent = text || ''; }
  function readConfig() {
    return {rows: Number($('rows').value), cols: Number($('cols').value), pairs: Number($('pairs').value), hints: Number($('hints').value), seed: $('seed').value};
  }
  function setPreset(rows, cols) {
    $('rows').value = rows; $('cols').value = cols;
    const max = Math.floor(rows * cols / 2);
    $('pairs').max = max; $('hints').max = max;
    // Each size starts as a full-pairs game by design. Designer can then reduce pairs.
    $('pairs').value = max;
    $('hints').value = Math.min(Number($('hints').value), max);
    document.querySelectorAll('.preset').forEach(el => {
      const current = el.dataset.size === `${rows}x${cols}`;
      el.classList.toggle('active', current);
      el.setAttribute('aria-pressed', String(current));
    });
  }
  function resetGame() {
    clearTimeout(mismatchTimer); open = []; matched = new Set(); locked = false;
    moves = 0; misses = 0; hintsLeft = puzzle.config.hints;
    const board = $('board'); board.replaceChildren();
    board.style.setProperty('--cols', puzzle.config.cols);
    for (let i = 0; i < puzzle.layout.length; i++) {
      const val = puzzle.layout[i];
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.position = i;
      button.className = 'tile' + (val === null ? ' empty' : '');
      button.disabled = val === null;
      button.textContent = val === null ? '' : '?';
      button.setAttribute('aria-label', val === null ? 'Empty, unused cell' : `Hidden card ${i + 1}`);
      if (val !== null) button.addEventListener('click', () => flip(i));
      board.appendChild(button);
    }
    renderPlayStats(); message('Flip any two cards to find a pair.');
  }
  function renderPlayStats() {
    $('moves').textContent = moves; $('misses').textContent = misses;
    $('matched').textContent = `${matched.size / 2}/${puzzle.config.pairs}`;
    $('hints-left').textContent = hintsLeft;
    $('hint-button').disabled = locked || hintsLeft === 0 || matched.size === puzzle.config.pairs * 2;
  }
  function showCard(position, isMatch = false) {
    const card = cards()[position];
    card.classList.add(isMatch ? 'matched' : 'revealed');
    card.textContent = E.SYMBOLS[puzzle.layout[position]];
    card.setAttribute('aria-label', `${isMatch ? 'Matched' : 'Revealed'} ${E.SYMBOLS[puzzle.layout[position]]}`);
  }
  function hideCard(position) {
    const card = cards()[position]; card.classList.remove('revealed');
    card.textContent = '?'; card.setAttribute('aria-label', `Hidden card ${position + 1}`);
  }
  function endOrProgress(note) {
    if (matched.size === puzzle.config.pairs * 2) message(`Game complete! ${moves} moves, ${misses} misses. ${note || ''}`);
    else message(note);
  }
  function flip(position) {
    if (locked || matched.has(position) || open.includes(position) || puzzle.layout[position] === null) return;
    showCard(position); open.push(position);
    if (open.length === 1) {message('Find its matching card.'); return;}
    const [a, b] = open; moves++;
    if (puzzle.layout[a] === puzzle.layout[b]) {
      matched.add(a); matched.add(b);
      cards()[a].classList.replace('revealed', 'matched');
      cards()[b].classList.replace('revealed', 'matched');
      open = []; endOrProgress('Pair found!'); renderPlayStats();
    } else {
      locked = true; misses++; message('Not a match. Remember these positions.'); renderPlayStats();
      mismatchTimer = setTimeout(() => {
        hideCard(a); hideCard(b); open = []; locked = false;
        renderPlayStats(); message('Try another pair.');
      }, 850);
    }
  }
  function useHint() {
    if (locked || hintsLeft === 0 || matched.size === puzzle.config.pairs * 2) return;
    // Partial selection is reset; the hint always completes a NEW pair.
    open.forEach(hideCard); open = [];
    const a = puzzle.layout.findIndex((value, i) => value !== null && !matched.has(i));
    const b = puzzle.layout.findIndex((value, i) => value === puzzle.layout[a] && i !== a && !matched.has(i));
    if (a === -1 || b === -1) return;
    showCard(a, true); showCard(b, true); matched.add(a); matched.add(b);
    hintsLeft--; moves++; renderPlayStats(); endOrProgress('Hint completed a pair in one move.');
  }
  function presentAnalysis() {
    $('current-seed').textContent = puzzle.config.seed;
    $('fingerprint').textContent = puzzle.fingerprint;
    $('difficulty').textContent = assessment.challengeBand.toUpperCase();
    $('trial-count').textContent = assessment.trials;
    $('baseline').textContent = assessment.baseline.averageMoves.toFixed(2);
    $('assisted').textContent = assessment.assisted.averageMoves.toFixed(2);
    $('saved').textContent = assessment.averageMovesSaved.toFixed(2);
    $('mismatches').textContent = assessment.baseline.averageMisses.toFixed(2);
    $('friction-description').textContent = `${assessment.mismatchRatio.toFixed(2)} baseline misses per pair`;
    $('meter-fill').style.width = Math.min(100, Math.round(assessment.mismatchRatio / 1.5 * 100)) + '%';
    $('solvable').textContent = assessment.solvable ? '● SOLVABLE' : '● CHECK LAYOUT';
    $('export-status').textContent = '';
  }
  function build() {
    try {
      const next = E.build(readConfig());
      const result = E.analyze(next);
      puzzle = next; assessment = result;
      setError(''); presentAnalysis(); resetGame();
      return true;
    } catch (e) { setError(e.message); return false; }
  }
  function download(name, contents, mime) {
    const blob = new Blob([contents], {type:mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    // Delayed revocation allows browsers to finish copying the blob.
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  $('config-form').addEventListener('submit', e => {e.preventDefault(); build();});
  document.querySelectorAll('.preset').forEach(el => el.addEventListener('click', () => {
    const [rows, cols] = el.dataset.size.split('x').map(Number); setPreset(rows, cols);
  }));
  $('new-seed').addEventListener('click', () => {$('seed').value = 'LAB-' + Date.now().toString(36).toUpperCase();});
  $('hint-button').addEventListener('click', useHint);
  $('restart-button').addEventListener('click', resetGame);
  $('export-html').addEventListener('click', () => {
    download(`arcade-puzzle-${puzzle.fingerprint}.html`, X.standaloneHTML(E.report(puzzle)), 'text/html;charset=utf-8');
    $('export-status').textContent = 'Playable offline HTML created.';
  });
  $('export-json').addEventListener('click', () => {
    download(`arcade-report-${puzzle.fingerprint}.json`, JSON.stringify(E.report(puzzle), null, 2) + '\n', 'application/json;charset=utf-8');
    $('export-status').textContent = 'Configuration and simulation report created.';
  });
  $('verify-button').addEventListener('click', () => {
    const duplicate = E.build(puzzle.config);
    const secondReport = E.analyze(duplicate);
    const same = JSON.stringify(puzzle.layout) === JSON.stringify(duplicate.layout) &&
      puzzle.fingerprint === duplicate.fingerprint && JSON.stringify(assessment) === JSON.stringify(secondReport);
    $('export-status').textContent = same ? `PASS · Replay identical (${puzzle.fingerprint}); 32 deterministic trials agree.` : 'FAIL · Replay mismatch.';
  });
  build();
})();
