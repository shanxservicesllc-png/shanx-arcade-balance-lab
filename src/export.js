/* Offline single-file export without fetch, CDN, scripts, or account data. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ArcadeExport = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeScriptJSON(obj) { return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
  function standaloneHTML(report) {
    if (!report || !report.puzzle || !report.analysis) throw new Error('A complete report is required.');
    const {puzzle} = report;
    const packed = escapeScriptJSON(report);
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Arcade Balance Lab · Offline Puzzle ${escapeHTML(puzzle.fingerprint)}</title>
<style>
:root{color-scheme:dark;font:16px/1.5 system-ui,sans-serif;background:#101522;color:#f4f6ff}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 8% 0%,#223252 0,transparent 35%),#101522}main{max-width:820px;margin:0 auto;padding:32px 18px}h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.04;letter-spacing:-.055em;margin:10px 0}p{color:#afb9cf}.tag{font-size:.75rem;text-transform:uppercase;font-weight:800;letter-spacing:.17em;color:#8fefd1}.meta{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.pill{border:1px solid #3c4960;border-radius:25px;padding:9px 13px;background:#1b2537;color:#e4ebff}.board{display:grid;gap:10px;max-width:660px;margin:24px auto}.tile{appearance:none;border:1px solid #51617c;background:linear-gradient(150deg,#334668,#1d2a40);color:#dbe8fd;aspect-ratio:1;border-radius:14px;font-size:clamp(1.5rem,6vw,2.4rem);font-weight:800;cursor:pointer;transition:transform .15s,background .15s}.tile:hover:not(:disabled){transform:translateY(-2px);border-color:#78e9c4}.tile.open,.tile.matched{background:#fcf0d8;color:#21324c;border-color:#f0bf80}.tile.matched{background:#abf0d5;color:#102b2a}.tile.empty{background:#111a28;border:1px dashed #344059;cursor:default;opacity:.4}.actions{display:flex;gap:10px;flex-wrap:wrap}.actions button{background:#84eac4;color:#102926;border:0;border-radius:12px;padding:13px 18px;font-weight:800;cursor:pointer}.actions button.secondary{background:#26354e;color:#eff6ff}.actions button:disabled{opacity:.4;cursor:not-allowed}.status{min-height:2rem;font-weight:700;color:#cfffe9}.small{font-size:.84rem}button:focus-visible{outline:3px solid #f9cb90;outline-offset:3px}
</style></head><body><main><div class="tag">SXS / ARCADE BALANCE LAB · PORTABLE EDITION</div><h1>Match your way through.</h1><p>Playable offline, no sign-in and no network needed. Every seed recreates the same layout.</p>
<div class="meta"><div class="pill">Seed: <strong id="seed"></strong></div><div class="pill">Fingerprint: <strong id="fingerprint"></strong></div><div class="pill">Moves: <strong id="moves">0</strong></div><div class="pill">Misses: <strong id="misses">0</strong></div><div class="pill">Pairs: <strong id="pairs">0</strong></div><div class="pill">Hints: <strong id="hints">0</strong></div></div>
<div class="board" id="board" aria-label="Card matching puzzle"></div><div class="actions"><button type="button" id="hint">Use hint: solve a pair</button><button class="secondary" type="button" id="reset">Restart</button></div><p id="status" class="status" aria-live="polite">Find two identical symbols.</p><p class="small">Hint rule: one hint completes one unmatched pair and counts as a move. Each mismatch counts as one move too. Empty cells are intentionally disabled.</p>
<script type="application/json" id="data">${packed}</script>
<script>
(()=>{'use strict';const R=JSON.parse(document.getElementById('data').textContent),P=R.puzzle,C=P.config,L=P.layout,S=['◆','✦','●','▲','⬡','✿','★','♥','♣','☀','⬢','✳','♠','◈','✚'];let matched,open,locked,moves,misses,hints,flipTimer;const el=id=>document.getElementById(id);const board=el('board');
function reset(){clearTimeout(flipTimer);matched=new Set();open=[];locked=false;moves=0;misses=0;hints=C.hints;board.style.gridTemplateColumns='repeat('+C.cols+',minmax(0,1fr))';board.replaceChildren();L.forEach((id,i)=>{const b=document.createElement('button');b.type='button';b.className='tile'+(id===null?' empty':'');b.dataset.pos=i;b.textContent=id===null?'':'?';b.setAttribute('aria-label',id===null?'Unused cell':'Hidden card '+(i+1));b.disabled=id===null;if(id!==null)b.addEventListener('click',()=>flip(i));board.appendChild(b)});update('Find two identical symbols.')}
function update(msg){el('seed').textContent=C.seed;el('fingerprint').textContent=P.fingerprint;el('moves').textContent=moves;el('misses').textContent=misses;el('pairs').textContent=matched.size/2+'/'+C.pairs;el('hints').textContent=hints;el('hint').disabled=locked||hints===0||matched.size===C.pairs*2;el('status').textContent=msg||''}
function paint(i,isMatch=false){const b=board.children[i];b.classList.add(isMatch?'matched':'open');b.textContent=S[L[i]];b.setAttribute('aria-label',(isMatch?'Matched ':'Revealed ')+S[L[i]])}
function finish(msg){if(matched.size===C.pairs*2){update('Completed in '+moves+' moves with '+misses+' misses. '+msg)}else update(msg)}
function flip(i){if(locked||matched.has(i)||open.includes(i)||L[i]===null)return;paint(i);open.push(i);if(open.length===2){moves++;const[a,b]=open;if(L[a]===L[b]){matched.add(a);matched.add(b);board.children[a].classList.replace('open','matched');board.children[b].classList.replace('open','matched');open=[];finish('Nice match!')}else{locked=true;misses++;update('Not a match. Remember those positions.');flipTimer=setTimeout(()=>{for(const p of [a,b]){board.children[p].classList.remove('open');board.children[p].textContent='?';board.children[p].setAttribute('aria-label','Hidden card '+(p+1))}open=[];locked=false;update('Try another pair.')},850)}}else update('Choose its match.')}
function hint(){if(locked||hints===0||matched.size===C.pairs*2)return;clearTimeout(flipTimer);for(const i of open){const b=board.children[i];b.classList.remove('open');b.textContent='?';b.setAttribute('aria-label','Hidden card '+(i+1))}open=[];const a=L.findIndex((id,i)=>id!==null&&!matched.has(i)),b=L.findIndex((id,i)=>id===L[a]&&i!==a&&!matched.has(i));if(a<0||b<0)return;paint(a,true);paint(b,true);matched.add(a);matched.add(b);hints--;moves++;finish('Hint solved a pair.')}
el('reset').addEventListener('click',reset);el('hint').addEventListener('click',hint);reset();})();
</script></main></body></html>`;
  }
  return {standaloneHTML, escapeHTML};
});
