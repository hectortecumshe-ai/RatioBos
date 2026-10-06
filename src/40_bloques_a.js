"use strict";
/* =====================================================================
   8. BLOQUES / BLOCKS
   ===================================================================== */
const BLOQUES = [
  {id:'inicio',       n:'⌂', ill:null,         corto:{es:'Inicio',en:'Home'},              titulo:{es:'Inicio',en:'Home'},                                             render:()=>renderInicio},
  {id:'animal',       n:'1', ill:'i-steer',    corto:{es:'Animal',en:'Animal'},            titulo:{es:'Tipo de animal, biotipo y sexo',en:'Animal type, biotype and sex'}, render:()=>renderAnimal},
  {id:'region',       n:'2', ill:'i-mapa',     corto:{es:'Región',en:'Region'},            titulo:{es:'Región, clima e infraestructura',en:'Region, climate and infrastructure'}, render:()=>renderRegion},
  {id:'etapa',        n:'3', ill:'i-growth',   corto:{es:'Requerimientos',en:'Requirements'}, titulo:{es:'Peso, meta y requerimientos',en:'Weight, target and requirements'}, render:()=>renderEtapa},
  {id:'condiciones',  n:'4', ill:'i-climate',  corto:{es:'Manejo',en:'Management'},        titulo:{es:'Manejo y mercado',en:'Management and market'},                  render:()=>renderCondiciones},
  {id:'ingredientes', n:'5', ill:'i-hay',      corto:{es:'Ingredientes',en:'Ingredients'}, titulo:{es:'Ingredientes disponibles',en:'Available ingredients'},           render:()=>renderIngredientes},
  {id:'precios',      n:'6', ill:'i-price',    corto:{es:'Precios',en:'Prices'},           titulo:{es:'Precios locales y límites de inclusión',en:'Local prices and inclusion limits'}, render:()=>renderPrecios},
  {id:'formulacion',  n:'7', ill:'i-scale',    corto:{es:'Formulación',en:'Formulation'},  titulo:{es:'Formulación de mínimo costo',en:'Least-cost formulation'},       render:()=>renderFormulacion},
  {id:'programa',     n:'8', ill:'i-calendar', corto:{es:'Programa',en:'Program'},         titulo:{es:'Programa de alimentación',en:'Feeding program'},                  render:()=>renderPrograma},
  {id:'tablero',      n:'9', ill:'i-panel',    corto:{es:'Tablero',en:'Dashboard'},        titulo:{es:'Tablero de resultados',en:'Results dashboard'},                  render:()=>renderTablero},
  {id:'sostenible',  n:'10', ill:'i-gas',     corto:{es:'Sostenibilidad',en:'Sustainability'}, titulo:{es:'Huella ambiental y producción sostenible',en:'Environmental footprint and sustainable production'}, render:()=>renderSostenible},
  {id:'informe',      n:'11', ill:'i-report',  corto:{es:'Informe',en:'Report'},           titulo:{es:'Informe y exportación',en:'Report and export'},                  render:()=>renderInforme},
  {id:'validacion',   n:'✓', ill:'i-check',    corto:{es:'Validación',en:'Validation'},    titulo:{es:'Validación con dietas publicadas',en:'Validation with published diets'}, render:()=>renderValidacion},
  {id:'teoria',       n:'§', ill:'i-book',     corto:{es:'Teoría',en:'Theory'},            titulo:{es:'Marco teórico',en:'Theoretical framework'},                      render:()=>renderTeoria}
];
const NUMERADOS = BLOQUES.filter(b=>/^\d+$/.test(b.n)).length;

