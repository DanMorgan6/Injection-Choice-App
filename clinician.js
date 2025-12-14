
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
  const m=h/100;
  const bmi=w/(m*m);
  bmiEl.value = bmi.toFixed(1);
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
function resetForm(){
  const ids=['age','vas','height','weight','bmi','kl','synovitis','effusion','aspirated','malalign','quadweak','metabolic','nutr','diabetes','glaucoma','firstInj','prior','cs12','cslife'];
  ids.forEach(id=>{const el=document.getElementById(id); if(el){ if(el.tagName==='SELECT') el.value=''; else el.value=''; el.disabled=false; }});
  for(let i=1;i<=6;i++){ const el=document.getElementById('pcs'+i); if(el) el.value='0'; }
  const amber=document.getElementById('amberWarning'); amber.style.display='none'; amber.innerHTML='';
  localStorage.removeItem('resultsPayload');
}
function buildReasons(inputs, idxs){
  const reasons = {};
  const infl = (inputs.synovitisY || inputs.effusionY);
  const severe = inputs.kl>=4;
  const mod = inputs.kl===3;
  const mild = inputs.kl && inputs.kl<=2;
  const highBMI = inputs.bmi>=35;
  const eff = inputs.effusionY;
  const asp = inputs.aspY;
  const csLoadHigh = (inputs.cslife>=3 || inputs.cs12>=2);

  function joinList(arr){ return arr.filter(Boolean).join(', '); }

  {
    const pos=[], lim=[];
    if(infl) pos.push('an inflammatory pattern (synovitis/effusion)');
    if(asp && eff) pos.push('effusion aspiration prior to injection');
    if(csLoadHigh) lim.push('multiple prior steroid injections (diminishing returns)');
    if(severe) lim.push('advanced arthritis');
    if(highBMI) lim.push('higher BMI');

    const pt = `This option shows a ${bandFromIndex(idxs.cs_short).band.toLowerCase()} short-term likelihood of benefit. ${
      infl ? 'Warmth/swelling features often respond well to corticosteroid in the short term.' : 'Corticosteroid tends to be most effective when there are inflammatory features.'
    } ${csLoadHigh ? 'Repeated steroid exposure may reduce durability beyond the first few weeks.' : ''}`;
    const cl = `Drivers: ${joinList(pos)||'—'}. Limiters: ${joinList(lim)||'—'}.`;
    reasons.cs = { patient: pt, clinician: cl };
  }

  {
    const pos=[], lim=[];
    if(mild || mod) pos.push('mild–moderate structural stage');
    if(!infl) pos.push('less inflammatory phenotype');
    if(eff) lim.push('effusion (may reduce HA durability)');
    if(asp && eff) pos.push('aspiration may improve HA retention');
    if(severe) lim.push('advanced arthritis (reduced HA response)');
    if(highBMI) lim.push('higher BMI (reduced HA durability)');
    const pt = `This option shows a ${bandFromIndex(idxs.ha_mid).band.toLowerCase()} mid-term likelihood of benefit. ${
      (mild||mod) ? 'Hyaluronic acid often performs best in mild–moderate arthritis.' : 'Response tends to reduce as arthritis becomes more severe.'
    } ${eff ? (asp ? 'Because the knee is swollen, draining fluid first can improve the chance of benefit.' : 'Swelling may reduce how long benefit lasts.') : ''}`;
    const cl = `Drivers: ${joinList(pos)||'—'}. Limiters: ${joinList(lim)||'—'}.`;
    reasons.ha = { patient: pt, clinician: cl };
  }

  {
    const pos=[], lim=[];
    if(inputs.age<70) pos.push('younger age (better long-term durability)');
    if(mild || mod) pos.push('mild–moderate stage');
    if(eff) lim.push('effusion (may reduce durability)');
    if(asp && eff) pos.push('aspiration reduces effusion penalty');
    if(severe) lim.push('advanced arthritis');
    if(highBMI) lim.push('higher BMI');
    const pt = `This option shows a ${bandFromIndex(idxs.gel_long).band.toLowerCase()} longer-term likelihood of benefit. Hydrogels are designed for longer durability, but outcomes depend on arthritis stage, inflammation, and overall health. ${eff ? (asp ? 'Aspiration may improve durability in swollen knees.' : 'Swelling may reduce durability.') : ''}`;
    const cl = `Drivers: ${joinList(pos)||'—'}. Limiters: ${joinList(lim)||'—'}.`;
    reasons.gel = { patient: pt, clinician: cl };
  }
  return reasons;
}

