let currentMode = 'patient';

function yn(val) {
  return val === 'Y' ? 1 : 0;
}

function bandShortMid(idx) {
  if (idx >= 5) return {text: "High (≥70%)", cls: "band-high"};
  if (idx >= 2) return {text: "Moderate (40–70%)", cls: "band-mod"};
  if (idx >= 0) return {text: "Low–moderate (20–40%)", cls: "band-lowmod"};
  return {text: "Unlikely (<20%)", cls: "band-unlikely"};
}

function bandLong(idx) {
  if (idx >= 6) return {text: "High (≥70%)", cls: "band-high"};
  if (idx >= 3) return {text: "Moderate (40–70%)", cls: "band-mod"};
  if (idx >= 1) return {text: "Low–moderate (20–40%)", cls: "band-lowmod"};
  return {text: "Unlikely (<20%)", cls: "band-unlikely"};
}

function calcBMI() {
  const h = parseFloat(document.getElementById('height').value) || 0;
  const w = parseFloat(document.getElementById('weight').value) || 0;
  const bmiEl = document.getElementById('bmi');
  if (h > 0 && w > 0) {
    const m = h / 100.0;
    const bmi = w / (m * m);
    bmiEl.value = bmi.toFixed(1);
  } else {
    bmiEl.value = "";
  }
}

function calcPCS() {
  let total = 0;
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('pcs' + i);
    total += parseInt(el.value || "0", 10);
  }
  const totalEl = document.getElementById('pcsTotalDisplay');
  const bandEl = document.getElementById('pcsBandDisplay');
  totalEl.textContent = total.toString();
  let band = "Low";
  if (total >= 15) band = "High";
  else if (total >= 10) band = "Moderate";
  bandEl.textContent = band;
  return { total, band };
}

function calcWOMAC() {
  const painIds = ['pain1','pain2','pain3','pain4','pain5'];
  const stiffIds = ['stiff1','stiff2'];
  const funcIds = [
    'func1','func2','func3','func4','func5','func6','func7','func8','func9',
    'func10','func11','func12','func13','func14','func15','func16','func17'
  ];

  let pain = 0, stiff = 0, func = 0;
  painIds.forEach(id => { pain += parseInt(document.getElementById(id).value || "0", 10); });
  stiffIds.forEach(id => { stiff += parseInt(document.getElementById(id).value || "0", 10); });
  funcIds.forEach(id => { func += parseInt(document.getElementById(id).value || "0", 10); });

  const total = pain + stiff + func;

  document.getElementById('womacPainTotal').textContent = pain.toString();
  document.getElementById('womacStiffTotal').textContent = stiff.toString();
  document.getElementById('womacFuncTotal').textContent = func.toString();
  document.getElementById('womacTotal').textContent = total.toString();

  return { pain, stiff, func, total };
}

function applyFirstInjectionBehaviour() {
  const prior = document.getElementById('prior').value;
  const cs12Field = document.getElementById('cs12');
  const cslifeField = document.getElementById('cslife');
  if (!cs12Field || !cslifeField) return;

  if (prior === 'First') {
    cs12Field.value = 0;
    cslifeField.value = 0;
    cs12Field.disabled = true;
    cslifeField.disabled = true;
  } else {
    cs12Field.disabled = false;
    cslifeField.disabled = false;
  }
}

