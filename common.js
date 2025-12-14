
(function(){
  const pref = localStorage.getItem('theme') || '';
  if (pref === 'dark') {
    document.addEventListener('DOMContentLoaded', ()=>document.body.classList.add('dark'));
  }
})();
function toggleTheme(){
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
function clamp(x, lo, hi){ return Math.max(lo, Math.min(hi, x)); }
function yn(v){ return v === 'Y' ? 1 : 0; }
function pctFromIndex(idx){ return Math.round(clamp((idx+2)/10,0,1)*100); }
function bandFromIndex(idx){
  if (idx >= 6) return {band:'High', cls:'high'};
  if (idx >= 3) return {band:'Moderate', cls:'moderate'};
  if (idx >= 1) return {band:'Low–Moderate', cls:'low'};
  return {band:'Low', cls:'low'};
}
