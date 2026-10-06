"use strict";
/* =====================================================================
   SUSTENTABILIDAD / SUSTAINABILITY
   Factores ambientales por kg de MS de cada ingrediente (editables):
     co2  = kg CO₂e de producir el alimento (cultivo, fertilizante, proceso y transporte, sin cambio de uso de suelo);
     agua = litros de huella hídrica verde + azul;   suelo = m²·año de superficie para producirlo.
   Valores orientativos dentro de los intervalos de la base GFLI y de FAO-GLEAM 3.0 (CO₂e), de
   Mekonnen y Hoekstra (2011) llevados a base seca (agua) y de los rendimientos medios del SIAP (suelo).
   Los subproductos llevan solo la parte que les toca por asignación económica.
   ===================================================================== */
const ENV_LIB = {
  alfalfa:[0.20,700,0.8], avena:[0.25,900,1.6], sudan:[0.20,800,1.2], bermuda:[0.18,900,1.0], rastrojo:[0.05,150,0.3],
  ensmaiz:[0.15,450,0.8], enssorgo:[0.14,500,0.9], ensavena:[0.18,600,1.2], pasto:[0.10,800,1.0],
  maizr:[0.45,1390,2.9], maizh:[0.50,1390,2.9], maize:[0.42,1390,2.9], sorgor:[0.42,3460,3.1], sorgoh:[0.47,3460,3.1], trigo:[0.55,2080,1.9],
  hominy:[0.30,700,1.2], melaza:[0.15,300,0.4], salvado:[0.25,600,0.8], glutenf:[0.35,500,0.9], cascsoya:[0.15,300,0.6],
  ddgs:[0.55,600,1.0], algodon:[0.45,1500,1.8], harinolina:[0.50,1300,1.6], soya44:[0.45,2300,3.4], soya48:[0.48,2400,3.6], canola:[0.50,1500,2.2],
  pollinaza:[0.05,50,0.1], pescado:[1.20,100,0], urea:[2.60,10,0], grasa:[1.00,300,0.5],
  carbonato:[0.05,5,0], dical:[1.50,20,0], sal:[0.15,5,0], bicarb:[0.90,10,0], mgo:[1.50,10,0], premezcla:[1.00,20,0], otros:[0.50,10,0]
};
const GWP = {CH4:27, N2O:273};                       // IPCC AR6, 100 años
const envDe = id => { const e = ENV_LIB[id]||[0.4,500,1]; return {co2:e[0], agua:e[1], suelo:e[2]}; };
/* Ym por ingrediente con las categorías del IPCC (2019, cuadro 10.12): concentrados 3 %, forrajes 4–7 % según su digestibilidad */
function ymIng(ing){
  if(['min','adi','nnp'].includes(ing.cat)) return 0;
  if(!ES_FORRAJE(ing.cat)) return 3.0;
  const d = ing.comp.TND||0; return d>=72 ? 4.0 : d>=62 ? 6.3 : 7.0;
}
const REG_HUMEDAS = ['GT','PS','PY','OB','CE'];
/* Factores del estiércol según el sistema y el clima (IPCC, 2019) */
function factoresEstiercol(s){
  const pastoreo = ['plano','lomerio'].includes(s.cond.sistema), t = +s.cond.tAct||20;
  return { ef3: pastoreo ? 0.004 : 0.02, fracGas: pastoreo ? 0.21 : 0.30, fracLeach: REG_HUMEDAS.includes(s.region) ? 0.24 : 0,
           mcf: pastoreo ? 0.0047 : (t<15 ? 0.010 : t<=25 ? 0.015 : 0.020), b0: 0.18, ash: 0.08 };
}
/* CO₂e por kg de MS consumida de cada ingrediente (para el objetivo del modelo): alimento + entérico + estiércol */
function co2eIng(ing, F){
  const env = ing.env || envDe(ing.id);
  const ent = 18.45*ymIng(ing)/100/55.65*GWP.CH4;
  const de = Math.min(0.95,(ing.comp.TND||0)/100), vs = ['min','adi','nnp'].includes(ing.cat) ? 0 : Math.max(0,(1-de+0.04))*(1-F.ash);
  const chEst = vs*F.b0*0.67*F.mcf*GWP.CH4;
  const n = (ing.comp.PC||0)/6.25/100;
  const n2o = n*(F.ef3 + F.fracGas*0.010 + F.fracLeach*0.011)*44/28*GWP.N2O;
  return env.co2 + ent + chEst + n2o;
}
/* Impactos de una ración ya formulada, por animal al día */
function impactos(s, r, ctx){
  const F = factoresEstiercol(s), dmi = r.dmi, n = r.nutr, p = r.pred, ings = s.ingredientes;
  let feedCO2 = 0, aguaV = 0, suelo = 0;
  r.formula.forEach(x=>{ if(x.pct<=1e-9) return; const ing = ings.find(i=>i.id===x.id)||x; const env = ing.env||envDe(x.id); const kg = dmi*x.pct/100; feedCO2 += kg*env.co2; aguaV += kg*env.agua; suelo += kg*env.suelo; });
  const chEnt = p.ch4/1000;                                              // kg CH4/d
  const vs = dmi*Math.max(0,(1-n.TND/100+0.04))*(1-F.ash);
  const chEst = vs*F.b0*0.67*F.mcf;
  const nEx = p.nExc/1000;                                               // kg N/d
  const n2oD = nEx*F.ef3*44/28, nVol = nEx*F.fracGas, nLix = nEx*F.fracLeach;
  const n2oI = (nVol*0.010 + nLix*0.011)*44/28;
  const d = (r.animal&&r.animal.d) || {};
  const pIng = dmi*n.P*10, pRet = ctx.crec ? 0.039*(d.npg||0)*Math.min(1,(p.adg||0)/Math.max(ctx.adg||1e-9,1e-9)) : (s.cat==='gestacion'&&ctx.t>190?7.6*0.68:0)+(ctx.lact?0.95*ctx.leche:0);
  const pEx = Math.max(0,pIng-pRet)/1000;                                // kg P/d
  const agua = dmi*((+s.cond.tAct||20)>25 ? 5 : 3.5);
  const hecesMS = dmi*Math.max(0.05,1-n.TND/100)*1.08;
  const co2e = { alimento:feedCO2, enterico:chEnt*GWP.CH4, estCH4:chEst*GWP.CH4, n2o:(n2oD+n2oI)*GWP.N2O };
  co2e.total = co2e.alimento+co2e.enterico+co2e.estCH4+co2e.n2o;
  return { F, agua, aguaV, suelo, co2e, chEnt, chEst, nEx, nVol, nh3: nVol*17/14, nLix, gris: nLix/0.010, pEx,
           sueloN: nEx*(1-F.fracGas)*365/170, sueloP: pEx*365/25, hecesMS, heces: hecesMS/0.15 };
}
/* Medicamentos por animal según el manejo (Bloque 4) y los días */
const MED_CAT = {
  iono:{n:{es:'Ionóforos',en:'Ionophores'}, oms:{es:'Sin importancia médica en humanos',en:'Not medically important in humans'}, c:'ok'},
  mac:{n:{es:'Antibiótico macrólido (tilosina)',en:'Macrolide antibiotic (tylosin)'}, oms:{es:'OMS: importancia crítica, máxima prioridad',en:'WHO: highest-priority critically important'}, c:'bad'},
  estr:{n:{es:'Antibiótico estreptogramina (virginiamicina)',en:'Streptogramin antibiotic (virginiamycin)'}, oms:{es:'OMS: altamente importante',en:'WHO: highly important'}, c:'warn'},
  beta:{n:{es:'β-agonista',en:'β-agonist'}, oms:{es:'Promotor; respetar el retiro antes del sacrificio',en:'Growth promoter; respect withdrawal before slaughter'}, c:'warn'},
  hor:{n:{es:'Implantes hormonales',en:'Hormonal implants'}, oms:{es:'Promotor; prohibidos para algunos mercados de exportación',en:'Growth promoter; banned in some export markets'}, c:'info'},
  par:{n:{es:'Antiparasitarios',en:'Antiparasitics'}, oms:{es:'Rotar principios activos para evitar resistencia',en:'Rotate actives to avoid resistance'}, c:'info'},
  vac:{n:{es:'Vacunas',en:'Vaccines'}, oms:{es:'Prevención: reducen el uso de antibióticos',en:'Prevention: reduce antibiotic use'}, c:'ok'}
};
function medicamentos(s, dias, dmi){
  const m = s.cond.med||{}, out = [];
  if(s.cond.ionoforo) out.push({k:'iono', prod:{es:'Monensina',en:'Monensin'}, g: (m.ionDosis||30)*dmi*dias/1000, u:'g'});
  if(m.antib==='tilosina') out.push({k:'mac', prod:{es:'Tilosina',en:'Tylosin'}, g:(m.antibDosis||11)*dmi*dias/1000, u:'g'});
  if(m.antib==='virginiamicina') out.push({k:'estr', prod:{es:'Virginiamicina',en:'Virginiamycin'}, g:(m.antibDosis||20)*dmi*dias/1000, u:'g'});
  if(m.beta && m.beta!=='ninguno') out.push({k:'beta', prod:{es:m.beta==='zilpaterol'?'Clorhidrato de zilpaterol':'Clorhidrato de ractopamina',en:m.beta==='zilpaterol'?'Zilpaterol hydrochloride':'Ractopamine hydrochloride'}, g:(m.betaDosis||6.5)*dmi*Math.min(dias, m.betaDias||30)/1000, u:'g'});
  if(+m.implantes>0 && s.cond.implante) out.push({k:'hor', prod:{es:'Implante (trembolona/estradiol)',en:'Implant (trenbolone/estradiol)'}, g:+m.implantes, u:T('implantes','implants')});
  if(+m.desparas>0) out.push({k:'par', prod:{es:'Desparasitante (p. ej. ivermectina)',en:'Dewormer (e.g. ivermectin)'}, g:+m.desparas, u:T('tratamientos','treatments')});
  if(+m.vacunas>0) out.push({k:'vac', prod:{es:'Vacunas (clostridiales, respiratorias)',en:'Vaccines (clostridial, respiratory)'}, g:+m.vacunas, u:T('dosis','doses')});
  return out;
}
/* Formulación con precio interno del carbono, el agua y el suelo (objetivo ampliado) */
function formularSostenible(s, pesos){
  const ctx = contexto(s), F = factoresEstiercol(s);
  const ings = s.ingredientes.filter(i=>s.sel[i.id]).map(i=>Object.assign({}, i, {penal: (pesos.co2||0)*co2eIng(i,F)/1000 + (pesos.agua||0)*((i.env||envDe(i.id)).agua)/1000 + (pesos.suelo||0)*((i.env||envDe(i.id)).suelo)}));
  return formularContexto(ctx, ings, s.reqEditado ? {req:s.req, dmi:s.reqInfo.dmi, d:s.reqInfo.d} : null, {nem0:s.animal.nemSup});
}
function fronteraCarbono(s){
  const out = [];
  for(const w of [0, 250, 500, 1000, 2000, 4000, 8000]){
    const r = formularSostenible(s, {co2:w});
    if(!r.ok) continue;
    const ctx = contexto(s), I = impactos(s, r, ctx), base = ctx.crec && r.pred.adg>0 ? r.pred.adg : 1;
    out.push({w, costo: r.dmi*r.costoKg/base, co2: I.co2e.total/base, r});
  }
  return out;
}