function calculatePredictions() {
  const age = parseFloat(document.getElementById('age').value) || 0;
  const kl = parseInt(document.getElementById('kl').value) || 0;
  let bmi = parseFloat(document.getElementById('bmi').value);
  const vas = parseFloat(document.getElementById('vas').value) || 0;

  const syn = document.getElementById('synovitis').value;
  const eff = document.getElementById('effusion').value;
  const mal = document.getElementById('malalign').value;
  const quad = document.getElementById('quadweak').value;
  const metabolic = document.getElementById('metabolic').value;
  const prior = document.getElementById('prior').value;
  const nutr = document.getElementById('nutr').value;
  const guided = document.getElementById('guided').value;
  let cs12 = parseInt(document.getElementById('cs12').value) || 0;
  let cslife = parseInt(document.getElementById('cslife').value) || 0;

  const diabetes = document.getElementById('diabetes').value;
  const glaucoma = document.getElementById('glaucoma').value;

  applyFirstInjectionBehaviour();
  if (prior === 'First') {
    cs12 = 0;
    cslife = 0;
  }

  const womac = calcWOMAC();
  const womacPain = womac.pain;
  const womacFunc = womac.func;
  const womacStiff = womac.stiff;

  if (!bmi || isNaN(bmi)) {
    const h = parseFloat(document.getElementById('height').value) || 0;
    const w = parseFloat(document.getElementById('weight').value) || 0;
    if (h > 0 && w > 0) {
      const m = h / 100.0;
      bmi = w / (m * m);
      document.getElementById('bmi').value = bmi.toFixed(1);
    } else {
      bmi = 0;
    }
  }

  const pcsInfo = calcPCS();
  const pcsTotal = pcsInfo.total;

  const amber = document.getElementById('amberWarning');
  amber.style.display = 'none';
  amber.innerHTML = '';

  let riskFlag = false;

  if (diabetes === 'Y') {
    riskFlag = true;
    amber.style.display = 'block';
    amber.innerHTML += '⚠ This patient has diabetes. Corticosteroid injections may destabilise blood glucose for up to 1–2 weeks. Monitor closely or consider a non-steroid option.<br>';
  }
  if (glaucoma === 'Y') {
    riskFlag = true;
    amber.style.display = 'block';
    amber.innerHTML += '⚠ This patient has glaucoma. Corticosteroids can increase intra-ocular pressure – consider non-steroid options or seek ophthalmology advice.<br>';
  }

  const csWarning = document.getElementById('csWarning');
  csWarning.style.display = 'none';
  if (cs12 >= 3 || cslife >= 5) {
    csWarning.style.display = 'block';
    csWarning.textContent = 'High corticosteroid exposure – reconsider further steroid use and emphasise alternatives.';
  }

  let AgeScore = age < 60 ? 1 : (age < 75 ? 0 : -1);
  let KLScore;
  if (kl <= 2) KLScore = 3;
  else if (kl === 3) KLScore = 1;
  else if (kl === 4) KLScore = -1;
  else KLScore = 0;

  let SynScore = yn(syn) * 4;
  let EffScore = yn(eff) * 1;

  let VASScore;
  if (vas < 40) VASScore = 1;
  else if (vas <= 69) VASScore = 0;
  else VASScore = -1;

  let MalScore = yn(mal) ? -2 : 0;

  let BMIScore;
  if (bmi > 0 && bmi < 25) BMIScore = 2;
  else if (bmi >= 25 && bmi <= 30) BMIScore = 0;
  else if (bmi > 30) BMIScore = -1;
  else BMIScore = 0;

  let QuadScore = yn(quad) ? -1 : 0;
  let MetScore = yn(metabolic) ? -1 : 0;

  let PsychScore = 0;
  if (pcsTotal >= 15) PsychScore = -1;
  else if (pcsTotal >= 10) PsychScore = -0.5;

  let PriorScore = (prior === 'Y') ? 2 : 0;
  let NutrScore = yn(nutr) ? -1 : 0;
  let IGScore = yn(guided) ? 1 : 0;

  let CSloadScore;
  if (cslife < 3) CSloadScore = 0;
  else if (cslife < 5) CSloadScore = -1;
  else CSloadScore = -2;

  const S = AgeScore + KLScore + SynScore + EffScore + VASScore + MalScore +
            BMIScore + QuadScore + MetScore + PsychScore + PriorScore +
            NutrScore + IGScore + CSloadScore;

  let KLcat;
  if (kl <= 2) KLcat = 1;
  else if (kl === 3) KLcat = 0;
  else KLcat = -1;

  let CSloadCat;
  if (cslife < 3) CSloadCat = 0;
  else if (cslife < 5) CSloadCat = 1;
  else CSloadCat = 2;

  const synFlag = yn(syn);
  const effFlag = yn(eff);
  const priorPosFlag = (prior === 'Y') ? 1 : 0;
  const malFlag = yn(mal);

  const womacPainNorm = Math.min(Math.max(womacPain / 20.0, 0), 1);
  const womacFuncNorm = Math.min(Math.max(womacFunc / 68.0, 0), 1);
  const womacStiffNorm = Math.min(Math.max(womacStiff / 8.0, 0), 1);

  let CS_short = S + 4 * synFlag + 1 * effFlag + 1 * priorPosFlag - 1 * CSloadCat;
  let CS_mid   = S + 2 * synFlag - 1 * CSloadCat - 1;

  CS_short += 1.2 * womacPainNorm - 0.3 * womacStiffNorm;
  CS_mid   += 0.6 * womacPainNorm - 0.4 * womacFuncNorm - 0.3 * womacStiffNorm;

  let HA_short = S + 1 * effFlag;
  let HA_mid   = S + 3 * KLcat + 1 * effFlag - (CSloadCat >= 2 ? 1 : 0);

  HA_short += 0.5 * womacPainNorm - 0.2 * womacStiffNorm;
  HA_mid   += 1.2 * womacFuncNorm + 0.4 * womacPainNorm - 0.3 * womacStiffNorm;

  let Gel_short = S;
  let Gel_mid   = S
                + 2 * KLcat
                + 1 * effFlag
                + 2 * synFlag
                + (age < 60 ? 2 : (age < 70 ? 1 : 0))
                + 1.5 * womacFuncNorm
                + 0.7 * womacStiffNorm;

  let Gel_long = 
      3 * (age < 60 ? 1 : 0) +
      2 * ((age >= 60 && age < 70) ? 1 : 0) +
      2 * synFlag +
      1 * effFlag +
      2 * (kl <= 2 ? 1 : 0) +
      1 * (kl === 3 ? 1 : 0) -
      2 * (kl === 4 ? 1 : 0) -
      2 * (malFlag ? 1 : 0) +
      2.0 * womacFuncNorm +
      1.0 * womacStiffNorm;

  const CS_short_band = bandShortMid(CS_short);
  const CS_mid_band   = bandShortMid(CS_mid);
  const HA_short_band = bandShortMid(HA_short);
  const HA_mid_band   = bandShortMid(HA_mid);
  const Gel_short_band= bandShortMid(Gel_short);
  const Gel_mid_band  = bandShortMid(Gel_mid);
  const Gel_long_band = bandLong(Gel_long);

  const preferredClass = riskFlag ? " preferred" : "";
  const haPreferredNote = riskFlag
    ? "<p class='small'><strong>Preferred:</strong> Favour HA over CS in diabetes/glaucoma to avoid systemic steroid effects.</p>"
    : "<p class='small'>Mid-term benefit favoured in KL1–3 with effusion, higher WOMAC function burden and lower cumulative CS exposure.</p>";
  const gelPreferredNote = riskFlag
    ? "<p class='small'><strong>Preferred:</strong> Consider hydrogel as a steroid-sparing option in diabetes/glaucoma.</p>"
    : "<p class='small'>Long-term durability favoured in &lt;70yrs, KL1–3, synovitis and effusion, higher WOMAC function/stiffness burden, with minimal malalignment.</p>";

  const csCautionNote = riskFlag
    ? "<p class='small'><strong>Caution:</strong> Diabetes/glaucoma present – if using corticosteroid, counsel carefully and monitor.</p>"
    : "<p class='small'>Best for synovitic flares and rapid symptom relief. Penalised by high CS load and high WOMAC stiffness mid-term.</p>";

  const res = document.getElementById('results');
  res.innerHTML = `
    <div class="card">
      <h2>Global Summary</h2>
      <p><strong>Total Score (S):</strong> ${S.toFixed(1)}</p>
      <p class="small">
        Higher S = more favourable overall prognosis for injection therapy.
        PCS-6: <strong>${pcsTotal}</strong> (${document.getElementById('pcsBandDisplay').textContent});
        WOMAC pain: ${womacPain}/20; stiffness: ${womacStiff}/8; function: ${womacFunc}/68; total: ${womac.pain + womac.stiff + womac.func}/96.
      </p>
    </div>

    <div class="grid grid-3">
      <div class="card result-card cs">
        <h3>Corticosteroid</h3>
        <p><strong>Short-term index (0–6w):</strong> ${CS_short.toFixed(1)}
          <span class="band-pill ${CS_short_band.cls}">${CS_short_band.text}</span>
        </p>
        <p><strong>Mid-term index (6w–3m):</strong> ${CS_mid.toFixed(1)}
          <span class="band-pill ${CS_mid_band.cls}">${CS_mid_band.text}</span>
        </p>
        ${csCautionNote}
      </div>

      <div class="card result-card ha${preferredClass}">
        <h3>Hyaluronic Acid</h3>
        <p><strong>Short-term index:</strong> ${HA_short.toFixed(1)}
          <span class="band-pill ${HA_short_band.cls}">${HA_short_band.text}</span>
        </p>
        <p><strong>Mid-term index:</strong> ${HA_mid.toFixed(1)}
          <span class="band-pill ${HA_mid_band.cls}">${HA_mid_band.text}</span>
        </p>
        ${haPreferredNote}
      </div>

      <div class="card result-card gel${preferredClass}">
        <h3>Hydrogel / Gel</h3>
        <p><strong>Short-term index:</strong> ${Gel_short.toFixed(1)}
          <span class="band-pill ${Gel_short_band.cls}">${Gel_short_band.text}</span>
        </p>
        <p><strong>Mid-term index (6w–3m):</strong> ${Gel_mid.toFixed(1)}
          <span class="band-pill ${Gel_mid_band.cls}">${Gel_mid_band.text}</span>
        </p>
        <p><strong>Long-term index (1–5y):</strong> ${Gel_long.toFixed(1)}
          <span class="band-pill ${Gel_long_band.cls}">${Gel_long_band.text}</span>
        </p>
        ${gelPreferredNote}
      </div>
    </div>
  `;
}

