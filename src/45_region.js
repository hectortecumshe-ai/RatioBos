"use strict";
/* ================= BLOQUE 2 · REGIÓN, CLIMA E INFRAESTRUCTURA ================= */
function mapaSVG(sel, edoSel, chico){
  const W = MAPA_MX.w, H = MAPA_MX.h;
  return `<svg class="mapa${chico?' chico':''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('Mapa de México por regiones ganaderas','Map of Mexico by cattle region')}">
    ${Object.entries(MAPA_MX.edo).map(([k,d])=>{ const rg = REGION_DE_EDO[k], R = REGIONES[rg]||{color:'#ccc'};
      return `<path d="${d}" data-edo="${k}" class="edo ${rg===sel?'sel':''} ${k===edoSel?'edosel':''}" style="--rc:${R.color}"><title>${esc(NOMBRE_EDO[k]||k)} · ${esc(tx((REGIONES[rg]||{n:''}).n))}</title></path>`; }).join('')}
    ${chico?'':Object.entries(REGIONES).map(([k,R])=>{ const cs = R.edos.map(e=>MAPA_MX.cen[e]).filter(Boolean); const x = cs.reduce((a,c)=>a+c[0],0)/cs.length, y = cs.reduce((a,c)=>a+c[1],0)/cs.length;
      return `<g class="etq ${k===sel?'sel':''}" pointer-events="none"><text x="${x.toFixed(0)}" y="${y.toFixed(0)}" text-anchor="middle">${esc(tx(R.n))}</text></g>`; }).join('')}
  </svg>`;
}
function barraITH(ith, ef){
  const X = v => Math.max(0, Math.min(100, (v-60)/(90-60)*100));
  return `<div class="ith"><div class="tramos"><i style="left:0;width:${X(75)}%" class="ok"></i><i style="left:${X(75)}%;width:${X(79)-X(75)}%" class="info"></i><i style="left:${X(79)}%;width:${X(84)-X(79)}%" class="warn"></i><i style="left:${X(84)}%;width:${100-X(84)}%" class="bad"></i></div>
    <b class="m med" style="left:${X(ith)}%" title="${T('ITH medio','Mean THI')}"></b><b class="m efe" style="left:${X(ef)}%" title="${T('ITH efectivo','Effective THI')}"></b>
    <div class="esc"><span>60</span><span style="left:${X(75)}%">75</span><span style="left:${X(79)}%">79</span><span style="left:${X(84)}%">84</span><span style="right:0">90</span></div></div>`;
}
function renderRegion(el){
  const R = REGIONES[S.region], c = S.cond, cat = CAT_ITH(c.ithEf);
  const filasT = Object.entries(TEMPORADAS).map(([k,n])=>{ const t = R.t[k], v = ITH(t[0],t[2]), cc = CAT_ITH(v);
    return `<tr class="${k===S.temporada?'tot':''}"><td>${esc(tx(n))}</td><td class="r">${t[0]}</td><td class="r">${t[1]}</td><td class="r">${t[2]}</td><td class="r"><span class="badge ${cc[0]}">${fmt(v,1)} · ${esc(tx(cc[1]))}</span></td></tr>`; }).join('');
  const sel = (id, obj, val) => `<select id="${id}">${Object.entries(obj).map(([k,o])=>`<option value="${k}" ${k===val?'selected':''}>${esc(tx(o.n))}</option>`).join('')}</select>`;
  el.innerHTML = `${cabecera('region',T('No es lo mismo formular en Sonora que en Querétaro o en Veracruz. Elige tu estado en el mapa: RatioBos carga el clima de la temporada, calcula el índice de temperatura y humedad (ITH), ajusta los precios a tu región y te dice qué cambia por la infraestructura de tus corrales.','Formulating in Sonora is not the same as in Querétaro or Veracruz. Pick your state on the map: RatioBos loads the season’s climate, computes the temperature–humidity index (THI), adjusts prices to your region and shows what changes with your pen infrastructure.'))}
  ${teoriaDe(['region','ith','infra','regional'])}
  <div class="card"><div class="mapa-wrap">
    <div>${mapaSVG(S.region, S.edo)}
      <div class="chips" style="margin-top:8px">${Object.entries(REGIONES).map(([k,r])=>`<button class="chip rchip ${k===S.region?'on':''}" data-reg="${k}" style="--rc:${r.color}"><i></i>${esc(tx(r.n))}</button>`).join('')}</div></div>
    <div class="rinfo">
      <div class="eyebrow">${S.edo?esc(NOMBRE_EDO[S.edo]):''}</div>
      <h2 style="margin:4px 0 2px">${esc(tx(R.n))}</h2><p class="muted small" style="margin:0 0 10px">${esc(R.ref)}</p>
      <dl>
        <dt>${T('Clima','Climate')}</dt><dd>${esc(tx(R.clima))}</dd>
        <dt>${T('Suelos y agua','Soils and water')}</dt><dd>${esc(tx(R.suelo))}</dd>
        <dt>${T('Razas comunes','Common breeds')}</dt><dd>${esc(tx(R.razas))}</dd>
        <dt>${T('Sistemas de producción','Production systems')}</dt><dd>${esc(tx(R.sistema))}</dd>
        <dt>${T('Insumos de la región','Regional feedstuffs')}</dt><dd>${esc(tx(R.insumos))}</dd>
        <dt>${T('Retos','Challenges')}</dt><dd>${esc(tx(R.retos))}</dd>
      </dl>
      <div class="row"><button class="btn sm" id="aplPrecios">${T('Usar precios de esta región','Use this region’s prices')}</button><button class="btn ghost sm" id="aplIngr">${T('Seleccionar sus ingredientes típicos','Select its typical ingredients')}</button></div>
      <p class="tiny muted">${T('Precios: ejemplo de octubre de 2026 × factor regional estimado (producción local, flete, frontera o puerto). Captura tus cotizaciones en el Bloque 6.','Prices: October 2026 example × estimated regional factor (local production, freight, border or port). Enter your quotes in Block 6.')}</p>
    </div></div></div>

  ${tarjetaEstudios(S.region)}
  <div class="card"><div class="row between"><h3 style="margin:0">${T('Temporada y estrés por calor','Season and heat stress')}${ayuda('ith')}</h3>
    <div class="basesw" role="group">${Object.entries(TEMPORADAS).map(([k,n])=>`<button data-temp="${k}" class="${k===S.temporada?'on':''}">${esc(tx(n)).replace(/\s*\(.*\)/,'')}</button>`).join('')}</div></div>
    <div class="grid g2" style="margin-top:12px">
      <div><div class="kpis" style="margin:0 0 10px"><div class="kpi"><div class="l">${T('ITH medio','Mean THI')}</div><div class="v">${fmt(c.ith,1)}</div><div class="s">${fmt(c.tAct,0)} °C · ${fmt(c.hr,0)} % HR</div></div>
        <div class="kpi"><div class="l">${T('ITH efectivo','Effective THI')}</div><div class="v" style="color:var(--${cat[0]==='ok'?'ok':cat[0]==='info'?'info':cat[0]==='warn'?'warn':'bad'}-text)">${fmt(c.ithEf,1)}</div><div class="s">${esc(tx(cat[1]))} · ${T('sombra y biotipo','shade and biotype')}</div></div></div>
        ${barraITH(c.ith, c.ithEf)}
        <p class="small muted">${T('El ITH efectivo descuenta lo que alivia la sombra y la adaptación del biotipo (cebú +3, cruzas +1.5). Peligro (79–83): jadeo rápido, +7 % de mantenimiento; emergencia (≥ 84): boca abierta, +18 %.','Effective THI discounts what shade and biotype adaptation relieve (zebu +3, crosses +1.5). Danger (79–83): rapid panting, +7 % maintenance; emergency (≥ 84): open mouth, +18 %.')}</p></div>
      <div class="tbl"><table><thead><tr><th>${T('Temporada','Season')}</th><th class="r">T °C</th><th class="r">${T('Máx.','Max.')} °C</th><th class="r">HR %</th><th class="r">${T('ITH medio','Mean THI')}</th></tr></thead><tbody>${filasT}</tbody></table>
      <p class="tiny muted" style="padding:0 10px">${T('Normales climatológicas aproximadas de','Approximate climate normals for')} ${esc(R.ref)}.</p></div>
    </div></div>

  <div class="card"><h3>${T('Infraestructura y sistema','Infrastructure and system')}</h3><div class="grid g4">
    <label class="f"><span>${T('Sombra','Shade')}${ayuda('sombra')}</span>${sel('i_som',SOMBRAS,c.sombra)}</label>
    <label class="f"><span>${T('Piso y drenaje del corral','Pen floor and drainage')}${ayuda('piso')}</span>${sel('i_pis',PISOS,c.piso)}</label>
    <label class="f"><span>${T('Sistema de producción','Production system')}${ayuda('sistemaP')}</span>${sel('i_sis',SISTEMAS,c.sistema)}</label>
    <label class="f"><span>${T('Sulfatos en el agua (mg/L)','Water sulfates (mg/L)')}${ayuda('sAgua')}</span><input type="number" id="i_sag" value="${c.sAgua}"></label>
  </div>
  <div class="semaf" style="margin-top:14px">${checklistInfra().map(([n,a,b])=>`<div class="${n}"><b>${a}</b><span class="muted small">${b}</span></div>`).join('')}</div></div>

  <div class="card"><h3>${T('Ambiente que usa el modelo','Environment used by the model')} <span class="muted small">(${T('se llena con la región; corrígelo con tus registros','filled from the region; correct it with your records')})</span></h3><div class="grid g4">
    <label class="f"><span>${T('Temperatura media del mes anterior (°C)','Previous month mean temperature (°C)')}${ayuda('tPrev')}</span><input type="number" id="c_tp" value="${c.tPrev}"></label>
    <label class="f"><span>${T('Temperatura media actual (°C)','Current mean temperature (°C)')}${ayuda('tAct')}</span><input type="number" id="c_ta" value="${c.tAct}"></label>
    <label class="f"><span>${T('Humedad relativa (%)','Relative humidity (%)')}${ayuda('ith')}</span><input type="number" id="c_hr" value="${c.hr}"></label>
    <label class="f"><span>${T('Jadeo','Panting')}${ayuda('jadeo')}</span><select id="c_ja"><option value="no" ${c.jadeo==='no'?'selected':''}>${T('No jadean','No panting')}</option><option value="rapido" ${c.jadeo==='rapido'?'selected':''}>${T('Jadeo rápido y superficial','Rapid shallow panting')}</option><option value="abierta" ${c.jadeo==='abierta'?'selected':''}>${T('Jadeo con boca abierta','Open-mouth panting')}</option></select></label>
    <label class="f"><span>${T('Lodo en el corral (cm)','Pen mud depth (cm)')}${ayuda('lodo')}</span><input type="number" id="c_lo" value="${c.lodo}"></label>
    <div class="f" style="font-size:14px;color:var(--muted)">${T('Noches','Nights')}${ayuda('noche')}<label class="row" style="color:var(--text);gap:8px"><input type="checkbox" id="c_no" ${c.noche?'checked':''}> ${T('Refresca por la noche (< 20 °C)','Cools down at night (< 20 °C)')}</label></div>
  </div></div>
  ${siguiente('region')}`;
  const cambiaRegion = (rg, edo) => { S.region = rg; S.edo = edo || REGIONES[rg].edos[0]; S.cond.sombra = S.cond.sombra||'lamina'; aplicarRegion(S); cargarRequerimientos(S); S.programa=null; guardar(); render(); toast(tx(REGIONES[rg].n)); };
  $$('path.edo',el).forEach(p=>p.addEventListener('click',()=>cambiaRegion(REGION_DE_EDO[p.dataset.edo], p.dataset.edo)));
  $$('[data-reg]',el).forEach(b=>b.addEventListener('click',()=>cambiaRegion(b.dataset.reg)));
  $$('[data-temp]',el).forEach(b=>b.addEventListener('click',()=>{ S.temporada=b.dataset.temp; aplicarRegion(S); cargarRequerimientos(S); S.programa=null; guardar(); render(); }));
  [['#i_som','sombra'],['#i_pis','piso'],['#i_sis','sistema']].forEach(([id,k])=>$(id,el).addEventListener('change',e=>{ S.cond[k]=e.target.value; const sAg=S.cond.sAgua; aplicarRegion(S); S.cond.sAgua=sAg; cargarRequerimientos(S); S.programa=null; guardar(); render(); }));
  $('#i_sag',el).addEventListener('change',e=>{ S.cond.sAgua=num(e.target.value)||0; cargarRequerimientos(S); guardar(); render(); });
  const set = (id,k)=>$(id,el).addEventListener('change',e=>{ S.cond[k]=num(e.target.value)??0; if(k==='tAct'||k==='hr'){ S.cond.ith=Math.round(ITH(S.cond.tAct,S.cond.hr)*10)/10; S.cond.ithEf=Math.round((S.cond.ith-SOMBRAS[S.cond.sombra].dITH-(ADAPT_ITH[S.biotipo]||0))*10)/10; } cargarRequerimientos(S); S.programa=null; guardar(); render(); });
  set('#c_tp','tPrev'); set('#c_ta','tAct'); set('#c_hr','hr'); set('#c_lo','lodo');
  $('#c_ja',el).addEventListener('change',e=>{ S.cond.jadeo=e.target.value; cargarRequerimientos(S); guardar(); render(); });
  $('#c_no',el).addEventListener('change',e=>{ S.cond.noche=e.target.checked; cargarRequerimientos(S); guardar(); render(); });
  $('#aplPrecios',el).addEventListener('click',()=>{ preciosRegion(S); S.resultado=null; S.programa=null; guardar(); toast(T('Precios regionales aplicados','Regional prices applied')); });
  $('#aplIngr',el).addEventListener('click',()=>{ ING_LIB.forEach(r=>S.sel[r[0]] = R.sel.includes(r[0])); S.resultado=null; S.programa=null; guardar(); toast(T('Ingredientes típicos seleccionados','Typical ingredients selected')); });
}
function filasEstudios(lista){
  return lista.flatMap(e=>e.filas.map((f,i)=>`<tr><td class="wrap" style="min-width:220px">${esc(tx(f[0]))}${i===0?`<br><span class="muted tiny">${esc(e.corta)} · ${esc(tx(e.lugar))}</span>`:''}</td><td class="r">${f[1]!=null?fmt(f[1],2):'—'}</td><td class="r">${f[2]!=null?fmt(f[2],2):'—'}</td></tr>`)
    .concat(e.nota?[`<tr><td colspan="3" class="wrap small muted">${esc(tx(e.nota))}</td></tr>`]:[])).join('');
}
function tarjetaEstudios(rg){
  const L = ESTUDIOS.filter(e=>e.r===rg);
  return `<div class="card"><h3>${T('Resultados publicados en esta región','Published results in this region')}${ayuda('refs')}</h3>
    ${L.length?`<div class="tbl"><table><thead><tr><th>${T('Sistema y estudio','System and study')}</th><th class="r">GDP kg/d</th><th class="r">${T('Conversión','Conversion')}</th></tr></thead><tbody>${filasEstudios(L)}</tbody></table></div>`
      :`<p class="muted small" style="margin:0">${T('Aún no hay estudios capturados para esta región. En el Tablero (Bloque 9) encontrarás los de otras regiones de México y de EUA como referencia.','No studies entered for this region yet. The Dashboard (Block 9) lists those from other Mexican regions and the US as a reference.')}</p>`}</div>`;
}
function checklistInfra(){
  const c = S.cond, eng = S.cat==='engorda', calor = c.ithEf>=75;
  return [
    [c.sombra==='ninguna'&&calor?'bad':c.sombra==='lamina'&&calor?'warn':'ok', T('Sombra','Shade'), T('2.5–4 m² por animal en clima cálido; un domo con ventiladores reduce el consumo y mejora la eficiencia (Avendaño-Reyes et al., 2025).','2.5–4 m² per head in hot climates; a dome with fans lowers intake and improves efficiency (Avendaño-Reyes et al., 2025).')],
    [c.lodo>10?'bad':c.lodo>4?'warn':'ok', T('Corral seco','Dry pen'), T('Pendiente de 3–5 %, montículos y 15–25 m² por animal en zonas secas o 30–45 m² en zonas lluviosas.','3–5 % slope, mounds and 15–25 m² per head in dry areas or 30–45 m² in rainy areas.')],
    ['info', T('Comedero','Feed bunk'), eng ? T('30–45 cm lineales por animal en finalización con dos repartos al día; 15 cm si hay alimento a libre acceso.','30–45 cm of bunk per head in finishing with two feedings a day; 15 cm with free access.') : T('45–60 cm por animal si comen al mismo tiempo (vacas y vaquillas).','45–60 cm per head when eating at once (cows and heifers).')],
    [calor?'warn':'info', T('Agua','Water'), T(`Limpia y a libre acceso: ≈ ${fmt(((S.reqInfo&&S.reqInfo.dmi)||8)*(c.tAct>25?5:3.5),0)} L por animal al día con este clima. Sulfatos > 1,000 mg/L: riesgo de polioencefalomalacia.`,`Clean and freely available: ≈ ${fmt(((S.reqInfo&&S.reqInfo.dmi)||8)*(c.tAct>25?5:3.5),0)} L per head per day in this climate. Sulfates > 1,000 mg/L: polioencephalomalacia risk.`)]
  ];
}
