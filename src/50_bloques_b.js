"use strict";
/* ================= BLOQUE 6 · FORMULACIÓN ================= */
function renderFormulacion(el){
  const sel = S.ingredientes.filter(i=>S.sel[i.id]);
  el.innerHTML = `${cabecera('formulacion',T('Presiona Formular: RatioBos busca la ración de menor costo por kg de materia seca que cubre lo que necesita tu ganado, ajusta la energía y el consumo hasta que cuadran y te dice cuánto va a ganar y cuánto cuesta cada kilo.','Press Formulate: RatioBos searches for the lowest-cost ration per kg of dry matter that covers what your cattle need, adjusts energy and intake until they match and tells you how much they will gain and what each kilo costs.'))}
  ${teoriaDe(['lp','iterativo','lectura'])}
  <div class="card"><div class="row between">
    <div class="chips">
      <span class="badge pri">${esc(tx(CATEGORIAS[S.cat].n))}</span><span class="badge pri">${esc(tx(BIOTIPOS[S.biotipo].n))}</span>
      <span class="badge pri">${fmt(S.animal.pv,0)} kg${esCrec()?' · '+fmt(S.animal.adg,2)+' kg/d':''}</span><span class="badge pri">${sel.length} ${T('ingredientes','ingredients')}</span>
      ${S.reqEditado?`<span class="badge warn">${T('requerimientos editados','edited requirements')}</span>`:''}
    </div>
    <button class="btn lg accent" id="formular">⚙ ${T('Formular','Formulate')}</button></div></div>
  <div id="res"></div>
  <div class="card">
    <h3>${T('Evaluar una fórmula existente','Evaluate an existing formula')}${ayuda('evaluar')}</h3>
    <p class="small muted" style="margin-top:0">${T('Escribe los porcentajes en base seca de una ración que ya uses (o de un artículo). La app calcula su aporte, su costo y la ganancia que permite.','Type the dry-basis percentages of a ration you already use (or from a paper). The app computes its supply, its cost and the gain it allows.')}</p>
    <div class="grid g4">${sel.map(i=>`<label class="f">${esc(tx(i.nombre))}<input data-ev="${i.id}" value="${S.evaluar[i.id]??''}" placeholder="0" inputmode="decimal"></label>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="btnEval">${T('Evaluar fórmula','Evaluate formula')}</button><button class="btn ghost sm" id="copiarOpt">${T('Copiar la fórmula óptima aquí','Copy the optimal formula here')}</button><button class="btn link" id="limpiarEv">${T('Limpiar','Clear')}</button></div>
    <div id="resEval" style="margin-top:14px"></div>
  </div>
  ${siguiente('formulacion')}`;
  $('#formular',el).addEventListener('click',()=>{ S.resultado = formular(S); guardar(); pintarResultado(); actualizarPill(); $('#res').scrollIntoView({behavior:'smooth'}); toast(S.resultado.ok?T('Ración óptima encontrada','Optimal ration found'):T('Sin solución: revisa el diagnóstico','No solution: see the diagnosis')); });
  $$('[data-ev]',el).forEach(i=>i.addEventListener('change',()=>{ S.evaluar[i.dataset.ev]=num(i.value); guardar(); }));
  $('#btnEval',el).addEventListener('click',pintarEvaluacion);
  $('#limpiarEv',el).addEventListener('click',()=>{ S.evaluar={}; guardar(); render(); });
  $('#copiarOpt',el).addEventListener('click',()=>{ if(!S.resultado||!S.resultado.ok) return; S.evaluar={}; S.resultado.formula.forEach(x=>{ if(x.pct>1e-6) S.evaluar[x.id]=+x.pct.toFixed(3); }); guardar(); render(); pintarEvaluacion(); });
  pintarResultado();
}
function tablaNutrientes(nutr, req, restr){
  return `<div class="tbl"><table><thead><tr><th>${T('Nutriente','Nutrient')}</th><th>${T('Unidad','Unit')}</th><th class="r">${T('Mín.','Min.')}</th><th class="r">${T('Máx.','Max.')}</th><th class="r">${T('Aporte','Supplied')}</th><th>${T('Estado','Status')}${ayuda('estado')}</th>${restr?`<th class="r sci">${T('Costo marginal /t MS (+1 % req.)','Marginal cost /t DM (+1 % req.)')}${ayuda('marg')}</th>`:''}</tr></thead><tbody>
  ${NUTRIENTES.map(nu=>{
    const v = nutr[nu.k], q = req[nu.k]||[null,null];
    let est=`<span class="badge ok">${T('cumple','met')}</span>`, marg='';
    const tol = x => 1e-6*Math.max(1,Math.abs(x));
    if(q[0]==null && q[1]==null) est=`<span class="muted small">${T('informativo','informative')}</span>`;
    else if(q[0]!=null && v < q[0]-tol(q[0])-1e-6) est=`<span class="badge bad">${T('bajo el mínimo','below minimum')}</span>`;
    else if(q[1]!=null && v > q[1]+tol(q[1])+1e-6) est=`<span class="badge bad">${T('sobre el máximo','above maximum')}</span>`;
    if(restr){
      const rmin = restr.find(x=>x.tag==='nmin_'+nu.k), rmax = restr.find(x=>x.tag==='nmax_'+nu.k);
      if(rmin&&rmin.activa){ est=`<span class="badge warn">${T('en el mínimo · limitante','at minimum · binding')}</span>`; marg = money(10*rmin.dual*Math.abs(rmin.req||0)); }
      else if(rmax&&rmax.activa){ est=`<span class="badge warn">${T('en el máximo · limitante','at maximum · binding')}</span>`; marg = money(10*rmax.dual*Math.abs(rmax.req||0)); }
    }
    return `<tr class="${KEYN.includes(nu.k)?'':'sci'}"><td>${esc(tx(nu.n))}${ayuda(nu.k)}</td><td class="muted">${nu.u}</td><td class="r">${q[0]!=null?fmt(q[0],nu.d):'—'}</td><td class="r">${q[1]!=null?fmt(q[1],nu.d):'—'}</td><td class="r"><b>${fmt(v,nu.d)}</b></td><td>${est}</td>${restr?`<td class="r sci">${marg}</td>`:''}</tr>`;
  }).join('')}</tbody></table></div>`;
}
function barrasCumplimiento(nutr, req){
  const ks = NUTRIENTES.filter(nu=>req[nu.k] && req[nu.k][0]!=null && req[nu.k][0]>0);
  return ks.map(nu=>{ const p = 100*nutr[nu.k]/req[nu.k][0]; const w = Math.min(p,150)/150*100;
    return `<div class="cmpbar ${KEYN.includes(nu.k)?'':'sci'}"><span>${esc(tx(nu.n)).replace(/\s*\(.*\)/,'')}</span><div class="tr"><i class="${p>115?'hi':''}" style="width:${w.toFixed(1)}%"></i><b style="left:${(100/150*100).toFixed(1)}%"></b></div><span class="p">${fmt(p,0)} %</span></div>`; }).join('');
}
/* semáforo de salud ruminal */
function semaforo(n, formula, cat){
  const urea = (formula.find(x=>x.id==='urea')||{pct:0}).pct;
  const ureaPC = n.PC>0 ? 100*urea*2.88/n.PC : 0;
  const lim = CATEGORIAS[cat].lim, fdnMin = (lim.FDNef||[0])[0]||0;
  const CaP = n.P>0 ? n.Ca/n.P : 0;
  const it = [];
  it.push([n.FDNef < fdnMin-0.5 ? 'bad' : n.FDNef < fdnMin+1 ? 'warn' : 'ok', T('Fibra efectiva','Effective fiber'), `${fmt(n.FDNef,1)} % · ${T('acidosis y timpanismo','acidosis and bloat')}`]);
  it.push([n.EE>7 ? 'bad' : n.EE>6.5 ? 'warn' : 'ok', T('Grasa total','Total fat'), `${fmt(n.EE,1)} % · ${T('digestión de la fibra','fiber digestion')}`]);
  it.push([urea>1.2 || ureaPC>35 ? 'bad' : urea>1.0 || ureaPC>25 ? 'warn' : 'ok', T('Urea','Urea'), `${fmt(urea,2)} % ${T('de la MS','of DM')} · ${fmt(ureaPC,0)} % ${T('de la PC','of CP')}`]);
  it.push([n.S>0.40 ? 'bad' : n.S>0.30 ? 'warn' : 'ok', T('Azufre','Sulfur'), `${fmt(n.S,2)} % · ${T('polioencefalomalacia (sin contar el agua)','polioencephalomalacia (excluding water)')}`]);
  it.push([n.PDRb < -5 ? 'bad' : n.PDRb < -0.5 ? 'warn' : 'ok', T('Nitrógeno para los microbios','Nitrogen for microbes'), `${fmt(n.PDRb,1)} g/kg · ${T('balance de PDR','RDP balance')}`]);
  it.push([CaP<1.2 ? 'bad' : CaP<1.5 ? 'warn' : 'ok', 'Ca : P', `${fmt(CaP,2)} : 1 · ${T('cálculos urinarios','urinary calculi')}`]);
  return `<div class="semaf">${it.map(([c,a,b])=>`<div class="${c}"><b>${c==='ok'?'●':c==='warn'?'▲':'■'} ${a}</b><span class="muted small">${b}</span></div>`).join('')}</div>`;
}
function bal(etq, req, sup, u, d=1){
  const w = req>0 ? Math.min(sup/req,1.5)/1.5*100 : 0;
  return `<div class="bal"><span>${etq}</span><div class="tr"><i style="width:${w.toFixed(1)}%"></i><b style="left:${(100/1.5).toFixed(1)}%"></b></div><span class="p">${fmt(sup,d)} / ${fmt(req,d)} ${u}</span></div>`;
}
function pintarResultado(){
  const box = $('#res'); if(!box) return;
  const r = S.resultado;
  if(!r){ box.innerHTML = `<div class="empty">${ill('i-scale')}<p>${T('Aún no hay resultado (o cambiaste algún dato). Presiona <b>Formular</b> y la balanza encontrará el equilibrio entre nutrientes y costo.','No result yet (or you changed an input). Press <b>Formulate</b> and the scale will find the balance between nutrients and cost.')}</p></div>`; return; }
  if(!r.ok){
    const d = r.diagnostico||{};
    box.innerHTML = `<div class="alert bad"><b>${T('Sin solución.','No solution.')}</b><p>${esc(r.motivo)}</p>
      ${r.animal&&r.animal.sinEnergia?`<p>${T('El consumo esperado apenas cubre el mantenimiento: baja la meta de ganancia (Bloque 3).','Expected intake barely covers maintenance: lower the gain target (Block 3).')}</p>`:''}
      ${esCrec()&&!S.reqEditado?`<p id="gmax">${T('Calculando la ganancia máxima posible…','Computing the maximum feasible gain…')}</p>`:''}
      ${d.sinFuente&&d.sinFuente.length?`<p><b>${T('Ningún ingrediente seleccionado aporta:','No selected ingredient supplies:')}</b> ${d.sinFuente.map(esc).join(', ')}.</p>`:''}
      ${d.culpables&&d.culpables.length?`<p><b>${T('Si relajas UNA de estas restricciones sí hay solución:','Relaxing ONE of these constraints gives a solution:')}</b></p><ul>${d.culpables.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`:`<p>${T('No basta con relajar una sola restricción: baja la meta de ganancia o agrega ingredientes (un grano para energía, una pasta proteica, urea, carbonato).','Relaxing a single constraint is not enough: lower the gain target or add ingredients (a grain for energy, a protein meal, urea, limestone).')}</p>`}</div>`;
    const gm = $('#gmax'); if(gm) setTimeout(()=>{ const g = gananciaMaxima(S); gm.innerHTML = g>0.11 ? `<b>${T('Con estos ingredientes y límites, la ganancia máxima posible es','With these ingredients and limits, the maximum feasible gain is')} ${fmt(Math.floor(g*100)/100,2)} kg/d.</b> <button class="btn sm" id="usarGmax">${T('Usar','Use')} ${fmt(Math.floor(g*20)/20,2)} kg/d ${T('y formular','and formulate')}</button> ${T('Para ganar más, agrega un ingrediente de más energía (maíz hojueleado, grasa).','To gain more, add a higher-energy ingredient (steam-flaked corn, fat).')}` : T('Ni con una ganancia mínima hay solución: revisa ingredientes y límites.','Not even a minimal gain is feasible: review ingredients and limits.');
      const ub = $('#usarGmax'); if(ub) ub.addEventListener('click',()=>{ S.animal.adg = Math.floor(g*20)/20; cargarRequerimientos(S); S.resultado = formular(S); guardar(); pintarResultado(); actualizarPill(); }); }, 30);
    return;
  }
  const ctx = contexto(S), crec = ctx.crec, p = r.pred, dmi = r.dmi, n = r.nutr;
  const tco = S.base==='tco';
  const nombre = x => tx((S.ingredientes.find(i=>i.id===x.id)||{nombre:x.nombre}).nombre);
  const usados = r.formula.filter(x=>x.pct>1e-6).sort((a,b)=>b.pct-a.pct);
  const noUsados = r.formula.filter(x=>x.pct<=1e-6);
  const val = x => tco ? x.pctTCO : x.pct;
  const maxPct = Math.max(...usados.map(val));
  const tcoDia = dmi*100/r.msDieta;                       // kg tal como se ofrece por animal por día
  const costoDia = dmi*r.costoKg, costoKgGan = crec && p.adg>0 ? costoDia/p.adg : null;
  const mezcla = +S.cond.mezcla||1000, cab = +S.cond.cabezas||0;
  const fijos = new Set(S.ingredientes.filter(i=>i.min>0 && i.min===i.max).map(i=>i.id));
  const limIng = r.restr.filter(x=>x.tipo==='ing' && x.activa && !fijos.has(x.id));
  const lim1 = r.restr.filter(x=>x.tipo==='nut'&&x.activa&&x.lado==='min'&&x.dual*Math.abs(x.req)>1e-9).sort((a,b)=>b.dual*Math.abs(b.req)-a.dual*Math.abs(a.req))[0];
  const entraTCO = x => (x.precioMS - x.reducido)*(x.ms||100)/100;
  const entra = noUsados.filter(x=>x.reducido>1e-6 && entraTCO(x)>0).sort((a,b)=>a.reducido/a.precioMS-b.reducido/b.precioMS).slice(0,2);
  const diasVenta = crec && p.adg>0 && S.cat!=='vaquillas' ? Math.max(0,(+(S.prog&&S.prog.venta||0) || (S.cat==='engorda'?520:320)) - S.animal.pv)/p.adg : null;
  const granja = [
    T(`La ración cuesta <b>${money(r.costoKg*1000,0)}</b> por tonelada de materia seca, es decir <b>${money(r.costoKgTCO*1000,0)}</b> por tonelada tal como se mezcla (${fmt(r.msDieta,0)} % de MS).`,`The ration costs <b>${money(r.costoKg*1000,0)}</b> per tonne of dry matter, i.e. <b>${money(r.costoKgTCO*1000,0)}</b> per tonne as mixed (${fmt(r.msDieta,0)} % DM).`),
    T(`Cada animal come unos <b>${fmt(dmi,1)} kg de materia seca</b> (${fmt(tcoDia,1)} kg tal como se ofrece) y te cuesta <b>${money(costoDia)} al día</b>.`,`Each animal eats about <b>${fmt(dmi,1)} kg of dry matter</b> (${fmt(tcoDia,1)} kg as fed) and costs you <b>${money(costoDia)} per day</b>.`),
    crec ? T(`Con esta ración se espera una ganancia de <b>${fmt(p.adg,2)} kg/d</b>${ctx.adg?` (tu meta: ${fmt(ctx.adg,2)})`:''}; cada kilo ganado cuesta <b>${money(costoKgGan)}</b> de alimento${S.cond.ventakg?(costoKgGan<S.cond.ventakg?T(`, menos que tu precio de venta de ${money(S.cond.ventakg)}/kg ✓`,`, below your sale price of ${money(S.cond.ventakg)}/kg ✓`):T(`, más que tu precio de venta de ${money(S.cond.ventakg)}/kg: revisa la meta o los precios`,`, above your sale price of ${money(S.cond.ventakg)}/kg: review the target or prices`)):''}.`,`This ration is expected to give <b>${fmt(p.adg,2)} kg/d</b>${ctx.adg?` (your target: ${fmt(ctx.adg,2)})`:''}; each kilo gained costs <b>${money(costoKgGan)}</b> in feed${S.cond.ventakg?(costoKgGan<S.cond.ventakg?`, below your sale price of ${money(S.cond.ventakg)}/kg ✓`:`, above your sale price of ${money(S.cond.ventakg)}/kg: review the target or prices`):''}.`)
         : T(`El balance de energía es de <b>${fmt(p.balE,1)} Mcal/d</b>: la vaca ${p.balE>=-0.2?'mantiene o gana condición':'pierde ≈ '+fmt(-p.cambioPV,2)+' kg/d de peso; sube la energía'}.`,`Energy balance is <b>${fmt(p.balE,1)} Mcal/d</b>: the cow ${p.balE>=-0.2?'keeps or gains condition':'loses ≈ '+fmt(-p.cambioPV,2)+' kg/d; raise energy'}.`),
    diasVenta ? T(`A ese ritmo, llegar al peso de venta toma unos <b>${fmt(diasVenta,0)} días</b> (calcúlalo fino en el Programa).`,`At that rate, reaching sale weight takes about <b>${fmt(diasVenta,0)} days</b> (refine it in the Program).`) : '',
    cab ? T(`Para tus ${fmt(cab,0)} animales prepara <b>${fmt(cab*tcoDia,0)} kg</b> de mezcla al día (${fmt(cab*tcoDia/mezcla,1)} cargas del carro de ${fmt(mezcla,0)} kg).`,`For your ${fmt(cab,0)} head prepare <b>${fmt(cab*tcoDia,0)} kg</b> of mix per day (${fmt(cab*tcoDia/mezcla,1)} loads of the ${fmt(mezcla,0)} kg wagon).`) : '',
    lim1 ? T(`Lo que más encarece esta ración es cubrir la <b>${esc(minus(tx(NUT[lim1.k].n)))}</b>.`,`What makes this ration most expensive is meeting <b>${esc(minus(tx(NUT[lim1.k].n)))}</b>.`) : '',
    crec && p.limita==='proteina' ? T('La ganancia la limita la <b>proteína</b>, no la energía: revisa la proteína metabolizable.','Gain is limited by <b>protein</b>, not energy: check metabolizable protein.') : '',
    ...entra.map(x=>T(`Si consigues <b>${esc(nombre(x))}</b> a ${money(entraTCO(x))} por kg o menos, vuelve a formular: empezaría a convenirte.`,`If you can buy <b>${esc(nombre(x))}</b> at ${money(entraTCO(x))} per kg or less, reformulate: it would start to pay off.`))
  ].filter(Boolean);
  const kpis = crec ? [
    [T('Costo por t de MS','Cost per t DM'), money(r.costoKg*1000,0), T('TCO: ','AF: ')+money(r.costoKgTCO*1000,0)+'/t','costoMS'],
    [T('Costo por animal al día','Cost per head per day'), money(costoDia), fmt(dmi,2)+' kg MS · '+fmt(tcoDia,1)+' kg TCO','costoDia'],
    [T('Ganancia esperada','Expected gain'), fmt(p.adg,2)+' kg/d', T('meta ','target ')+fmt(ctx.adg,2)+' · '+T('limita: ','limit: ')+(p.limita==='energia'?T('energía','energy'):T('proteína','protein')),'adgPred'],
    [T('Costo de alimento / kg ganado','Feed cost / kg gained'), costoKgGan?money(costoKgGan):'—', T('conversión ','feed:gain ')+(p.adg>0?fmt(dmi/p.adg,2):'—'),'costoKgGan']
  ] : [
    [T('Costo por t de MS','Cost per t DM'), money(r.costoKg*1000,0), T('TCO: ','AF: ')+money(r.costoKgTCO*1000,0)+'/t','costoMS'],
    [T('Costo por vaca al día','Cost per cow per day'), money(costoDia), fmt(dmi,2)+' kg MS · '+fmt(tcoDia,1)+' kg TCO','costoDia'],
    [T('Balance de energía','Energy balance'), (p.balE>=0?'+':'')+fmt(p.balE,2)+' Mcal/d', T('≈ ','≈ ')+fmt(p.cambioPV,2)+' kg/d '+T('de peso','of weight'),'balE'],
    [T('Balance de proteína metabolizable','MP balance'), (p.balPM>=0?'+':'')+fmt(p.balPM,0)+' g/d', fmt(p.mpSup,0)+' / '+fmt(p.mpReq,0)+' g/d','balPM']
  ];
  const req = r.contexto.req;
  box.innerHTML = `
  <div class="alert ok prod"><b>${T('✓ Esta es la ración más barata posible','✓ This is the cheapest possible ration')}</b> ${T('con tus ingredientes y tus precios, y cubre lo que tu ganado necesita para la meta que fijaste.','with your ingredients and prices, and it covers what your cattle need for the target you set.')}</div>
  <div class="alert sci ${r.cert.ok?'ok':'warn'}"><b>${r.cert.ok?T('✓ Solución óptima certificada.','✓ Certified optimal solution.'):T('Solución encontrada.','Solution found.')}</b> ${usados.length} ${T('ingredientes.','ingredients.')} ${T('Dualidad fuerte','Strong duality')}: ${T('brecha','gap')} ${r.cert.brecha.toExponential(1)}; ${T('violación','violation')} ${r.cert.viol.toExponential(1)}. ${r.iter.length?(r.convergio?T(`Energía y consumo convergieron en ${r.iter.length} iteraciones.`,`Energy and intake converged in ${r.iter.length} iterations.`):T('El ajuste iterativo no convergió del todo; revisa la meta.','The iterative adjustment did not fully converge; check the target.')):T('Requerimientos fijos (editados).','Fixed (edited) requirements.')}${ayuda('cert')}</div>
  <div class="kpis">${kpis.map(k=>`<div class="kpi"><div class="l">${k[0]}${ayuda(k[3])}</div><div class="v">${k[1]}</div><div class="s">${k[2]}</div></div>`).join('')}</div>

  <div class="card prod"><h3>${T('Qué significa para tu rancho','What it means for your ranch')}</h3><ul class="granja">${granja.map(t=>`<li>${t}</li>`).join('')}</ul></div>
  <div class="card prod hoja-mezcla"><div class="row between"><h3 style="margin:0">${T('Hoja de mezclado','Mixing sheet')} · ${T('carga de','load of')} ${fmt(mezcla,0)} kg ${T('tal como se ofrece','as fed')}${ayuda('mezcla')}</h3><button class="btn ghost sm no-print" id="impMezcla" onclick="document.body.classList.add('solo-mezcla');window.print();document.body.classList.remove('solo-mezcla')">🖨 ${T('Imprimir','Print')}</button></div>
    <p class="small muted" style="margin:6px 0 0">${T('Kilos húmedos, en el orden de carga sugerido: primero forrajes y ensilajes, luego granos y pastas, al final los ingredientes pequeños premezclados. Mezcla 4–6 minutos después de la última carga.','Wet kilos, in the suggested loading order: forages and silages first, then grains and meals, and pre-mixed small ingredients last. Mix 4–6 minutes after the last load.')}</p>
    <div class="mezcla">${[...usados].sort((a,b)=>ordenCarga(a)-ordenCarga(b)).map(x=>{ const kg=x.pctTCO/100*mezcla; return `<label><span><input type="checkbox">${esc(nombre(x))}</span><b>${fmt(kg, kg<1?3:(kg<10?2:1))} kg</b></label>`; }).join('')}</div>
    <p class="small muted" style="margin:0">Total: <b>${fmt(mezcla,0)} kg</b> · ${T('costo de la carga','load cost')}: <b>${money(r.costoKgTCO*mezcla)}</b>${cab?` · ${T('alcanza para','feeds')} ${fmt(mezcla/tcoDia,0)} ${T('animales-día','head-days')}`:''}</p></div>

  <div class="card"><div class="row between"><h3 style="margin:0">${T('Fórmula','Formula')}</h3><div class="basesw" role="group" aria-label="${T('Base','Basis')}"><button data-base="ms" class="${tco?'':'on'}">${T('Materia seca','Dry matter')}</button><button data-base="tco" class="${tco?'on':''}">${T('Tal como se ofrece','As fed')}</button></div></div>
    <div class="chart-wrap" style="margin:14px 0">${dona(usados.map(x=>({n:nombre(x),v:val(x)})))}
      <div class="legend">${usados.slice(0,12).map((x,i)=>`<span><i style="background:${PALETA[i%PALETA.length]}"></i>${esc(nombre(x))} · <b>${fmt(val(x),2)} %</b></span>`).join('')}</div></div>
    <div class="tbl"><table>
    <thead><tr><th>${T('Ingrediente','Ingredient')}</th><th class="r">% MS</th><th class="r">% ${T('TCO','AF')}</th><th style="width:18%"></th><th class="r">kg MS/${T('animal/d','head/d')}</th><th class="r">kg ${T('TCO','AF')}/${T('animal/d','head/d')}</th><th class="r">${esc(S.moneda)}/kg ${T('TCO','AF')}</th><th class="r">${T('Aporte al costo','Cost share')} ${esc(S.moneda)}/t MS</th></tr></thead>
    <tbody>${usados.map(x=>`<tr><td>${esc(nombre(x))}</td><td class="r"><b>${fmt(x.pct,2)}</b></td><td class="r">${fmt(x.pctTCO,2)}</td><td><div class="bar-h" style="width:${(val(x)/maxPct*100).toFixed(1)}%"></div></td><td class="r">${fmt(x.pct/100*dmi,3)}</td><td class="r">${fmt(x.pctTCO/100*tcoDia,3)}</td><td class="r">${fmt(x.precio,2)}</td><td class="r">${fmt(x.pct*x.precioMS*10,0)}</td></tr>`).join('')}
    <tr class="tot"><td>Total</td><td class="r">${fmt(100,2)}</td><td class="r">${fmt(100,2)}</td><td></td><td class="r">${fmt(dmi,2)}</td><td class="r">${fmt(tcoDia,2)}</td><td></td><td class="r">${fmt(r.costoKg*1000,0)}</td></tr></tbody></table></div>
    <p class="small muted">${T('Materia seca de la mezcla','Mix dry matter')}: <b>${fmt(r.msDieta,1)} %</b>. ${T('Forraje : concentrado','Forage : concentrate')} = <b>${fmt(n.For,0)} : ${fmt(100-n.For,0)}</b>${ayuda('forcon')}</p></div>

  <div class="card"><h3>${T('Energía y proteína del día','Daily energy and protein')}</h3>
    ${crec ? `${bal(T('Energía para ganar (ENg)','Energy for gain (NEg)'), r.animal.d.re, p.reDisp, 'Mcal/d', 2)}
      ${bal(T('Proteína metabolizable','Metabolizable protein'), p.mpReq, p.mpSup, 'g/d', 0)}
      <p class="small muted">${T('Alimento que se va en mantenimiento','Feed spent on maintenance')}: <b>${fmt(p.fm,2)} kg MS/d</b> · ${T('para ganar','for gain')}: <b>${fmt(p.fg,2)} kg MS/d</b>.</p>
      <div class="kpis sci" style="margin:10px 0 0"><div class="kpi"><div class="l">${T('Ganancia permitida por la energía','Energy-allowable gain')}</div><div class="v">${fmt(p.adgEM,2)} kg/d</div></div><div class="kpi"><div class="l">${T('Ganancia permitida por la proteína','Protein-allowable gain')}</div><div class="v">${fmt(p.adgPM,2)} kg/d</div></div></div>`
    : `${bal(T('Energía (ENm equivalente)','Energy (NEm equivalent)'), p.neReq, p.neSup, 'Mcal/d', 1)}${bal(T('Proteína metabolizable','Metabolizable protein'), p.mpReq, p.mpSup, 'g/d', 0)}`}
  </div>

  <div class="card"><h3>${T('Salud ruminal','Rumen health')}${ayuda('acidosis')}</h3>${semaforo(n, r.formula, S.cat)}</div>
  <div class="card"><h3>${T('Huella ambiental','Environmental footprint')}</h3><div class="eco">
    <div class="e">${ill('i-gas')}<div><div class="v">${fmt(p.ch4,0)} g/d</div><div class="l">${T('metano entérico','enteric methane')} · Ym ${fmt(p.ym,1)} %${ayuda('ch4')}</div></div></div>
    ${crec&&p.adg>0?`<div class="e">${ill('i-gas')}<div><div class="v">${fmt(p.ch4/p.adg,0)} g/kg</div><div class="l">${T('CH₄ por kg de ganancia','CH₄ per kg of gain')}</div></div></div>`:''}
    <div class="e">${ill('i-grass')}<div><div class="v">${fmt(p.nExc,0)} g N/d</div><div class="l">${T('nitrógeno excretado','excreted nitrogen')} · ${fmt(p.nIng>0?100*p.nRet/p.nIng:0,0)} % ${T('retenido','retained')}${ayuda('nExc')}</div></div></div>
  </div></div>

  <div class="card"><h3>${T('Aporte frente al requerimiento','Supply versus requirement')}${ayuda('cumpl')}</h3><p class="small muted" style="margin-top:0">${T('La línea vertical marca el 100 % del mínimo por kg de MS.','The vertical line marks 100 % of the minimum per kg DM.')}</p>${barrasCumplimiento(n, req)}</div>
  <div class="card"><h3>${T('Aporte nutricional por kg de materia seca','Nutrient supply per kg of dry matter')}</h3>${tablaNutrientes(n, req, r.restr)}</div>

  <div class="card"><h3><span class="sci">${T('Análisis de sensibilidad','Sensitivity analysis')}</span><span class="prod">${T('¿Qué ingredientes conviene vigilar?','Which ingredients are worth watching?')}</span></h3><div class="grid g2">
    <div><h4 style="margin-top:0">${T('Ingredientes no usados · precio de entrada','Unused ingredients · entry price')}${ayuda('entrada')}</h4>
    ${noUsados.length?`<div class="tbl"><table><thead><tr><th>${T('Ingrediente','Ingredient')}</th><th class="r">${T('Precio actual','Current price')}</th><th class="r">${T('Entraría a','Would enter at')}</th></tr></thead><tbody>
    ${noUsados.map(x=>`<tr><td>${esc(nombre(x))}</td><td class="r">${fmt(x.precio,2)}</td><td class="r">${x.reducido>1e-6&&entraTCO(x)>0?'≤ '+fmt(entraTCO(x),2):'—'}</td></tr>`).join('')}</tbody></table></div><p class="tiny muted">${T('Precios por kg tal como se ofrece.','Prices per kg as fed.')}</p>`:`<p class="muted small">${T('Todos los ingredientes seleccionados entraron a la fórmula.','All selected ingredients entered the formula.')}</p>`}</div>
    <div class="sci"><h4 style="margin-top:0">${T('Ingredientes en su límite de inclusión','Ingredients at their inclusion limit')}${ayuda('limEf')}</h4>
    ${limIng.length?`<div class="tbl"><table><thead><tr><th>${T('Límite','Limit')}</th><th class="r">${T('Efecto de +1 % /t MS','Effect of +1 % /t DM')}</th></tr></thead><tbody>
    ${limIng.map(x=>`<tr><td>${esc(x.etiqueta)}</td><td class="r">${money(10*x.dual)}</td></tr>`).join('')}</tbody></table></div>`:`<p class="muted small">${T('Ningún ingrediente quedó topado en su límite.','No ingredient hit its limit.')}</p>`}</div>
  </div></div>

  <div class="card sci"><h3>${T('Modelo matemático y reproducibilidad','Mathematical model and reproducibility')}${ayuda('cert')}</h3>
    <div class="modelo">min&nbsp; <i>Z</i> = Σ<sub><i>i</i></sub> (<i>p<sub>i</sub></i> / <i>MS<sub>i</sub></i>) <i>x<sub>i</sub></i><br>
      s.&nbsp;a.&nbsp; Σ<sub><i>i</i></sub> <i>x<sub>i</sub></i> = 100 &nbsp;·&nbsp; Σ<sub><i>i</i></sub> <i>a<sub>ij</sub></i> <i>x<sub>i</sub></i> ≥ 100·(<i>b<sub>j</sub></i><sup>min</sup> − <i>k<sub>j</sub></i>/CMS) &nbsp;·&nbsp; Σ<sub><i>i</i></sub> <i>a<sub>ij</sub></i> <i>x<sub>i</sub></i> ≤ 100·<i>b<sub>j</sub></i><sup>max</sup><br>
      <i>a</i><sub>PM,i</sub> = 0.64·0.087·TND<sub><i>i</i></sub>·10 + 0.80·PNDR<sub><i>i</i></sub> &nbsp;·&nbsp; <i>a</i><sub>PDRb,i</sub> = PDR<sub><i>i</i></sub> − 0.087·TND<sub><i>i</i></sub>·10 &nbsp;·&nbsp; <i>k</i><sub>PM</sub> = 0.64·42.73, <i>k</i><sub>PDRb</sub> = −42.73<br>
      ENg<sub>req</sub> = ER / (CMS − ENm<sub>mant</sub>/ENm<sub>dieta</sub>) &nbsp;⟳&nbsp; ${T('hasta','until')} |ΔENm| &lt; 0.002</div>
    <p class="small muted">${T('<i>x<sub>i</sub></i>: % del ingrediente en la MS; <i>p<sub>i</sub></i>: precio tal como se ofrece; <i>a<sub>ij</sub></i>: aporte por kg de MS; <i>b<sub>j</sub></i>: requerimiento por kg de MS; CMS: consumo de MS. Símplex de dos fases (regla de Bland); optimalidad verificada por dualidad fuerte en cada iteración.','<i>x<sub>i</sub></i>: % of ingredient in DM; <i>p<sub>i</sub></i>: as-fed price; <i>a<sub>ij</sub></i>: supply per kg DM; <i>b<sub>j</sub></i>: requirement per kg DM; DMI: dry-matter intake. Two-phase simplex (Bland’s rule); optimality verified by strong duality at every iteration.')}</p>
    <div class="kpis">
      <div class="kpi"><div class="l">${T('Variables','Variables')}</div><div class="v">${r.modelo.n}</div><div class="s">${T('ingredientes','ingredients')}</div></div>
      <div class="kpi"><div class="l">${T('Restricciones','Constraints')}</div><div class="v">${r.modelo.m}</div><div class="s">${r.restr.filter(x=>x.activa).length} ${T('activas','binding')}</div></div>
      <div class="kpi"><div class="l">${T('Pivoteos símplex','Simplex pivots')}</div><div class="v">${r.modelo.piv}</div><div class="s">${T('última iteración','last iteration')}</div></div>
      <div class="kpi"><div class="l">${T('Brecha primal–dual','Primal–dual gap')}</div><div class="v" style="font-size:20px">${r.cert.brecha.toExponential(1)}</div><div class="s">${T('violación','violation')} ${r.cert.viol.toExponential(1)}</div></div>
    </div>
    ${r.iter.length?`<h4>${T('Ajuste iterativo de energía y consumo','Iterative energy and intake adjustment')}${ayuda('iter')}</h4><div class="tbl iter"><table><thead><tr><th>#</th><th class="r">${T('ENm supuesta','Assumed NEm')}</th><th class="r">CMS kg/d</th><th class="r">${crec?T('ENg requerida','Required NEg'):T('ENm requerida','Required NEm')}</th><th class="r">${T('ENm de la dieta','Diet NEm')}</th><th class="r">${esc(S.moneda)}/t MS</th></tr></thead><tbody>
      ${r.iter.map(x=>`<tr><td>${x.it}</td><td class="r">${fmt(x.nem,4)}</td><td class="r">${fmt(x.dmi,3)}</td><td class="r">${fmt(crec?x.neg:x.nemReq,4)}</td><td class="r">${x.nemDieta!=null?fmt(x.nemDieta,4):'—'}</td><td class="r">${x.costo!=null?fmt(x.costo*1000,1):'—'}</td></tr>`).join('')}</tbody></table></div>`:''}
    <div class="grid g2" style="margin-top:12px">
      <div><h4 style="margin-top:0">${T('Precios sombra (restricciones activas)','Shadow prices (binding constraints)')}${ayuda('marg')}</h4>
      <div class="tbl"><table><thead><tr><th>${T('Restricción','Constraint')}</th><th class="r">∂Z/∂b · ${esc(S.moneda)}/t MS</th></tr></thead><tbody>
      ${r.restr.filter(x=>x.activa && x.tipo!=='suma').map(x=>`<tr><td>${esc(x.etiqueta)}</td><td class="r">${fmt(Math.abs(x.dual)<1e-9?0:(x.tipo==='nut'?1000*x.dual:10*x.dual), 3)}</td></tr>`).join('') || `<tr><td colspan="2" class="muted">—</td></tr>`}</tbody></table></div>
      <p class="tiny muted">${T('Nutrientes: cambio del costo por t de MS por unidad del requerimiento. Ingredientes: por 1 punto % del límite.','Nutrients: change in cost per t DM per unit of requirement. Ingredients: per 1 % point of the limit.')}</p></div>
      <div><h4 style="margin-top:0">${T('Costos reducidos','Reduced costs')}${ayuda('entrada')}</h4>
      <div class="tbl"><table><thead><tr><th>${T('Ingrediente','Ingredient')}</th><th class="r">x (% MS)</th><th class="r">d · ${esc(S.moneda)}/t MS</th></tr></thead><tbody>
      ${r.formula.map(x=>`<tr><td>${esc(nombre(x))}</td><td class="r">${fmt(x.pct,3)}</td><td class="r">${fmt(10*(x.reducido||0),3)}</td></tr>`).join('')}</tbody></table></div></div>
    </div>
    <div class="row" style="margin-top:6px"><button class="btn ghost sm" id="jsonModelo">⬇ ${T('Modelo y solución (JSON)','Model and solution (JSON)')}</button><span class="small muted">${T('Incluye animal, matriz, precios, límites, requerimientos, iteraciones y solución.','Includes animal, matrix, prices, limits, requirements, iterations and solution.')}</span></div>
  </div>`;
  $$('[data-base]',box).forEach(b=>b.addEventListener('click',()=>{ S.base=b.dataset.base; guardar(); pintarResultado(); }));
  const jb = $('#jsonModelo'); if(jb) jb.addEventListener('click',()=>{
    const sel = S.ingredientes.filter(i=>S.sel[i.id]).map(i=>({id:i.id, nombre:tx(i.nombre), cat:i.cat, precio:i.precio, min:i.min, max:i.max, comp:i.comp}));
    descargar(slug()+'_modelo.json', JSON.stringify({software:CONFIG.app+' '+CONFIG.version, doi:CONFIG.doi||null, fecha:r.fecha, animal:{categoria:S.cat, biotipo:S.biotipo, sexo:S.sexo, datos:S.animal, condiciones:S.cond}, consumoMS:r.dmi, requerimientos:r.contexto.req, diarios:r.animal.d, iteraciones:r.iter, ingredientes:sel, solucion:{costoKgMS:r.costoKg, costoKgTCO:r.costoKgTCO, msDieta:r.msDieta, formula:r.formula, nutrientes:r.nutr, prediccion:r.pred, restricciones:r.restr, certificado:r.cert, modelo:r.modelo}}, null, 1), 'application/json');
  });
}
function ordenCarga(x){ return ({for:1, ens:2, gra:3, sub:4, pro:5, gras:6, nnp:7, min:8, adi:9, per:5})[x.cat]||5; }
function pintarEvaluacion(){
  const box = $('#resEval'); if(!box) return;
  const ctx = contexto(S);
  const dmi0 = S.resultado&&S.resultado.ok ? S.resultado.dmi : (S.reqInfo&&S.reqInfo.dmi) || 8;
  let a = analizar(S.evaluar, S.ingredientes, dmi0);
  if(!a.suma){ box.innerHTML=`<div class="alert warn">${T('Escribe al menos un porcentaje.','Enter at least one percentage.')}</div>`; return; }
  const dmi = ctx.dmiFijo || dmiPredicho(ctx, a.nutr.NEm);
  a = analizar(S.evaluar, S.ingredientes, dmi);
  const p = prediccion(ctx, a.nutr, dmi), req = S.resultado&&S.resultado.ok ? S.resultado.contexto.req : S.req;
  box.innerHTML = `${Math.abs(a.suma-100)>0.01?`<div class="alert warn">${T('La fórmula suma','The formula adds up to')} <b>${fmt(a.suma,3)} %</b>${T(', no 100 %. El aporte se calcula tal cual.',', not 100 %. Supply is computed as is.')}</div>`:''}
    <div class="kpis"><div class="kpi"><div class="l">${T('Costo por t de MS','Cost per t DM')}</div><div class="v">${money(a.costoKg*1000,0)}</div><div class="s">${T('con tus precios','with your prices')}</div></div>
    ${S.resultado&&S.resultado.ok?`<div class="kpi"><div class="l">${T('Diferencia vs. fórmula óptima','Difference vs. optimal formula')}</div><div class="v">${money((a.costoKg-S.resultado.costoKg)*1000,0)}</div><div class="s">${T('por t de MS','per t DM')}</div></div>`:''}
    ${ctx.crec?`<div class="kpi"><div class="l">${T('Ganancia que permite','Gain it allows')}</div><div class="v">${fmt(p.adg,2)} kg/d</div><div class="s">${T('con','at')} ${fmt(dmi,2)} kg MS/d</div></div><div class="kpi"><div class="l">${T('Costo / kg ganado','Cost / kg gained')}</div><div class="v">${p.adg>0?money(a.costoKg*dmi/p.adg):'—'}</div></div>`:`<div class="kpi"><div class="l">${T('Balance de energía','Energy balance')}</div><div class="v">${fmt(p.balE,2)} Mcal/d</div></div>`}</div>
    ${tablaNutrientes(a.nutr, req, null)}`;
}

/* ================= BLOQUE 7 · PROGRAMA ================= */
function asegurarProg(){
  if(!S.prog || S.prog.cat!==S.cat){ const f = fasesPrograma(S); S.prog = {cat:S.cat, fases:f, venta: f.length && f[f.length-1].hasta || null, destete:200}; }
}
function renderPrograma(el){
  asegurarProg();
  const crec = esCrec(), P = S.prog;
  const tabla = crec
    ? `<div class="tbl"><table><thead><tr><th>${T('Fase','Phase')}</th><th class="r">${T('Hasta (kg)','Up to (kg)')}</th><th class="r">${T('Meta de ganancia (kg/d)','Gain target (kg/d)')}</th><th class="r">${T('Forraje mín. %','Forage min. %')}</th><th class="r">${T('Forraje máx. %','Forage max. %')}</th></tr></thead><tbody>
      ${P.fases.map((f,i)=>`<tr><td>${esc(tx(f.n))}</td><td class="r"><input class="num" data-pf="${i}" data-k="hasta" value="${f.hasta}"></td><td class="r"><input class="num" data-pf="${i}" data-k="adg" value="${f.adg}"></td><td class="r"><input class="num" data-pf="${i}" data-k="f0" value="${f.For[0]}"></td><td class="r"><input class="num" data-pf="${i}" data-k="f1" value="${f.For[1]}"></td></tr>`).join('')}</tbody></table></div>`
    : `<div class="tbl"><table><thead><tr><th>${T('Etapa del ciclo','Cycle stage')}</th><th class="r">${T('Días','Days')}</th><th class="r">${T('Día de gestación','Day of pregnancy')}</th><th class="r">${T('Leche kg/d','Milk kg/d')}</th></tr></thead><tbody>
      ${P.fases.map((f,i)=>`<tr><td>${esc(tx(f.n))}</td><td class="r"><input class="num" data-pf="${i}" data-k="dias" value="${f.dias}"></td><td class="r">${f.cat==='gestacion'?`<input class="num" data-pf="${i}" data-k="t" value="${f.t}">`:'—'}</td><td class="r">${f.cat==='lactacion'?`<input class="num" data-pf="${i}" data-k="leche" value="${f.leche}">`:'—'}</td></tr>`).join('')}</tbody></table></div>`;
  el.innerHTML = `${cabecera('programa',crec?T('Simula toda la estancia en el corral: RatioBos formula una ración para cada fase y hace crecer al animal día a día con la ganancia que esa ración permite. Obtienes los días en corral, el alimento total, el costo por kg ganado y la utilidad por cabeza.','Simulates the whole stay in the pen: RatioBos formulates a ration for each phase and grows the animal day by day at the gain that ration allows. You get days on feed, total feed, cost per kg gained and profit per head.'):T('Formula el ciclo anual de la vaca de cría en cuatro etapas y obtén su costo de alimentación por año y por kg de becerro destetado.','Formulate the beef cow’s annual cycle in four stages and get its feed cost per year and per kg of weaned calf.'))}
  ${teoriaDe(['programa'])}
  <div class="card">
    <div class="row between"><div class="chips"><span class="badge pri">${esc(etiquetaAnimal())}</span>${crec?`<span class="badge pri">${T('Entrada','Entry')}: ${fmt(S.animal.pv,0)} kg</span>`:''}</div>
    <button class="btn lg accent" id="btnProg">⚙ ${T('Formular el programa','Formulate the program')}</button></div>
    <div style="margin-top:12px">${tabla}</div>
    <div class="grid g4" style="margin-top:12px">
      ${crec?`<label class="f"><span>${T('Peso de venta (kg)','Sale weight (kg)')}${ayuda('dof')}</span><input id="pVenta" value="${P.venta}"></label>`:`<label class="f"><span>${T('Peso del becerro al destete (kg)','Calf weaning weight (kg)')}${ayuda('costoVaca')}</span><input id="pDestete" value="${P.destete}"></label>`}
      <div class="f"><span class="small muted">${T('Los demás límites (fibra efectiva, grasa, azufre) son los del tipo de animal.','Other limits (effective fiber, fat, sulfur) are those of the animal type.')}</span><button class="btn link" id="pReset" style="justify-content:flex-start">↺ ${T('Fases sugeridas','Suggested phases')}</button></div>
    </div>
  </div>
  <div id="resProg"></div>
  ${siguiente('programa')}`;
  $$('[data-pf]',el).forEach(i=>i.addEventListener('change',()=>{ const f=P.fases[+i.dataset.pf], k=i.dataset.k, v=num(i.value);
    if(k==='f0') f.For[0]=v??0; else if(k==='f1') f.For[1]=v; else f[k]=v??f[k];
    if(crec && i.dataset.pf==P.fases.length-1 && k==='hasta') P.venta=f.hasta; S.programa=null; guardar(); }));
  const pv = $('#pVenta',el); if(pv) pv.addEventListener('change',()=>{ P.venta=num(pv.value)||P.venta; P.fases[P.fases.length-1].hasta=P.venta; S.programa=null; guardar(); render(); });
  const pd = $('#pDestete',el); if(pd) pd.addEventListener('change',()=>{ P.destete=num(pd.value)||P.destete; guardar(); pintarPrograma(); });
  $('#pReset',el).addEventListener('click',()=>{ S.prog=null; S.programa=null; guardar(); render(); });
  $('#btnProg',el).addEventListener('click',()=>{ S.programa = formularPrograma(S); guardar(); pintarPrograma(); toast(T('Programa formulado','Program formulated')); });
  pintarPrograma();
}
function curvaSVG(curva, fases){
  if(curva.length<2) return '';
  const W=640, H=260, m={l:52,r:16,t:14,b:34};
  const xs=curva.map(p=>p[0]), ys=curva.map(p=>p[1]);
  const x0=0, x1=Math.max(...xs), y0=Math.floor(Math.min(...ys)/50)*50, y1=Math.ceil(Math.max(...ys)/50)*50;
  const X = v => m.l + (v-x0)/(x1-x0||1)*(W-m.l-m.r), Y = v => H-m.b - (v-y0)/(y1-y0||1)*(H-m.t-m.b);
  const pts = curva.map(p=>`${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
  const yt = []; for(let v=y0; v<=y1; v+=50) yt.push(v);
  const xt = []; const pasoX = x1>200?30:x1>90?15:7; for(let v=0; v<=x1; v+=pasoX) xt.push(v);
  let acc=0; const cortes = fases.slice(0,-1).map(f=>{ acc+=f.dias; return acc; });
  return `<div class="curva"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('Curva de crecimiento','Growth curve')}">
    ${yt.map(v=>`<line class="rej" x1="${m.l}" x2="${W-m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l-8}" y="${Y(v)+4}" text-anchor="end">${v}</text>`).join('')}
    ${xt.map(v=>`<text x="${X(v)}" y="${H-m.b+18}" text-anchor="middle">${v}</text>`).join('')}
    ${cortes.map(d=>`<line class="fase" x1="${X(d)}" x2="${X(d)}" y1="${m.t}" y2="${H-m.b}"/>`).join('')}
    <polygon class="area" points="${X(curva[0][0])},${H-m.b} ${pts} ${X(curva[curva.length-1][0])},${H-m.b}"/>
    <polyline class="lin" points="${pts}"/>
    <line class="eje" x1="${m.l}" x2="${W-m.r}" y1="${H-m.b}" y2="${H-m.b}"/>
    <text x="${(W+m.l)/2}" y="${H-4}" text-anchor="middle">${T('días en corral','days on feed')}</text>
    <text x="14" y="${(H-m.b)/2}" text-anchor="middle" transform="rotate(-90 14 ${(H-m.b)/2})">kg</text></svg></div>`;
}
function pintarPrograma(){
  const box = $('#resProg'); if(!box) return;
  const P = S.programa;
  if(!P){ box.innerHTML=`<div class="empty">${ill('i-calendar')}<p>${T('Presiona <b>Formular el programa</b> para ver los días, el costo total y la utilidad.','Press <b>Formulate the program</b> to see days, total cost and profit.')}</p></div>`; return; }
  const nombre = id => tx((S.ingredientes.find(i=>i.id===id)||{nombre:id}).nombre);
  const ok = P.fases.filter(f=>f.r.ok), fallas = P.fases.filter(f=>!f.r.ok);
  const ids = [...new Set(ok.flatMap(f=>f.r.formula.filter(x=>x.pct>1e-6).map(x=>x.id)))];
  const pct = (f,id)=>{ const x=f.r.formula.find(y=>y.id===id); return x?x.pct:0; };
  let html = fallas.length?`<div class="alert bad"><b>${fallas.length} ${T('fase(s) sin solución:','phase(s) without solution:')}</b> ${fallas.map(f=>esc(tx(f.f.n))).join(', ')}. ${fallas.map(f=>f.r.diagnostico&&f.r.diagnostico.culpables.length?`${T('Basta relajar:','It is enough to relax:')} ${f.r.diagnostico.culpables.slice(0,3).map(esc).join('; ')}.`:T('Baja la meta de ganancia o agrega ingredientes.','Lower the gain target or add ingredients.')).join(' ')}</div>`:'';
  if(P.crec && ok.length===P.fases.length){
    const gan = P.pvF-P.pvI, compra = P.pvI*S.cond.comprakg, venta = P.pvF*S.cond.ventakg, otros = P.dias*S.cond.otrosDia;
    const util = venta-compra-P.costo-otros, equil = (compra+P.costo+otros)/P.pvF;
    html += `<div class="kpis">
      <div class="kpi"><div class="l">${T('Días en corral','Days on feed')}${ayuda('dof')}</div><div class="v">${fmt(P.dias,0)}</div><div class="s">${fmt(P.pvI,0)} → ${fmt(P.pvF,0)} kg (${fmt(gan/P.dias,2)} kg/d)</div></div>
      <div class="kpi"><div class="l">${T('Alimento por animal','Feed per head')}${ayuda('costoDia')}</div><div class="v">${money(P.costo,0)}</div><div class="s">${fmt(P.cms,0)} kg MS</div></div>
      <div class="kpi"><div class="l">${T('Costo de alimento / kg ganado','Feed cost / kg gained')}${ayuda('costoKgGan')}</div><div class="v">${money(P.costo/gan)}</div><div class="s">${T('conversión','feed:gain')} ${fmt(P.cms/gan,2)}</div></div>
      <div class="kpi"><div class="l">${T('Utilidad por cabeza','Profit per head')}${ayuda('margen')}</div><div class="v" style="color:${util>=0?'var(--ok-text)':'var(--bad-text)'}">${money(util,0)}</div><div class="s">${T('equilibrio','break-even')}: ${money(equil)}/kg${ayuda('equilibrio')}</div></div>
    </div>
    <div class="card"><h3>${T('Curva de crecimiento','Growth curve')}</h3>${curvaSVG(P.curva, P.fases)}
      <p class="small muted">${T('Las líneas punteadas marcan el cambio de ración. Crecimiento simulado día a día con la ganancia permitida por cada ración y el consumo esperado a cada peso.','Dashed lines mark ration changes. Growth simulated day by day with each ration’s allowable gain and the expected intake at each weight.')}</p></div>
    <div class="card"><h3>${T('Economía del lote','Group economics')} (${fmt(S.cond.cabezas,0)} ${T('cabezas','head')})</h3><div class="tbl"><table><tbody>
      <tr><td>${T('Compra','Purchase')} (${fmt(P.pvI,0)} kg × ${money(S.cond.comprakg)})</td><td class="r">${money(compra*S.cond.cabezas,0)}</td></tr>
      <tr><td>${T('Alimento','Feed')}</td><td class="r">${money(P.costo*S.cond.cabezas,0)}</td></tr>
      <tr><td>${T('Otros costos','Other costs')} (${fmt(P.dias,0)} d × ${money(S.cond.otrosDia)})</td><td class="r">${money(otros*S.cond.cabezas,0)}</td></tr>
      <tr><td>${T('Venta','Sale')} (${fmt(P.pvF,0)} kg × ${money(S.cond.ventakg)})</td><td class="r">${money(venta*S.cond.cabezas,0)}</td></tr>
      <tr class="tot"><td>${T('Utilidad del lote','Group profit')}</td><td class="r">${money(util*S.cond.cabezas,0)}</td></tr>
      <tr class="sci"><td>${T('Metano del periodo','Methane over the period')}</td><td class="r">${fmt(P.ch4/1000,1)} kg CH₄/${T('animal','head')} · ${fmt(P.ch4/gan,0)} g/kg</td></tr></tbody></table></div>
      <p class="tiny muted">${T('Sin mortalidad, impuestos ni intereses del capital.','Excluding deaths, taxes and capital interest.')}</p></div>`;
  }
  if(!P.crec && ok.length===P.fases.length){
    const dest = (S.prog&&S.prog.destete)||200;
    html += `<div class="kpis">
      <div class="kpi"><div class="l">${T('Alimento por vaca al año','Feed per cow per year')}${ayuda('costoVaca')}</div><div class="v">${money(P.costo,0)}</div><div class="s">${fmt(P.cms,0)} kg MS · ${fmt(P.dias,0)} d</div></div>
      <div class="kpi"><div class="l">${T('Costo por kg de becerro destetado','Cost per kg of weaned calf')}</div><div class="v">${money(P.costo/dest)}</div><div class="s">${fmt(dest,0)} kg ${T('al destete','at weaning')}</div></div>
      <div class="kpi"><div class="l">${T('Costo promedio por día','Average cost per day')}</div><div class="v">${money(P.costo/P.dias)}</div></div>
      <div class="kpi sci"><div class="l">${T('Metano al año','Methane per year')}</div><div class="v">${fmt(P.ch4/1000,0)} kg</div><div class="s">CH₄</div></div></div>`;
  }
  html += `<div class="card"><h3>${T('Resumen por fase','Summary by phase')}</h3><div class="tbl"><table>
    <thead><tr><th>${T('Fase','Phase')}</th><th class="r">${T('Días','Days')}</th>${P.crec?`<th class="r">kg</th><th class="r">${T('GDP','ADG')}</th>`:''}<th class="r">CMS</th><th class="r">ENm</th><th class="r">ENg</th><th class="r">${T('PC','CP')} %</th><th class="r">${T('Forraje','Forage')} %</th><th class="r">${esc(S.moneda)}/t MS</th><th class="r">${esc(S.moneda)}/${T('fase','phase')}</th></tr></thead>
    <tbody>${P.fases.map(f=>f.r.ok?`<tr><td>${esc(tx(f.f.n))}${f.ajustada?` <span class="badge warn" title="${T('La meta no era alcanzable con estos ingredientes','The target was not achievable with these ingredients')}">${T('meta','target')} → ${fmt(f.adgMeta,2)}</span>`:''}</td><td class="r">${fmt(f.dias,0)}</td>${P.crec?`<td class="r">${fmt(f.desde,0)}→${fmt(f.hasta,0)}</td><td class="r">${fmt(f.ganancia/Math.max(f.dias,1),2)}</td>`:''}<td class="r">${fmt(P.crec?f.cms/Math.max(f.dias,1):f.r.dmi,2)}</td><td class="r">${fmt(f.r.nutr.NEm,2)}</td><td class="r">${fmt(f.r.nutr.NEg,2)}</td><td class="r">${fmt(f.r.nutr.PC,1)}</td><td class="r">${fmt(f.r.nutr.For,0)}</td><td class="r"><b>${fmt(f.r.costoKg*1000,0)}</b></td><td class="r">${money(f.costo,0)}</td></tr>`:`<tr><td>${esc(tx(f.f.n))}</td><td colspan="10"><span class="badge bad">${T('sin solución','no solution')}</span></td></tr>`).join('')}</tbody></table></div></div>
  <div class="card"><h3>${T('Raciones del programa (% de la MS)','Program rations (% of DM)')}</h3><div class="tbl"><table>
    <thead><tr><th>${T('Ingrediente','Ingredient')}</th>${ok.map(f=>`<th class="r">${esc(tx(f.f.n))}</th>`).join('')}</tr></thead>
    <tbody>${ids.map(id=>`<tr><td>${esc(nombre(id))}</td>${ok.map(f=>{const v=pct(f,id);return `<td class="r">${v>1e-6?fmt(v,2):'<span class="muted">—</span>'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="row" style="margin-top:12px"><button class="btn ghost sm" id="csvProg">⬇ ${T('Descargar programa (CSV)','Download program (CSV)')}</button></div></div>`;
  box.innerHTML = html;
  const cb = $('#csvProg'); if(cb) cb.addEventListener('click',()=>{
    const filas = [[T('Ingrediente','Ingredient'),...ok.map(f=>tx(f.f.n)+' (% MS)')], ...ids.map(id=>[nombre(id),...ok.map(f=>pct(f,id).toFixed(4))]),
      [T('Días','Days'),...ok.map(f=>f.dias)], [T('Costo por t MS','Cost per t DM'),...ok.map(f=>(f.r.costoKg*1000).toFixed(2))], ['ENm',...ok.map(f=>f.r.nutr.NEm.toFixed(3))], ['ENg',...ok.map(f=>f.r.nutr.NEg.toFixed(3))]];
    descargar(slug()+T('_programa.csv','_program.csv'), csv(filas), 'text/csv');
  });
}

/* ================= BLOQUE 8 · INFORME ================= */
function renderInforme(el){
  const r = S.resultado;
  const nombre = x => tx((S.ingredientes.find(i=>i.id===x.id)||{nombre:x.nombre}).nombre);
  let resumen = `<div class="empty">${ill('i-report')}<p>${T('Primero formula la ración en el Bloque 7; aquí aparecerá el informe redactado.','First formulate the ration in Block 7; the written report will appear here.')}</p></div>`;
  if(r && r.ok){
    const ctx = contexto(S), p = r.pred;
    const usados = r.formula.filter(x=>x.pct>1e-6).sort((a,b)=>b.pct-a.pct);
    const lim = r.restr.filter(x=>x.tipo==='nut'&&x.activa).map(x=>tx(NUT[x.k].n).toLowerCase());
    const animal = esc(etiquetaAnimal().toLowerCase());
    const textoSci = T(
      `Se formuló una ración de mínimo costo para ${animal} de ${fmt(S.animal.pv,0)} kg${ctx.crec?` con una ganancia objetivo de ${fmt(ctx.adg,2)} kg/d`:''}, mediante programación lineal (símplex en dos fases; optimalidad verificada por dualidad fuerte). Los requerimientos se calcularon con las ecuaciones de NASEM (2016) y NRC (1996) —energía neta de mantenimiento y de ganancia, proteína metabolizable con síntesis microbiana según Galyean y Tedeschi (2014), calcio y fósforo factoriales— y el consumo de materia seca predicho (${fmt(r.dmi,2)} kg/d) se ajustó junto con la energía de la dieta por iteración de punto fijo (${r.iter.length} iteraciones)${S.reqEditado?', con requerimientos editados por el usuario':''}. La composición de los ingredientes proviene de Beck et al. (2024) con valores de NASEM (2016)${S.ingredientes.some(i=>i.custom)?', además de ingredientes capturados por el usuario':''}. La ración cuesta <b>${money(r.costoKg*1000,0)} por t de MS</b> (${money(r.costoKgTCO*1000,0)} por t tal como se ofrece, ${fmt(r.msDieta,1)} % de MS) y aporta ${fmt(r.nutr.NEm,2)} y ${fmt(r.nutr.NEg,2)} Mcal/kg de ENm y ENg, ${fmt(r.nutr.PC,1)} % de PC y ${fmt(r.nutr.PM,0)} g/kg de proteína metabolizable. ${ctx.crec?`Ganancia predicha: ${fmt(p.adg,2)} kg/d (limitada por ${p.limita==='energia'?'energía':'proteína'}); metano entérico ${fmt(p.ch4,0)} g/d (IPCC, 2019).`:`Balance de energía: ${fmt(p.balE,2)} Mcal/d.`} Restricciones limitantes: ${lim.length?esc(lim.join(', ')):'ninguna de nutrientes'}.`,
      `A least-cost ration was formulated for ${animal} weighing ${fmt(S.animal.pv,0)} kg${ctx.crec?` with a target gain of ${fmt(ctx.adg,2)} kg/d`:''}, by linear programming (two-phase simplex; optimality verified by strong duality). Requirements were computed with the NASEM (2016) and NRC (1996) equations — net energy for maintenance and gain, metabolizable protein with microbial synthesis per Galyean and Tedeschi (2014), factorial calcium and phosphorus — and predicted dry-matter intake (${fmt(r.dmi,2)} kg/d) was adjusted together with dietary energy by fixed-point iteration (${r.iter.length} iterations)${S.reqEditado?', with user-edited requirements':''}. Ingredient composition comes from Beck et al. (2024) with NASEM (2016) values${S.ingredientes.some(i=>i.custom)?', plus user-entered ingredients':''}. The ration costs <b>${money(r.costoKg*1000,0)} per t DM</b> (${money(r.costoKgTCO*1000,0)} per t as fed, ${fmt(r.msDieta,1)} % DM) and supplies ${fmt(r.nutr.NEm,2)} and ${fmt(r.nutr.NEg,2)} Mcal/kg NEm and NEg, ${fmt(r.nutr.PC,1)} % CP and ${fmt(r.nutr.PM,0)} g/kg metabolizable protein. ${ctx.crec?`Predicted gain: ${fmt(p.adg,2)} kg/d (${p.limita==='energia'?'energy':'protein'}-limited); enteric methane ${fmt(p.ch4,0)} g/d (IPCC, 2019).`:`Energy balance: ${fmt(p.balE,2)} Mcal/d.`} Binding constraints: ${lim.length?esc(lim.join(', ')):'no nutrient constraints'}.`);
    const textoProd = T(
      `Ración para ${animal} de ${fmt(S.animal.pv,0)} kg. Cuesta <b>${money(r.costoKgTCO*1000,0)} por tonelada</b> tal como se mezcla; cada animal come ${fmt(r.dmi*100/r.msDieta,1)} kg al día y cuesta ${money(r.dmi*r.costoKg)} diarios. ${ctx.crec?`Se espera que gane ${fmt(p.adg,2)} kg al día, a ${money(r.dmi*r.costoKg/Math.max(p.adg,0.01))} de alimento por kilo ganado.`:`Cubre ${fmt(100*p.neSup/p.neReq,0)} % de la energía que necesita la vaca.`} RatioBos la calculó para que sea la más barata posible con tus ingredientes y precios. Revísala con tu médico veterinario zootecnista o nutriólogo antes de ofrecerla y haz el cambio de ración en forma gradual.`,
      `Ration for ${animal} weighing ${fmt(S.animal.pv,0)} kg. It costs <b>${money(r.costoKgTCO*1000,0)} per tonne</b> as mixed; each animal eats ${fmt(r.dmi*100/r.msDieta,1)} kg per day at ${money(r.dmi*r.costoKg)} daily. ${ctx.crec?`Expected gain is ${fmt(p.adg,2)} kg per day, at ${money(r.dmi*r.costoKg/Math.max(p.adg,0.01))} of feed per kilo gained.`:`It covers ${fmt(100*p.neSup/p.neReq,0)} % of the energy the cow needs.`} RatioBos computed it to be the cheapest possible with your ingredients and prices. Review it with your veterinarian or nutritionist before feeding and change rations gradually.`);
    resumen = `<div class="card"><div class="row between"><div><h2 style="margin:0 0 4px">${esc(S.proyecto.nombre||T('Ración para bovinos de carne','Beef cattle ration'))}</h2>
      <p class="muted small" style="margin-top:0">${S.proyecto.rancho?esc(S.proyecto.rancho)+' · ':''}${S.proyecto.autor?esc(S.proyecto.autor)+' · ':''}${new Date(r.fecha).toLocaleDateString(LOC())} · RatioBos ${CONFIG.version}</p></div><svg style="width:54px;height:54px"><use href="#i-logo" width="100%" height="100%"/></svg></div>
      <p style="max-width:88ch">${SCI()?textoSci:textoProd}</p>
      <p class="small muted sci" style="max-width:88ch">${T('Cítese el software como','Cite the software as')}: ${esc(tx(CONFIG.citaAutores))} (${CONFIG.anio}). <i>${CONFIG.app}: ${esc(tx(CONFIG.titulo))}</i> (${T('Versión','Version')} ${CONFIG.version}) [Software]. ${CONFIG.doi?'https://doi.org/'+CONFIG.doi:esc(CONFIG.repo)}</p>
      <div class="tbl"><table><thead><tr><th>${T('Ingrediente','Ingredient')}</th><th class="r">% MS</th><th class="r">% ${T('TCO','AF')}</th><th class="r">kg ${T('TCO por t de mezcla','AF per t of mix')}</th></tr></thead><tbody>
      ${usados.map(x=>`<tr><td>${esc(nombre(x))}</td><td class="r">${fmt(x.pct,2)}</td><td class="r">${fmt(x.pctTCO,2)}</td><td class="r">${fmt(x.pctTCO*10,1)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  el.innerHTML = `${cabecera('informe',T('Genera tu reporte, descarga las tablas o guarda todo el proyecto en un archivo para abrirlo en otra computadora.','Generate your report, download the tables or save the whole project to a file to open it on another computer.'))}
  ${resumen}
  <div class="card no-print"><h3>${T('Exportar','Export')}</h3>
    <div class="row">
      <button class="btn" id="imprimir" ${r&&r.ok?'':'disabled'}>🖨 ${T('Imprimir / PDF','Print / PDF')}</button>
      <button class="btn ghost" id="csvF" ${r&&r.ok?'':'disabled'}>⬇ ${T('Fórmula (CSV)','Formula (CSV)')}</button>
      <button class="btn ghost" id="csvN" ${r&&r.ok?'':'disabled'}>⬇ ${T('Nutrientes (CSV)','Nutrients (CSV)')}</button>
    </div>
    <h4>${T('Proyecto','Project')}</h4>
    <div class="row">
      <button class="btn ghost" id="guardarP">💾 ${T('Guardar proyecto (.json)','Save project (.json)')}</button>
      <label class="btn ghost">📂 ${T('Abrir proyecto','Open project')}<input type="file" id="abrirP" accept=".json,application/json" hidden></label>
      <button class="btn danger" id="reiniciar">${T('Reiniciar todo','Reset everything')}</button>
    </div>
    <p class="small muted">${T('Tu trabajo también se guarda automáticamente en este navegador.','Your work is also saved automatically in this browser.')}</p>
  </div>
  ${siguiente('informe')}`;
  if(r&&r.ok){
    $('#imprimir').addEventListener('click',()=>window.print());
    $('#csvF').addEventListener('click',()=>{ const u = r.formula.filter(x=>x.pct>1e-6).sort((a,b)=>b.pct-a.pct);
      descargar(slug()+'_formula.csv', csv([[T('Ingrediente','Ingredient'),'% MS','% '+T('TCO','AF'),T('kg TCO por t de mezcla','kg AF per t of mix'),T('Precio por kg TCO','Price per kg AF'),T('Aporte al costo por t MS','Cost share per t DM')], ...u.map(x=>[nombre(x),x.pct.toFixed(4),x.pctTCO.toFixed(4),(x.pctTCO*10).toFixed(2),x.precio,(x.pct*x.precioMS*10).toFixed(2)]), ['Total',100,100,1000,'',(r.costoKg*1000).toFixed(2)]]), 'text/csv'); });
    $('#csvN').addEventListener('click',()=>{ descargar(slug()+T('_nutrientes.csv','_nutrients.csv'), csv([[T('Nutriente','Nutrient'),T('Unidad','Unit'),T('Minimo','Minimum'),T('Maximo','Maximum'),T('Aporte','Supplied')], ...NUTRIENTES.map(nu=>{ const q=r.contexto.req[nu.k]||[]; return [tx(nu.n),nu.u,q[0]??'',q[1]??'',(+r.nutr[nu.k]).toFixed(4)]; })]), 'text/csv'); });
  }
  $('#guardarP').addEventListener('click',()=>{ descargar(slug()+'.json', JSON.stringify(S,null,1), 'application/json'); toast(T('Proyecto guardado','Project saved')); });
  $('#abrirP').addEventListener('change',e=>{ const file = e.target.files[0]; if(!file) return;
    file.text().then(t=>{ try{ const s=JSON.parse(t); if(s.version!==1||!s.animal) throw 0; S=completarEstado(s); guardar(); irA('inicio'); toast(T('Proyecto abierto','Project opened')); }catch(_){ e.target.closest('.card').insertAdjacentHTML('beforeend',`<div class="alert bad">${T('El archivo no es un proyecto válido de RatioBos.','The file is not a valid RatioBos project.')}</div>`); } }); });
  $('#reiniciar').addEventListener('click',e=>{ if(e.target.dataset.conf){ S=estadoInicial(); cargarRequerimientos(S); guardar(); irA('inicio'); } else { e.target.dataset.conf='1'; e.target.textContent=T('¿Seguro? Presiona otra vez para borrar todo','Sure? Press again to erase everything'); } });
}
