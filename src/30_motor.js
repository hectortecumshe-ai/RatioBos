"use strict";
/* =====================================================================
   5. MOTOR DE CÁLCULO / CALCULATION ENGINE
   Sistema de energía neta de California (Lofgreen y Garrett, 1968) con las
   ecuaciones de NRC (1996, 2000) y NASEM (2016); proteína metabolizable
   con la síntesis microbiana de Galyean y Tedeschi (2014), adoptada por NASEM (2016).
   ===================================================================== */
const P75 = x => Math.pow(Math.max(x,0), 0.75);
const ME_TND = 0.82*4.409/100;            // EM (Mcal/kg) = 0.82 × ED; ED = 4.409 × TND/100
const MCP_A = 42.73, MCP_B = 0.087;        // PCM (g/d) = 42.73 + 0.087 × TND consumido (g/d)
const MP_MCP = 0.64, D_RUP = 0.80;         // PM = 0.64·PCM + 0.80·PNDR

/* ---------- aporte de un ingrediente (base seca) ---------- */
function tndMic(ing){ return ing.cat==='gras' ? 0 : (ing.comp.TND||0); }   // los microbios no crecen con la grasa
function valorNut(ing, k){
  const c = ing.comp;
  switch(k){
    case 'PM':   return MP_MCP*MCP_B*tndMic(ing)*10 + (c.PC||0)*10*(1-(c.PDR||0)/100)*D_RUP;
    case 'PDRb': return (c.PC||0)*10*(c.PDR||0)/100 - MCP_B*tndMic(ing)*10;
    case 'PDR':  return (c.PC||0)*(c.PDR||0)/100;
    case 'FDNef':return (c.FDN||0)*(c.pef||0);
    case 'For':  return ES_FORRAJE(ing.cat) ? 100 : 0;
    default:     return c[k]||0;
  }
}
/* término constante de la síntesis microbiana, por kg de MS, según el consumo */
function constante(k, dmi){
  if(!dmi) return 0;
  if(k==='PM') return MP_MCP*MCP_A/dmi;
  if(k==='PDRb') return -MCP_A/dmi;
  return 0;
}
const precioMS = ing => (+ing.precio||0) / Math.max((ing.comp.MS||100)/100, 0.01);

/* Aporte de una fórmula {id: % de la MS} */
function analizar(formula, ingredientes, dmi){
  const nutr = {}; let costo = 0, suma = 0, tco = 0;
  NUTRIENTES.forEach(n=>nutr[n.k]=0);
  for(const id in formula){
    const pct = +formula[id]||0; if(!pct) continue;
    const ing = ingredientes.find(i=>i.id===id); if(!ing) continue;
    suma += pct; costo += pct*precioMS(ing)/100; tco += pct/Math.max(ing.comp.MS||100,0.01);
    NUTRIENTES.forEach(n=>{ nutr[n.k] += pct*valorNut(ing,n.k)/100; });
  }
  if(suma>0) for(const k of ['PM','PDRb']) nutr[k] += constante(k,dmi)*suma/100;
  let ym = 0, ge = 0; for(const id in formula){ const pct=+formula[id]||0, ing=ingredientes.find(i=>i.id===id); if(!pct||!ing||typeof ymIng!=='function') continue; ym += pct*ymIng(ing); ge += pct; }
  nutr.Ym = ge>0 ? ym/ge : null;
  return {nutr, costoKg:costo, suma, msDieta: tco>0 ? suma/tco : 0};
}

