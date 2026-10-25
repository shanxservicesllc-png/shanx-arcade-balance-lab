'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../src/engine.js');
const Export = require('../src/export.js');
const config = {rows:4, cols:4, pairs:8, hints:2, seed:'SXS-0426'};

test('same seed and config generate byte-identical layouts and fingerprints', () => {
  const a = Engine.build(config), b = Engine.build({...config});
  assert.deepEqual(a,b);
});
test('layout includes exactly two of each active symbol', () => {
  for (const [r,c,p] of [[3,4,6],[4,4,8],[4,5,4],[5,6,15]]) {
    const b = Engine.build({rows:r, cols:c, pairs:p, hints:0, seed:'limits'});
    assert.equal(b.layout.length,r*c);
    assert.equal(b.layout.filter(x=>x===null).length,r*c-2*p);
    for (let i = 0;i<p;i++) assert.equal(b.layout.filter(x=>x===i).length,2);
  }
});
test('different seed affects layout on supplied fixture', () => {
  assert.notDeepEqual(Engine.build(config).layout, Engine.build({...config, seed:'SXS-OTHER'}).layout);
});
test('rejects too many pairs instead of crashing', () => {
  assert.throws(()=>Engine.build({...config,pairs:9}),/Pairs must/);
});
test('rejects fractional pairs, invalid hints, unsafe sizes and empty seed', () => {
  const changes=[{pairs:2.5},{hints:-1},{hints:99},{rows:7},{cols:7},{seed:''},{seed:'    '},{seed:'BAD\nSEED'},{pairs:0},{rows:'4'}];
  for(const c of changes) assert.throws(()=>Engine.build({...config,...c}),undefined,JSON.stringify(c));
});
test('simulated play always solves and reports deterministic metrics', () => {
  const puzzle = Engine.build(config);
  const a=Engine.analyze(puzzle,32),b=Engine.analyze(puzzle,32);
  assert.deepEqual(a,b);
  assert.equal(a.solvable,true);
  assert.ok(a.baseline.averageMoves>=config.pairs);
  assert.ok(a.assisted.averageMoves>=config.pairs);
  assert.ok(a.baseline.maxMoves<=config.pairs*3);
  assert.equal(a.trials,32);
});
test('hint count equal to pair count yields exactly one move per pair', () => {
  const cfg={...config,hints:config.pairs};
  const p=Engine.build(cfg),r=Engine.analyze(p);
  assert.equal(r.assisted.averageMoves,config.pairs);
  assert.equal(r.assisted.averageMisses,0);
});
test('zero hints produce identical baselines and assisted metrics', () => {
  const puzzle=Engine.build({...config,hints:0});
  const r=Engine.analyze(puzzle);
  assert.deepEqual(r.assisted,r.baseline);
  assert.equal(r.averageMovesSaved,0);
});
test('rejects corrupt layout in analysis', () => {
  const puzzle=Engine.build(config);puzzle.layout[0]=14;
  assert.throws(()=>Engine.analyze(puzzle),/Layout does not match/);
});
test('simulation random seeds and grid variants have no hangs', () => {
  for(let n=0;n<90;n++) {
    const rows=3+n%3, cols=4+n%3,pairs=2+n%(Math.floor(rows*cols/2)-1);
    const p=Engine.build({rows,cols,pairs,hints:n%(pairs+1),seed:'stress-'+n});
    const r=Engine.analyze(p,8);
    assert.equal(r.solvable,true);
    assert.ok(Number.isFinite(r.baseline.averageMoves));
  }
});
test('export is a complete self-contained offline HTML document', () => {
  const html=Export.standaloneHTML(Engine.report(Engine.build(config)));
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/SXS-0426/);
  assert.match(html,/application\/json/);
  assert.match(html,/Offline Puzzle/);
  assert.doesNotMatch(html,/<script[^>]+src=/);
  assert.doesNotMatch(html,/<link[^>]+href=/);
  assert.doesNotMatch(html,/https?:\/\//);
});
test('seed encoding cannot inject script tags into exported HTML', () => {
  const malicious={...config,seed:'</script><script>alert(1)</script>'};
  const html=Export.standaloneHTML(Engine.report(Engine.build(malicious)));
  assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
  assert.match(html,/\\u003c/);
});