function resetForm() {
  const ids = [
    'age','kl','height','weight','bmi','vas',
    'synovitis','effusion','malalign','quadweak',
    'metabolic','diabetes','glaucoma',
    'prior','nutr','guided',
    'cs12','cslife',
    'pain1','pain2','pain3','pain4','pain5',
    'stiff1','stiff2',
    'func1','func2','func3','func4','func5','func6','func7','func8','func9',
    'func10','func11','func12','func13','func14','func15','func16','func17',
    'pcs1','pcs2','pcs3','pcs4','pcs5','pcs6'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') {
      el.value = "0";
    } else {
      el.value = '';
    }
  });
  document.getElementById('pcsTotalDisplay').textContent = "0";
  document.getElementById('pcsBandDisplay').textContent = "Low";
  document.getElementById('womacPainTotal').textContent = "0";
  document.getElementById('womacStiffTotal').textContent = "0";
  document.getElementById('womacFuncTotal').textContent = "0";
  document.getElementById('womacTotal').textContent = "0";

  const amber = document.getElementById('amberWarning');
  const csWarning = document.getElementById('csWarning');
  const results = document.getElementById('results');
  if (amber) { amber.style.display = 'none'; amber.innerHTML = ''; }
  if (csWarning) { csWarning.style.display = 'none'; csWarning.innerHTML = ''; }
  if (results) { results.innerHTML = ''; }

  applyFirstInjectionBehaviour();
}