/* ---------- el animal / the animal ---------- */
function contexto(s){
  const C = CATEGORIAS[s.cat], B = BIOTIPOS[s.biotipo], X = SEXOS[s.sexo]||SEXOS.novillo, a = s.animal, c = s.cond;
  const vaca = C.tipo==='vaca', crec = !vaca;
  const sbw = 0.96*(+a.pv||0);
  const fsbw = 0.96*(+(s.cat==='vaquillas' ? a.mw : a.pf)||1);
  const eqsbw = crec ? sbw*(+a.srw||478)/fsbw : sbw;
  const fSexo = crec ? X.fNEm : 1;
  const lact = s.cat==='lactacion';
  const a2 = 0.0007*(20-(+c.tPrev||20));            // ajuste por aclimatación térmica (NRC, 1996)
  const jadeo = c.jadeo==='abierta' ? 1.18 : c.jadeo==='rapido' ? 1.07 : 1;
  const fAct = (SISTEMAS[c.sistema]||SISTEMAS.corral).fAct;   // actividad en pastoreo (NRC, 1996: +10 a +20 %)
  const nemM = ((0.077*B.fNEm*fSexo*(lact?1.2:1)) + a2) * P75(sbw) * jadeo * fAct;
  return { s, C, B, X, vaca, crec, lact, gest: s.cat==='gestacion' || (lact && false),
    pv:+a.pv, sbw, fsbw, eqsbw, adg: crec ? (+a.adg||0) : 0, nemM, a2, jadeo, fAct,
    fIon: c.ionoforo ? 1.12 : 1,                      // ionóforo: +12 % al valor de ENm de la dieta (NRC, 1996)
    t: +a.diasGest||0, pn:+a.pn||0, leche: lact ? (+a.leche||0) : 0, grasaL:+a.grasaL||4, protL:+a.protL||3.4,
    dmiFijo: a.dmi ? +a.dmi : null };
}
/* Factores de ajuste del consumo (NRC, 1996; NASEM, 2016) */
function factoresDMI(ctx){
  const c = ctx.s.cond, f = [];
  f.push(['raza', ctx.B.fDMI||1]);
  if(ctx.crec){
    const e = ctx.eqsbw; let ebf = 1;
    if(e>350) ebf = e<=400 ? 1-(e-350)/50*0.03 : e<=450 ? 0.97-(e-400)/50*0.07 : e<=500 ? 0.90-(e-450)/50*0.08 : e<=550 ? 0.82-(e-500)/50*0.09 : 0.73;
    f.push(['grasa', ebf]);
    if(!c.implante) f.push(['implante', 0.94]);
  }
  if(c.ionoforo) f.push(['ionoforo', 0.97]);
  const t = +c.tAct; let ft = 1;
  if(t>35) ft = c.noche ? 0.90 : 0.65; else if(t>25) ft = 0.90; else if(t>=15) ft = 1; else if(t>=5) ft = 1.03; else if(t>=-5) ft = 1.05; else if(t>=-15) ft = 1.07; else ft = 1.16;
  f.push(['temperatura', ft]);
  if(+c.lodo>0) f.push(['lodo', Math.max(0.5, 1-0.01*(+c.lodo))]);
  return f;
}
function dmiPredicho(ctx, nem){
  const N = Math.max(0.8, nem||1.5), w = P75(ctx.sbw);
  let d;
  if(ctx.crec){ const k = ctx.C.dmi==='becerro' ? 0.0869 : 0.1128; d = w*(0.2435*N - 0.0466*N*N - k)/N; }
  else d = w*(0.04997*N*N + (ctx.lact ? 0.04631 : 0.03840))/N + 0.2*ctx.leche;
  return Math.max(0.5, d*factoresDMI(ctx).reduce((a,x)=>a*x[1],1));
}
/* Gestación (NRC, 1996): EM para el útero grávido y proteína del feto */
function gestacion(t, pn){
  if(t<=0) return {me:0, mp:0};
  const me = pn*(0.4504-0.000766*t)*Math.exp((0.03233-0.0000275*t)*t)/1000;
  const tp = pn*(0.001669-0.00000211*t)*Math.exp((0.0278-0.0000176*t)*t)*6.25;
  return {me:Math.max(0,me), mp:Math.max(0,tp/0.65)};
}
/* Crecimiento (NASEM, 2016): energía y proteína retenidas */
const reCrec = (eqsbw, swg) => swg>0 ? 0.0635*P75(0.891*eqsbw)*Math.pow(0.956*swg,1.097) : 0;
const swgDeRE = (eqsbw, re) => re>0 ? 13.91*Math.pow(re,0.9116)*Math.pow(eqsbw,-0.6837) : 0;
const npgCrec = (swg, re) => swg>0 ? swg*(268-29.4*re/swg) : 0;
const effPM = eqsbw => eqsbw<=300 ? 0.834-0.00114*eqsbw : 0.492;

