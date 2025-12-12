
function yn(val) {
  return val === 'Y' ? 1 : 0;
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function bandShortMid(idx) {
  if (idx >= 6) return 'High';
  if (idx >= 3) return 'Moderate';
  if (idx >= 1) return 'Low–Moderate';
  return 'Low';
}

function calcBMI() {
  const h = parseFloat(document.getElementById('height')?.value || '');
  const w = parseFloat(document.getElementById('weight')?.value || '');
  const bmiEl = document.getElementById('bmi');
  if (!bmiEl) return;
  if (!h || !w) { bmiEl.value = ''; return; }
  const m = h / 100.0;
  const bmi = w / (m*m);
  bmiEl.value = bmi.toFixed(1);
  return bmi;
}

function calcPCS() {
  let total = 0;
  for (let i=1;i<=6;i++) {
    const v = parseInt(document.getElementById('pcs'+i)?.value || '0', 10);
    total += (isNaN(v)?0:v);
  }
  const totalEl = document.getElementById('pcsTotalDisplay');
  const bandEl = document.getElementById('pcsBandDisplay');
  if (totalEl) totalEl.textContent = String(total);
  let band = 'Low';
  if (total >= 15) band = 'High';
  else if (total >= 10) band = 'Moderate';
  if (bandEl) bandEl.textContent = band;
  return total;
}

function calcWOMAC() {
  const get = (id) => parseInt(document.getElementById(id)?.value || '0', 10) || 0;
  const pain = [1,2,3,4,5].map(i=>get('pain'+i)).reduce((a,b)=>a+b,0);
  const stiff = [1,2].map(i=>get('stiff'+i)).reduce((a,b)=>a+b,0);
  const func = Array.from({length:17},(_,i)=>get('func'+(i+1))).reduce((a,b)=>a+b,0);
  const total = pain + stiff + func;

  document.getElementById('womacPainTotal').textContent = String(pain);
  document.getElementById('womacStiffTotal').textContent = String(stiff);
  document.getElementById('womacFuncTotal').textContent = String(func);
  document.getElementById('womacTotal').textContent = String(total);

  return { pain, stiff, func, total };
}

function resetForm() {
  const ids = [
    'age','vas','height','weight','bmi',
    'synovitis','effusion','pt_xray','pt_severity','malalign','quadweak',
    'nutr','pt_cs_response','pt_cs_count','pt_aspirated'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') el.value = '';
    else el.value = '';
  });

  const checks = ['com_diabetes','com_glaucoma','com_cvd','com_ckd','com_cld','com_raid','com_immune','com_none'];
  checks.forEach(id => { const el=document.getElementById(id); if(el) el.checked=false; });

  // WOMAC / PCS back to zero
  for (let i=1;i<=6;i++) document.getElementById('pcs'+i).value = '0';
  for (let i=1;i<=5;i++) document.getElementById('pain'+i).value = '0';
  for (let i=1;i<=2;i++) document.getElementById('stiff'+i).value = '0';
  for (let i=1;i<=17;i++) document.getElementById('func'+i).value = '0';
  calcPCS();
  calcWOMAC();

  const amber = document.getElementById('amberWarning');
  const csWarning = document.getElementById('csWarning');
  if (amber) { amber.style.display='none'; amber.innerHTML=''; }
  if (csWarning) { csWarning.style.display='none'; csWarning.textContent=''; }

  const results = document.getElementById('results');
  if (results) results.innerHTML = '';
}

