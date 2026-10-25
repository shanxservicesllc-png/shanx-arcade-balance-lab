/* Arcade Balance Lab · original deterministic puzzle engine · no dependencies */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ArcadeEngine = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const SYMBOLS = ['◆', '✦', '●', '▲', '⬡', '✿', '★', '♥', '♣', '☀', '⬢', '✳', '♠', '◈', '✚'];
  const MODEL = 'Perfect-recall memory player: each trial samples a seeded search order, remembers every observed card, takes any known pair, and otherwise explores unseen cards. A hint automatically completes one pair in one move. Estimates describe this model, not human performance.';
  function hash32(value) {
    let h = 2166136261;
    for (const char of String(value)) {
      const code = char.codePointAt(0);
      h ^= code & 255; h = Math.imul(h, 16777619);
      h ^= (code >>> 8) & 255; h = Math.imul(h, 16777619);
      h ^= (code >>> 16) & 255; h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function random32(seed) {
    let state = seed >>> 0;
    return function () {
      let t = state += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(array, rand) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function validate(input) {
    if (!input || typeof input !== 'object') throw new Error('Configuration must be an object.');
    const {rows, cols, pairs, hints, seed} = input;
    for (const name of ['rows', 'cols', 'pairs', 'hints']) {
      if (!Number.isSafeInteger(input[name])) throw new Error(`${name} must be a whole number.`);
    }
    if (rows < 2 || rows > 5 || cols < 2 || cols > 6 || rows * cols > 30 || rows * cols < 4) throw new Error('Grid must be 2–5 rows by 2–6 columns, up to 30 cells.');
    if (pairs < 2 || pairs > Math.floor(rows * cols / 2) || pairs > SYMBOLS.length) throw new Error(`Pairs must be 2–${Math.min(Math.floor(rows * cols / 2), SYMBOLS.length)} for this grid.`);
    if (hints < 0 || hints > pairs) throw new Error(`Hints must be between 0 and ${pairs}.`);
    if (typeof seed !== 'string' || seed.length < 1 || seed.length > 64 || !seed.trim()) throw new Error('Seed must contain 1–64 nonblank characters.');
    if (/[\u0000-\u001F\u007F]/.test(seed)) throw new Error('Seed must not include control characters.');
    return {rows, cols, pairs, hints, seed};
  }
  function build(input) {
    const config = validate(input);
    const rng = random32(hash32('layout-v1|' + config.seed + '|' + config.rows + 'x' + config.cols + '|' + config.pairs));
    const cells = [];
    for (let i = 0; i < config.pairs; i++) cells.push(i, i);
    while (cells.length < config.rows * config.cols) cells.push(null);
    const layout = shuffle(cells, rng);
    const fingerprint = hash32('v1|' + layout.map(x => x === null ? '_' : String(x)).join('.') + '|' + JSON.stringify(config)).toString(16).padStart(8, '0').toUpperCase();
    return {version: '1.0', config, layout, fingerprint};
  }
  function simulateOne(puzzle, trial, hintsUsed) {
    const {layout, config} = puzzle;
    const active = layout.map((id, pos) => id === null ? null : pos).filter(pos => pos !== null);
    const order = shuffle(active, random32(hash32('trial-v1|' + config.seed + '|' + trial + '|' + config.rows + 'x' + config.cols)));
    const matched = new Set(), seen = new Set();
    let moves = 0, misses = 0, used = 0;
    const remaining = () => active.filter(i => !matched.has(i));
    while (matched.size < active.length) {
      if (moves > active.length * 4) throw new Error('Simulation safety bound exceeded.');
      if (used < hintsUsed) {
        // Hint is a one-move assisted match. Deterministic pair choice from the search order.
        const pick = order.find(i => !matched.has(i));
        const mate = active.find(i => i !== pick && layout[i] === layout[pick] && !matched.has(i));
        matched.add(pick); matched.add(mate); used++; moves++; continue;
      }
      let first, second;
      const known = order.find(i => !matched.has(i) && seen.has(i) && active.some(j => j !== i && !matched.has(j) && seen.has(j) && layout[j] === layout[i]));
      if (known !== undefined) {
        first = known;
        second = order.find(j => j !== first && !matched.has(j) && seen.has(j) && layout[j] === layout[first]);
      } else {
        first = order.find(i => !matched.has(i) && !seen.has(i));
        if (first === undefined) throw new Error('Simulation could not select a card.');
        seen.add(first);
        second = order.find(j => j !== first && !matched.has(j) && seen.has(j) && layout[j] === layout[first]);
        if (second === undefined) {
          second = order.find(j => j !== first && !matched.has(j) && !seen.has(j));
          if (second === undefined) throw new Error('Simulation could not select the second card.');
        }
      }
      seen.add(first); seen.add(second);
      moves++;
      if (layout[first] === layout[second]) { matched.add(first); matched.add(second); }
      else misses++;
    }
    return {moves, misses, hintsUsed: used};
  }
  function summarize(arr) {
    const sum = arr.reduce((a, t) => a + t.moves, 0);
    const misses = arr.reduce((a, t) => a + t.misses, 0);
    return {averageMoves: Number((sum / arr.length).toFixed(2)), averageMisses: Number((misses / arr.length).toFixed(2)), minMoves: Math.min(...arr.map(x => x.moves)), maxMoves: Math.max(...arr.map(x => x.moves))};
  }
  function analyze(puzzle, trials = 32) {
    if (!puzzle || !puzzle.config || !Array.isArray(puzzle.layout)) throw new Error('A generated puzzle is required.');
    const validated = validate(puzzle.config);
    const canonical = build(validated);
    if (JSON.stringify(canonical.layout) !== JSON.stringify(puzzle.layout)) throw new Error('Layout does not match its configuration and seed.');
    if (!Number.isInteger(trials) || trials < 1 || trials > 200) throw new Error('Trials must be a whole number from 1–200.');
    const baseline = Array.from({length: trials}, (_, i) => simulateOne(puzzle, i, 0));
    const assisted = Array.from({length: trials}, (_, i) => simulateOne(puzzle, i, puzzle.config.hints));
    const normal = summarize(baseline), helped = summarize(assisted);
    const missRatio = normal.averageMisses / puzzle.config.pairs;
    return {
      solvable: true, reason: 'Every included symbol occurs exactly twice; all pairs can be matched.',
      activeCards: puzzle.config.pairs * 2, unusedCells: puzzle.layout.length - puzzle.config.pairs * 2,
      trials, baseline: normal, assisted: helped,
      averageMovesSaved: Number((normal.averageMoves - helped.averageMoves).toFixed(2)),
      mismatchRatio: Number(missRatio.toFixed(2)),
      challengeBand: missRatio < 0.35 ? 'Gentle' : missRatio < 0.85 ? 'Balanced' : 'Tricky',
      assumptions: MODEL
    };
  }
  function report(puzzle) {
    return {schema: 'arcade-balance-lab/report-v1', generatedBy: 'Arcade Balance Lab 1.0', puzzle, analysis: analyze(puzzle)};
  }
  return {SYMBOLS, MODEL, hash32, validate, build, simulateOne, analyze, report};
});