/* Requerimientos diarios y concentraciones en la dieta para una dieta supuesta {NEm, TND} */
function requerimientos(ctx, dieta){
  const nem = dieta.NEm, me = Math.max(1, (dieta.TND||65)*ME_TND), km = Math.min(0.75, Math.max(0.45, nem/me));
  const dmi = ctx.dmiFijo || dmiPredicho(ctx, nem);
  const d = {nemM:ctx.nemM, re:0, nemP:0, nel:0, npg:0, mpM:3.8*P75(ctx.sbw), mpG:0, mpY:0, mpL:0, ca:0, p:0, km};
  d.ca = 0.0154*ctx.sbw/0.5; d.p = 0.016*ctx.sbw/0.68;
  if(ctx.crec){
    d.re = reCrec(ctx.eqsbw, ctx.adg); d.npg = npgCrec(ctx.adg, d.re);
    d.mpG = d.npg/effPM(ctx.eqsbw);
    d.ca += 0.071*d.npg/0.5; d.p += 0.039*d.npg/0.68;
  } else {
    if(ctx.s.cat==='gestacion'){ const g = gestacion(ctx.t, ctx.pn); d.nemP = g.me*km; d.mpY = g.mp; if(ctx.t>190){ d.ca += 13.7; d.p += 7.6; } }
    if(ctx.lact){ d.nel = ctx.leche*(0.3512+0.0962*ctx.grasaL); d.mpL = ctx.leche*ctx.protL*10/0.65; d.ca += 1.23*ctx.leche/0.5; d.p += 0.95*ctx.leche/0.68; }
  }
  d.mp = d.mpM+d.mpG+d.mpY+d.mpL;
  const req = {}; NUTRIENTES.forEach(n=>req[n.k]=[null,null]);
  const lim = ctx.C.lim; for(const k in lim) req[k] = lim[k].slice();
  let negReq = null, nemReq = null, sinEnergia = false;
  if(ctx.crec && ctx.adg>0){
    const fm = d.nemM/(nem*ctx.fIon);
    if(dmi - fm < 0.05*dmi){ sinEnergia = true; negReq = 9; }
    else negReq = d.re/(dmi-fm);
    req.NEg = [r3(negReq), null];
  } else {
    nemReq = (d.nemM + d.nemP + d.nel)/dmi/ctx.fIon;
    req.NEm = [r3(nemReq), null];
  }
  req.PM = [r3(d.mp/dmi), null];
  req.PDRb = [0, null];
  req.Ca = [r3(d.ca/dmi/10), null];
  req.P = [r3(d.p/dmi/10), null];
  /* azufre del agua: se descuenta del máximo de la dieta (consumo de agua ≈ 3.5–5 L por kg de MS) */
  const so4 = +ctx.s.cond.sAgua||0, litros = dmi*((+ctx.s.cond.tAct||20)>25 ? 5 : 3.5);
  d.agua = litros; d.sAgua = so4>0 ? litros*so4*(32.06/96.06)/1000/(dmi*1000)*100 : 0;
  if(req.S[1]!=null) req.S[1] = r3(Math.max(0.15, req.S[1]-d.sAgua));
  return {req, dmi, d, negReq, nemReq, sinEnergia, nemSup:nem, factores:factoresDMI(ctx)};
}
const r3 = v => Math.round(v*1000)/1000;
function cargarRequerimientos(s){
  const ctx = contexto(s), A = requerimientos(ctx, {NEm:s.animal.nemSup, TND:65});
  s.req = A.req; s.reqInfo = {dmi:A.dmi, d:A.d, nemSup:A.nemSup}; s.reqEditado = false; s.resultado = null;
}

/* ---------- predicción del desempeño con una dieta dada ---------- */
function prediccion(ctx, nutr, dmi){
  const p = {dmi};
  const nem = nutr.NEm*ctx.fIon, neg = nutr.NEg;
  const extra = requerimientos(ctx, {NEm:nutr.NEm, TND:nutr.TND}).d;
  let mpSup = nutr.PM*dmi; if(nutr.PDRb<0) mpSup += MP_MCP*nutr.PDRb*dmi;   // sin PDR suficiente, la síntesis microbiana se limita
  p.mpSup = mpSup; p.mpReq = extra.mp; p.balPM = mpSup - extra.mp;
  if(ctx.crec){
    const fm = ctx.nemM/Math.max(nem,0.1);
    p.fm = fm; p.fg = Math.max(0, dmi-fm);
    p.reDisp = p.fg*neg;
    { let lo=0, hi=4; for(let i=0;i<60;i++){ const m=(lo+hi)/2; if(reCrec(ctx.eqsbw,m) > p.reDisp) hi=m; else lo=m; } p.adgEM = lo; }   // inversa exacta de la ecuación de EN retenida
    const npgDisp = Math.max(0, (mpSup - extra.mpM))*effPM(ctx.eqsbw);
    let lo=0, hi=4; for(let i=0;i<60;i++){ const m=(lo+hi)/2; if(npgCrec(m, reCrec(ctx.eqsbw,m)) > npgDisp) hi=m; else lo=m; }
    p.adgPM = lo; p.adg = Math.min(p.adgEM, p.adgPM); p.limita = p.adgEM<=p.adgPM ? 'energia' : 'proteina';
    p.balE = (dmi-fm)*neg - extra.re;
  } else {
    p.neSup = dmi*nem; p.neReq = ctx.nemM + extra.nemP + extra.nel; p.balE = p.neSup - p.neReq; p.adg = 0;
    p.cambioPV = p.balE>0 ? p.balE/5.0 : p.balE/4.92;   // ≈ Mcal por kg de peso ganado o movilizado en vacas adultas
  }
  /* metano entérico (IPCC 2019, Nivel 2) y nitrógeno */
  const ym = nutr.Ym!=null ? nutr.Ym : (nutr.For<=10 ? 3.0 : nutr.TND>=72 ? 4.0 : nutr.TND>=62 ? 6.3 : 7.0);
  p.ym = ym; p.ch4 = dmi*18.45*ym/100/55.65*1000;          // g/d
  p.nIng = dmi*nutr.PC*10/6.25;                            // g N/d
  p.nRet = ctx.crec ? extra.npg/6.25 * (p.adg>0 && ctx.adg>0 ? Math.min(1, p.adg/ctx.adg) : 0) : (extra.mpY*0.65 + extra.mpL*0.65)/6.25;
  p.nExc = Math.max(0, p.nIng - p.nRet);
  return p;
}

