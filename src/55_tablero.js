"use strict";
/* ================= BLOQUE 9 · TABLERO DE RESULTADOS / DASHBOARD ================= */
/* ---------- gráficas SVG propias, animadas ---------- */
function ticks(a, b, n){ const span = (b-a)||1, paso0 = span/n, p10 = Math.pow(10, Math.floor(Math.log10(paso0))); const paso = [1,2,2.5,5,10].map(m=>m*p10).find(s=>s>=paso0) || p10*10;
  const t = []; for(let v=Math.ceil(a/paso)*paso; v<=b+1e-9; v+=paso) t.push(+v.toFixed(6)); return t; }
function graficaLineas(o){
  const W=560, H=300, m={l:62,r:o.y2?62:18,t:16,b:44};
  const xs = o.series.flatMap(s=>s.pts.map(p=>p[0]));
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const rango = sel => { const ys = o.series.filter(s=>!!s.y2===sel).flatMap(s=>s.pts.map(p=>p[1])); if(!ys.length) return null; let a=Math.min(...ys), b=Math.max(...ys); if(o.cero&&!sel) a=Math.min(a,0); const pad=(b-a)*0.08||1; return [a-pad,b+pad]; };
  const r1 = rango(false), r2 = rango(true);
  const X = v => m.l + (v-x0)/((x1-x0)||1)*(W-m.l-m.r);
  const Y = (v, alt) => { const r = alt?r2:r1; return H-m.b - (v-r[0])/((r[1]-r[0])||1)*(H-m.t-m.b); };
  const ty = ticks(r1[0], r1[1], 5), tx2 = ticks(x0, x1, 6);
  return `<div class="graf"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.titulo||'')}">
    ${ty.map(v=>`<line class="rej" x1="${m.l}" x2="${W-m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l-8}" y="${Y(v)+4}" text-anchor="end">${fmt(v,o.dy??0)}</text>`).join('')}
    ${r2?ticks(r2[0],r2[1],5).map(v=>`<text x="${W-m.r+8}" y="${Y(v,true)+4}" fill="var(--accent-text)">${fmt(v,o.dy2??2)}</text>`).join(''):''}
    ${tx2.map(v=>`<text x="${X(v)}" y="${H-m.b+18}" text-anchor="middle">${fmt(v,o.dx??1)}</text>`).join('')}
    <line class="eje" x1="${m.l}" x2="${W-m.r}" y1="${H-m.b}" y2="${H-m.b}"/>
    ${(o.vlineas||[]).map(v=>`<line x1="${X(v.x)}" x2="${X(v.x)}" y1="${m.t}" y2="${H-m.b}" stroke="var(--${v.c||'muted'})" stroke-dasharray="5 5"/>${X(v.x) > W-m.r-90 ? `<text x="${X(v.x)-5}" y="${H-m.b-8}" text-anchor="end"` : `<text x="${X(v.x)+5}" y="${H-m.b-8}"`} fill="var(--${v.c||'muted'})">${esc(v.t)}</text>`).join('')}
    ${o.series.map(s=>`<polyline class="${s.cls} dibuja" pathLength="1" points="${s.pts.map(p=>X(p[0]).toFixed(1)+','+Y(p[1],s.y2).toFixed(1)).join(' ')}"/>${s.pts.map(p=>`<circle class="pt" r="3.5" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1],s.y2).toFixed(1)}" stroke="var(--${s.cls==='l2'?'accent':'primary'})"><title>${esc(s.etq)}: ${fmt(p[1],2)}</title></circle>`).join('')}`).join('')}
    ${(o.marcas||[]).map(k=>`<circle class="opt aparece" r="7" cx="${X(k.x)}" cy="${Y(k.y,k.y2)}"/><text x="${X(k.x) > W-m.r-40 ? X(k.x)-12 : X(k.x)}" y="${Y(k.y,k.y2) < m.t+22 ? Y(k.y,k.y2)+24 : Y(k.y,k.y2)-12}" text-anchor="${X(k.x) > W-m.r-40 ? 'end' : 'middle'}" font-weight="700" fill="var(--accent-text)">${esc(k.t)}</text>`).join('')}
    <text x="${(W+m.l-m.r)/2}" y="${H-6}" text-anchor="middle">${esc(o.xlab||'')}</text>
    <text x="14" y="${(H-m.b+m.t)/2}" text-anchor="middle" transform="rotate(-90 14 ${(H-m.b+m.t)/2})" fill="var(--primary-dark)">${esc(o.ylab||'')}</text>
    ${o.y2?`<text x="${W-8}" y="${(H-m.b+m.t)/2}" text-anchor="middle" transform="rotate(90 ${W-8} ${(H-m.b+m.t)/2})" fill="var(--accent-text)">${esc(o.y2lab||'')}</text>`:''}
  </svg>${o.leyenda?`<div class="legend" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-top:6px">${o.series.map(s=>`<span><i style="background:var(--${s.cls==='l2'?'accent':'primary'})"></i>${esc(s.etq)}</span>`).join('')}</div>`:''}</div>`;
}
function graficaBarrasH(items, o){
  const W=560, fila=30, H=items.length*fila+24, l=150, r=Math.max(96, 10+6.4*Math.max(...items.map(x=>String(x.txt).length)));
  const vmax = Math.max(...items.map(x=>x.v), 1e-9);
  return `<div class="graf"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.titulo||'')}">
    ${items.map((x,i)=>{ const w = Math.max(2,(W-l-r)*x.v/vmax), y = 8+i*fila;
      return `<text x="${l-8}" y="${y+16}" text-anchor="end" ${x.yo?'font-weight="700" fill="var(--text)"':''}>${esc(x.n)}</text><rect class="b ${x.yo?'yo':''} crece" style="animation-delay:${(i*0.05).toFixed(2)}s" x="${l}" y="${y+3}" width="${w.toFixed(1)}" height="${fila-10}" rx="5"><title>${esc(x.n)}: ${esc(x.txt)}</title></rect><text x="${l+w+6}" y="${y+16}" ${x.yo?'font-weight="700" fill="var(--text)"':''}>${esc(x.txt)}</text>`; }).join('')}
  </svg></div>`;
}
function graficaRadar(items){
  const S0 = 300, c = S0/2, R = 105, n = items.length, max = 150;
  const P = (i, v) => { const a = -Math.PI/2 + i*2*Math.PI/n, rr = R*Math.min(v,max)/max; return [c+rr*Math.cos(a), c+rr*Math.sin(a)]; };
  const poly = vals => vals.map((v,i)=>P(i,v).map(z=>z.toFixed(1)).join(',')).join(' ');
  return `<div class="graf"><svg viewBox="0 0 ${S0} ${S0}" role="img" aria-label="${T('Aporte frente al requerimiento','Supply versus requirement')}">
    ${[50,100,150].map(k=>`<polygon points="${poly(items.map(()=>k))}" fill="none" stroke="var(--border)" ${k===100?'stroke-width="1.6"':''}/>`).join('')}
    ${items.map((x,i)=>{ const p = P(i,max), t = P(i,max+22); return `<line x1="${c}" y1="${c}" x2="${p[0]}" y2="${p[1]}" stroke="var(--border)"/><text x="${t[0]}" y="${t[1]+4}" text-anchor="middle">${esc(x.n)}</text>`; }).join('')}
    <polygon class="rad0" points="${poly(items.map(()=>100))}"/>
    <polygon class="rad aparece" points="${poly(items.map(x=>x.v))}"><title>${items.map(x=>x.n+' '+fmt(x.v,0)+' %').join(' · ')}</title></polygon>
  </svg></div>`;
}