document.addEventListener('DOMContentLoaded', function() {

  const modeClinicianBtn = document.getElementById('modeClinicianBtn');
  const modePatientBtn = document.getElementById('modePatientBtn');

  function setMode(mode) {
    currentMode = mode;
    if (modeClinicianBtn && modePatientBtn) {
      if (mode === 'clinician') {
        modeClinicianBtn.classList.add('mode-active');
        modePatientBtn.classList.remove('mode-active');
      } else {
        modePatientBtn.classList.add('mode-active');
        modeClinicianBtn.classList.remove('mode-active');
      }
    }
    // Toggle clinician vs patient specific blocks
    const klClin = document.getElementById('klClinicianBlock');
    const klPat = document.getElementById('klPatientBlock');
    const ptCsBlock = document.getElementById('pt_cs_block');
    if (klClin && klPat) {
      if (mode === 'clinician') {
        klClin.classList.remove('mode-hidden');
        klPat.classList.add('mode-hidden');
      } else {
        klClin.classList.add('mode-hidden');
        klPat.classList.remove('mode-hidden');
      }
    }
    if (ptCsBlock) {
      if (mode === 'clinician') ptCsBlock.classList.add('mode-hidden');
      else ptCsBlock.classList.remove('mode-hidden');
    }
  }

  if (modeClinicianBtn) {
    modeClinicianBtn.addEventListener('click', () => setMode('clinician'));
  }
  if (modePatientBtn) {
    modePatientBtn.addEventListener('click', () => setMode('patient'));
  }

  const startBtn = document.getElementById('startBtn');
  const formCard = document.getElementById('formCard');
  const calcBtn = document.getElementById('calcBtn');
  const printBtn = document.getElementById('printBtn');
  const resetFab = document.getElementById('resetFab');
  const darkToggle = document.getElementById('darkToggle');

  if (startBtn && formCard) {
    startBtn.addEventListener('click', function() {
      formCard.classList.toggle('hidden');
      window.scrollTo({ top: formCard.offsetTop - 10, behavior: 'smooth' });
    });
  }

  if (calcBtn) calcBtn.addEventListener('click', () => {
    if (currentMode === 'patient') {
      calculatePatientPredictions();
    } else {
      calculatePredictions();
    }
  });
  if (printBtn) printBtn.addEventListener('click', () => window.print());
  if (resetFab) resetFab.addEventListener('click', resetForm);
  if (darkToggle) darkToggle.addEventListener('click', () => document.body.classList.toggle('dark'));

  const h = document.getElementById('height');
  const w = document.getElementById('weight');
  if (h) h.addEventListener('input', calcBMI);
  if (w) w.addEventListener('input', calcBMI);

  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('pcs' + i);
    if (el) el.addEventListener('change', calcPCS);
  }

  const womacIds = [
    'pain1','pain2','pain3','pain4','pain5',
    'stiff1','stiff2',
    'func1','func2','func3','func4','func5','func6','func7','func8','func9',
    'func10','func11','func12','func13','func14','func15','func16','func17'
  ];
  womacIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', calcWOMAC);
  });

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

  const priorSelect = document.getElementById('prior');
  if (priorSelect) {
    priorSelect.addEventListener('change', applyFirstInjectionBehaviour);
  }