/* =====================================================================
   PROGRAMACIÓN LINEAL — símplex en dos fases con regla de Bland
   ===================================================================== */
function simplex(c, filas){
  const n=c.length, m=filas.length, EPS=1e-9;
  const R_ = filas.map(f=>{
    let a=f.a.slice(), b=f.b, op=f.op, sg=1;
    if(b<0){ a=a.map(v=>-v); b=-b; op = op==='>='?'<=':(op==='<='?'>=':'='); sg=-1; }
    return {a,b,op,sg};
  });
  let nS=0,nA=0; const colH=[], colA=[];
  R_.forEach((r,i)=>{ colH[i] = r.op!=='=' ? n+(nS++) : -1; });
  R_.forEach((r,i)=>{ colA[i] = r.op!=='<=' ? -2 : -1; });
  R_.forEach((r,i)=>{ if(colA[i]===-2) colA[i] = n+nS+(nA++); });
  const N = n+nS+nA;
  const T_ = R_.map((r,i)=>{
    const row = new Float64Array(N+1);
    for(let j=0;j<n;j++) row[j]=r.a[j];
    if(colH[i]>=0) row[colH[i]] = r.op==='<=' ? 1 : -1;
    if(colA[i]>=0) row[colA[i]] = 1;
    row[N]=r.b; return row;
  });
  const basis = R_.map((r,i)=> r.op==='<=' ? colH[i] : colA[i]);
  const esArt = j => j>=n+nS;
  let PIV=0;
  function pivot(pr,pc){
    PIV++;
    const P=T_[pr], p=P[pc];
    for(let j=0;j<=N;j++) P[j]/=p;
    for(let i=0;i<m;i++){ if(i===pr) continue; const f=T_[i][pc]; if(Math.abs(f)>1e-12){ const Ti=T_[i]; for(let j=0;j<=N;j++) Ti[j]-=f*P[j]; } }
    basis[pr]=pc;
  }
  function reducido(cost,j){ let d=cost[j]; for(let i=0;i<m;i++) d-=cost[basis[i]]*T_[i][j]; return d; }
  function correr(cost, permitirArt){
    for(let it=0; it<50000; it++){
      const enB = new Set(basis); let ent=-1;
      for(let j=0;j<N;j++){ if(enB.has(j)) continue; if(!permitirArt && esArt(j)) continue; if(reducido(cost,j) < -EPS){ ent=j; break; } }
      if(ent<0) return 'optimo';
      let sal=-1, mejor=Infinity;
      for(let i=0;i<m;i++){ const a=T_[i][ent]; if(a>EPS){ const q=T_[i][N]/a; if(q<mejor-1e-12 || (Math.abs(q-mejor)<=1e-12 && basis[i]<basis[sal])){ mejor=q; sal=i; } } }
      if(sal<0) return 'no acotado';
      pivot(sal,ent);
    }
    return 'iteraciones';
  }
  const c1 = new Float64Array(N); for(let j=n+nS;j<N;j++) c1[j]=1;
  let st = correr(c1, true);
  let inf = 0; for(let i=0;i<m;i++) if(esArt(basis[i])) inf += T_[i][N];
  if(inf > 1e-7) return {estado:'infactible'};
  for(let i=0;i<m;i++) if(esArt(basis[i])){ for(let j=0;j<n+nS;j++){ if(Math.abs(T_[i][j])>1e-9){ pivot(i,j); break; } } }
  const c2 = new Float64Array(N); for(let j=0;j<n;j++) c2[j]=c[j];
  st = correr(c2, false);
  if(st!=='optimo') return {estado:st};
  const x = new Array(n).fill(0);
  for(let i=0;i<m;i++) if(basis[i]<n) x[basis[i]] = T_[i][N];
  const z = x.reduce((s,v,j)=>s+v*c[j],0);
  const duales = R_.map((r,i)=>{
    let y;
    if(r.op==='<=') y = -reducido(c2,colH[i]);
    else if(r.op==='>=') y = reducido(c2,colH[i]);
    else y = -reducido(c2,colA[i]);
    return y*r.sg;
  });
  const reducidos = []; for(let j=0;j<n;j++) reducidos[j]=reducido(c2,j);
  return {estado:'optimo', x, z, duales, reducidos, piv:PIV};
}
/* Certificado de optimalidad por dualidad fuerte */
function certificado(c, filas, x, y){
  let viol = 0;
  filas.forEach(f=>{ const l = f.a.reduce((s,v,j)=>s+v*x[j],0);
    if(f.op==='>=') viol = Math.max(viol, f.b-l); else if(f.op==='<=') viol = Math.max(viol, l-f.b); else viol = Math.max(viol, Math.abs(l-f.b)); });
  viol = Math.max(viol, ...x.map(v=>-v), 0);
  let dualViol = 0;
  filas.forEach((f,i)=>{ if(f.op==='>=') dualViol=Math.max(dualViol,-y[i]); if(f.op==='<=') dualViol=Math.max(dualViol,y[i]); });
  for(let j=0;j<c.length;j++){ let d=c[j]; filas.forEach((f,i)=>{ d-=y[i]*f.a[j]; }); dualViol=Math.max(dualViol,-d); }
  const zP = x.reduce((s,v,j)=>s+v*c[j],0), zD = filas.reduce((s,f,i)=>s+y[i]*f.b,0);
  const brecha = Math.abs(zP-zD)/Math.max(1,Math.abs(zP));
  return {viol, dualViol, brecha, ok: viol<1e-6 && dualViol<1e-6 && brecha<1e-7};
}
/* Modelo: variables = % de cada ingrediente en la MS; objetivo = costo por kg de MS */
function construirModelo(ings, req, dmi, omitir){
  const filas = [];
  const add = (tag, etiqueta, a, op, b, meta)=>{
    if(omitir && omitir===tag) return;
    const e = Math.max(1e-9, ...a.map(Math.abs));
    filas.push({tag, etiqueta, a:a.map(v=>v/e), op, b:b/e, esc:e, ...meta});
  };
  add('suma',T('Suma de ingredientes = 100 % de la MS','Sum of ingredients = 100 % of DM'), ings.map(()=>1), '=', 100, {tipo:'suma'});
  NUTRIENTES.forEach(nu=>{
    const r = req[nu.k]; if(!r) return;
    const a = ings.map(i=>valorNut(i,nu.k)), k0 = constante(nu.k, dmi);
    if(r[0]!=null && r[0]!=='') add('nmin_'+nu.k, tx(nu.n)+' ≥ '+r[0], a, '>=', 100*(r[0]-k0), {tipo:'nut', k:nu.k, lado:'min', req:r[0]});
    if(r[1]!=null && r[1]!=='') add('nmax_'+nu.k, tx(nu.n)+' ≤ '+r[1], a, '<=', 100*(r[1]-k0), {tipo:'nut', k:nu.k, lado:'max', req:r[1]});
  });
  ings.forEach((ing,j)=>{
    const e = ings.map((_,q)=>q===j?1:0);
    if(ing.min>0) add('imin_'+ing.id, tx(ing.nombre)+' ≥ '+ing.min+' %', e, '>=', ing.min, {tipo:'ing', id:ing.id, lado:'min'});
    if(ing.max!=null && ing.max!=='' && ing.max<100) add('imax_'+ing.id, tx(ing.nombre)+' ≤ '+ing.max+' %', e, '<=', ing.max, {tipo:'ing', id:ing.id, lado:'max'});
  });
  return {ings, filas, c:ings.map(i=>precioMS(i)+(i.penal||0)), req, dmi};
}
function resolverModelo(M){
  if(!M.ings.length) return {ok:false, motivo:T('No hay ingredientes seleccionados.','No ingredients selected.')};
  const sol = simplex(M.c, M.filas);
  if(sol.estado!=='optimo'){
    return {ok:false, motivo: sol.estado==='infactible' ? T('No existe ninguna combinación de los ingredientes seleccionados que cumpla todas las restricciones.','No combination of the selected ingredients meets all the constraints.') : T('El cálculo no convergió (','The calculation did not converge (')+sol.estado+').',
      diagnostico: sol.estado==='infactible' ? diagnosticar(M) : null};
  }
  const pct = sol.x.map(v=> Math.abs(v)<1e-7 ? 0 : v);
  const formula = Object.fromEntries(M.ings.map((ing,j)=>[ing.id,pct[j]]));
  const an = analizar(formula, M.ings, M.dmi);
  const restr = M.filas.map((f,i)=>{
    const lhs = f.a.reduce((acc,v,j)=>acc+v*pct[j],0);
    const activa = Math.abs(lhs - f.b) < 1e-6*Math.max(1,Math.abs(f.b));
    return {tag:f.tag, etiqueta:f.etiqueta, tipo:f.tipo, k:f.k, id:f.id, lado:f.lado, req:f.req, activa, dual: sol.duales[i]/f.esc};
  });
  return { ok:true, fecha:new Date().toISOString(),
    formula: M.ings.map((ing,j)=>({id:ing.id, nombre:ing.nombre, cat:ing.cat, pct:pct[j], ms:ing.comp.MS, pctTCO: an.msDieta*pct[j]/Math.max(ing.comp.MS,0.01), precio:+ing.precio, precioMS:precioMS(ing), reducido: sol.reducidos[j]})),
    costoKg: an.costoKg, costoKgTCO: an.costoKg*an.msDieta/100, costoObjetivo: sol.z/100, msDieta: an.msDieta, nutr: an.nutr, restr, cert: certificado(M.c, M.filas, sol.x, sol.duales),
    modelo: {n:M.ings.length, m:M.filas.length, piv:sol.piv} };
}
function diagnosticar(M){
  const culpables = [];
  const tags = [...new Set(M.filas.map(f=>f.tag))].filter(t=>t!=='suma');
  tags.forEach(t=>{
    const M2 = construirModelo(M.ings, M.req, M.dmi, t);
    if(simplex(M2.c, M2.filas).estado==='optimo') culpables.push(M.filas.find(f=>f.tag===t).etiqueta);
  });
  const sinFuente = [];
  NUTRIENTES.forEach(nu=>{ const r = M.req[nu.k]; if(!r || r[0]==null || r[0]<=0 || nu.k==='PDRb') return;
    if(!M.ings.some(i=>valorNut(i,nu.k)>0)) sinFuente.push(tx(nu.n)); });
  return {culpables, sinFuente};
}

