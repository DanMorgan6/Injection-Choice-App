
function setupStepper() {
  const steps = Array.from(document.querySelectorAll('.step'));
  let stepIndex = 0;
  const nextBtn = document.getElementById('nextBtn');
  const backBtn = document.getElementById('backBtn');
  const stepTitle = document.getElementById('stepTitle');
  const stepCounter = document.getElementById('stepCounter');
  const stepBar = document.getElementById('stepBar');

  function showStep(i){
    stepIndex = Math.max(0, Math.min(i, steps.length-1));
    steps.forEach((s, idx) => s.classList.toggle('active', idx===stepIndex));
    const title = steps[stepIndex]?.getAttribute('data-title') || `Step ${stepIndex+1}`;
    if(stepTitle) stepTitle.textContent = title;
    if(stepCounter) stepCounter.textContent = `Step ${stepIndex+1} of ${steps.length}`;
    if(stepBar) stepBar.style.width = `${Math.round(((stepIndex+1)/steps.length)*100)}%`;
    if(backBtn) backBtn.style.visibility = stepIndex===0 ? 'hidden' : 'visible';
    if(nextBtn) nextBtn.textContent = stepIndex===steps.length-1 ? 'Finish' : 'Next section';
  }
  function next(){ if(stepIndex < steps.length-1) { showStep(stepIndex+1); return true; } return false; }
  function back(){ if(stepIndex>0) showStep(stepIndex-1); }
  showStep(0);
  return { showStep, next, back };
}