function calculatePredictions() {
  const amber = document.getElementById('amberWarning');
  const csWarning = document.getElementById('csWarning');
  if (amber) { amber.style.display='none'; amber.innerHTML=''; }
  if (csWarning) { csWarning.style.display='none'; csWarning.textContent=''; }

  // Inputs
  const age = parseInt(document.getElementById('age')?.value || '0',10) || 0;
  const vas = parseInt(document.getElementById('vas')?.value || '0',10) || 0;
  const bmi = parseFloat(document.getElementById('bmi')?.value || '') || calcBMI() || 0;

  // Patient wording mapping:
  // synovitis select = swelling/puffy
  // effusion select = warm/hot
  const swelling = document.getElementById('synovitis')?.value || '';
  const warm = document.getElementById('effusion')?.value || '';

  const xray = document.getElementById('pt_xray')?.value || '';
  const severity = document.getElementById('pt_severity')?.value || '';
  const mal = document.getElementById('malalign')?.value || '';
  const quad = document.getElementById('quadweak')?.value || '';
  const nutr = document.getElementById('nutr')?.value || '';

  const csResp = document.getElementById('pt_cs_response')?.value || '';
  const csCount = document.getElementById('pt_cs_count')?.value || '';

  // Aspiration (only meaningful if swelling)
  const asp = document.getElementById('pt_aspirated')?.value || '';

  // Comorbidities
  const hasDiabetes = !!document.getElementById('com_diabetes')?.checked;
  const hasGlaucoma = !!document.getElementById('com_glaucoma')?.checked;
  const comCVD = !!document.getElementById('com_cvd')?.checked;
  const comCKD = !!document.getElementById('com_ckd')?.checked;
  const comCLD = !!document.getElementById('com_cld')?.checked;
  const comRA = !!document.getElementById('com_raid')?.checked;
  const comImm = !!document.getElementById('com_immune')?.checked;

  // Warnings
  if (hasDiabetes && amber) {
    amber.style.display='block';
    amber.innerHTML += '⚠ Diabetes: steroid injections can temporarily upset blood sugar control for up to 1–2 weeks. Discuss monitoring or non-steroid options.<br>';
  }
  if (hasGlaucoma && amber) {
    amber.style.display='block';
    amber.innerHTML += '⚠ Glaucoma: steroid injections can increase pressure inside the eye. Consider non-steroid options or seek medical advice.<br>';
  }

  // Scores
  // AgeScore: small negative with age (patient version)
  let AgeScore = 0;
  if (age >= 80) AgeScore = -1.2;
  else if (age >= 70) AgeScore = -0.8;
  else if (age >= 60) AgeScore = -0.3;
  else AgeScore = 0.3;

  // StageScore based on severity (only if xray yes)
  let StageScore = 0;
  if (xray === 'Y') {
    if (severity === 'mild') StageScore = 1.2;
    else if (severity === 'mildmod') StageScore = 0.8;
    else if (severity === 'mod') StageScore = 0.2;
    else if (severity === 'modsev') StageScore = -0.8;
    else if (severity === 'sev') StageScore = -1.6;
    else StageScore = 0; // unknown
  } else if (xray === 'N') {
    StageScore = -0.2; // slightly less confident without imaging
  }

  // Inflammation from swelling/warm
  const SwellY = (swelling === 'Y') ? 1 : 0;
  const WarmY = (warm === 'Y') ? 1 : 0;
  const InflammScore = 1.2*SwellY + 1.2*WarmY;

  // BMIScore (conservative for HA/gels; small baseline effect)
  let BMIScore = 0;
  if (bmi >= 35) BMIScore = -1.0;
  else if (bmi >= 30) BMIScore = -0.6;
  else if (bmi >= 27) BMIScore = -0.2;
  else BMIScore = 0.2;

  // Alignment
  let AlignScore = (mal === 'Y') ? -0.6 : 0;

  // Quad penalty (Option C scaling)
  let QuadPenalty = 0;
  if (quad === 'abit') QuadPenalty = -0.3;
  else if (quad === 'hard') QuadPenalty = -0.7;
  else if (quad === 'cant') QuadPenalty = -1.0;

  // Nutrition
  let NutrScore = (nutr === 'Y') ? -0.5 : 0;

  // Comorbidity penalty (typed, conservative)
  let ComorbPenalty = 0;
  if (comCVD) ComorbPenalty += 0.3;
  if (comCKD) ComorbPenalty += 0.6;
  if (comCLD) ComorbPenalty += 0.5;
  if (comRA)  ComorbPenalty += 1.2;
  if (comImm) ComorbPenalty += 0.8;
  if (hasDiabetes) ComorbPenalty += 0.0; // warning-driven; minimal outcome penalty
  ComorbPenalty = clamp(ComorbPenalty, 0, 2.5);

  // PCS + WOMAC
  const pcsTotal = calcPCS();
  const womac = calcWOMAC();
  const womacPainNorm = clamp(womac.pain/20.0, 0, 1);
  const womacFuncNorm = clamp(womac.func/68.0, 0, 1);
  const womacStiffNorm = clamp(womac.stiff/8.0, 0, 1);

  let PsychPenalty = 0;
  if (pcsTotal >= 15) PsychPenalty = 1.0;
  else if (pcsTotal >= 10) PsychPenalty = 0.5;

  // SymptomScore (conservative weight)
  const SymptomScore = 2.0*womacPainNorm + 1.5*womacFuncNorm + 0.5*womacStiffNorm; // 0..4
  const VASScore = clamp((vas-50)/25.0, -2, 2) * 0.4; // small modulator

  // Prior & CS load
  let PriorScore = 0;
  if (csResp === 'good') PriorScore = 0.8;
  else if (csResp === 'poor') PriorScore = -0.6;

  let CSloadPenalty = 0;
  if (csCount === 'few') CSloadPenalty = 0.5;
  else if (csCount === 'many') CSloadPenalty = 1.2;

  // Baseline index
  const S = AgeScore + StageScore + BMIScore + AlignScore + QuadPenalty + NutrScore - ComorbPenalty + (SymptomScore*1.2) + VASScore - PsychPenalty;

  // Treatment indices (conservative HA/gel)
  let CS_short = 0.9*S + 1.0*InflammScore + 0.5*PriorScore - 0.6*CSloadPenalty;
  let CS_mid   = 0.5*S + 0.3*InflammScore + 0.2*PriorScore - 1.0*CSloadPenalty;

  let HA_short = 0.6*S - 0.3*InflammScore - 0.3*ComorbPenalty + 0.2*StageScore;
  let HA_mid   = 0.9*S - 0.9*InflammScore - 0.7*ComorbPenalty + 0.4*StageScore - 0.4*BMIScore;

  let Gel_mid  = 0.95*S - 0.35*InflammScore - 0.6*ComorbPenalty + 0.3*StageScore - 0.2*BMIScore;
  let Gel_long = 0.75*S - 0.25*InflammScore - 0.7*ComorbPenalty + 0.2*StageScore - 0.2*BMIScore;

  // Aspiration modifier: only if swelling reported and aspiration usually done
  const aspY = (SwellY === 1) && (asp === 'Y');
  if (aspY) {
    CS_short += 0.2;
    CS_mid += 0.1;
    HA_mid += 0.5;
    Gel_mid += 0.2;
    Gel_long += 0.2;
  }

  // Clamp
  const cap = (x) => clamp(x, -2, 8);
  CS_short = cap(CS_short); CS_mid = cap(CS_mid);
  HA_short = cap(HA_short); HA_mid = cap(HA_mid);
  Gel_mid = cap(Gel_mid); Gel_long = cap(Gel_long);

  // Build results
  const results = document.getElementById('results');
  if (!results) return;

  const cards = [
    { title: 'Corticosteroid', short: CS_short, mid: CS_mid, note: 'Short-term often best when the knee is warm/swollen.' },
    { title: 'Hyaluronic Acid (e.g., Sinovial 64 / Sinogel)', short: HA_short, mid: HA_mid, note: 'Typically best mid-term in mild–moderate OA.' },
    { title: 'Hydrogel', short: null, mid: Gel_mid, long: Gel_long, note: 'Designed for longer durability; results vary by stage and inflammation.' }
  ];

  function band(val){ return bandShortMid(val); }
  function pct(val){ return Math.round(clamp((val+2)/10,0,1)*100); }

  results.innerHTML = cards.map(c => {
    const shortHtml = (c.short===null) ? '' : `<div class="pill">Short-term: <b>${band(c.short)}</b> (${pct(c.short)}%)</div>`;
    const midHtml = `<div class="pill">Mid-term: <b>${band(c.mid)}</b> (${pct(c.mid)}%)</div>`;
    const longHtml = (c.long===undefined) ? '' : `<div class="pill">Long-term: <b>${band(c.long)}</b> (${pct(c.long)}%)</div>`;
    return `
      <div class="result-card">
        <div class="result-title">${c.title}</div>
        <div class="pillrow">${shortHtml}${midHtml}${longHtml}</div>
        <div class="small">${c.note}</div>
      </div>
    `;
  }).join('');

  const resultsCard = document.getElementById('resultsCard');
  if (resultsCard) window.scrollTo({ top: resultsCard.offsetTop - 10, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const formCard = document.getElementById('formCard');
  const calcBtn = document.getElementById('calcBtn');
  const printBtn = document.getElementById('printBtn');
  const resetFab = document.getElementById('resetFab');
  const darkToggle = document.getElementById('darkToggle');

  // Stepper
  const steps = Array.from(document.querySelectorAll('.step'));
  let stepIndex = 0;
  const nextBtn = document.getElementById('nextBtn');
  const backBtn = document.getElementById('backBtn');
  const stepTitle = document.getElementById('stepTitle');
  const stepCounter = document.getElementById('stepCounter');
  const stepBar = document.getElementById('stepBar');

  function showStep(i) {
    stepIndex = Math.max(0, Math.min(i, steps.length - 1));
    steps.forEach((s, idx) => s.classList.toggle('active', idx === stepIndex));
    const title = steps[stepIndex].getAttribute('data-title') || `Section ${stepIndex+1}`;
    if (stepTitle) stepTitle.textContent = title;
    if (stepCounter) stepCounter.textContent = `Step ${stepIndex+1} of ${steps.length}`;
    if (stepBar) stepBar.style.width = `${Math.round(((stepIndex+1)/steps.length)*100)}%`;
    if (backBtn) backBtn.style.visibility = stepIndex === 0 ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.textContent = stepIndex === steps.length-1 ? 'Finish' : 'Next section';
  }

  if (startBtn && formCard) {
    startBtn.addEventListener('click', function() {
      formCard.classList.toggle('hidden');
      if (!formCard.classList.contains('hidden')) {
        showStep(0);
        window.scrollTo({ top: formCard.offsetTop - 10, behavior: 'smooth' });
      }
    });
  }

  if (nextBtn) nextBtn.addEventListener('click', function() {
    if (stepIndex < steps.length - 1) {
      showStep(stepIndex + 1);
      window.scrollTo({ top: formCard.offsetTop - 10, behavior: 'smooth' });
    } else {
      calculatePredictions();
    }
  });

  if (backBtn) backBtn.addEventListener('click', function() {
    if (stepIndex > 0) {
      showStep(stepIndex - 1);
      window.scrollTo({ top: formCard.offsetTop - 10, behavior: 'smooth' });
    }
  });

  // X-ray severity enable/disable
  const xraySel = document.getElementById('pt_xray');
  const sevSel = document.getElementById('pt_severity');
  function updateSeverityState() {
    if (!sevSel) return;
    if (xraySel && xraySel.value === 'Y') {
      sevSel.disabled = false;
    } else {
      sevSel.value = '';
      sevSel.disabled = true;
    }
  }
  if (xraySel) xraySel.addEventListener('change', updateSeverityState);
  updateSeverityState();

  // Aspiration question shown only if swelling yes (synovitis select)
  const swellSel = document.getElementById('synovitis');
  const aspBlock = document.getElementById('pt_aspirated_block');
  const aspSel = document.getElementById('pt_aspirated');
  function updateAspBlock() {
    const show = swellSel && swellSel.value === 'Y';
    if (aspBlock) aspBlock.style.display = show ? 'block' : 'none';
    if (!show && aspSel) aspSel.value = '';
  }
  if (swellSel) swellSel.addEventListener('change', updateAspBlock);
  updateAspBlock();

  // Comorbidity "None" logic
  const none = document.getElementById('com_none');
  const others = ['com_diabetes','com_glaucoma','com_cvd','com_ckd','com_cld','com_raid','com_immune']
    .map(id => document.getElementById(id)).filter(Boolean);

  if (none) none.addEventListener('change', () => {
    if (none.checked) others.forEach(el => el.checked = false);
  });
  others.forEach(el => el.addEventListener('change', () => {
    if (el.checked && none) none.checked = false;
  }));

  // BMI + questionnaires live
  const h = document.getElementById('height');
  const w = document.getElementById('weight');
  if (h) h.addEventListener('input', calcBMI);
  if (w) w.addEventListener('input', calcBMI);

  // WOMAC/PCS toggles
  const womacToggleBtn = document.getElementById('womacToggleBtn');
  const womacGrid = document.getElementById('womacGrid');
  if (womacToggleBtn && womacGrid) {
    womacToggleBtn.addEventListener('click', () => {
      const show = !womacGrid.classList.contains('show');
      womacGrid.classList.toggle('show', show);
      womacToggleBtn.textContent = show ? 'Hide' : 'Show';
    });
  }
  const pcsToggleBtn = document.getElementById('pcsToggleBtn');
  const pcsGrid = document.getElementById('pcsGrid');
  if (pcsToggleBtn && pcsGrid) {
    pcsToggleBtn.addEventListener('click', () => {
      const show = !pcsGrid.classList.contains('show');
      pcsGrid.classList.toggle('show', show);
      pcsToggleBtn.textContent = show ? 'Hide' : 'Show';
    });
  }

  for (let i=1;i<=6;i++) document.getElementById('pcs'+i).addEventListener('change', calcPCS);
  const womacIds = [
    'pain1','pain2','pain3','pain4','pain5',
    'stiff1','stiff2',
    'func1','func2','func3','func4','func5','func6','func7','func8','func9',
    'func10','func11','func12','func13','func14','func15','func16','func17'
  ];
  womacIds.forEach(id => document.getElementById(id).addEventListener('change', calcWOMAC));
  calcPCS(); calcWOMAC();

  if (calcBtn) calcBtn.addEventListener('click', calculatePredictions);
  if (printBtn) printBtn.addEventListener('click', () => window.print());
  if (resetFab) resetFab.addEventListener('click', resetForm);
  if (darkToggle) darkToggle.addEventListener('click', () => document.body.classList.toggle('dark'));

  showStep(0);
});