/* ---------- cálculos del tablero ---------- */
function parametros(r, ctx){
  const p = r.pred, dmi = r.dmi, cd = dmi*r.costoKg, c = S.cond;
  if(!ctx.crec || !(p.adg>0)) return {cd, dmi, crec:false};
  const ing = p.adg*c.ventakg;
  return {crec:true, adg:p.adg, dmi, ea:p.adg/dmi, ca:dmi/p.adg, cd, ckg:cd/p.adg, ing, bcA: ing/cd, bcT: ing/(cd+c.otrosDia), margen: ing-cd-c.otrosDia};
}
function clonEstado(){ return JSON.parse(JSON.stringify(S)); }
function curvaOptimo(){
  const ctx0 = contexto(S); if(!ctx0.crec) return null;
  const ings = S.ingredientes.filter(i=>S.sel[i.id]);
  const g0 = S.cat==='vaquillas' ? 0.3 : S.cat==='desarrollo' ? 0.5 : 0.7, g1 = S.cat==='vaquillas' ? 1.0 : S.cat==='desarrollo' ? 1.4 : 2.0;
  const pts = [];
  for(let g=g0; g<=g1+1e-9; g+=0.1){
    const s2 = clonEstado(); s2.animal.adg = +g.toFixed(2);
    const ctx = contexto(s2), r = formularContexto(ctx, ings, null, {nem0:S.animal.nemSup});
    if(!r.ok) continue;
    const P = parametrosCon(r, s2);
    pts.push({meta:+g.toFixed(2), adg:r.pred.adg, ckg:P.ckg, margen:P.margen, bc:P.bcT, costoT:r.costoKg*1000});
  }
  if(!pts.length) return null;
  const opt = pts.reduce((a,b)=>b.margen>a.margen?b:a);
  return {pts, opt};
}
function parametrosCon(r, s){ const dmi = r.dmi, cd = dmi*r.costoKg, ing = r.pred.adg*s.cond.ventakg; return {ckg: r.pred.adg>0?cd/r.pred.adg:null, margen: ing-cd-s.cond.otrosDia, bcT: ing/(cd+s.cond.otrosDia), cd}; }
function comparaRegiones(){
  return Object.keys(REGIONES).map(k=>{
    const s2 = clonEstado(); s2.region = k; s2.edo = REGIONES[k].edos[0]; aplicarRegion(s2); preciosRegion(s2);
    const ctx = contexto(s2), ings = s2.ingredientes.filter(i=>s2.sel[i.id]);
    let r = formularContexto(ctx, ings, null, {nem0:S.animal.nemSup}), lim = false;
    /* Si el clima de la región no permite la meta (estrés calórico, lodo), se compara con la ganancia máxima posible allí */
    if(!r.ok && ctx.crec){ const g = Math.floor(gananciaMaxima(s2)*100)/100;
      if(g > 0.11){ s2.animal.adg = g; r = formularContexto(contexto(s2), ings, null, {nem0:S.animal.nemSup}); lim = r.ok; } }
    if(!r.ok) return {k, ok:false};
    const P = parametrosCon(r, s2);
    return {k, ok:true, lim, adg:r.pred.adg, ckg:P.ckg, cd:P.cd, bc:P.bcT, ithEf:s2.cond.ithEf, costoT:r.costoKg*1000};
  });
}
function sensibilidadGrano(r){
  const gr = r.formula.filter(x=>x.pct>1e-6 && (x.cat==='gra'||x.cat==='sub'||x.cat==='pro')).sort((a,b)=>b.pct*b.precioMS-a.pct*a.precioMS)[0];
  if(!gr) return null;
  const ings0 = S.ingredientes.filter(i=>S.sel[i.id]);
  const pts = [];
  for(const f of [0.7,0.8,0.9,1.0,1.1,1.2,1.3]){
    const ings = ings0.map(i=>i.id===gr.id ? Object.assign({}, i, {precio:i.precio*f}) : i);
    const rr = formularContexto(contexto(S), ings, null, {nem0:S.animal.nemSup});
    if(!rr.ok) continue;
    const uso = (rr.formula.find(x=>x.id===gr.id)||{pct:0}).pct;
    pts.push({f, costoT:rr.costoKg*1000, ckg: rr.pred.adg>0 ? rr.dmi*rr.costoKg/rr.pred.adg : null, uso});
  }
  return {id:gr.id, pts};
}