/* ---------- formulación con ajuste iterativo de la energía y el consumo ----------
   El requerimiento de ENg por kg de MS depende de la ENm de la propia dieta (el alimento
   que se gasta en mantenimiento) y el consumo depende también de la ENm. Se resuelve el
   modelo lineal, se actualiza la ENm supuesta con la de la dieta obtenida y se repite
   hasta que el cambio es menor que 0.002 Mcal/kg (punto fijo amortiguado). */
function formularContexto(ctx, ings, reqFijo, opciones){
  opciones = opciones||{};
  const iter = [];
  if(reqFijo){
    const dmi = reqFijo.dmi;
    const r = resolverModelo(construirModelo(ings, reqFijo.req, dmi));
    r.iter = iter; r.dmi = dmi; r.animal = {dmi, d:reqFijo.d, editado:true};
    if(r.ok) r.pred = prediccion(ctx, r.nutr, dmi);
    return r;
  }
  /* Punto fijo «ENm supuesta = ENm de la ración» (f = ENm dieta − ENm supuesta = 0). Primero pasos
     directos amortiguados; si no convergen, se recorre una malla de ENm supuestas (0.8–2.9 Mcal/kg),
     se toma el primer par de raciones factibles con cambio de signo (f ≥ 0 → f < 0) y se biseca entre
     ellas. Se conserva la del lado conservador (f ≥ 0): su ENm real es al menos la supuesta, así que
     cumple el requerimiento verdadero. Sin cambio de signo, se usa la factible con f ≥ 0 más cercana
     a cero o, si no hay, la de f mayor. */
  let tnd = 70, conv = false, it = 0, cand = null, ultimo = null;
  const pts = [];
  const evalua = g => { it++; const A = requerimientos(ctx, {NEm:g, TND:tnd}); if(opciones.ajustarReq) opciones.ajustarReq(A.req);
    const r = resolverModelo(construirModelo(ings, A.req, A.dmi));
    iter.push({it, nem:g, dmi:A.dmi, neg:A.negReq, nemReq:A.nemReq, costo:r.ok?r.costoKg:null, nemDieta:r.ok?r.nutr.NEm:null});
    if(r.ok) tnd = r.nutr.TND; const o = {g, r, A, f: r.ok ? r.nutr.NEm - g : null}; ultimo = o; pts.push(o); return o; };
  let g = Math.min(2.6, Math.max(0.9, opciones.nem0 || 1.9)), o = evalua(g);
  for(let k=0; k<6 && o.r.ok && Math.abs(o.f) >= 0.002; k++){ g = Math.min(2.9, Math.max(0.8, g + 0.85*o.f)); o = evalua(g); }
  if(o.r.ok && Math.abs(o.f) < 0.002){ conv = true; cand = o; }
  else {
    for(let gg=0.8; gg<=2.9001; gg+=0.1) evalua(+gg.toFixed(2));
    const ok = pts.filter(p=>p.r.ok).sort((a,b)=>a.g-b.g);
    let par = null;
    for(let k=0; k+1<ok.length && !par; k++) if(ok[k].f >= 0 && ok[k+1].f < 0) par = [ok[k], ok[k+1]];
    if(par){ let [lo, hi] = par;
      for(let k=0; k<30 && hi.g-lo.g > 0.0005; k++){ const q = evalua((lo.g+hi.g)/2);
        if(q.r.ok && q.f < 0) hi = q; else if(q.r.ok) lo = q; else lo = {...lo, g:q.g}; }
      cand = lo; conv = true;
    } else {
      const pos = ok.filter(p=>p.f >= 0).sort((a,b)=>a.f-b.f)[0];
      cand = pos || ok.sort((a,b)=>b.f-a.f)[0] || null;
    }
  }
  const fin = cand || ultimo;
  const r = fin.r, A = fin.A;
  r.iter = iter; r.convergio = conv; r.animal = {dmi:A.dmi, d:A.d, negReq:A.negReq, nemReq:A.nemReq, sinEnergia:A.sinEnergia, factores:A.factores, req:A.req};
  r.dmi = A.dmi;
  if(r.ok) r.pred = prediccion(ctx, r.nutr, A.dmi);
  return r;
}
function formular(s){
  const ctx = contexto(s);
  const ings = s.ingredientes.filter(i=>s.sel[i.id]);
  const r = formularContexto(ctx, ings, s.reqEditado ? {req:s.req, dmi:s.reqInfo.dmi, d:s.reqInfo.d} : null, {nem0:s.animal.nemSup});
  r.contexto = {cat:s.cat, biotipo:s.biotipo, sexo:s.sexo, pv:s.animal.pv, adg:ctx.adg, req: JSON.parse(JSON.stringify(r.animal.req||s.req)), editado:s.reqEditado};
  return r;
}