function calculatePatientPredictions() {
  // Use WOMAC & PCS from existing inputs
  const womac = calcWOMAC();
  const womacPain = womac.pain;
  const womacFunc = womac.func;
  const womacStiff = womac.stiff;

  const pcsInfo = calcPCS();
  const pcsTotal = pcsInfo.total;

  const PainNorm  = Math.min(Math.max(womacPain / 20.0, 0), 1);
  const FuncNorm  = Math.min(Math.max(womacFunc / 68.0, 0), 1);
  const StiffNorm = Math.min(Math.max(womacStiff / 8.0, 0), 1);
  const PCSNorm   = Math.min(Math.max(pcsTotal / 24.0, 0), 1);

  const SymptomScore = 3*PainNorm + 2*FuncNorm + 1*StiffNorm;
  const PsychPenalty = 1.5 * PCSNorm;

  const age = parseFloat(document.getElementById('age').value) || 0;
  let AgeScore = 0;
  if (age > 0 && age < 55) AgeScore = 1;
  else if (age >= 70) AgeScore = -1;

  // X-ray based stage
  const xray = (document.getElementById('pt_xray') || {}).value || "";
  const sev = (document.getElementById('pt_severity') || {}).value || "";
  let StageScore = 0;
  if (xray === 'Y') {
    if (sev === 'mild') StageScore = 2.0;
    else if (sev === 'mildmod') StageScore = 1.5;
    else if (sev === 'mod') StageScore = 0.0;
    else if (sev === 'modsev') StageScore = -0.5;
    else if (sev === 'sev') StageScore = -1.0;
  }

  // Inflammatory features – approximate from synovitis/effusion selects
  const syn = (document.getElementById('synovitis') || {}).value || "";
  const eff = (document.getElementById('effusion') || {}).value || "";
  const SwellingY = (eff === 'Y') ? 1 : 0;
  const WarmY = (syn === 'Y') ? 1 : 0;
  const InflammScore = 1.5*SwellingY + 1.5*WarmY;

  // Prior steroid response & count from patient fields
  const csResp = (document.getElementById('pt_cs_response') || {}).value || "";
  const csCount = (document.getElementById('pt_cs_count') || {}).value || "";

  let PriorScore = 0;
  if (csResp === 'good') PriorScore = 1.5;
  else if (csResp === 'poor') PriorScore = -1.0;

  let CSloadPenalty = 0;
  if (csCount === 'few') CSloadPenalty = -0.5;
  else if (csCount === 'many') CSloadPenalty = -1.5;

  const BaselineIndex = SymptomScore - PsychPenalty + AgeScore + StageScore;

  const CS_short = BaselineIndex
                 + 2.0*InflammScore
                 + 0.75*PriorScore
                 - CSloadPenalty;

  const CS_mid = BaselineIndex
               + 1.0*InflammScore
               + 0.5*PriorScore
               - 1.5*CSloadPenalty
               - 0.5*StiffNorm;

  const HA_short = BaselineIndex
                 + 0.5*InflammScore
                 - 0.5*CSloadPenalty;

  const HA_mid = BaselineIndex
               + 1.5*StageScore
               + 1.2*FuncNorm
               + 0.3*PainNorm
               - 0.3*StiffNorm
               - 0.5*CSloadPenalty;

  const Gel_short = BaselineIndex
                  + 1.0*InflammScore;

  const Gel_mid = BaselineIndex
                + 1.2*StageScore
                + 1.5*FuncNorm
                + 0.7*StiffNorm;

  let AgeLongBonus = 0;
  if (age > 0 && age < 60) AgeLongBonus = 2;
  else if (age >= 60 && age < 70) AgeLongBonus = 1;

  const Gel_long = 2.0*StageScore
                 + 2.0*FuncNorm
                 + 1.0*StiffNorm
                 + AgeLongBonus;

  function bandPatient(idx) {
    if (idx >= 6) return {text: "High (≥70%)", cls: "band-high"};
    if (idx >= 3) return {text: "Moderate (40–70%)", cls: "band-mod"};
    if (idx >= 1) return {text: "Low–moderate (20–40%)", cls: "band-lowmod"};
    return {text: "Unlikely (<20%)", cls: "band-unlikely"};
  }

  const CS_short_band = bandPatient(CS_short);
  const CS_mid_band   = bandPatient(CS_mid);
  const HA_short_band = bandPatient(HA_short);
  const HA_mid_band   = bandPatient(HA_mid);
  const Gel_short_band= bandPatient(Gel_short);
  const Gel_mid_band  = bandPatient(Gel_mid);
  const Gel_long_band = bandPatient(Gel_long);

  // Simple patient-facing warnings
  const diabetes = (document.getElementById('diabetes') || {}).value || "";
  const glaucoma = (document.getElementById('glaucoma') || {}).value || "";

  let safetyNotes = "";
  if (diabetes === 'Y') {
    safetyNotes += "• You reported diabetes – steroid injections can temporarily raise blood sugar for 1–2 weeks. This should be discussed with your clinician.<br>";
  }
  if (glaucoma === 'Y') {
    safetyNotes += "• You reported glaucoma – steroids can increase eye pressure in some people. Alternatives may be preferred.<br>";
  }
  if (csCount === 'many') {
    safetyNotes += "• You have had several steroid injections already – further injections may have less benefit. Other options may be worth exploring.<br>";
  }
  if (!safetyNotes) {
    safetyNotes = "No specific safety flags from your answers – your clinician will still need to confirm this against your full medical history.";
  }

  const res = document.getElementById('results');
  if (!res) return;

  res.innerHTML = `
    <div class="card">
      <h2>Patient Mode – Summary</h2>
      <p class="small">
        This is an estimate based on your questionnaire responses and some simple health questions.
        It does not replace a consultation or imaging.
      </p>
      <p>
        WOMAC total: <strong>${womacPain + womacFunc + womacStiff}/96</strong> (Pain ${womacPain}/20, Stiffness ${womacStiff}/8, Function ${womacFunc}/68).<br>
        PCS-6 total: <strong>${pcsTotal}</strong>.
      </p>
    </div>

    <div class="grid grid-3">
      <div class="card result-card cs">
        <h3>Steroid injection</h3>
        <p><strong>Short-term (0–6 weeks):</strong> ${CS_short.toFixed(1)}
          <span class="band-pill ${CS_short_band.cls}">${CS_short_band.text}</span>
        </p>
        <p><strong>6 weeks–3 months:</strong> ${CS_mid.toFixed(1)}
          <span class="band-pill ${CS_mid_band.cls}">${CS_mid_band.text}</span>
        </p>
        <p class="small">
          Steroid injections are often best for short-term relief when the knee is inflamed or swollen.
        </p>
      </div>

      <div class="card result-card ha">
        <h3>Hyaluronic acid injection</h3>
        <p><strong>Short-term (0–6 weeks):</strong> ${HA_short.toFixed(1)}
          <span class="band-pill ${HA_short_band.cls}">${HA_short_band.text}</span>
        </p>
        <p><strong>6 weeks–3 months:</strong> ${HA_mid.toFixed(1)}
          <span class="band-pill ${HA_mid_band.cls}">${HA_mid_band.text}</span>
        </p>
        <p class="small">
          These injections aim to improve lubrication and may give more gradual relief, especially in mild–moderate arthritis.
        </p>
      </div>

      <div class="card result-card gel">
        <h3>Hydrogel / long-acting gel</h3>
        <p><strong>Short-term (0–6 weeks):</strong> ${Gel_short.toFixed(1)}
          <span class="band-pill ${Gel_short_band.cls}">${Gel_short_band.text}</span>
        </p>
        <p><strong>6 weeks–3 months:</strong> ${Gel_mid.toFixed(1)}
          <span class="band-pill ${Gel_mid_band.cls}">${Gel_mid_band.text}</span>
        </p>
        <p><strong>Longer-term (up to several years):</strong> ${Gel_long.toFixed(1)}
          <span class="band-pill ${Gel_long_band.cls}">${Gel_long_band.text}</span>
        </p>
        <p class="small">
          Gels are often considered for people &lt;70 years with confirmed arthritis who need longer-lasting relief.
        </p>
      </div>
    </div>

    <div class="card">
      <h3>Safety notes from your answers</h3>
      <p class="small">${safetyNotes}</p>
      <p class="small">
        Please discuss these results with your clinician – they will consider imaging, examination and your full medical history before making any treatment decisions.
      </p>
    </div>
  `;
}

  if (typeof setMode === 'function') { setMode('patient'); }
  applyFirstInjectionBehaviour();
});