function renderTablero(el){
  const r = S.resultado;
  el.innerHTML = `${cabecera('tablero',T('Todos los números que importan en una sola vista: lo que logra la ración, la ganancia que deja más dinero, cómo cambia el costo entre regiones y qué tanto te afecta el precio del grano.','Every number that matters in one view: what the ration achieves, the gain that makes the most money, how cost changes across regions and how much the grain price affects you.'))}
  ${teoriaDe(['indicadores'])}
  <div id="dash">${!r||!r.ok?`<div class="empty">${ill('i-panel')}<p>${T('Primero formula la ración en el Bloque 7. Después vuelve aquí para ver el tablero completo.','First formulate the ration in Block 7, then come back here for the full dashboard.')}</p><button class="btn" data-ir="formulacion">${T('Ir a Formulación','Go to Formulation')}</button></div>`:`<div class="empty">${ill('i-panel')}<p>${T('Calculando el tablero…','Computing the dashboard…')}</p></div>`}</div>
  ${siguiente('tablero')}`;
  if(r && r.ok) setTimeout(pintarTablero, 20);
}
function pintarTablero(){
  const box = $('#dash'); if(!box) return;
  const r = S.resultado, ctx = contexto(S), Pm = parametros(r, ctx), nombre = id => tx((S.ingredientes.find(i=>i.id===id)||{nombre:id}).nombre);
  const P = S.programa && S.programa.ok && S.programa.crec ? S.programa : null;
  let html = '';
  /* 1. Parámetros logrados */
  if(Pm.crec){
    const prog = P ? (()=>{ const gan=P.pvF-P.pvI, compra=P.pvI*S.cond.comprakg, venta=P.pvF*S.cond.ventakg, otros=P.dias*S.cond.otrosDia;
      return {adg:gan/P.dias, dmi:P.cms/P.dias, ea:gan/P.cms, ca:P.cms/gan, ckg:P.costo/gan, bcT: venta/(compra+P.costo+otros), bcVA:(venta-compra)/(P.costo+otros), margen:(venta-compra-P.costo-otros)}; })() : null;
    const fila = (n, a, b, ay, d=2) => `<tr><td>${n}${ayuda(ay)}</td><td class="r"><b>${a}</b></td>${prog?`<td class="r"><b>${b}</b></td>`:''}</tr>`;
    html += `<div class="card"><h3>${T('Parámetros logrados','Achieved parameters')}</h3>
      <div class="tbl"><table><thead><tr><th>${T('Parámetro','Parameter')}</th><th class="r">${T('Ración actual','Current ration')} (${fmt(S.animal.pv,0)} kg)</th>${prog?`<th class="r">${T('Programa completo','Whole program')} (${fmt(P.dias,0)} d)</th>`:''}</tr></thead><tbody>
      ${fila(T('Ganancia diaria de peso (GDP)','Average daily gain (ADG)'), fmt(Pm.adg,2)+' kg/d', prog?fmt(prog.adg,2)+' kg/d':'', 'adgPred')}
      ${fila(T('Consumo de materia seca','Dry matter intake'), fmt(Pm.dmi,2)+' kg/d', prog?fmt(prog.dmi,2)+' kg/d':'', 'dmi')}
      ${fila(T('Eficiencia alimenticia (ganancia : alimento)','Feed efficiency (gain : feed)'), fmt(Pm.ea,3)+' kg/kg', prog?fmt(prog.ea,3)+' kg/kg':'', 'ea')}
      ${fila(T('Conversión alimenticia (alimento : ganancia)','Feed conversion (feed : gain)'), fmt(Pm.ca,2)+' kg/kg', prog?fmt(prog.ca,2)+' kg/kg':'', 'conv')}
      ${fila(T('Costo de alimento por kg ganado','Feed cost per kg gained'), money(Pm.ckg), prog?money(prog.ckg):'', 'costoKgGan')}
      ${fila(T('Relación beneficio : costo','Benefit : cost ratio'), fmt(Pm.bcT,2), prog?fmt(prog.bcT,2):'', 'bc')}
      ${fila(T('Margen','Margin'), money(Pm.margen)+' /d', prog?money(prog.margen,0)+' /'+T('cabeza','head'):'', 'margen')}
      </tbody></table></div>
      <p class="small muted">${T('Ración actual: B/C = valor de la ganancia del día (GDP × precio de venta) ÷ (alimento + otros costos del día). Programa: B/C = venta ÷ (compra + alimento + otros costos); su valor agregado, (venta − compra) ÷ (alimento + otros), es','Current ration: B/C = value of the day’s gain (ADG × sale price) ÷ (feed + other daily costs). Program: B/C = sale ÷ (purchase + feed + other costs); its value added, (sale − purchase) ÷ (feed + other), is')} ${prog?fmt(prog.bcVA,2):T('— (formula el Programa)','— (formulate the Program)')}.</p></div>`;
  } else {
    html += `<div class="card"><h3>${T('Parámetros logrados','Achieved parameters')}</h3><div class="kpis" style="margin:0">
      <div class="kpi"><div class="l">${T('Costo por vaca al día','Cost per cow per day')}</div><div class="v">${money(Pm.cd)}</div></div>
      <div class="kpi"><div class="l">${T('Balance de energía','Energy balance')}${ayuda('balE')}</div><div class="v">${fmt(r.pred.balE,2)} Mcal/d</div></div>
      <div class="kpi"><div class="l">${T('Balance de PM','MP balance')}${ayuda('balPM')}</div><div class="v">${fmt(r.pred.balPM,0)} g/d</div></div>
      <div class="kpi"><div class="l">${T('Metano','Methane')}${ayuda('ch4')}</div><div class="v">${fmt(r.pred.ch4,0)} g/d</div></div></div></div>`;
  }
  html += `<div class="dash">`;
  /* 2. Ganancia económicamente óptima */
  const C = curvaOptimo();
  if(C){
    const o = C.opt;
    html += `<div class="card"><h3>${T('¿Qué ganancia deja más dinero?','Which gain makes the most money?')}${ayuda('optimo')}</h3>
      ${graficaLineas({titulo:T('Margen diario según la meta de ganancia','Daily margin by gain target'), xlab:T('ganancia lograda (kg/d)','achieved gain (kg/d)'), ylab:T('margen $/d','margin $/d'), y2:true, y2lab:T('$ por kg ganado','$ per kg gained'), dy:0, dy2:0, dx:1, leyenda:true,
        series:[{etq:T('Margen por animal al día','Margin per head per day'), cls:'l1', pts:C.pts.map(p=>[p.adg,p.margen])},{etq:T('Costo de alimento por kg ganado','Feed cost per kg gained'), cls:'l2', y2:true, pts:C.pts.map(p=>[p.adg,p.ckg])}],
        marcas:[{x:o.adg, y:o.margen, t:T('óptimo','optimum')}], vlineas:[{x:r.pred.adg, t:T('tu ración','your ration'), c:'muted'}]})}
      <p class="small">${T(`Con tus precios, la mayor utilidad diaria se logra con <b>${fmt(o.adg,2)} kg/d</b> (meta ${fmt(o.meta,1)}): ${money(o.margen)} por animal al día, a ${money(o.ckg)} por kg ganado.`,`At your prices, the highest daily profit comes at <b>${fmt(o.adg,2)} kg/d</b> (target ${fmt(o.meta,1)}): ${money(o.margen)} per head per day, at ${money(o.ckg)} per kg gained.`)} ${Math.abs(o.adg-r.pred.adg)>0.15?T('Ajusta tu meta en el Bloque 3.','Adjust your target in Block 3.'):T('Tu meta ya está cerca del óptimo. ✓','Your target is already close to the optimum. ✓')}</p></div>`;
  }
  /* 3. Comparación regional */
  const RG = comparaRegiones().filter(x=>x.ok);
  if(RG.length){
    const crec = Pm.crec;
    const items = RG.map(x=>({n:tx(REGIONES[x.k].n), v: crec ? x.ckg : x.cd, yo:x.k===S.region, txt: crec ? money(x.ckg)+'/kg · '+fmt(x.adg,2)+' kg/d'+(x.lim?' *':'') : money(x.cd)+'/d'})).sort((a,b)=>a.v-b.v);
    html += `<div class="card"><h3>${T('El mismo animal en cada región','The same animal in every region')}${ayuda('regionComp')}</h3>
      ${graficaBarrasH(items, {titulo:T('Costo por región','Cost by region')})}
      <p class="small muted">${crec?T('Costo de alimento por kg ganado y ganancia esperada, con el clima de la temporada, la sombra de tu corral y los precios estimados de cada región.','Feed cost per kg gained and expected gain, with the season’s climate, your pen shade and each region’s estimated prices.'):T('Costo de la ración por vaca al día en cada región.','Ration cost per cow per day in each region.')}${RG.some(x=>x.lim)?' '+T('* El clima de esa región no permite tu meta de ganancia: se muestra la ganancia máxima posible allí.','* That region’s climate does not allow your gain target: the maximum feasible gain there is shown.'):''}</p>
      <div class="mapa-mini">${mapaSVG(S.region, S.edo, true)}</div></div>`;
  }
  /* 4. Sensibilidad al precio del ingrediente principal */
  const SG = sensibilidadGrano(r);
  if(SG && SG.pts.length>2){
    html += `<div class="card"><h3>${T('Si cambia el precio de','If the price changes for')} ${esc(nombre(SG.id))}${ayuda('sensib')}</h3>
      ${graficaLineas({titulo:T('Sensibilidad al precio','Price sensitivity'), xlab:T('precio respecto al actual (%)','price relative to current (%)'), ylab:T('$ por t de MS','$ per t DM'), y2:true, y2lab:T('% en la dieta','% in the diet'), dx:0, dy:0, dy2:0, leyenda:true,
        series:[{etq:T('Costo por t de MS','Cost per t DM'), cls:'l1', pts:SG.pts.map(p=>[p.f*100,p.costoT])},{etq:T('Inclusión en la ración','Inclusion in the ration'), cls:'l2', y2:true, pts:SG.pts.map(p=>[p.f*100,p.uso])}]})}
      <p class="small muted">${T('Cada punto es una ración reformulada. Cuando el precio sube, el modelo lo sustituye por otros ingredientes hasta donde lo permiten los requerimientos.','Each point is a reformulated ration. As the price rises, the model replaces it with other ingredients as far as requirements allow.')}</p></div>`;
  }
  /* 5. Costo y nutrientes */
  const usados = r.formula.filter(x=>x.pct>1e-6).sort((a,b)=>b.pct*b.precioMS-a.pct*a.precioMS);
  html += `<div class="card"><h3>${T('¿En qué se va el dinero?','Where does the money go?')}</h3>
    <div class="chart-wrap">${dona(usados.map(x=>({n:nombre(x.id),v:x.pct*x.precioMS})))}
    <div class="legend">${usados.slice(0,10).map((x,i)=>`<span><i style="background:${PALETA[i%PALETA.length]}"></i>${esc(nombre(x.id))} · <b>${fmt(100*x.pct*x.precioMS/(r.costoKg*100),1)} %</b></span>`).join('')}</div></div></div>`;
  const req = r.contexto.req, rad = KEYN.filter(k=>req[k]&&req[k][0]>0).map(k=>({n:k==='NEm'?'ENm':k==='NEg'?'ENg':k==='FDNef'?'FDNfe':k==='For'?T('Forraje','Forage'):k, v:100*r.nutr[k]/req[k][0]}));
  if(rad.length>=3) html += `<div class="card"><h3>${T('Aporte frente al requerimiento','Supply versus requirement')}${ayuda('cumpl')}</h3>${graficaRadar(rad)}<p class="small muted">${T('Línea punteada = 100 % del mínimo.','Dashed line = 100 % of the minimum.')}</p></div>`;
  html += `</div>`;
  /* 6. Referencias publicadas */
  html += tablaReferencias();
  html += `<div class="card"><h3>${T('Resultados publicados en distintas regiones','Published results across regions')}${ayuda('refs')}</h3>
    <div class="tbl"><table><thead><tr><th>${T('Región · sistema y estudio','Region · system and study')}</th><th class="r">GDP kg/d</th><th class="r">${T('Conversión','Conversion')}</th></tr></thead><tbody>
    ${Object.keys(REGIONES).concat(['US']).map(rg=>{ const L = ESTUDIOS.filter(e=>e.r===rg); if(!L.length) return ''; return `<tr class="cat"><td colspan="3">${esc(rg==='US'?T('Estados Unidos','United States'):tx(REGIONES[rg].n))}</td></tr>`+filasEstudios(L); }).join('')}</tbody></table></div>
    <p class="tiny muted">${T('Incluye trabajos clásicos del CIPES de Sonora, todavía válidos para los sistemas del noroeste. La conversión se muestra como la publicaron los autores (base seca o tal como se ofrece).','Includes classic CIPES (Sonora) work, still valid for northwestern systems. Conversion is shown as published (dry or as-fed basis).')}</p></div>`;
  box.innerHTML = html;
}
function tablaReferencias(){
  const filas = [];
  VALIDACION.forEach(c=>c.fases.forEach(f=>(f.perf||[]).forEach(p=>{
    const ings = S.ingredientes.concat((c.extra||[]).map(e=>({id:e.id, nombre:e.nombre, cat:e.cat, comp:e.comp, precio:null})));
    const sinPrecio = (c.extra||[]).length>0;
    const suma = f.f.reduce((a,x)=>a+x[1],0), form = Object.fromEntries(f.f.map(([id,v])=>[id,v*100/suma]));
    const a = analizar(form, ings, p.dmi);
    const ea = p.adg/p.dmi, cd = p.dmi*a.costoKg, bc = sinPrecio ? null : p.adg*S.cond.ventakg/(cd+S.cond.otrosDia);
    filas.push(`<tr><td class="wrap" style="min-width:180px">${esc(c.corta)}<br><span class="muted tiny">${esc(tx(c.animal))} · ${esc(tx(p.trat))}</span></td><td>${esc(tx(c.pais))}</td><td class="r">${fmt(p.adg,2)}</td><td class="r">${fmt(p.dmi,2)}</td><td class="r">${fmt(ea,3)}</td><td class="r">${fmt(1/ea,2)}</td><td class="r">${bc!=null?fmt(bc,2):'—'}</td></tr>`);
  })));
  return `<div class="card"><h3>${T('Parámetros publicados en engordas de referencia','Published parameters from reference feedlots')}${ayuda('refs')}</h3>
    <div class="tbl"><table><thead><tr><th>${T('Estudio','Study')}</th><th>${T('Lugar','Place')}</th><th class="r">GDP kg/d</th><th class="r">CMS kg/d</th><th class="r">${T('Eficiencia','Efficiency')}</th><th class="r">${T('Conversión','Conversion')}</th><th class="r">B/C*</th></tr></thead><tbody>${filas.join('')}</tbody></table></div>
    <p class="tiny muted">${T('GDP, CMS y eficiencia: los publicados por los autores. *B/C calculada por RatioBos con la fórmula publicada, tus precios de ingredientes, tu precio de venta y tus otros costos (— cuando el artículo usa un suplemento comercial sin precio conocido).','ADG, DMI and efficiency: as published by the authors. *B/C computed by RatioBos with the published formula, your ingredient prices, your sale price and other costs (— when the paper uses a commercial supplement of unknown price).')}</p></div>`;
}
