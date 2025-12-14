
const el = document.getElementById('results');
const meta = document.getElementById('resultsMeta');
let payload = {};
try { payload = JSON.parse(localStorage.getItem('resultsPayload')||'{}'); } catch(e) { payload = {}; }

function pillHTML(label, idx){
  const b = bandFromIndex(idx);
  const pct = pctFromIndex(idx);
  return `<div class="pill ${b.cls}">${label}: ${b.band} (${pct}%)</div>`;
}
function cardHTML(c){
  const short = (c.short===undefined) ? '' : pillHTML('Short-term', c.short);
  const mid = pillHTML('Mid-term', c.mid);
  const long = (c.long===undefined) ? '' : pillHTML('Long-term', c.long);
  return `
    <div class="result-card">
      <div class="result-title">${c.title}</div>
      <div class="pillrow">${short}${mid}${long}</div>
      <div class="small"><b>Why this result?</b> ${c.note || ''}</div>
      <details class="details">
        <summary>Clinician detail</summary>
        <div class="small" style="margin-top:8px;">${c.clinician || ''}</div>
      </details>
    </div>
  `;
}

if (!payload.cards || !payload.cards.length) {
  el.innerHTML = `<div class="warning">No results found. Please run an assessment first.</div>
    <div style="margin-top:12px; display:flex; gap:12px; flex-wrap:wrap;">
      <a class="btn btn-primary" href="patient.html">Patient tool</a>
      <a class="btn btn-primary" href="clinician.html">Clinician tool</a>
    </div>`;
} else {
  const m = payload.meta || {};
  if (meta) {
    const bits = [];
    if (payload.mode) bits.push(`Mode: ${payload.mode}`);
    if (m.age) bits.push(`Age: ${m.age}`);
    if (m.bmi) bits.push(`BMI: ${Number(m.bmi).toFixed(1)}`);
    if (m.kl) bits.push(`KL: ${m.kl}`);
    if (m.stage) bits.push(`Stage: ${m.stage}`);
    meta.textContent = bits.join(' • ') + ' • This tool supports shared decision-making and does not replace clinical judgement.';
  }
  el.innerHTML = payload.cards.map(cardHTML).join('');
}

document.getElementById('newBtn').addEventListener('click', ()=>{
  localStorage.removeItem('resultsPayload');
  window.location.href = 'index.html';
});