function calculate(){
  const amber=document.getElementById('amberWarning'); amber.style.display='none'; amber.innerHTML='';
  const age=parseInt(document.getElementById('age').value||'0',10)||0;
  const vas=parseInt(document.getElementById('vas').value||'0',10)||0;
  const bmi=parseFloat(document.getElementById('bmi').value||'')||calcBMI()||0;
  const kl=parseInt(document.getElementById('kl').value||'0',10)||0;
  const syn=document.getElementById('synovitis').value||'';
  const eff=document.getElementById('effusion').value||'';
  const asp=document.getElementById('aspirated')?.value||'';
  const mal=document.getElementById('malalign').value||'';
  const quad=document.getElementById('quadweak').value||'';
  const metab=document.getElementById('metabolic').value||'';
  const nutr=document.getElementById('nutr').value||'';
  const diab=document.getElementById('diabetes').value||'';
  const glau=document.getElementById('glaucoma').value||'';
  const first=document.getElementById('firstInj').value||'';
  const prior=document.getElementById('prior').value||'';
  const cs12=parseInt(document.getElementById('cs12').value||'0',10)||0;
  const cslife=parseInt(document.getElementById('cslife').value||'0',10)||0;
  const pcs=pcsTotal();

  if(diab==='Y'){
    amber.style.display='block';
    amber.innerHTML += '⚠ Diabetes: steroid injections can temporarily upset blood sugar control for up to 1–2 weeks.<br>';
  }
  if(glau==='Y'){
    amber.style.display='block';
    amber.innerHTML += '⚠ Glaucoma: steroid injections can increase intra-ocular pressure – consider alternatives / seek advice.<br>';
  }

  const synY=yn(syn)===1, effY=yn(eff)===1, aspY=(effY && asp==='Y');

  let S=0;
  if(age<60) S+=0.6; else if(age<70) S+=0.2; else if(age<80) S-=0.4; else S-=1.0;
  if(kl<=2 && kl>0) S+=1.2; else if(kl===3) S+=0.2; else if(kl===4) S-=1.4;
  if(bmi>0){
    if(bmi>=35) S-=0.8; else if(bmi>=30) S-=0.4; else if(bmi<27) S+=0.2;
  }
  if(mal==='Y') S-=0.6;
  if(quad==='Y') S-=0.6;
  if(metab==='Y') S-=0.6;
  if(nutr==='Y') S-=0.4;
  if(pcs>=15) S-=0.8; else if(pcs>=10) S-=0.4;

  const inflamm = (synY?1:0) + (effY?1:0);

  let priorScore=0;
  let csLoadPenalty=0;
  if(first==='Y'){
  } else {
    priorScore = (prior==='Y') ? 0.8 : 0;
    csLoadPenalty = Math.min(2.0, cs12*0.5 + cslife*0.25);
  }

  let cs_short = 0.9*S + 1.4*inflamm + 0.5*priorScore - 0.4*csLoadPenalty;
  let cs_mid   = 0.5*S + 0.3*inflamm + 0.2*priorScore - 0.9*csLoadPenalty;

  let ha_short = 0.6*S - 0.3*inflamm - 0.2*(metab==='Y'?1:0);
  let ha_mid   = 0.9*S - 0.9*inflamm - 0.6*(metab==='Y'?1:0);

  let gel_mid  = 0.95*S - 0.35*inflamm - 0.5*(metab==='Y'?1:0);
  let gel_long = 0.75*S - 0.25*inflamm - 0.6*(metab==='Y'?1:0);

  if(aspY){
    cs_short += 0.2; cs_mid += 0.1;
    ha_mid += 0.5; gel_mid += 0.2; gel_long += 0.2;
  }

  const cap=(x)=>clamp(x,-2,8);
  cs_short=cap(cs_short); cs_mid=cap(cs_mid); ha_short=cap(ha_short); ha_mid=cap(ha_mid); gel_mid=cap(gel_mid); gel_long=cap(gel_long);

  const idxs={cs_short, cs_mid, ha_short, ha_mid, gel_mid, gel_long};
  const inputs={age,bmi,kl,synovitisY:synY,effusionY:effY,aspY,cs12,cslife};
  const reasons=buildReasons(inputs, idxs);

  const cards=[
    {key:'cs', title:'Corticosteroid', short:cs_short, mid:cs_mid, note:reasons.cs.patient, clinician:reasons.cs.clinician},
    {key:'ha', title:'Hyaluronic Acid (e.g., Sinovial 64 / Sinogel)', short:ha_short, mid:ha_mid, note:reasons.ha.patient, clinician:reasons.ha.clinician},
    {key:'gel', title:'Hydrogel', mid:gel_mid, long:gel_long, note:reasons.gel.patient, clinician:reasons.gel.clinician},
  ];
  localStorage.setItem('resultsPayload', JSON.stringify({mode:'clinician', cards, meta:{age, bmi, kl, inflamm}}));
  window.location.href='results.html';
}

document.addEventListener('DOMContentLoaded', ()=>{
  const startBtn=document.getElementById('startBtn');
  const formCard=document.getElementById('formCard');
  const calcBtn=document.getElementById('calcBtn');
  const nextBtn=document.getElementById('nextBtn');
  const backBtn=document.getElementById('backBtn');
  const resetFab=document.getElementById('resetFab');

  const stepper = setupStepper();

  startBtn.addEventListener('click', ()=>{
    formCard.classList.toggle('hidden');
    if(!formCard.classList.contains('hidden')) stepper.showStep(0);
  });

  function updateAsp(){
    const eff=document.getElementById('effusion').value;
    const blk=document.getElementById('aspiratedBlock');
    const sel=document.getElementById('aspirated');
    const show = eff==='Y';
    blk.style.display = show ? 'block' : 'none';
    if(!show) sel.value='';
  }
  document.getElementById('effusion').addEventListener('change', updateAsp);
  updateAsp();

  function updateFirst(){
    const first=document.getElementById('firstInj').value;
    const dis = first==='Y';
    ['prior','cs12','cslife'].forEach(id=>{
      const el=document.getElementById(id);
      el.disabled=dis;
      if(dis) el.value='';
    });
  }
  document.getElementById('firstInj').addEventListener('change', updateFirst);
  updateFirst();

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

  for(let i=1;i<=6;i++){
    const el=document.getElementById('pcs'+i);
    if(el && !el.value) el.value='0';
  }
});