/* ---------- utilidades / utilities ---------- */
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const esc = t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(v,d=2){ if(v==null||v===''||isNaN(v)) return '—'; const x = Math.abs(v)<1e-9?0:v; return Number(x).toLocaleString(LOC(),{minimumFractionDigits:d,maximumFractionDigits:d}); }
function num(v){ if(v===''||v==null) return null; const x=parseFloat(String(v).replace(',','.')); return isNaN(x)?null:x; }
const money = (v,d=2)=> S.moneda+' '+fmt(v,d);
const B = id=>BLOQUES.find(b=>b.id===id);
const ill = (id, cls='', style='') => `<svg class="ico ${cls}" style="${style}" aria-hidden="true"><use href="#${id}" width="100%" height="100%"/></svg>`;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('on'),2400); }
function cabecera(id, lead){
  const b = B(id);
  const et = /^\d+$/.test(b.n) ? T(`Bloque ${b.n} de ${NUMERADOS}`,`Block ${b.n} of ${NUMERADOS}`) : (id==='validacion'?T('Evaluación de la plataforma','Platform evaluation'):T('Fundamentos','Foundations'));
  const estilo = (id==='animal' ? BIOTIPOS[S.biotipo].estilo : '');
  return `<div class="bhead"><div><div class="eyebrow">${et}</div><h1>${esc(tx(b.titulo))}</h1>${lead?`<p class="lead">${lead}</p>`:''}</div>${b.ill?`<div class="bill" style="--anim:running">${ill(b.ill,'',estilo)}</div>`:''}</div>`;
}
function siguiente(id){
  const i = BLOQUES.findIndex(b=>b.id===id), p = BLOQUES[i-1], n = BLOQUES[i+1];
  return `<div class="next no-print">${p?`<button class="btn ghost" data-ir="${p.id}">← ${esc(tx(p.corto))}</button>`:'<span></span>'}
    ${n?`<button class="btn big-next" data-ir="${n.id}"><small>${T('Siguiente','Next')}</small><span>${/^\d+$/.test(n.n)?n.n+' · ':''}${esc(tx(n.titulo))} →</span></button>`:''}</div>`;
}
function descargar(nombre, texto, tipo){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([texto],{type:tipo})); a.download=nombre; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},500); }
const csv = filas => '﻿'+filas.map(f=>f.map(c=>{ const s=String(c??''); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(',')).join('\n');
const slug = ()=> (S.proyecto.nombre||T('dieta_bovinos','beef_diet')).replace(/[^\w\-]+/g,'_');
const PALETA = ['#b05434','#2f5d50','#8fb3a5','#e0a13c','#5f9a4a','#7d5a2c','#b5d98b','#3b6aa0','#d94c3d','#9aa5a0','#f2c46d','#1c3b33'];
function dona(items, size=220){
  const tot = items.reduce((a,x)=>a+x.v,0)||1, r=70, C=2*Math.PI*r; let acc=0;
  const arcs = items.map((x,i)=>{ const f=x.v/tot; const s=`<circle r="${r}" fill="none" stroke="${PALETA[i%PALETA.length]}" stroke-width="34" stroke-dasharray="${(C*f).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-C*acc).toFixed(2)}"><title>${esc(x.n)}: ${fmt(x.v,2)} %</title></circle>`; acc+=f; return s; }).join('');
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="${T('Composición de la dieta','Diet composition')}"><g transform="translate(100,100) rotate(-90)">${arcs}</g><circle cx="100" cy="100" r="52" fill="var(--card)"/><text x="100" y="96" text-anchor="middle" font-size="13" fill="var(--muted)" font-family="inherit">${T('ingredientes','ingredients')}</text><text x="100" y="118" text-anchor="middle" font-size="26" font-weight="700" fill="var(--primary-dark)" font-family="inherit">${items.length}</text></svg>`;
}
const esCrec = () => CATEGORIAS[S.cat].tipo==='crec';
const etiquetaAnimal = () => `${tx(CATEGORIAS[S.cat].n)} · ${tx(BIOTIPOS[S.biotipo].n)}${esCrec()&&S.cat!=='vaquillas'?' · '+tx(SEXOS[S.sexo].n):''}`;

/* ================= INICIO / HOME ================= */
function renderInicio(el){
  const inc = [
    ['animal','i-steer',T('Animal','Animal'),T('Becerros, engorda en corral, vaquillas y vacas gestantes o lactantes; cinco biotipos (británico, continental, cebú, cruzas y lechero) y tres sexos.','Calves, feedlot finishing, heifers and pregnant or lactating cows; five biotypes (British, continental, zebu, crosses and dairy) and three sexes.')],
    ['etapa','i-growth',T('Requerimientos del animal','Animal requirements'),T('Calculados con las ecuaciones de NASEM (2016) a partir del peso, la meta de ganancia, la gestación o la leche: energía neta, proteína metabolizable, calcio y fósforo.','Computed with NASEM (2016) equations from weight, target gain, pregnancy or milk: net energy, metabolizable protein, calcium and phosphorus.')],
    ['condiciones','i-climate',T('Ambiente y manejo','Environment and management'),T('Calor, frío, jadeo, lodo, implantes e ionóforos ajustan el mantenimiento y el consumo; precios de compra y venta para el negocio.','Heat, cold, panting, mud, implants and ionophores adjust maintenance and intake; purchase and sale prices for the business.')],
    ['ingredientes','i-hay',T('Ingredientes','Ingredients'),`${ING_LIB.length} `+T('alimentos con ENm, ENg, proteína degradable, fibra efectiva y minerales, en base seca. Edita la matriz con tus análisis.','feeds with NEm, NEg, degradable protein, effective fiber and minerals, on a dry basis. Edit the matrix with your analyses.')],
    ['precios','i-price',T('Precios y límites','Prices and limits'),T('Tus precios tal como compras; la app los pasa a materia seca y calcula el costo de cada Mcal y de cada kg de proteína.','Your prices as bought; the app converts them to dry matter and computes the cost of every Mcal and kg of protein.')],
    ['formulacion','i-scale',T('Formulación','Formulation'),T('Mínimo costo con ajuste iterativo de energía y consumo, ganancia esperada, costo por kg ganado, salud ruminal, metano y certificado de optimalidad.','Least cost with iterative energy and intake adjustment, expected gain, cost per kg gained, rumen health, methane and an optimality certificate.')],
    ['programa','i-calendar',T('Programa','Program'),T('Toda la engorda o el ciclo de la vaca: días en corral, curva de crecimiento, costo total y punto de equilibrio.','The whole feedlot period or the cow cycle: days on feed, growth curve, total cost and break-even.')],
    ['informe','i-report',T('Informe','Report'),T('Resumen redactado, hoja de mezclado para el carro, PDF, CSV y el proyecto completo en un archivo.','Written summary, mixer sheet, PDF, CSV and the whole project in one file.')],
    ['validacion','i-check',T('Validación','Validation'),T('Reproduce dietas de engordas de Sinaloa y de la Universidad de California publicadas en revistas científicas.','Reproduces feedlot diets from Sinaloa and the University of California published in scientific journals.')]
  ];
  const cita = `${esc(tx(CONFIG.citaAutores))} (${CONFIG.anio}). <i>${CONFIG.app}: ${esc(tx(CONFIG.titulo))}</i> (${T('Versión','Version')} ${CONFIG.version}) [Software]. ${CONFIG.doi?`https://doi.org/${CONFIG.doi}`:esc(CONFIG.repo)}`;
  const nuevo = [
    [T('El animal, no una tabla','The animal, not a table'),T('Los requerimientos salen de ecuaciones factoriales para tu peso, ganancia, biotipo, sexo, gestación y leche.','Requirements come from factorial equations for your weight, gain, biotype, sex, pregnancy and milk.')],
    [T('Energía y consumo que se ajustan solos','Self-adjusting energy and intake'),T('La ENg que hace falta depende de la ENm de la propia dieta; RatioBos itera hasta que todo cuadra.','The NEg needed depends on the diet’s own NEm; RatioBos iterates until everything matches.')],
    [T('Base seca y base húmeda','Dry and as-fed basis'),T('Formula en materia seca y te entrega los kilos húmedos para el carro mezclador.','Formulates on dry matter and gives you wet kilos for the mixer wagon.')],
    [T('Ganancia y costo por kilo','Gain and cost per kilo'),T('Predice la ganancia que permite la energía y la que permite la proteína, y el costo de cada kilo producido.','Predicts energy- and protein-allowable gain, and the cost of every kilo produced.')],
    [T('Salud ruminal','Rumen health'),T('Semáforo de fibra efectiva, forraje, grasa, urea y azufre contra acidosis y polioencefalomalacia.','Traffic light for effective fiber, forage, fat, urea and sulfur against acidosis and polioencephalomalacia.')],
    [T('Huella ambiental','Environmental footprint'),T('Metano entérico (IPCC 2019) y nitrógeno excretado por día y por kg de ganancia.','Enteric methane (IPCC 2019) and excreted nitrogen per day and per kg of gain.')],
    [T('El negocio completo','The whole business'),T('Días en corral, curva de crecimiento, costo total, utilidad y precio de equilibrio.','Days on feed, growth curve, total cost, profit and break-even price.')],
    [T('Validado con desempeño real','Validated with real performance'),T('Además del análisis químico, reproduce la energía neta observada en los corrales experimentales.','Beyond chemical analysis, it reproduces the net energy observed in experimental pens.')]
  ];
  el.innerHTML = `
  <section class="hero">
    <div>
      <div class="eyebrow">${T('Nutrición de precisión para bovinos de carne','Precision nutrition for beef cattle')}</div>
      <h1>${T('La <em>razón</em> al servicio del <span class="acc">ganado</span>','<em>Reason</em> in the service of <span class="acc">cattle</span>')}</h1>
      <p class="big">${T('<b>Ratio</b> es razón y cálculo; de ella nace la palabra <i>ración</i>. RatioBos calcula lo que necesita tu ganado con las <b>ecuaciones de NASEM (2016)</b> y encuentra, por <b>programación lineal</b>, la ración de <b>menor costo</b> con tus <b>ingredientes y precios locales</b>: del becerro al novillo terminado y de la vaca gestante a la lactante.','<b>Ratio</b> means reason and calculation — the root of the word <i>ration</i>. RatioBos computes what your cattle need with the <b>NASEM (2016) equations</b> and uses <b>linear programming</b> to find the <b>lowest-cost</b> ration with your <b>local ingredients and prices</b>: from calf to finished steer and from pregnant to lactating cow.')}</p>
      <div class="ctas">
        <button class="btn lg" data-ir="animal">${T('Empezar a formular →','Start formulating →')}</button>
        <button class="btn ghost lg" data-ir="validacion">${T('Ver la validación científica','See the scientific validation')}</button>
        <button class="btn link" data-ir="teoria">${T('Leer la teoría','Read the theory')}</button>
      </div>
      <div class="chips">
        <span class="chip">${T('Todo el cálculo ocurre en tu navegador','All calculations run in your browser')}</span><span class="chip">${T('Ningún dato sale de tu computadora','No data leaves your computer')}</span>
        <span class="chip">${T('Español e inglés','Spanish and English')}</span><span class="chip">${T('Libre y de código abierto (MIT)','Free and open source (MIT)')}</span>
      </div>
    </div>
    <div class="art" aria-hidden="true" style="--anim:running">
      <div class="stage"></div>
      <svg class="big" style="left:4%;bottom:0;width:26%;height:24%"><use href="#i-grass" width="100%" height="100%"/></svg>
      <svg class="big" style="left:52%;bottom:2%;width:20%;height:18%"><use href="#i-grass" width="100%" height="100%"/></svg>
      <svg class="big float" style="left:12%;top:14%;width:72%;height:62%;--cw:#9b4f2e;--hu:#8f4628"><use href="#i-steer" width="100%" height="100%"/></svg>
      <svg class="big float d2" style="left:0;top:50%;width:30%;height:30%"><use href="#i-hay" width="100%" height="100%"/></svg>
      <svg class="big float d3" style="right:0;top:2%;width:28%;height:30%"><use href="#i-silo" width="100%" height="100%"/></svg>
      <svg class="big float d3" style="left:2%;top:4%;width:16%;height:26%"><use href="#i-corn" width="100%" height="100%"/></svg>
      <svg class="big float d2" style="right:2%;bottom:6%;width:30%;height:22%"><use href="#i-mixer" width="100%" height="100%"/></svg>
      <div class="chip-n" style="left:34%;bottom:0">${T('Costo por kg ganado','Cost per kg gained')}<b>${T('mínimo','minimum')} ✓</b></div>
      <div class="chip-n" style="right:0;top:40%">ENg · PM<b>100 % ✓</b></div>
    </div>
  </section>

  <div class="stats">
    <div class="stat"><div class="v">5 × 5</div><div class="l">${T('tipos de animal × biotipos','animal types × biotypes')}</div></div>
    <div class="stat"><div class="v">${ING_LIB.length}</div><div class="l">${T('ingredientes en base seca','ingredients, dry basis')}</div></div>
    <div class="stat"><div class="v">${NUTRIENTES.length}</div><div class="l">${T('nutrientes e indicadores','nutrients and indicators')}</div></div>
    <div class="stat"><div class="v" id="statVal">—</div>x</div></div>
    <div class="stat"><div class="v" id="statNE">—</div><div class="l">${T('error al reproducir la energía observada','error reproducing observed energy')}</div></div>
  </div>

  <h2 class="section-t">${T('Una herramienta, dos miradas','One tool, two views')}</h2>
  <p class="section-l">${T('RatioBos sirve al ganadero que decide en el corral y al investigador que necesita rigor y reproducibilidad. Cambia de vista cuando quieras con el botón <b>Productor / Científico</b>; tus datos no se pierden.','RatioBos serves the rancher deciding at the bunk and the researcher who needs rigor and reproducibility. Switch views at any time with the <b>Producer / Scientist</b> button; your data is kept.')}</p>
  <div class="vistas">
    <div class="vista ${MODO==='prod'?'on':''}"><h3>${ill('i-prod')}${T('Vista productor','Producer view')}${MODO==='prod'?`<span class="tag">${T('activa','active')}</span>`:''}</h3>
      <p class="muted" style="margin:0">${T('Lo esencial para decidir, en lenguaje sencillo.','The essentials to decide, in plain language.')}</p>
      <ul><li>${T('Consejos breves en cada paso','Short tips at every step')}</li><li>${T('Los 8 nutrientes clave y un semáforo de salud ruminal','The 8 key nutrients and a rumen-health traffic light')}</li><li>${T('Hoja de mezclado en kg húmedos para tu carro, lista para imprimir','Mixer sheet in wet kg for your wagon, ready to print')}</li><li>${T('Ganancia esperada, costo por animal al día y por kg ganado','Expected gain, cost per head per day and per kg gained')}</li><li>${T('Días en corral y utilidad por cabeza','Days on feed and profit per head')}</li></ul>
      ${MODO==='prod'?'':`<button class="btn sm" data-vista="prod">${T('Usar vista productor','Use producer view')}</button>`}</div>
    <div class="vista ${MODO==='cien'?'on':''}"><h3>${ill('i-cien')}${T('Vista científica','Scientist view')}${MODO==='cien'?`<span class="tag">${T('activa','active')}</span>`:''}</h3>
      <p class="muted" style="margin:0">${T('Todo el modelo, para investigación, docencia y revisión por pares.','The whole model, for research, teaching and peer review.')}</p>
      <ul><li>${T('Ecuaciones del animal, factores de consumo y peso equivalente','Animal equations, intake factors and equivalent weight')}</li><li>${T('Modelo lineal explícito, iteraciones del ajuste energético y certificado de dualidad','Explicit linear model, energy-adjustment iterations and duality certificate')}</li><li>${T('Precios sombra y costos reducidos','Shadow prices and reduced costs')}</li><li>${T('Ganancia permitida por energía y por proteína; metano y nitrógeno','Energy- and protein-allowable gain; methane and nitrogen')}</li><li>${T('Energía neta observada (Zinn y Shen, 1998), validación y referencias APA','Observed net energy (Zinn and Shen, 1998), validation and APA references')}</li></ul>
      ${MODO==='cien'?'':`<button class="btn sm" data-vista="cien">${T('Usar vista científica','Use scientist view')}</button>`}</div>
  </div>

  <h2 class="section-t">${T('Lo nuevo en RatioBos','What’s new in RatioBos')}</h2>
  <p class="section-l">${T('Todo lo de RatioAvis, más lo que exige la nutrición de rumiantes.','Everything in RatioAvis, plus what ruminant nutrition demands.')}</p>
  <div class="inc">${nuevo.map((c,i)=>`<div class="card" style="margin:0;display:flex;gap:12px"><span class="num" style="flex:none;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent-text);font-weight:700">${i+1}</span><span><b>${c[0]}</b><br><span class="muted small">${c[1]}</span></span></div>`).join('')}</div>

  <h2 class="section-t">${T('Cómo funciona','How it works')}</h2>
  <p class="section-l">${T('Un recorrido guiado. Cada bloque explica la idea en palabras llanas, revisa tus datos y recomienda qué hacer después. La decisión siempre la tomas tú.','A guided path. Each block explains the idea in plain words, checks your data and suggests what to do next. You always make the decision.')}</p>
  <div class="howto">
    ${[[T('Animal','Animal'),T('tipo, biotipo y sexo','type, biotype and sex')],[T('Requerimientos','Requirements'),T('peso, meta y ecuaciones','weight, target, equations')],[T('Condiciones','Conditions'),T('clima, manejo y mercado','climate, management, market')],[T('Ingredientes','Ingredients'),T('disponibles y su matriz','available and their matrix')],[T('Precios','Prices'),T('costo local y límites','local cost and limits')],[T('Formulación','Formulation'),T('mínimo costo y ganancia','least cost and gain')],[T('Programa','Program'),T('días, costo y utilidad','days, cost and profit')],[T('Informe','Report'),T('PDF, mezcla y proyecto','PDF, mix and project')]].map((p,i)=>`<div><div class="k">${T('PASO','STEP')} ${i+1}</div><b>${p[0]}</b><span>${p[1]}</span></div>`).join('')}
  </div>

  <h2 class="section-t">${T('Qué incluye','What’s inside')}</h2>
  <p class="section-l">${T('Ocho bloques en orden, más la validación y el marco teórico. Pulsa una tarjeta para ir directo.','Eight blocks in order, plus validation and the theoretical framework. Tap a card to jump straight in.')}</p>
  <div class="inc">${inc.map(c=>`<button data-ir="${c[0]}"><span class="ib">${ill(c[1],'',c[1]==='i-steer'?BIOTIPOS[S.biotipo].estilo:'')}</span><span><h3>${c[2]}</h3><p>${c[3]}</p></span></button>`).join('')}</div>

  <div class="card" style="margin-top:28px">
    <h3>${T('Datos del proyecto','Project details')} <span class="muted small">(${T('opcional, aparecen en el informe','optional, shown in the report')})</span></h3>
    <div class="grid g3">
      <label class="f">${T('Nombre de la dieta','Diet name')}<input data-p="nombre" value="${esc(S.proyecto.nombre)}" placeholder="${T('p. ej. Finalización corral 4','e.g. Finishing pen 4')}"></label>
      <label class="f">${T('Responsable','Prepared by')}<input data-p="autor" value="${esc(S.proyecto.autor)}"></label>
      <label class="f">${T('Rancho o unidad de producción','Ranch or production unit')}<input data-p="rancho" value="${esc(S.proyecto.rancho)}"></label>
    </div>
  </div>

  <section class="why">
    <div>
      <h3>${T('Por qué existe','Why it exists')}</h3>
      <p class="muted" style="margin:0">${T('En bovinos no basta una tabla: lo que necesita un torete de 380 kg depende de su raza, de cuánto quieres que gane, del calor del corral y de la energía de la misma dieta que vas a darle. RatioBos pone las ecuaciones del animal, la economía del corral y la salud del rumen junto al número que las justifica, en el momento de decidir, y muestra con dietas publicadas qué tanto puedes confiar en el resultado.','In cattle a table is not enough: what a 380 kg bull needs depends on its breed, how much you want it to gain, pen heat and the energy of the very diet you will feed. RatioBos places animal equations, pen economics and rumen health next to the number that justifies them, right when the decision is made, and shows with published diets how far you can trust the result.')}</p>
    </div>
    <div class="cite">
      <div class="k">${T('SI LA USAS EN UN TRABAJO, CÍTALA','IF YOU USE IT IN YOUR WORK, PLEASE CITE IT')}</div>
      <p style="margin:0 0 10px" id="citaTxt">${cita}</p>
      <div class="row"><button class="btn ghost sm" id="copiarCita">⧉ ${T('Copiar referencia','Copy reference')}</button>${CONFIG.doi?`<a class="doi" href="https://doi.org/${CONFIG.doi}" target="_blank" rel="noopener"><span>DOI</span><span>${CONFIG.doi}</span></a>`:''}</div>
    </div>
  </section>
  ${siguiente('inicio')}`;
  $$('[data-p]',el).forEach(i=>i.addEventListener('input',()=>{ S.proyecto[i.dataset.p]=i.value; guardar(); }));
  $('#copiarCita',el).addEventListener('click',()=>{ try{ navigator.clipboard.writeText($('#citaTxt').innerText); toast(T('Referencia copiada','Reference copied')); }catch(_){} });
  setTimeout(()=>{ try{ const o = resumenOptim(), ne = resumenEnergia(); const a=$('#statVal'), b=$('#statNE'); if(a) a.textContent = `${o.ok}/${o.n}`; if(b) b.textContent = fmt(ne.mape,1)+' %'; }catch(e){} }, 30);
}

/* ================= BLOQUE 1 · ANIMAL ================= */
function nuevoAnimal(){ S.animal = animalInicial(S.cat, S.biotipo, S.sexo); aplicarRegion(S); cargarRequerimientos(S); S.programa=null; S.prog=null; }
function renderAnimal(el){
  const bio = BIOTIPOS[S.biotipo];
  el.innerHTML = `${cabecera('animal',T('Lo primero es saber a quién vas a alimentar. El tipo de animal decide qué ecuaciones usa el modelo (crecimiento o vaca); el biotipo y el sexo cambian el gasto de mantenimiento, el tamaño adulto y lo que lleva cada kilo ganado.','First, know whom you are feeding. The animal type decides which equations the model uses (growth or cow); biotype and sex change maintenance cost, mature size and what each kilo of gain carries.'))}
  ${teoriaDe(['animal','sistemaEN'])}
  <div class="card">
    <h3>${T('Tipo de animal','Animal type')}${ayuda('categoria')}</h3>
    <div class="opts">${Object.entries(CATEGORIAS).map(([k,c])=>`
      <label class="opt ${S.cat===k?'sel':''}"><input type="radio" name="cat" value="${k}" ${S.cat===k?'checked':''}>
      ${ill(c.ico,'oico big',bio.estilo+';transform:scale('+c.escala+')')}
      <b>${esc(tx(c.n))}</b><small style="clear:both">${esc(tx(c.desc))}</small>
      <div class="badge ${c.tipo==='crec'?'pri':'acc'}">${c.tipo==='crec'?T('Modelo de crecimiento','Growth model'):T('Modelo de vaca','Cow model')}</div></label>`).join('')}
    </div>
  </div>
  <div class="card">
    <h3>${T('Biotipo','Biotype')}${ayuda('biotipo')}</h3>
    <div class="opts">${Object.entries(BIOTIPOS).map(([k,b])=>`
      <label class="opt ${S.biotipo===k?'sel':''}"><input type="radio" name="bio" value="${k}" ${S.biotipo===k?'checked':''}>
      ${ill('i-steer','oico big',b.estilo)}
      <b>${esc(tx(b.n))}</b><small>${esc(tx(b.ej))}</small>
      <small style="margin-top:4px;clear:both">${esc(tx(b.desc))}</small>
      <div class="badge info">${T('Mantenimiento','Maintenance')} × ${fmt(b.fNEm,2)}</div></label>`).join('')}
    </div>
  </div>
  ${esCrec() && S.cat!=='vaquillas' ? `<div class="card">
    <h3>${T('Sexo','Sex')}${ayuda('sexo')}</h3>
    <div class="opts">${Object.entries(SEXOS).map(([k,x])=>`
      <label class="opt ${S.sexo===k?'sel':''}"><input type="radio" name="sexo" value="${k}" ${S.sexo===k?'checked':''}>
      <b>${esc(tx(x.n))}</b><small>${esc(tx(x.d))}</small></label>`).join('')}
    </div></div>` : ''}
  <div class="alert info"><b>${T('Fuente de las ecuaciones:','Source of the equations:')}</b> ${T('NASEM (2016), <i>Nutrient Requirements of Beef Cattle</i>, 8ª ed. revisada, y NRC (1996, 2000) para los ajustes por raza, sexo, ambiente, gestación y consumo. El peso, la meta y la gestación o la leche se capturan en el Bloque 3.','NASEM (2016), <i>Nutrient Requirements of Beef Cattle</i>, 8th rev. ed., and NRC (1996, 2000) for breed, sex, environment, pregnancy and intake adjustments. Weight, target and pregnancy or milk are entered in Block 3.')}</div>
  ${siguiente('animal')}`;
  $$('input[name=cat]',el).forEach(r=>r.addEventListener('change',()=>{ S.cat=r.value; if(S.cat==='vaquillas') S.sexo='vaquilla'; else if(S.sexo==='vaquilla' && S.cat!=='desarrollo' && S.cat!=='engorda') S.sexo='novillo'; nuevoAnimal(); guardar(); render(); toast(tx(CATEGORIAS[r.value].n)); }));
  $$('input[name=bio]',el).forEach(r=>r.addEventListener('change',()=>{ S.biotipo=r.value; const pv=S.animal.pv; nuevoAnimal(); S.animal.pv=pv; cargarRequerimientos(S); guardar(); render(); }));
  $$('input[name=sexo]',el).forEach(r=>r.addEventListener('change',()=>{ S.sexo=r.value; const pv=S.animal.pv, adg=S.animal.adg; nuevoAnimal(); S.animal.pv=pv; S.animal.adg=adg; cargarRequerimientos(S); guardar(); render(); }));
}

/* ================= BLOQUE 2 · PESO, META Y REQUERIMIENTOS ================= */
function tarjetasReq(info, ctx){
  const d = info.d, dmi = info.dmi, crec = ctx.crec;
  const t = [
    [T('Consumo de MS esperado','Expected DM intake'), fmt(dmi,2)+' kg/d', fmt(100*dmi/ctx.pv,2)+' % '+T('del peso vivo','of body weight'), 'dmi'],
    [T('ENm de mantenimiento','NEm for maintenance'), fmt(d.nemM,2)+' Mcal/d', T('mantener el peso','keep weight'), 'NEm'],
    crec ? [T('Energía retenida (ENg)','Retained energy (NEg)'), fmt(d.re,2)+' Mcal/d', fmt(ctx.adg,2)+' kg/d '+T('de ganancia','of gain'), 'NEg']
         : [T('Gestación + leche','Pregnancy + milk'), fmt(d.nemP+d.nel,2)+' Mcal/d', T('ENm equivalente','NEm equivalent'), 'leche'],
    [T('Proteína metabolizable','Metabolizable protein'), fmt(d.mp,0)+' g/d', crec?T(`${fmt(d.mpM,0)} mant. + ${fmt(d.mpG,0)} crec.`,`${fmt(d.mpM,0)} maint. + ${fmt(d.mpG,0)} growth`):T(`${fmt(d.mpM,0)} mant. + ${fmt(d.mpY+d.mpL,0)} prod.`,`${fmt(d.mpM,0)} maint. + ${fmt(d.mpY+d.mpL,0)} prod.`), 'PM'],
    [T('Calcio · fósforo','Calcium · phosphorus'), fmt(d.ca,1)+' · '+fmt(d.p,1)+' g/d', T('absorción 50 % y 68 %','50 % and 68 % absorption'), 'Ca']
  ];
  if(crec) t.push([T('Peso equivalente','Equivalent weight'), fmt(ctx.eqsbw,0)+' kg', T('SRW ','SRW ')+(S.animal.srw||478)+' kg', 'eqsbw']);
  return `<div class="req-d">${t.map(x=>`<div class="${x[3]==='eqsbw'?'sci':''}"><div class="l">${x[0]}${ayuda(x[3])}</div><div class="v">${x[1]}</div><div class="s">${x[2]}</div></div>`).join('')}</div>`;
}
function renderEtapa(el){
  const a = S.animal, ctx = contexto(S), info = requerimientos(ctx, {NEm:a.nemSup, TND:65}), crec = ctx.crec;
  const campo = (id, et, v, h, ay, extra='') => `<label class="f"><span>${et}${ayuda(ay)}</span><input id="${id}" value="${v??''}" inputmode="decimal" ${extra}>${h?`<span class="h">${h}</span>`:''}</label>`;
  const filas = NUTRIENTES.map(nu=>{
    const r = S.req[nu.k]||[null,null];
    return `<tr class="${KEYN.includes(nu.k)?'':'sci'}"><td>${esc(tx(nu.n))}${ayuda(nu.k)}</td><td class="muted">${nu.u}</td>
      <td class="r"><input class="num" data-req="${nu.k}" data-l="0" value="${r[0]??''}" placeholder="—" aria-label="min ${esc(tx(nu.n))}"></td>
      <td class="r"><input class="num" data-req="${nu.k}" data-l="1" value="${r[1]??''}" placeholder="—" aria-label="max ${esc(tx(nu.n))}"></td></tr>`;
  }).join('');
  el.innerHTML = `${cabecera('etapa',T('Con el peso del animal y lo que quieres lograr (ganancia, gestación o leche), RatioBos calcula sus requerimientos diarios con las ecuaciones de NASEM (2016) y los convierte en la concentración que debe tener cada kg de materia seca.','With the animal’s weight and what you want to achieve (gain, pregnancy or milk), RatioBos computes its daily requirements with the NASEM (2016) equations and turns them into the concentration each kg of dry matter must have.'))}
  ${teoriaDe(['requer','energia','proteina','minerales'])}
  <div class="card">
    <div class="row between"><h3 style="margin:0">${esc(etiquetaAnimal())}</h3><span class="badge pri">NASEM (2016)</span></div>
    <div class="grid g4" style="margin-top:12px">
      ${campo('a_pv',T('Peso vivo actual (kg)','Current live weight (kg)'),a.pv,'','pv')}
      ${crec && S.cat!=='vaquillas' ? campo('a_pf',T('Peso final de referencia (kg)','Reference final weight (kg)'),a.pf,T('a engrasamiento objetivo','at target fatness'),'pf') : ''}
      ${S.cat==='vaquillas' || !crec ? campo('a_mw',T('Peso adulto de la vaca (kg)','Mature cow weight (kg)'),a.mw,'','mw') : ''}
      ${crec ? campo('a_adg',T('Ganancia diaria objetivo (kg/d)','Target daily gain (kg/d)'),a.adg,'','adg') : ''}
      ${crec ? `<label class="f sci"><span>${T('Engrasamiento final (SRW)','Final fatness (SRW)')}${ayuda('srw')}</span><select id="a_srw">${Object.entries(SRW).map(([k,v])=>`<option value="${k}" ${+a.srw===+k?'selected':''}>${k} kg · ${esc(tx(v))}</option>`).join('')}</select></label>` : ''}
      ${S.cat==='gestacion' ? campo('a_dg',T('Días de gestación','Days pregnant'),a.diasGest,T('gestación total ≈ 283 d','total ≈ 283 d'),'diasGest') + campo('a_pn',T('Peso del becerro al nacer (kg)','Calf birth weight (kg)'),a.pn,'','pn') : ''}
      ${S.cat==='lactacion' ? campo('a_le',T('Leche (kg/d)','Milk (kg/d)'),a.leche,'','leche') + campo('a_gl',T('Grasa de la leche (%)','Milk fat (%)'),a.grasaL,'','grasaL','class="sci"') + campo('a_pl',T('Proteína de la leche (%)','Milk protein (%)'),a.protL,'','protL') : ''}
      ${campo('a_dmi',T('Consumo real de MS (kg/d)','Actual DM intake (kg/d)'),a.dmi,T('opcional; vacío = lo predice la app','optional; empty = predicted by the app'),'dmi')}
      <label class="f sci"><span>${T('ENm de la dieta supuesta (Mcal/kg)','Assumed diet NEm (Mcal/kg)')}${ayuda('nemSup')}</span><input id="a_nem" value="${a.nemSup}" inputmode="decimal"></label>
    </div>
  </div>
  <div class="card">
    <h3>${T('Requerimientos diarios por animal','Daily requirements per head')}${ayuda('reqDia')}</h3>
    ${tarjetasReq(info, ctx)}
    ${info.sinEnergia?`<div class="alert bad">${T('Con este consumo, la energía apenas alcanza para mantenimiento: baja la meta de ganancia o captura un consumo mayor.','At this intake, energy barely covers maintenance: lower the gain target or enter a higher intake.')}</div>`:''}
    <div class="sci"><h4>${T('Factores de ajuste del consumo','Intake adjustment factors')}${ayuda('dmi')}</h4>
      <div class="chips">${info.factores.map(([k,v])=>`<span class="chip">${esc(nombreFactor(k))} × ${fmt(v,2)}</span>`).join('')}</div></div>
  </div>
  <div class="card">
    <div class="row between" style="margin-bottom:8px">
      <h3 style="margin:0">${T('Concentración por kg de materia seca','Concentration per kg of dry matter')} ${S.reqEditado?`<span class="badge warn">${T('editados','edited')}</span>`:`<span class="badge pri">${T('según el animal','from the animal')}</span>`}</h3>
      <button class="btn ghost sm" id="restaurar">↺ ${T('Recalcular con el animal','Recompute from the animal')}</button>
    </div>
    <p class="small muted" style="margin-top:0">${T('Deja la casilla vacía para no restringir. Energía, proteína metabolizable, Ca y P salen de las ecuaciones; forraje, fibra, grasa, azufre y sodio son límites prácticos del tipo de animal. Al formular, la energía y el consumo se ajustan solos a la dieta (si no editas la tabla).','Leave a cell empty for no constraint. Energy, metabolizable protein, Ca and P come from the equations; forage, fiber, fat, sulfur and sodium are practical limits for the animal type. When formulating, energy and intake self-adjust to the diet (unless you edit the table).')}</p>
    <p class="small prod" style="margin-top:0">${T('Vista productor: se muestran los 8 nutrientes clave. Los demás se siguen respetando al formular.','Producer view: the 8 key nutrients are shown. The rest are still enforced when formulating.')}</p>
    <div class="tbl"><table>
      <thead><tr><th>${T('Nutriente','Nutrient')}</th><th>${T('Unidad','Unit')}</th><th class="r">${T('Mínimo','Minimum')}${ayuda('minmax')}</th><th class="r">${T('Máximo','Maximum')}</th></tr></thead>
      <tbody>${filas}</tbody></table></div>
  </div>
  ${siguiente('etapa')}`;
  const map = {a_pv:'pv',a_pf:'pf',a_mw:'mw',a_adg:'adg',a_dg:'diasGest',a_pn:'pn',a_le:'leche',a_gl:'grasaL',a_pl:'protL',a_dmi:'dmi',a_nem:'nemSup'};
  Object.entries(map).forEach(([id,k])=>{ const i=$('#'+id,el); if(i) i.addEventListener('change',()=>{ const v=num(i.value); S.animal[k] = k==='dmi' ? v : (v??S.animal[k]); if(k==='nemSup') S.animal.nemSup = Math.min(2.6,Math.max(0.9,S.animal.nemSup)); cargarRequerimientos(S); S.programa=null; guardar(); render(); }); });
  const sr = $('#a_srw',el); if(sr) sr.addEventListener('change',()=>{ S.animal.srw=+sr.value; cargarRequerimientos(S); guardar(); render(); });
  $$('[data-req]',el).forEach(i=>i.addEventListener('change',()=>{ S.req[i.dataset.req][+i.dataset.l]=num(i.value); S.reqEditado=true; S.resultado=null; guardar(); }));
  $('#restaurar').addEventListener('click',()=>{ cargarRequerimientos(S); guardar(); render(); toast(T('Requerimientos recalculados','Requirements recomputed')); });
}
function nombreFactor(k){ return ({raza:T('Raza','Breed'),grasa:T('Engrasamiento','Body fat'),implante:T('Sin implante','No implant'),ionoforo:T('Ionóforo','Ionophore'),temperatura:T('Temperatura','Temperature'),lodo:T('Lodo','Mud')})[k]||k; }

/* ================= BLOQUE 3 · CONDICIONES ================= */
function renderCondiciones(el){
  const c = S.cond, rec = [], ctx = contexto(S);
  if(+c.tAct>25) rec.push({t:'warn', h:T(`Calor: ${c.tAct} °C de temperatura media`,`Heat: ${c.tAct} °C mean temperature`), p:T('El consumo esperado baja '+(+c.tAct>35&&!c.noche?'35':'10')+' %. Sombra (2–4 m² por animal), agua fresca abundante, alimentar en las horas frescas y concentrar un poco más la dieta. La grasa genera menos calor metabólico que la fibra.','Expected intake drops '+(+c.tAct>35&&!c.noche?'35':'10')+' %. Shade (2–4 m² per head), plenty of cool water, feed in cool hours and slightly concentrate the diet. Fat produces less metabolic heat than fiber.')});
  if(c.jadeo!=='no') rec.push({t:'bad', h:T('Estrés calórico con jadeo','Heat stress with panting'), p:T(`El mantenimiento sube ${c.jadeo==='abierta'?'18':'7'} %. Aspersión o ventilación, revisar bebederos y no mover al ganado en las horas de calor.`,`Maintenance rises ${c.jadeo==='abierta'?'18':'7'} %. Sprinklers or fans, check waterers and do not move cattle in the heat of the day.`)});
  if(+c.tPrev<15) rec.push({t:'info', h:T('Frío de aclimatación','Cold acclimation'), p:T('Con un mes previo frío el mantenimiento sube; la dieta necesitará más energía para la misma ganancia.','After a cold previous month maintenance rises; the diet will need more energy for the same gain.')});
  if(+c.lodo>5) rec.push({t:'warn', h:T(`Lodo de ${c.lodo} cm`,`${c.lodo} cm of mud`), p:T('Reduce el consumo y la ganancia. Rastrear el corral, montículos y pendiente para drenar.','Reduces intake and gain. Scrape the pen, build mounds and slope for drainage.')});
  if(!rec.length) rec.push({t:'ok', h:T('Condiciones de confort','Comfort conditions'), p:T('Sin ajustes especiales por ambiente.','No special environmental adjustments.')});
  const sw = (id, on, txt) => `<label class="row" style="color:var(--text);gap:8px"><input type="checkbox" id="${id}" ${on?'checked':''}> ${txt}</label>`;
  el.innerHTML = `${cabecera('condiciones',T('Implantes, ionóforos y el tamaño del lote cambian lo que el animal come y rinde; los precios de compra y venta deciden si el negocio deja utilidad. Estos datos entran directo al modelo y al Programa.','Implants, ionophores and group size change what the animal eats and yields; purchase and sale prices decide whether the business pays. These inputs go straight into the model and the Program.'))}
  ${teoriaDe(['aditivos','economia'])}
  <div class="card soft"><div class="row between"><h3 style="margin:0">${T('Ambiente de tu región','Your region’s environment')}</h3><button class="btn ghost sm" data-ir="region">${T('Cambiar en el Bloque 2','Change in Block 2')}</button></div>
    <div class="chips" style="margin-top:10px"><span class="chip">${esc(tx(REGIONES[S.region].n))} · ${esc(tx(TEMPORADAS[S.temporada]))}</span><span class="chip">${fmt(c.tAct,0)} °C · ${fmt(c.hr,0)} % HR</span><span class="chip">${T('ITH','THI')} ${fmt(c.ith,1)} → ${T('efectivo','effective')} ${fmt(c.ithEf,1)}</span><span class="chip">${T('Lodo','Mud')} ${fmt(c.lodo,0)} cm</span><span class="chip">${esc(tx(SISTEMAS[c.sistema].n))}</span></div></div>
  <div class="card"><h3>${T('Manejo','Management')}</h3><div class="grid g4">
    <div class="f" style="font-size:14px;color:var(--muted)">${T('Promotores','Growth promoters')}${ayuda('implante')}${sw('c_im',c.implante,T('Implante anabólico','Anabolic implant'))}</div>
    <div class="f" style="font-size:14px;color:var(--muted)">${T('Aditivo','Additive')}${ayuda('ionoforo')}${sw('c_io',c.ionoforo,T('Ionóforo (monensina, lasalocida)','Ionophore (monensin, lasalocid)'))}</div>
    <label class="f"><span>${T('Animales en el lote','Head in the group')}${ayuda('cabezas')}</span><input type="number" id="c_ca" value="${c.cabezas}"></label>
    <label class="f"><span>${T('Carga del carro mezclador (kg TCO)','Mixer wagon load (kg as fed)')}${ayuda('mezcla')}</span><input type="number" id="c_me" value="${c.mezcla}"></label>
  </div></div>
  <div class="card"><h3>${T('Sanidad y aditivos','Health and additives')}${ayuda('medic')}</h3><div class="grid g4">
    <label class="f"><span>${T('Dosis de ionóforo (mg/kg MS)','Ionophore dose (mg/kg DM)')}</span><input type="number" id="m_ion" value="${c.med.ionDosis}" ${c.ionoforo?'':'disabled'}></label>
    <label class="f"><span>${T('Antibiótico en el alimento','In-feed antibiotic')}</span><select id="m_ab"><option value="ninguno" ${c.med.antib==='ninguno'?'selected':''}>${T('Ninguno','None')}</option><option value="virginiamicina" ${c.med.antib==='virginiamicina'?'selected':''}>${T('Virginiamicina','Virginiamycin')}</option><option value="tilosina" ${c.med.antib==='tilosina'?'selected':''}>${T('Tilosina','Tylosin')}</option></select></label>
    <label class="f"><span>${T('Dosis del antibiótico (mg/kg MS)','Antibiotic dose (mg/kg DM)')}</span><input type="number" id="m_abd" value="${c.med.antibDosis}"></label>
    <label class="f"><span>${T('β-agonista al final','β-agonist at the end')}</span><select id="m_be"><option value="ninguno" ${c.med.beta==='ninguno'?'selected':''}>${T('Ninguno','None')}</option><option value="zilpaterol" ${c.med.beta==='zilpaterol'?'selected':''}>${T('Zilpaterol','Zilpaterol')}</option><option value="ractopamina" ${c.med.beta==='ractopamina'?'selected':''}>${T('Ractopamina','Ractopamine')}</option></select></label>
    <label class="f"><span>${T('Dosis (mg/kg MS) · días','Dose (mg/kg DM) · days')}</span><span class="row" style="flex-wrap:nowrap;gap:6px"><input type="number" id="m_bed" value="${c.med.betaDosis}"><input type="number" id="m_bdi" value="${c.med.betaDias}"></span></label>
    <label class="f"><span>${T('Implantes por animal','Implants per head')}</span><input type="number" id="m_imp" value="${c.med.implantes}" ${c.implante?'':'disabled'}></label>
    <label class="f"><span>${T('Desparasitaciones','Dewormings')}</span><input type="number" id="m_des" value="${c.med.desparas}"></label>
    <label class="f"><span>${T('Vacunas (dosis)','Vaccines (doses)')}</span><input type="number" id="m_vac" value="${c.med.vacunas}"></label>
  </div><p class="small muted">${T('No cambian la ración: alimentan el inventario de medicamentos del Bloque 10. El clenbuterol está prohibido en México; los β-agonistas autorizados exigen respetar su retiro antes del sacrificio.','They do not change the ration: they feed the medicine inventory in Block 10. Clenbuterol is banned in Mexico; authorized β-agonists require their withdrawal period before slaughter.')}</p></div>
  <div class="card"><h3>${T('Mercado','Market')}</h3><div class="grid g4">
    <label class="f">${T('Moneda (símbolo)','Currency (symbol)')}<input id="c_mon" value="${esc(S.moneda)}" maxlength="4"></label>
    ${esCrec()?`<label class="f"><span>${T('Precio de compra ($/kg en pie)','Purchase price ($/kg live)')}${ayuda('compra')}</span><input type="number" id="c_pc" value="${c.comprakg}"></label>
    <label class="f"><span>${T('Precio de venta ($/kg en pie)','Sale price ($/kg live)')}${ayuda('venta')}</span><input type="number" id="c_pv" value="${c.ventakg}"></label>`:''}
    <label class="f"><span>${T('Otros costos ($/animal/día)','Other costs ($/head/day)')}${ayuda('otrosDia')}</span><input type="number" id="c_ot" value="${c.otrosDia}"></label>
  </div></div>
  ${rec.map(r=>`<div class="alert ${r.t}"><b>${esc(r.h)}</b><p>${esc(r.p)}</p></div>`).join('')}
  <div class="card sci"><h3>${T('Ajustes aplicados al modelo','Adjustments applied to the model')}</h3>
    <div class="chips"><span class="chip">${T('ENm mantenimiento','Maintenance NEm')}: ${fmt(ctx.nemM,2)} Mcal/d</span><span class="chip">a₂ = ${fmt(ctx.a2,4)}</span><span class="chip">${T('Jadeo','Panting')} × ${fmt(ctx.jadeo,2)}</span><span class="chip">${T('ENm de la dieta','Diet NEm')} × ${fmt(ctx.fIon,2)} (${T('ionóforo','ionophore')})</span>
    ${factoresDMI(ctx).map(([k,v])=>`<span class="chip">${T('Consumo','Intake')} · ${esc(nombreFactor(k))} × ${fmt(v,2)}</span>`).join('')}</div></div>
  ${siguiente('condiciones')}`;
  const set = (id,k)=>{ const i=$(id,el); if(i) i.addEventListener('change',e=>{ S.cond[k]=num(e.target.value)??0; cargarRequerimientos(S); S.programa=null; guardar(); render(); }); };
  [['#m_ion','ionDosis'],['#m_abd','antibDosis'],['#m_bed','betaDosis'],['#m_bdi','betaDias'],['#m_imp','implantes'],['#m_des','desparas'],['#m_vac','vacunas']].forEach(([id,k])=>$(id,el).addEventListener('change',e=>{ S.cond.med[k]=num(e.target.value)||0; guardar(); }));
  [['#m_ab','antib'],['#m_be','beta']].forEach(([id,k])=>$(id,el).addEventListener('change',e=>{ S.cond.med[k]=e.target.value; guardar(); }));
  set('#c_ca','cabezas'); set('#c_me','mezcla'); set('#c_pc','comprakg'); set('#c_pv','ventakg'); set('#c_ot','otrosDia');
  [['#c_im','implante'],['#c_io','ionoforo']].forEach(([id,k])=>$(id,el).addEventListener('change',e=>{ S.cond[k]=e.target.checked; cargarRequerimientos(S); S.programa=null; guardar(); render(); }));
  $('#c_mon',el).addEventListener('change',e=>{ S.moneda=e.target.value||'$'; guardar(); });
}

/* ================= BLOQUE 4 · INGREDIENTES ================= */
let ingDetalle = null;
function renderIngredientes(el){
  const nSel = S.ingredientes.filter(i=>S.sel[i.id]).length;
  const filas = CATS.map(cat=>{
    const lista = S.ingredientes.filter(i=>i.cat===cat); if(!lista.length) return '';
    return `<tr class="cat"><td colspan="12">${esc(tx(CAT[cat]))}</td></tr>` + lista.map(i=>`
      <tr><td><label class="row" style="gap:8px;flex-wrap:nowrap"><input type="checkbox" data-sel="${i.id}" ${S.sel[i.id]?'checked':''}> ${esc(tx(i.nombre))}</label></td>
      <td class="r">${fmt(i.comp.MS,0)}</td><td class="r sci">${fmt(i.comp.TND,0)}</td><td class="r">${fmt(i.comp.NEm,2)}</td><td class="r">${fmt(i.comp.NEg,2)}</td><td class="r">${fmt(i.comp.PC,1)}</td>
      <td class="r sci">${fmt(i.comp.PDR,0)}</td><td class="r">${fmt(i.comp.FDN,0)}</td><td class="r sci">${fmt(valorNut(i,'FDNef'),0)}</td><td class="r sci">${fmt(i.comp.EE,1)}</td>
      <td class="small muted wrap" style="min-width:200px">${esc(tx(i.nota)||'')}</td>
      <td><button class="btn ghost sm" data-det="${i.id}">${T('Editar','Edit')}</button></td></tr>`).join('');
  }).join('');
  el.innerHTML = `${cabecera('ingredientes',T('Marca los alimentos que realmente puedes conseguir. Todos los valores están en base seca: así se comparan forrajes, ensilajes y granos con justicia. Si tienes análisis de laboratorio, cámbialos con Editar.','Tick the feeds you can actually get. All values are on a dry basis: the fair way to compare forages, silages and grains. If you have laboratory analyses, change them with Edit.'))}
  ${teoriaDe(['ingredientes'])}
  <div class="alert info small">${T('Seleccionados','Selected')}: <b>${nSel}</b>. ${T('Composición en base seca de Beck, Lalman y Moehlenpah (2024, Oklahoma State University), con valores de NASEM (2016).','Dry-basis composition from Beck, Lalman and Moehlenpah (2024, Oklahoma State University), with NASEM (2016) values.')}${ayuda('MS')}</div>
  <div class="card hide" id="detalle"></div>
  <div class="card">
    <div class="row between" style="margin-bottom:10px">
      <h3 style="margin:0">${T('Biblioteca de ingredientes','Ingredient library')}</h3>
      <span class="row"><input id="nuevoNombre" placeholder="${T('Nombre del nuevo ingrediente','New ingredient name')}" style="max-width:250px"><button class="btn sm" id="nuevo">+ ${T('Agregar','Add')}</button></span>
    </div>
    <div class="tbl"><table>
      <thead><tr><th>${T('Ingrediente','Ingredient')}</th><th class="r">MS %${ayuda('MS')}</th><th class="r sci">${T('TND','TDN')} %${ayuda('TND')}</th><th class="r">ENm${ayuda('NEm')}</th><th class="r">ENg${ayuda('NEg')}</th><th class="r">${T('PC','CP')} %${ayuda('PC')}</th><th class="r sci">${T('PDR','RDP')} %PC${ayuda('PDR')}</th><th class="r">${T('FDN','NDF')} %${ayuda('FDN')}</th><th class="r sci">${T('FDNfe','peNDF')} %${ayuda('FDNef')}</th><th class="r sci">EE %${ayuda('EE')}</th><th>${T('Notas','Notes')}</th><th></th></tr></thead>
      <tbody>${filas}</tbody></table></div>
    <p class="small muted">${T('ENm y ENg en Mcal/kg de MS.','NEm and NEg in Mcal/kg DM.')}</p>
  </div>
  ${siguiente('ingredientes')}`;
  $$('[data-sel]',el).forEach(c=>c.addEventListener('change',()=>{ S.sel[c.dataset.sel]=c.checked; S.resultado=null; S.programa=null; guardar(); render(); }));
  $$('[data-det]',el).forEach(bn=>bn.addEventListener('click',()=>{ ingDetalle=bn.dataset.det; pintarDetalle(); $('#detalle').scrollIntoView({behavior:'smooth',block:'start'}); }));
  $('#nuevo',el).addEventListener('click',()=>{
    const nombre = $('#nuevoNombre').value.trim() || T('Ingrediente nuevo','New ingredient');
    const id = 'c'+Date.now().toString(36);
    const comp = {}; ING_COLS.forEach(k=>comp[k]=0); comp.MS=90;
    S.ingredientes.push({id, nombre, cat:'per', comp, precio:0, min:0, max:100, nota:{es:'Captura su composición en base seca.',en:'Enter its dry-basis composition.'}, custom:true});
    S.sel[id]=true; ingDetalle=id; guardar(); render(); toast(T('Ingrediente agregado','Ingredient added'));
  });
  pintarDetalle();
}
function pintarDetalle(){
  const box = $('#detalle'); if(!box) return;
  const ing = S.ingredientes.find(i=>i.id===ingDetalle);
  if(!ing){ box.classList.add('hide'); return; }
  box.classList.remove('hide');
  const campos = [['MS',T('Materia seca','Dry matter'),'%'],['TND',T('TND','TDN'),'% MS'],['NEm',T('ENm','NEm'),'Mcal/kg MS'],['NEg',T('ENg','NEg'),'Mcal/kg MS'],['PC',T('Proteína cruda','Crude protein'),'% MS'],['PDR',T('PDR','RDP'),'% PC'],['FDN',T('FDN','NDF'),'% MS'],['pef',T('Factor de efectividad','Effectiveness factor'),'0–1'],['EE',T('Extracto etéreo','Ether extract'),'% MS'],['Ca',T('Calcio','Calcium'),'% MS'],['P',T('Fósforo','Phosphorus'),'% MS'],['S',T('Azufre','Sulfur'),'% MS'],['Na',T('Sodio','Sodium'),'% MS']];
  box.innerHTML = `<div class="row between"><h3 style="margin:0">${T('Composición','Composition')}: ${esc(tx(ing.nombre))}</h3><span class="row">${ing.custom?`<button class="btn danger sm" id="borrarIng">${T('Eliminar','Delete')}</button>`:`<button class="btn ghost sm" id="resetIng">↺ ${T('Valores de tabla','Table values')}</button>`}<button class="btn sm" id="cerrarDet">${T('Cerrar','Close')}</button></span></div>
    <div class="grid g4" style="margin-top:12px">
      <label class="f">${T('Nombre','Name')}<input data-campo="nombre" value="${esc(tx(ing.nombre))}"></label>
      <label class="f">${T('Categoría','Category')}<select data-campo="cat">${CATS.map(c=>`<option value="${c}" ${c===ing.cat?'selected':''}>${esc(tx(CAT[c]))}</option>`).join('')}</select></label>
      ${campos.map(([k,n,u])=>`<label class="f"><span>${n} (${u})${ayuda(k==='pef'?'pef':k)}</span><input data-comp="${k}" value="${ing.comp[k]}" inputmode="decimal"></label>`).join('')}
    </div>
    <h4 class="sci">${T('Huella ambiental por kg de MS','Environmental footprint per kg DM')}${ayuda('huellaIng')}</h4>
    <div class="grid g4 sci">
      <label class="f">kg CO₂e<input data-env="co2" value="${(ing.env||envDe(ing.id)).co2}" inputmode="decimal"></label>
      <label class="f">${T('Agua (L)','Water (L)')}<input data-env="agua" value="${(ing.env||envDe(ing.id)).agua}" inputmode="decimal"></label>
      <label class="f">${T('Suelo (m²·año)','Land (m²·yr)')}<input data-env="suelo" value="${(ing.env||envDe(ing.id)).suelo}" inputmode="decimal"></label>
    </div>
    <p class="small muted">${T('Las categorías de forraje y ensilaje cuentan como forraje en la dieta. La grasa no aporta energía a los microbios del rumen.','Forage and silage categories count as dietary forage. Fat supplies no energy to rumen microbes.')}</p>`;
  $$('[data-env]',box).forEach(i=>i.addEventListener('change',()=>{ ing.env = ing.env||envDe(ing.id); ing.env[i.dataset.env]=num(i.value)||0; guardar(); }));
  $$('[data-comp]',box).forEach(i=>i.addEventListener('change',()=>{ ing.comp[i.dataset.comp]=num(i.value)||0; S.resultado=null; guardar(); }));
  $$('[data-campo]',box).forEach(i=>i.addEventListener('change',()=>{ ing[i.dataset.campo]=i.value; guardar(); render(); }));
  $('#cerrarDet').addEventListener('click',()=>{ ingDetalle=null; pintarDetalle(); });
  const bb = $('#borrarIng'); if(bb) bb.addEventListener('click',()=>{ S.ingredientes=S.ingredientes.filter(i=>i.id!==ing.id); delete S.sel[ing.id]; ingDetalle=null; guardar(); render(); });
  const rb = $('#resetIng'); if(rb) rb.addEventListener('click',()=>{ const n=ingDesdeLib(ING_LIB.find(x=>x[0]===ing.id)); ing.comp=n.comp; ing.nombre=n.nombre; ing.cat=n.cat; guardar(); render(); });
}

/* ================= BLOQUE 5 · PRECIOS ================= */
function renderPrecios(el){
  const sel = S.ingredientes.filter(i=>S.sel[i.id]);
  el.innerHTML = `${cabecera('precios',T('Escribe el precio que pagas por kg puesto en el rancho, tal como lo compras. La app lo convierte a precio por kg de materia seca, que es lo que se compara y se minimiza. Los precios precargados son solo ejemplos.','Enter the price you pay per kg delivered to the ranch, as you buy it. The app converts it to price per kg of dry matter, which is what gets compared and minimized. Preloaded prices are only examples.'))}
  ${teoriaDe(['limites'])}
  ${sel.length?'':`<div class="empty">${ill('i-sack')}<p>${T('No hay ingredientes seleccionados. Regresa al Bloque 5.','No ingredients selected. Go back to Block 5.')}</p></div>`}
  <div class="card">
    <div class="row between" style="margin-bottom:10px"><h3 style="margin:0">${T('Precios y límites','Prices and limits')} · ${sel.length} ${T('ingredientes','ingredients')}</h3><span class="small muted">${T('Límites en % de la materia seca','Limits in % of dry matter')}</span></div>
    <div class="tbl"><table>
      <thead><tr><th>${T('Ingrediente','Ingredient')}</th><th class="r">${esc(S.moneda)}/kg ${T('TCO','AF')}${ayuda('precio')}</th><th class="r">${esc(S.moneda)}/kg MS${ayuda('precioMS')}</th><th class="r">${T('Mínimo','Minimum')} %${ayuda('incl')}</th><th class="r">${T('Máximo','Maximum')} %</th><th class="r">${esc(S.moneda)} ${T('por Mcal ENg','per Mcal NEg')}${ayuda('pMcal')}</th><th class="r">${esc(S.moneda)} ${T('por kg PC','per kg CP')}${ayuda('ppc')}</th></tr></thead>
      <tbody>${sel.map(i=>`<tr>
        <td>${esc(tx(i.nombre))}</td>
        <td class="r"><input class="num" data-pr="${i.id}" data-f="precio" value="${i.precio}"></td>
        <td class="r muted" data-pms="${i.id}">${fmt(precioMS(i),2)}</td>
        <td class="r"><input class="num" data-pr="${i.id}" data-f="min" value="${i.min??0}"></td>
        <td class="r"><input class="num" data-pr="${i.id}" data-f="max" value="${i.max??''}"></td>
        <td class="r muted">${i.comp.NEg>0?fmt(precioMS(i)/i.comp.NEg,2):'—'}</td>
        <td class="r muted">${i.comp.PC>0?fmt(precioMS(i)/(i.comp.PC/100),2):'—'}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted">${T('TCO = tal como se ofrece (húmedo). Para fijar una inclusión exacta (p. ej. premezcla 0.3 %) escribe el mismo valor en mínimo y máximo.','AF = as fed (wet). To fix an exact inclusion (e.g. premix 0.3 %) enter the same value as minimum and maximum.')}</p>
  </div>
  ${siguiente('precios')}`;
  $$('[data-pr]',el).forEach(inp=>inp.addEventListener('change',()=>{
    const ing = S.ingredientes.find(i=>i.id===inp.dataset.pr); const v = num(inp.value);
    ing[inp.dataset.f] = inp.dataset.f==='max' ? v : (v||0);
    if(inp.dataset.f==='precio'){ const td=$(`[data-pms="${ing.id}"]`); if(td) td.textContent=fmt(precioMS(ing),2); }
    S.resultado=null; S.programa=null; guardar();
  }));
}
