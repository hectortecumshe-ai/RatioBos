/* Genera los 500 problemas de formulación de la prueba del motor de cálculo.
   Uso: abrir index.html, pegar este código en la consola del navegador y guardar
   el texto copiado como pruebas/problemas.json. Después: python comparar_highs.py
   Semilla fija: los mismos problemas en cada corrida. */
(() => {
  let seed = 20261006;
  const rnd = () => { seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; };
  const pick = a => a[Math.floor(rnd()*a.length)];
  const probs = [], cats = Object.keys(CATEGORIAS), bios = Object.keys(BIOTIPOS), regs = Object.keys(REGIONES), temps = Object.keys(TEMPORADAS);
  for(let k=0; k<500; k++){
    const s = estadoInicial(); s.cat = pick(cats); s.biotipo = pick(bios);
    s.sexo = s.cat==='vaquillas' ? 'vaquilla' : (s.cat==='gestacion'||s.cat==='lactacion') ? 'vaca' : s.sexo;
    s.animal = animalInicial(s.cat, s.biotipo, s.sexo); s.region = pick(regs); s.temporada = pick(temps);
    aplicarRegion(s); cargarRequerimientos(s);
    if(['desarrollo','engorda','vaquillas'].includes(s.cat)) s.animal.adg = +(0.3 + rnd()*1.2).toFixed(2);
    const ctx = contexto(s);
    const ings = ING_LIB.map(ingDesdeLib).filter(i => i.id!=='otros' && (i.id==='premezcla' || rnd()<0.45));
    ings.forEach(i => i.precio = +(i.precio*(0.5 + rnd())).toFixed(3));
    const A = requerimientos(ctx, {NEm:+(1.2 + rnd()*1.1).toFixed(3), TND:70});
    const M = construirModelo(ings, A.req, A.dmi), sol = simplex(M.c, M.filas);
    probs.push({c:M.c, filas:M.filas.map(f => ({a:f.a, op:f.op, b:f.b})), estado:sol.estado, x:sol.x||null,
      obj: sol.x ? sol.x.reduce((t,v,j) => t + v*M.c[j], 0) : null});
  }
  copy(JSON.stringify(probs));
  return probs.length + ' problemas copiados al portapapeles';
})();
