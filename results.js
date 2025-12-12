
const data = JSON.parse(localStorage.getItem('resultsPayload') || '{}');
const results = document.getElementById('results');

function bandClass(val){
  if (val >= 6) return 'high';
  if (val >= 3) return 'moderate';
  return 'low';
}
function pct(val){
  const p = Math.max(0, Math.min(1, (val + 2) / 10));
  return Math.round(p * 100);
}
function pill(val, label){
  const cls = bandClass(val);
  const labelTxt = cls === 'high' ? 'High' : (cls === 'moderate' ? 'Moderate' : 'Low');
  return `<div class="pill ${cls}">${label}: <b>${labelTxt}</b> <span class="small">(${pct(val)}%)</span></div>`;
}

if (!data.cards || !Array.isArray(data.cards)) {
  results.innerHTML = `<p class="small">No results found. Please return to the assessment and tap “Finish”.</p>`;
} else {
  results.innerHTML = data.cards.map((c, idx) => {
    const shortHtml = (c.short == null) ? '' : pill(c.short, 'Short-term');
    const midHtml = pill(c.mid, 'Mid-term');
    const longHtml = (c.long == null) ? '' : pill(c.long, 'Long-term');

    const toggleId = `clinToggle_${idx}`;
    const detailId = `clinDetail_${idx}`;

    return `
      <div class="result-card">
        <div class="result-title">${c.title}</div>
        <div class="pillrow">${shortHtml}${midHtml}${longHtml}</div>

        <div class="why-block">
          <div class="why-title">Why this result?</div>
          <p class="why-text">${c.whyPatient || ''}</p>

          <button class="btn-secondary btn-small" id="${toggleId}" type="button" aria-expanded="false">
            Clinician detail
          </button>
          <div class="clin-detail" id="${detailId}" style="display:none;">
            <p class="small" style="margin:10px 0 0 0;">${c.whyClinician || ''}</p>
          </div>
        </div>

        ${c.note ? `<div class="small" style="margin-top:10px;">${c.note}</div>` : ''}
      </div>
    `;
  }).join('');

  // wire toggles
  data.cards.forEach((c, idx) => {
    const t = document.getElementById(`clinToggle_${idx}`);
    const d = document.getElementById(`clinDetail_${idx}`);
    if (!t || !d) return;
    t.addEventListener('click', () => {
      const open = d.style.display !== 'none';
      d.style.display = open ? 'none' : 'block';
      t.setAttribute('aria-expanded', open ? 'false' : 'true');
      t.textContent = open ? 'Clinician detail' : 'Hide clinician detail';
    });
  });
}