function calcBMI(){
  const h = parseFloat(document.getElementById('height').value || '');
  const w = parseFloat(document.getElementById('weight').value || '');
  const bmiEl = document.getElementById('bmi');
  if(!h || !w){ bmiEl.value=''; return 0; }
  const m=h/100; const bmi=w/(m*m);
  bmiEl.value=bmi.toFixed(1);
  return bmi;
}
function pcsTotal(){
  let t=0;
  for(let i=1;i<=6;i++){
    const el=document.getElementById('pcs'+i);
    if(el) t += parseInt(el.value||'0',10)||0;
  }
  return t;
}
function womacTotals(){
  const get=(id)=>parseInt(document.getElementById(id)?.value||'0',10)||0;
  const pain=[1,2,3,4,5].reduce((a,i)=>a+get('pain'+i),0);
  const stiff=[1,2].reduce((a,i)=>a+get('stiff'+i),0);
  const func=Array.from({length:17},(_,i)=>i+1).reduce((a,i)=>a+get('func'+i),0);
  return {pain, stiff, func, total:pain+stiff+func};
}
function resetForm(){
  const ids=['age','vas','height','weight','bmi','swelling','warmth','pt_xray','pt_severity','malalign','quadweak','nutr','pt_cs_response','pt_cs_count','pt_aspirated'];
  ids.forEach(id=>{const el=document.getElementById(id); if(el){ if(el.tagName==='SELECT') el.value=''; else el.value=''; el.disabled=false; }});
  const checks=['com_diabetes','com_glaucoma','com_cvd','com_ckd','com_cld','com_raid','com_immune','com_none'];
  checks.forEach(id=>{const el=document.getElementById(id); if(el) el.checked=false;});
  for(let i=1;i<=6;i++){ const el=document.getElementById('pcs'+i); if(el) el.value='0'; }
  for(let i=1;i<=5;i++) document.getElementById('pain'+i).value='0';
  for(let i=1;i<=2;i++) document.getElementById('stiff'+i).value='0';
  for(let i=1;i<=17;i++) document.getElementById('func'+i).value='0';
  const amber=document.getElementById('amberWarning'); amber.style.display='none'; amber.innerHTML='';
  localStorage.removeItem('resultsPayload');
}
function buildReasons(inputs, idxs){
  const reasons={};
  const infl = inputs.inflamm;
  const hasSwelling = inputs.swellingY;
  const asp = inputs.aspY;
  const stage = inputs.stage;
  const highBMI = inputs.bmi>=35;
  const csLoadHigh = inputs.csCount==='many';
  function ptBand(idx){ return bandFromIndex(idx).band.toLowerCase(); }
  function join(arr){ return arr.filter(Boolean).join(', '); }

  { // CS
    const pos=[], lim=[];
    if(infl) pos.push('warmth/swelling features');
    if(asp && hasSwelling) pos.push('fluid is usually drained first');
    if(csLoadHigh) lim.push('multiple prior steroid injections (diminishing returns)');
    if(stage==='sev') lim.push('more advanced arthritis');
    const patient = `This option shows a ${ptBand(idxs.cs_short)} short-term likelihood of benefit. ${
      infl ? 'Warmth and swelling can respond well to steroid injections in the short term.' : 'Steroid injections tend to work best when there are inflammatory features.'
    } ${csLoadHigh ? 'If you’ve had several steroid injections before, benefits may not last as long.' : ''}`;
    const clinician = `Drivers: ${join(pos)||'—'}. Limiters: ${join(lim)||'—'}.`;
    reasons.cs={patient, clinician};
  }

  { // HA
    const pos=[], lim=[];
    if(stage==='mild' || stage==='mod') pos.push('mild–moderate stage');
    if(!infl) pos.push('less inflammatory pattern');
    if(hasSwelling) lim.push('swelling can reduce HA durability');
    if(asp && hasSwelling) pos.push('aspiration can improve retention');
    if(stage==='sev') lim.push('severe stage reduces HA response');
    if(highBMI) lim.push('higher BMI reduces durability');
    const patient = `This option shows a ${ptBand(idxs.ha_mid)} mid-term likelihood of benefit. ${
      (stage==='mild'||stage==='mod') ? 'Hyaluronic acid often performs best in mild–moderate arthritis.' : 'Benefit can reduce as arthritis becomes more severe.'
    } ${hasSwelling ? (asp ? 'Because your knee is swollen, draining fluid first may improve outcomes.' : 'Swelling may reduce how long benefit lasts.') : ''}`;
    const clinician = `Drivers: ${join(pos)||'—'}. Limiters: ${join(lim)||'—'}.`;
    reasons.ha={patient, clinician};
  }

  { // Gel
    const pos=[], lim=[];
    if(inputs.age<70) pos.push('younger age improves durability');
    if(stage==='mild' || stage==='mod') pos.push('mild–moderate stage');
    if(hasSwelling) lim.push('swelling may reduce durability');
    if(asp && hasSwelling) pos.push('aspiration reduces effusion penalty');
    if(stage==='sev') lim.push('severe stage reduces durability');
    if(highBMI) lim.push('higher BMI');
    const patient = `This option shows a ${ptBand(idxs.gel_long)} longer-term likelihood of benefit. Hydrogels are designed for longer durability, but outcomes depend on arthritis stage, inflammation, and overall health. ${hasSwelling ? (asp ? 'Draining fluid first may improve durability in swollen knees.' : 'Swelling may reduce durability.') : ''}`;
    const clinician = `Drivers: ${join(pos)||'—'}. Limiters: ${join(lim)||'—'}.`;
    reasons.gel={patient, clinician};
  }
  return reasons;
}
function calculate(){
  const amber=document.getElementById('amberWarning'); amber.style.display='none'; amber.innerHTML='';
  const age=parseInt(document.getElementById('age').value||'0',10)||0;
  const vas=parseInt(document.getElementById('vas').value||'0',10)||0;
  const bmi=parseFloat(document.getElementById('bmi').value||'')||calcBMI()||0;

  const swelling=document.getElementById('swelling').value||'';
  const warmth=document.getElementById('warmth').value||'';
  const xray=document.getElementById('pt_xray').value||'';
  const sev=document.getElementById('pt_severity').value||'';
  const mal=document.getElementById('malalign').value||'';
  const quad=document.getElementById('quadweak').value||'';
  const nutr=document.getElementById('nutr').value||'';
  const csResp=document.getElementById('pt_cs_response').value||'';
  const csCount=document.getElementById('pt_cs_count').value||'';
  const asp=document.getElementById('pt_aspirated')?.value||'';

  const hasDiabetes=!!document.getElementById('com_diabetes').checked;
  const hasGlaucoma=!!document.getElementById('com_glaucoma').checked;
  const comCVD=!!document.getElementById('com_cvd').checked;
  const comCKD=!!document.getElementById('com_ckd').checked;
  const comCLD=!!document.getElementById('com_cld').checked;
  const comRA=!!document.getElementById('com_raid').checked;
  const comImm=!!document.getElementById('com_immune').checked;

  if(hasDiabetes){ amber.style.display='block'; amber.innerHTML += '⚠ Diabetes: steroid injections can temporarily upset blood sugar control for up to 1–2 weeks.<br>'; }
  if(hasGlaucoma){ amber.style.display='block'; amber.innerHTML += '⚠ Glaucoma: steroid injections can increase intra-ocular pressure – consider alternatives / seek advice.<br>'; }

  let stage='unknown';
  if(xray==='Y'){
    if(sev==='mild' || sev==='mildmod') stage='mild';
    else if(sev==='mod') stage='mod';
    else if(sev==='modsev' || sev==='sev') stage='sev';
  }

  const swellingY = (swelling==='Y');
  const warmthY = (warmth==='Y');
  const inflamm = (swellingY?1:0) + (warmthY?1:0);
  const aspY = swellingY && asp==='Y';

  let comPenalty=0;
  if(comCVD) comPenalty += 0.3;
  if(comCKD) comPenalty += 0.6;
  if(comCLD) comPenalty += 0.5;
  if(comRA) comPenalty += 1.2;
  if(comImm) comPenalty += 0.8;
  comPenalty = clamp(comPenalty, 0, 2.5);

  const womac=womacTotals();
  const pcs=pcsTotal();
  const painNorm = clamp(womac.pain/20.0,0,1);
  const funcNorm = clamp(womac.func/68.0,0,1);
  const stiffNorm = clamp(womac.stiff/8.0,0,1);
  const symptomScore = 2.0*painNorm + 1.5*funcNorm + 0.5*stiffNorm;

  let S=0;
  if(age<60) S+=0.4; else if(age<70) S+=0.1; else if(age<80) S-=0.5; else S-=1.0;
  if(stage==='mild') S+=1.0; else if(stage==='mod') S+=0.2; else if(stage==='sev') S-=1.2; else S-=0.1;
  if(bmi>0){
    if(bmi>=35) S-=0.8; else if(bmi>=30) S-=0.4; else if(bmi<27) S+=0.2;
  }
  if(mal==='Y') S-=0.6;
  if(quad==='abit') S-=0.2; else if(quad==='hard') S-=0.6; else if(quad==='cant') S-=0.9;
  if(nutr==='Y') S-=0.4;
  if(pcs>=15) S-=0.8; else if(pcs>=10) S-=0.4;
  S += symptomScore*1.1;
  S -= 0.7*comPenalty;

  let priorScore=0;
  if(csResp==='good') priorScore=0.7;
  else if(csResp==='poor') priorScore=-0.4;

  let csLoadPenalty=0;
  if(csCount==='few') csLoadPenalty=0.6;
  else if(csCount==='many') csLoadPenalty=1.3;

  let cs_short = 0.9*S + 1.2*inflamm + 0.5*priorScore - 0.4*csLoadPenalty;
  let cs_mid   = 0.5*S + 0.3*inflamm + 0.2*priorScore - 0.9*csLoadPenalty;

  let ha_short = 0.6*S - 0.3*inflamm - 0.3*comPenalty;
  let ha_mid   = 0.9*S - 0.9*inflamm - 0.7*comPenalty - 0.2*(bmi>=35?1:0);

  let gel_mid  = 0.95*S - 0.35*inflamm - 0.6*comPenalty;
  let gel_long = 0.75*S - 0.25*inflamm - 0.7*comPenalty;

  if(aspY){
    cs_short += 0.2; cs_mid += 0.1;
    ha_mid += 0.5; gel_mid += 0.2; gel_long += 0.2;
  }

  const cap=(x)=>clamp(x,-2,8);
  cs_short=cap(cs_short); cs_mid=cap(cs_mid); ha_short=cap(ha_short); ha_mid=cap(ha_mid); gel_mid=cap(gel_mid); gel_long=cap(gel_long);

  const idxs={cs_short, cs_mid, ha_short, ha_mid, gel_mid, gel_long};
  const inputs={age,bmi,stage,swellingY,inflamm,aspY,csCount};
  const reasons=buildReasons(inputs, idxs);

  const cards=[
    {key:'cs', title:'Corticosteroid', short:cs_short, mid:cs_mid, note:reasons.cs.patient, clinician:reasons.cs.clinician},
    {key:'ha', title:'Hyaluronic Acid (e.g., Sinovial 64 / Sinogel)', short:ha_short, mid:ha_mid, note:reasons.ha.patient, clinician:reasons.ha.clinician},
    {key:'gel', title:'Hydrogel', mid:gel_mid, long:gel_long, note:reasons.gel.patient, clinician:reasons.gel.clinician},
  ];
  localStorage.setItem('resultsPayload', JSON.stringify({mode:'patient', cards, meta:{age,bmi,stage,inflamm}}));
  window.location.href='results.html';
}

