(function(){
const advisorName='Magno Eugenio Calderón Ortega', advisorWa='5214431281154';
const tiers=[[5000,.011],[10000,.012],[15000,.013],[20000,.014],[25000,.015],[50000,.016],[75000,.017],[100000,.018],[200000,.019],[300000,.020],[400000,.021],[500000,.022],[600000,.023],[700000,.024],[800000,.025],[900000,.026],[1000000,.027],[1100000,.028],[1200000,.029],[1300000,.030]];
const mxn=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
let projection=[];
const $=id=>document.getElementById(id);
const pct=v=>(v*100).toFixed(1)+'%';
function num(v){return Number(String(v||'').replace(/[^0-9.-]/g,''))||0}
function rateFor(amount){let r=0; for(const [min,rate] of tiers){ if(amount>=min) r=rate } return r}
function nextTier(amount){return tiers.find(([min])=>amount<min)||null}
function set(id,val){const el=$(id); if(el) el.textContent=val}
function show(id,html){const el=$(id); if(el) el.innerHTML=html}
function calculate(){
  const initial=Math.max(0,num($('initial')?.value)), monthly=Math.max(0,num($('monthly')?.value));
  const months=Math.max(1,Math.min(240,num($('months')?.value)||1));
  const mode=document.querySelector('input[name="mode"]:checked')?.value||'withdraw';
  const name=($('clientName')?.value||'').trim(); if($('months')) $('months').value=months;
  const startMonth = Number($('startMonth')?.value || 0); // 0=Enero ... 11=Diciembre
  let balance=initial,totalRewards=0,contributions=initial; projection=[];
  for(let m=1;m<=months;m++){
    const contribution = m===1 ? 0 : monthly;
    const base = balance + contribution;
    // Mes calendario (0=Enero ... 11=Diciembre)
    const calendarMonth = (startMonth + m - 1) % 12;
    let rate = rateFor(base);
    let reward = base * rate;
    if (calendarMonth === 11) {
      reward *= 0.5; // Ojo: si te da error de asignación, cambia el 'const reward' de arriba por 'let reward'
    }
    totalRewards+=reward; contributions+=contribution;
    const end=mode==='reinvest'?base+reward:base;
    projection.push({m,calendarMonth,base,rate,reward,end}); balance=end;
  }
  
  let initialRate = rateFor(initial);
  const last = projection[projection.length-1] || {
    base: initial,
    rate: initialRate,
    reward: 0,
    end: initial
  };

  const nt = nextTier(initial);
  
  
  set('rateNow',pct(initialRate)); set('heroRate',pct(initialRate)); set('finalCapital',mxn.format(last.end));
  set('lastReward',mxn.format(last.reward)); set('totalRewards',mxn.format(totalRewards)); set('totalContributions',mxn.format(contributions));
  set('modeText',mode==='reinvest'?'Recompensas reinvertidas al capital':'Recompensas retiradas cada mes');
  set('rewardHelp',`Último mes · base ${mxn.format(last.base)} · ${pct(last.rate)} mensual`);
  set('rateSub',initialRate===last.rate?`${pct(initialRate)} durante la simulación`:`${pct(initialRate)} inicial → ${pct(last.rate)} final`);
  set('rateCaption',initialRate?`Rango por monto inicial: ${mxn.format(initial)}`:'La tabla inicia en $5,000');
  show('nextTier', nt?`Para subir al siguiente rango faltan <b>${mxn.format(nt[0]-initial)}</b>. Al llegar a <b>${mxn.format(nt[0])}</b> se aplicaría <b>${pct(nt[1])}</b>.`:`Ya estás en el rango máximo de la tabla: <b>${pct(rateFor(initial))}</b> mensual.`);
  const warning=$('warning'); if(warning){warning.classList.toggle('show',initial>0&&initial<5000); warning.innerHTML=initial>0&&initial<5000?'El monto capturado está por debajo de $5,000; por eso el rendimiento se muestra en 0.0%.':''}
  renderTables(); renderChart(); updateWhatsApp({name,initial,monthly,months,mode,last,totalRewards,contributions,initialRate});
}
function renderTables(){
  show('tierBody',tiers.map(([min,rate])=>`<tr><td>${mxn.format(min)}</td><td>${pct(rate)}</td></tr>`).join(''));
  show('projectionBody',projection.map(p=>`<tr><td>${p.m}</td><td>${mxn.format(p.base)}</td><td>${pct(p.rate)}</td><td>${mxn.format(p.reward)}</td><td>${mxn.format(p.end)}</td></tr>`).join(''));
}
function renderChart(){
  const canvas=$('chart'); if(!canvas||!projection.length) return; const parent=canvas.parentElement,dpr=window.devicePixelRatio||1,w=parent.clientWidth,h=parent.clientHeight;
  canvas.width=w*dpr; canvas.height=h*dpr; const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
  const vals=projection.map(p=>p.end), max=Math.max(...vals,1)*1.08, pad={l:14,r:14,t:20,b:28};
  const x=i=>pad.l+(i/Math.max(1,vals.length-1))*(w-pad.l-pad.r), y=v=>h-pad.b-(v/max)*(h-pad.t-pad.b);
  ctx.strokeStyle='rgba(20,32,51,.08)'; for(let i=0;i<4;i++){const yy=pad.t+i*(h-pad.t-pad.b)/3; ctx.beginPath(); ctx.moveTo(pad.l,yy); ctx.lineTo(w-pad.r,yy); ctx.stroke()}
  const area=ctx.createLinearGradient(0,pad.t,0,h-pad.b); area.addColorStop(0,'rgba(20,184,109,.28)'); area.addColorStop(1,'rgba(20,184,109,0)');
  ctx.beginPath(); vals.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v))); ctx.lineTo(x(vals.length-1),h-pad.b); ctx.lineTo(x(0),h-pad.b); ctx.closePath(); ctx.fillStyle=area; ctx.fill();
  const grad=ctx.createLinearGradient(pad.l,0,w-pad.r,0); grad.addColorStop(0,'#14b86d'); grad.addColorStop(1,'#d1aa58');
  ctx.beginPath(); vals.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v))); ctx.strokeStyle=grad; ctx.lineWidth=4; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();
  ctx.fillStyle='#d1aa58'; ctx.beginPath(); ctx.arc(x(vals.length-1),y(vals[vals.length-1]),5,0,Math.PI*2); ctx.fill();
}
function updateWhatsApp(d){
  const modeText=d.mode==='reinvest'?'reinvertir recompensas':'retirar recompensas mensuales';
  const msg=`Hola ${advisorName}, quiero revisar esta simulación patrimonial:\n\nCliente: ${d.name||'Por confirmar'}\nMonto inicial: ${mxn.format(d.initial)}\nAportación mensual recurrente: ${mxn.format(d.monthly)}\nPlazo: ${d.months} meses\nModalidad: ${modeText}\nRendimiento automático: ${pct(d.initialRate)} inicial / ${pct(d.last.rate)} al final\n\nCapital final estimado: ${mxn.format(d.last.end)}\nÚltima recompensa mensual estimada: ${mxn.format(d.last.reward)}\nRecompensas acumuladas estimadas: ${mxn.format(d.totalRewards)}\n\nMe gustaría recibir asesoría personalizada.`;
  const url=`https://wa.me/${advisorWa}?text=${encodeURIComponent(msg)}`;
  ['waTop','waHero','waAdvisor','waForm','waSticky'].forEach(id=>{const el=$(id); if(el) el.href=url})
}
function csv(){
  const rows=[['Mes','Base para rendimiento','Rendimiento mensual','Recompensa estimada','Saldo final'],...projection.map(p=>[p.m,p.base.toFixed(2),(p.rate*100).toFixed(1)+'%',p.reward.toFixed(2),p.end.toFixed(2)])];
  const data=rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([data],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='simulacion_patrimonial.csv'; a.click(); URL.revokeObjectURL(a.href); toast('CSV descargado')
}
function copySummary(){
  const href=$('waForm')?.href||''; const text=decodeURIComponent((href.split('text=')[1]||'')).replace(/\+/g,' ');
  if(navigator.clipboard){navigator.clipboard.writeText(text).then(()=>toast('Resumen copiado')).catch(()=>toast('No se pudo copiar'))} else {toast('Resumen listo para enviar')}
}
function toast(msg){const t=$('toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200)}
function format(id){const el=$(id); if(!el)return; const v=num(el.value); el.value=v?v.toLocaleString('es-MX'):''}
function init(){
  ['clientName','months'].forEach(id=>$(id)?.addEventListener('input',calculate));
  ['initial','monthly'].forEach(id=>{const el=$(id); if(el){el.addEventListener('input',calculate); el.addEventListener('change',calculate); el.addEventListener('blur',()=>{format(id); calculate()})}});
  document.querySelectorAll('input[name="mode"]').forEach(el=>el.addEventListener('change',calculate));
  document.querySelectorAll('[data-amount]').forEach(btn=>btn.addEventListener('click',()=>{const el=$('initial'); if(el){el.value=Number(btn.dataset.amount).toLocaleString('es-MX'); calculate()}}));
  $('downloadCsv')?.addEventListener('click',csv); $('copySummary')?.addEventListener('click',copySummary); $('calcBtn')?.addEventListener('click',()=>{format('initial'); format('monthly'); calculate(); toast('Simulación actualizada')});
  window.addEventListener('resize',()=>{clearTimeout(window._rz); window._rz=setTimeout(renderChart,150)});
  format('initial'); format('monthly'); calculate();
  setTimeout(calculate,100);
}
window.calcularSimulacion=calculate;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