/* Ganancia máxima alcanzable con los ingredientes y límites actuales (bisección sobre la meta) */
function gananciaMaxima(s){
  const ings = s.ingredientes.filter(i=>s.sel[i.id]);
  const prueba = g => { const s2 = JSON.parse(JSON.stringify(s)); s2.animal.adg = g; return formularContexto(contexto(s2), ings, null, {nem0:s.animal.nemSup}).ok; };
  if(!prueba(0.1)) return 0;
  let lo = 0.1, hi = Math.max(0.2, +s.animal.adg||1.5);
  for(let i=0;i<14;i++){ const m = (lo+hi)/2; if(prueba(m)) lo = m; else hi = m; }
  return lo;
}

/* ---------- programa de alimentación / feeding program ---------- */
function fasesPrograma(s){
  const a = s.animal, v = Math.max(+a.pv+60, +(s.prog&&s.prog.venta) || (s.cat==='engorda'?Math.max(+a.pv+100,520):s.cat==='desarrollo'?Math.max(+a.pv+80,320):Math.round(0.62*a.mw)));
  if(s.cat==='engorda'){
    const p0 = +a.pv, m1 = Math.min(p0+45, v-40), m2 = Math.round((m1+v)/2);
    return [ {id:'rec', n:{es:'Recepción y adaptación',en:'Receiving and step-up'}, hasta:m1, adg:1.1, For:[30,45]},
             {id:'cre', n:{es:'Crecimiento',en:'Growing'}, hasta:m2, adg:1.35, For:[15,25]},
             {id:'fin', n:{es:'Finalización',en:'Finishing'}, hasta:v, adg:1.45, For:[8,12]} ];
  }
  if(s.cat==='desarrollo') return [ {id:'d1', n:{es:'Desarrollo I',en:'Growing I'}, hasta:Math.round((+a.pv+v)/2), adg:0.85, For:[40,60]},
                                    {id:'d2', n:{es:'Desarrollo II',en:'Growing II'}, hasta:v, adg:1.0, For:[35,50]} ];
  if(s.cat==='vaquillas') return [ {id:'v1', n:{es:'Desarrollo al empadre',en:'Growth to breeding'}, hasta:v, adg:0.6, For:[40,70]} ];
  const pico = +a.leche || BIOTIPOS[s.biotipo].leche;
  return [ {id:'gm', n:{es:'Gestación media',en:'Mid gestation'}, dias:95, cat:'gestacion', t:150, leche:0},
           {id:'gf', n:{es:'Gestación final',en:'Late gestation'}, dias:90, cat:'gestacion', t:240, leche:0},
           {id:'lt', n:{es:'Lactación temprana',en:'Early lactation'}, dias:90, cat:'lactacion', t:0, leche:pico},
           {id:'la', n:{es:'Lactación tardía',en:'Late lactation'}, dias:90, cat:'lactacion', t:0, leche:+(pico*0.6).toFixed(1)} ];
}
function formularPrograma(s){
  const ings = s.ingredientes.filter(i=>s.sel[i.id]);
  const fases = (s.prog && s.prog.fases) || fasesPrograma(s);
  const crec = CATEGORIAS[s.cat].tipo==='crec';
  const out = {fecha:new Date().toISOString(), cat:s.cat, crec, fases:[], curva:[], ok:true};
  if(crec){
    let W = +s.animal.pv, dia = 0, cms = 0, costo = 0, ch4 = 0;
    out.curva.push([0,W]);
    fases.forEach((f,fi)=>{
      const desde = W, medio = (W + f.hasta)/2;
      const s2 = JSON.parse(JSON.stringify(s)); s2.animal.pv = medio; s2.animal.adg = f.adg; s2.animal.dmi = null;
      const ctx = contexto(s2);
      const ajuste = req=>{ req.For = f.For.slice(); if(fi===0 && s.cat==='engorda'){ req.FDNef=[Math.max(req.FDNef[0]||0,12),null]; } };
      let r = formularContexto(ctx, ings, null, {nem0:s.animal.nemSup, ajustarReq:ajuste}), adgUsada = f.adg;
      if(!r.ok){   /* meta inalcanzable: se usa la ganancia máxima posible de esa fase */
        const ok = g => { const s3 = JSON.parse(JSON.stringify(s2)); s3.animal.adg = g; return formularContexto(contexto(s3), ings, null, {nem0:s.animal.nemSup, ajustarReq:ajuste}); };
        let lo = 0, hi = f.adg, mejor = null; for(let i=0;i<12;i++){ const m=(lo+hi)/2; const rr = ok(m); if(rr.ok){ lo=m; mejor=rr; } else hi=m; }
        if(mejor){ r = mejor; adgUsada = lo; }
      }
      const fase = {f, r, desde, dias:0, cms:0, costo:0, ganancia:0, adgMeta:adgUsada, ajustada: adgUsada<f.adg-0.01};
      if(!r.ok){ out.ok=false; out.fases.push(fase); return; }
      let guard = 0;
      while(W < f.hasta && guard < 900){
        const s3 = JSON.parse(JSON.stringify(s2)); s3.animal.pv = W; const c3 = contexto(s3);
        const dmi = dmiPredicho(c3, r.nutr.NEm);
        const nutr = Object.assign({}, r.nutr, {PM: r.nutr.PM - constante('PM',r.dmi) + constante('PM',dmi), PDRb: r.nutr.PDRb - constante('PDRb',r.dmi) + constante('PDRb',dmi)});
        const p = prediccion(c3, nutr, dmi);
        const g = Math.max(p.adg, 0.05);
        W += g; dia++; fase.dias++; fase.cms += dmi; fase.costo += dmi*r.costoKg; ch4 += p.ch4;
        if(dia%7===0) out.curva.push([dia, W]);
        guard++;
      }
      fase.ganancia = W-desde; fase.hasta = W; cms += fase.cms; costo += fase.costo;
      out.curva.push([dia, W]); out.fases.push(fase);
    });
    Object.assign(out, {dias:dia, pvI:+s.animal.pv, pvF:W, cms, costo, ch4});
  } else {
    let dias=0, cms=0, costo=0, ch4=0;
    fases.forEach(f=>{
      const s2 = JSON.parse(JSON.stringify(s)); s2.cat = f.cat; s2.animal.diasGest = f.t; s2.animal.leche = f.leche; s2.animal.dmi = null;
      const ctx = contexto(s2);
      const r = formularContexto(ctx, ings, null, {nem0:s.animal.nemSup});
      const fase = {f, r, dias:f.dias, cms:0, costo:0};
      if(r.ok){ fase.cms = r.dmi*f.dias; fase.costo = fase.cms*r.costoKg; cms += fase.cms; costo += fase.costo; dias += f.dias; ch4 += r.pred.ch4*f.dias; } else out.ok=false;
      out.fases.push(fase);
    });
    Object.assign(out, {dias, cms, costo, ch4});
  }
  return out;
}

/* ---------- energía neta observada (Zinn y Shen, 1998) ----------
   A partir del desempeño observado se despeja la ENm de la dieta con
   CMS = EM/ENm + EG/ENg y ENg = 0.877·ENm − 0.41 (Zinn et al., 2008). */
function eneObservada(pvI, pvF, adg, dmi, em, eg){
  const W = P75((pvI+pvF)/2), EM = (em||0.077)*W, EG = (eg||0.0557)*W*Math.pow(adg,1.097);
  const a = -0.41*EM, b = 0.877*EM + 0.41*dmi + EG, c = -0.877*dmi;
  const disc = b*b - 4*a*c;
  const nem = (-b - Math.sqrt(disc))/(2*c);
  return {nem, neg: 0.877*nem - 0.41, EM, EG};
}
