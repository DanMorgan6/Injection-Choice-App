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
  const cs12 = parseInt(document.getElementById('cs12').value) || 0;
  const cslife = parseInt(document.getElementById('cslife').value) || 0;

  const diabetes = document.getElementById('diabetes').value;
  const glaucoma = document.getElementById('glaucoma').value;

  const womacPain = parseFloat(document.getElementById('womacPain').value) || 0;
  const womacFunc = parseFloat(document.getElementById('womacFunc').value) || 0;
  const womacStiff = parseFloat(document.getElementById('womacStiff').value) || 0;

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
        WOMAC pain: ${womacPain || 0}/20; function: ${womacFunc || 0}/68; stiffness: ${womacStiff || 0}/8.
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
    'womacPain','womacFunc','womacStiff',
    'pcs1','pcs2','pcs3','pcs4','pcs5','pcs6'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') {
      el.value = el.id.startsWith('pcs') ? "0" : "";
    } else {
      el.value = '';
    }
  });
  document.getElementById('pcsTotalDisplay').textContent = "0";
  document.getElementById('pcsBandDisplay').textContent = "Low";

  const amber = document.getElementById('amberWarning');
  const csWarning = document.getElementById('csWarning');
  const results = document.getElementById('results');
  if (amber) { amber.style.display = 'none'; amber.innerHTML = ''; }
  if (csWarning) { csWarning.style.display = 'none'; csWarning.innerHTML = ''; }
  if (results) { results.innerHTML = ''; }
}

document.addEventListener('DOMContentLoaded', function() {
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

  if (calcBtn) {
    calcBtn.addEventListener('click', function() {
      calculatePredictions();
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', function() {
      window.print();
    });
  }

  if (resetFab) {
    resetFab.addEventListener('click', function() {
      resetForm();
    });
  }

  if (darkToggle) {
    darkToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark');
    });
  }

  const h = document.getElementById('height');
  const w = document.getElementById('weight');
  if (h) h.addEventListener('input', calcBMI);
  if (w) w.addEventListener('input', calcBMI);

  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('pcs' + i);
    if (el) el.addEventListener('change', calcPCS);
  }
});