/* ================= BLOQUE 10 · SUSTENTABILIDAD ================= */
function renderSostenible(el){
  const r = S.resultado;
  el.innerHTML = `${cabecera('sostenible',T('Producir carne también consume agua y suelo y deja gases, nutrientes y residuos. Aquí ves la huella de tu ración por animal, por kg de carne y por lote, y puedes formularla poniéndole precio a esa carga ambiental para buscar el equilibrio entre utilidad y sostenibilidad.','Producing beef also uses water and land and leaves gases, nutrients and residues. Here you see your ration’s footprint per head, per kg of beef and per group, and you can formulate it with a price on that environmental load to find the balance between profit and sustainability.'))}
  ${teoriaDe(['sostenible','gei'])}
  <div id="sust">${!r||!r.ok?`<div class="empty">${ill('i-gas')}<p>${T('Primero formula la ración en el Bloque 7.','First formulate the ration in Block 7.')}</p><button class="btn" data-ir="formulacion">${T('Ir a Formulación','Go to Formulation')}</button></div>`:''}</div>
  ${siguiente('sostenible')}`;
  if(r && r.ok) pintarSostenible();
}
function pintarSostenible(){
  const box = $('#sust'); if(!box) return;
  const r = S.resultado, ctx = contexto(S), I = impactos(S, r, ctx), cab = +S.cond.cabezas||1;
  const crec = ctx.crec && r.pred.adg>0, g = crec ? r.pred.adg : null;
  const P = S.programa && S.programa.ok && S.programa.crec ? S.programa : null;
  const dias = P ? P.dias : (crec ? 100 : 365);
  const porKg = v => crec ? fmt(v/g, v/g<10?2:0) : '—';
  const fila = (n, u, d, ay, dec=1) => `<tr><td>${n}${ayuda(ay)}</td><td class="muted">${u}</td><td class="r"><b>${fmt(d,dec)}</b></td><td class="r">${crec?fmt(d/g,dec>1?dec:2):'—'}</td><td class="r">${fmt(d*dias*cab/(u.includes('L')?1000:1), d*dias*cab>100?0:1)}</td></tr>`;
  const m = medicamentos(S, dias, r.dmi);
  const sem = [
    [I.co2e.total/(g||1) < 12 ? 'ok' : I.co2e.total/(g||1) < 20 ? 'warn' : 'bad', T('Gases de efecto invernadero','Greenhouse gases'), crec ? `${fmt(I.co2e.total/g,1)} kg CO₂e/kg ${T('ganado','gained')}` : `${fmt(I.co2e.total,1)} kg CO₂e/d`],
    [I.agua+I.aguaV/1 > 0 && I.aguaV/(g||1) < 6000 ? 'ok' : I.aguaV/(g||1) < 10000 ? 'warn' : 'bad', T('Agua','Water'), crec ? `${fmt(I.aguaV/g/1000,1)} m³/kg ${T('en el alimento','in feed')}` : `${fmt(I.aguaV/1000,1)} m³/d`],
    [I.nh3*1000 < 60 ? 'ok' : I.nh3*1000 < 100 ? 'warn' : 'bad', T('Amoniaco al aire','Ammonia to air'), `${fmt(I.nh3*1000,0)} g NH₃/d`],
    [I.nLix>0 ? 'warn' : 'ok', T('Nitratos al agua','Nitrates to water'), I.nLix>0 ? `${fmt(I.nLix*1000,0)} g N/d ${T('en clima húmedo','in a humid climate')}` : T('clima seco: lixiviación despreciable','dry climate: negligible leaching')],
    [m.some(x=>x.k==='mac') ? 'bad' : m.some(x=>x.k==='estr'||x.k==='beta') ? 'warn' : 'ok', T('Medicamentos','Medicines'), m.some(x=>x.k==='mac'||x.k==='estr') ? T('usa antibióticos de importancia médica','uses medically important antibiotics') : T('sin antibióticos de importancia médica','no medically important antibiotics')]
  ];
  box.innerHTML = `
  <div class="card"><h3>${T('Semáforo de sostenibilidad','Sustainability traffic light')}${ayuda('sostenible')}</h3>
    <div class="semaf">${sem.map(([c,a,b])=>`<div class="${c}"><b>${c==='ok'?'●':c==='warn'?'▲':'■'} ${a}</b><span class="muted small">${b}</span></div>`).join('')}</div></div>
  <div class="dash">
  <div class="card"><h3>${T('Gases de efecto invernadero','Greenhouse gases')}${ayuda('gei')}</h3>
    ${graficaBarrasH([
      {n:T('Metano entérico','Enteric methane'), v:I.co2e.enterico, txt:fmt(I.co2e.enterico,2)+' kg CO₂e'},
      {n:T('Producción del alimento','Feed production'), v:I.co2e.alimento, txt:fmt(I.co2e.alimento,2)+' kg CO₂e'},
      {n:T('Óxido nitroso (estiércol)','Nitrous oxide (manure)'), v:I.co2e.n2o, txt:fmt(I.co2e.n2o,2)+' kg CO₂e'},
      {n:T('Metano del estiércol','Manure methane'), v:I.co2e.estCH4, txt:fmt(I.co2e.estCH4,2)+' kg CO₂e'}], {titulo:'GEI'})}
    <p class="small">${T('Total','Total')}: <b>${fmt(I.co2e.total,2)} kg CO₂e</b> ${T('por animal al día','per head per day')}${crec?` · <b>${fmt(I.co2e.total/g,1)} kg CO₂e</b> ${T('por kg ganado','per kg gained')}`:''}. ${T('Ym de la ración','Ration Ym')}: ${fmt(r.nutr.Ym||r.pred.ym,1)} %.</p></div>
  <div class="card"><h3>${T('Recursos que usa la ración','Resources the ration uses')}</h3>
    <div class="eco">
      <div class="e">${ill('i-gas')}<div><div class="v">${fmt(I.agua,0)} L/d</div><div class="l">${T('agua de bebida','drinking water')}${ayuda('aguaB')}</div></div></div>
      <div class="e">${ill('i-grass')}<div><div class="v">${fmt(I.aguaV/1000,1)} m³/d</div><div class="l">${T('huella hídrica del alimento','feed water footprint')}${ayuda('huellaH')}</div></div></div>
      <div class="e">${ill('i-hay')}<div><div class="v">${fmt(I.suelo*365/10000,2)} ha</div><div class="l">${T('para producir su alimento por año','to grow its feed per year')}${ayuda('sueloA')}</div></div></div>
      <div class="e">${ill('i-silo')}<div><div class="v">${fmt(Math.max(I.sueloN,I.sueloP),2)} ha</div><div class="l">${T('para aplicar su estiércol por año','to spread its manure per year')}${ayuda('sueloE')}</div></div></div>
    </div></div>
  </div>
  <div class="card"><h3>${T('Huella completa de la ración','Full footprint of the ration')}</h3>
    <div class="tbl"><table><thead><tr><th>${T('Indicador','Indicator')}</th><th>${T('Unidad','Unit')}</th><th class="r">${T('Por animal al día','Per head per day')}</th><th class="r">${T('Por kg ganado','Per kg gained')}</th><th class="r">${T('Lote','Group')} (${fmt(cab,0)} × ${fmt(dias,0)} d)</th></tr></thead><tbody>
      ${fila(T('Agua de bebida','Drinking water'),'L · m³',I.agua,'aguaB',0)}
      ${fila(T('Huella hídrica del alimento (verde + azul)','Feed water footprint (green + blue)'),'L · m³',I.aguaV,'huellaH',0)}
      ${fila(T('Superficie para producir el alimento','Land to grow the feed'),'m²·año',I.suelo,'sueloA',1)}
      ${fila(T('Metano entérico','Enteric methane'),'kg CH₄',I.chEnt,'ch4',3)}
      ${fila(T('Metano del estiércol','Manure methane'),'kg CH₄',I.chEst,'gei',4)}
      ${fila(T('GEI totales','Total GHG'),'kg CO₂e',I.co2e.total,'gei',2)}
      ${fila(T('Nitrógeno excretado','Excreted nitrogen'),'kg N',I.nEx,'nExc',3)}
      ${fila(T('Amoniaco al aire','Ammonia to air'),'kg NH₃',I.nh3,'nh3',3)}
      ${fila(T('Nitrógeno lixiviado','Leached nitrogen'),'kg N',I.nLix,'agGris',4)}
      ${fila(T('Agua contaminada (agua gris)','Polluted water (grey water)'),'L · m³',I.gris*1000,'agGris',0)}
      ${fila(T('Fósforo excretado','Excreted phosphorus'),'kg P',I.pEx,'pExc',4)}
      ${fila(T('Heces frescas','Fresh feces'),'kg',I.heces,'heces',1)}
    </tbody></table></div>
    <p class="small muted">${T('Superficie para el estiércol del lote','Manure land for the group')}: <b>${fmt(Math.max(I.sueloN,I.sueloP)*cab*dias/365,1)} ha</b> (${T('límite de','limit of')} 170 kg N/ha·año ${T('o','or')} 25 kg P/ha·año, ${T('el que pida más superficie','whichever needs more land')}). ${T('Los factores de emisión y de huella de cada ingrediente son orientativos y se pueden editar en la vista científica.','Emission and footprint factors per ingredient are indicative and can be edited in the scientist view.')}</p></div>
  <div class="card"><h3>${T('Medicamentos y aditivos por animal','Medicines and additives per head')} (${fmt(dias,0)} d)${ayuda('medic')}</h3>
    ${m.length?`<div class="tbl"><table><thead><tr><th>${T('Categoría','Category')}</th><th>${T('Producto','Product')}</th><th class="r">${T('Cantidad','Amount')}</th><th class="r">${T('Lote','Group')}</th><th>${T('Clasificación','Classification')}</th></tr></thead><tbody>
      ${m.map(x=>`<tr><td>${esc(tx(MED_CAT[x.k].n))}</td><td>${esc(tx(x.prod))}</td><td class="r">${fmt(x.g,x.u==='g'?2:0)} ${esc(x.u)}</td><td class="r">${fmt(x.g*cab,x.u==='g'?0:0)} ${esc(x.u)}</td><td><span class="badge ${MED_CAT[x.k].c}">${esc(tx(MED_CAT[x.k].oms))}</span></td></tr>`).join('')}</tbody></table></div>`:`<p class="muted">${T('No se registraron medicamentos ni aditivos.','No medicines or additives recorded.')}</p>`}
    <p class="small muted">${T('Se capturan en el Bloque 4 (Manejo). Dosis en mg por kg de MS × consumo × días.','Entered in Block 4 (Management). Doses in mg per kg DM × intake × days.')}</p></div>
  <div class="card"><div class="row between"><h3 style="margin:0">${T('Optimizar costo y ambiente a la vez','Optimize cost and environment together')}${ayuda('precioC')}</h3><button class="btn accent" id="btnFrontera">⚙ ${T('Calcular la frontera costo–huella','Compute the cost–footprint frontier')}</button></div>
    <p class="small muted">${T('Se formula varias veces sumando al precio de cada ingrediente un «precio interno del carbono» por sus emisiones (alimento + metano + estiércol). Así se ve cuánto cuesta cada kilo de CO₂e evitado y dónde está el punto de equilibrio.','The ration is formulated several times adding to each ingredient’s price an internal carbon price on its emissions (feed + methane + manure). This shows what each kilo of CO₂e avoided costs and where the balance point lies.')}</p>
    <div id="frontera"></div></div>`;
  $('#btnFrontera').addEventListener('click',()=>{ const f = $('#frontera'); f.innerHTML = `<p class="muted">${T('Calculando…','Computing…')}</p>`; setTimeout(()=>pintarFrontera(f), 20); });
}
function pintarFrontera(box){
  const Fr = fronteraCarbono(S); if(Fr.length<2){ box.innerHTML = `<p class="muted">${T('No se pudo calcular.','Could not compute.')}</p>`; return; }
  const ctx = contexto(S), crec = ctx.crec && Fr[0].r.pred.adg>0, u = crec ? T('por kg ganado','per kg gained') : T('por animal al día','per head per day');
  /* punto de equilibrio: mayor reducción de CO₂e por peso adicional (codo de la frontera) */
  const b0 = Fr[0]; let eq = b0, mejor = 0;
  Fr.slice(1).forEach(x=>{ const dC = b0.co2 - x.co2, dP = x.costo - b0.costo; const ef = dC/Math.max(dP,1e-6); if(dC>0.02*b0.co2 && ef>mejor){ mejor=ef; eq=x; } });
  box.innerHTML = `${graficaLineas({titulo:T('Frontera costo–huella','Cost–footprint frontier'), xlab:'kg CO₂e '+u, ylab:T('costo de alimento $ ','feed cost $ ')+u, dx:1, dy:2,
      series:[{etq:T('Raciones óptimas','Optimal rations'), cls:'l1', pts:Fr.map(x=>[x.co2,x.costo]).sort((a,b)=>a[0]-b[0])}], marcas:[{x:eq.co2,y:eq.costo,t:T('equilibrio','balance')}]})}
    <div class="tbl"><table><thead><tr><th class="r">${T('Precio del carbono','Carbon price')} $/t CO₂e</th><th class="r">$ ${u}</th><th class="r">kg CO₂e ${u}</th><th class="r">${T('Costo de evitar 1 t CO₂e','Cost to avoid 1 t CO₂e')}</th></tr></thead><tbody>
    ${Fr.map(x=>`<tr class="${x===eq?'tot':''}"><td class="r">${fmt(x.w,0)}</td><td class="r">${fmt(x.costo,2)}</td><td class="r">${fmt(x.co2,2)}</td><td class="r">${x===b0||b0.co2-x.co2<=1e-6?'—':money((x.costo-b0.costo)/(b0.co2-x.co2)*1000,0)}</td></tr>`).join('')}</tbody></table></div>
    <p class="small">${T(`Punto de equilibrio sugerido: precio interno de <b>${money(eq.w,0)}/t CO₂e</b>, que baja la huella ${fmt(100*(1-eq.co2/b0.co2),1)} % con un costo ${fmt(100*(eq.costo/b0.costo-1),1)} % mayor.`,`Suggested balance point: internal price of <b>${money(eq.w,0)}/t CO₂e</b>, cutting the footprint ${fmt(100*(1-eq.co2/b0.co2),1)} % at ${fmt(100*(eq.costo/b0.costo-1),1)} % higher cost.`)}</p>
    <button class="btn sm" id="usarEq">${T('Usar la ración de equilibrio','Use the balance ration')}</button>`;
  $('#usarEq',box).addEventListener('click',()=>{ const r = eq.r; r.contexto = {cat:S.cat, biotipo:S.biotipo, sexo:S.sexo, pv:S.animal.pv, adg:contexto(S).adg, req: JSON.parse(JSON.stringify(r.animal.req||S.req)), editado:S.reqEditado, carbono:eq.w}; S.resultado = r; guardar(); toast(T('Ración de equilibrio aplicada','Balance ration applied')); render(); });
}