document.addEventListener('DOMContentLoaded', ()=>{
  const startBtn=document.getElementById('startBtn');
  const formCard=document.getElementById('formCard');
  const calcBtn=document.getElementById('calcBtn');
  const nextBtn=document.getElementById('nextBtn');
  const backBtn=document.getElementById('backBtn');
  const resetFab=document.getElementById('resetFab');

  const stepper=setupStepper();
  startBtn.addEventListener('click', ()=>{
    formCard.classList.toggle('hidden');
    if(!formCard.classList.contains('hidden')) stepper.showStep(0);
  });

  const xray=document.getElementById('pt_xray');
  const sev=document.getElementById('pt_severity');
  function updateSev(){
    const enable = xray.value==='Y';
    sev.disabled = !enable;
    if(!enable) sev.value='';
  }
  xray.addEventListener('change', updateSev);
  updateSev();

  const swelling=document.getElementById('swelling');
  const aspBlock=document.getElementById('pt_aspirated_block');
  const aspSel=document.getElementById('pt_aspirated');
  function updateAsp(){
    const show = swelling.value==='Y';
    aspBlock.style.display = show ? 'block' : 'none';
    if(!show) aspSel.value='';
  }
  swelling.addEventListener('change', updateAsp);
  updateAsp();

  const none=document.getElementById('com_none');
  const others=['com_diabetes','com_glaucoma','com_cvd','com_ckd','com_cld','com_raid','com_immune'].map(id=>document.getElementById(id));
  none.addEventListener('change', ()=>{ if(none.checked) others.forEach(el=>el.checked=false); });
  others.forEach(el=>el.addEventListener('change', ()=>{ if(el.checked) none.checked=false; }));

  document.getElementById('height').addEventListener('input', calcBMI);
  document.getElementById('weight').addEventListener('input', calcBMI);

  nextBtn.addEventListener('click', ()=>{
    const ok = stepper.next();
    if(!ok) calculate();
  });
  backBtn.addEventListener('click', ()=>stepper.back());

  calcBtn.addEventListener('click', calculate);
  document.getElementById('printBtn').addEventListener('click', ()=>window.print());
  resetFab.addEventListener('click', resetForm);

  for(let i=1;i<=6;i++){ document.getElementById('pcs'+i).value='0'; }
  for(let i=1;i<=5;i++) document.getElementById('pain'+i).value='0';
  for(let i=1;i<=2;i++) document.getElementById('stiff'+i).value='0';
  for(let i=1;i<=17;i++) document.getElementById('func'+i).value='0';
});
