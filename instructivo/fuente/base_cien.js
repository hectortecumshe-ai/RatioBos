
"use strict";
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const CAP = window.CAPTURAS || {};
const T = (es, en) => LANG === 'es' ? es : en;
const NF = (v, d = 0) => Number(v).toLocaleString(LANG === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/* =====================================================================
   DATOS DEL CASO (resultados de RatioAvis 1.1.1 · Ross 308, iniciación,
   2,200 msnm, ajuste −50 kcal). Fuente: app, vista científica.
   ===================================================================== */
const FORMULA = [ // [es, en, % inclusión, $/kg]
  ['Pasta de soya 46 %', 'Soybean meal 46 %', 39.546, 10.5], ['Maíz amarillo', 'Yellow corn', 53.804, 5.5],
  ['Aceite de soya', 'Soybean oil', 2.076, 30], ['Fosfato dicálcico', 'Dicalcium phosphate', 2.055, 20],
  ['DL-Metionina 99 %', 'DL-Methionine 99 %', 0.378, 70], ['Premezcla vit.-min.', 'Vit.–min. premix', 0.25, 60],
  ['L-Lisina HCl', 'L-Lysine HCl', 0.234, 38], ['L-Treonina', 'L-Threonine', 0.123, 45], ['L-Valina', 'L-Valine', 0.039, 90],
  ['Cloruro de colina', 'Choline chloride', 0.08, 25], ['Bicarbonato de sodio', 'Sodium bicarbonate', 0.153, 12],
  ['Carbonato de calcio', 'Limestone', 0.955, 1.5], ['Sal común', 'Salt', 0.306, 4]
];
const SOMBRA = [ // [es, en, ∂Z/∂b $/t por unidad, requerimiento]
  ['EMAn', 'AMEn', 4.948, 2925], ['Proteína cruda', 'Crude protein', 206.432, 23], ['Valina', 'Valine', 738.98, 1],
  ['P disponible', 'Available P', 1378.48, 0.5], ['Met + Cis', 'Met + Cys', 522.293, 1], ['Calcio', 'Calcium', 394.54, 0.95],
  ['Treonina', 'Threonine', 267.642, 0.88], ['Lisina', 'Lysine', 156.583, 1.32], ['Sodio', 'Sodium', 944.167, 0.18],
  ['Cloro (máx.)', 'Chloride (max)', -326.888, 0.23]
];
const IDEAL = [ // [es, en, valor, ref mín, ref máx]
  ['Met + Cis', 'Met + Cys', 75.8, 74, 78], ['Treonina', 'Threonine', 66.7, 65, 68], ['Valina', 'Valine', 75.8, 76, 80],
  ['Arginina', 'Arginine', 108.3, 105, 110], ['Isoleucina', 'Isoleucine', 67.7, 67, 69], ['Triptófano', 'Tryptophan', 18.8, 16, 17]
];
const VAL = [ // [artículo, fase, [[nutriente, artículo, app, %, errata]]]
  ['Maldonado-Fuentes 2020', 'Ini', [['EM',3025,3041.3,0.54],['PC',21,21.42,1.98],['Ca',.96,1.045,8.82],['Pd',.48,.488,1.74],['Lys',1.44,1.387,-3.69],['Met',.83,.8,-3.57],['MC',1.08,1.139,5.45],['Thr',.97,.928,-4.33],['Trp',.3,.253,-15.56]]],
  ['Maldonado-Fuentes 2020', 'Fin', [['EM',3100,3106.4,0.21],['PC',19,19.22,1.15],['Ca',.8,.871,8.84],['Pd',.4,.406,1.57],['Lys',1.15,1.104,-4.03],['Met',.47,.631,34.16,1],['MC',.9,.946,5.11],['Thr',.78,.747,-4.22],['Trp',.18,.226,25.49]]],
  ['Obeidat 2025', 'Ini', [['EM',3000,2977.9,-0.74],['PC',21.7,21.58,-0.55],['Ca',.9,1.003,11.48],['Pd',.45,.402,-10.68],['Na',.2,.215,7.55],['Lys',1.26,1.151,-8.64],['Met',.55,.557,1.31],['MC',.89,.859,-3.45],['Thr',.82,.72,-12.14],['Trp',.26,.236,-9.12],['Arg',1.47,1.352,-8.03],['Ile',.98,.844,-13.83],['Val',1.39,.913,-34.34,1]]],
  ['Obeidat 2025', 'Cre', [['EM',3050,3054.3,0.14],['PC',21,20.87,-0.63],['Ca',.9,.998,10.9],['Pd',.45,.401,-10.89],['Na',.2,.214,6.91],['Lys',1.2,1.089,-9.27],['Met',.54,.548,1.4],['MC',.87,.841,-3.33],['Thr',.8,.704,-11.95],['Trp',.25,.228,-9],['Arg',1.32,1.304,-1.25],['Ile',.95,.815,-14.19]]],
  ['Bauer 2025', 'Pre', [['EM',2975,2925.2,-1.68],['PC',21.5,21.06,-2.04],['Ca',.9,.889,-1.23],['Pd',.45,.424,-5.81],['Lys',1.2,1.267,5.58],['Met',.55,.584,6.1],['MC',.8,.88,10.06],['Thr',.66,.696,5.43]]],
  ['Bauer 2025', 'Ini', [['EM',3057,3007.4,-1.62],['PC',19.5,19.12,-1.93],['Ca',.8,.792,-1.03],['Pd',.4,.373,-6.78],['Lys',1.13,1.182,4.61],['Met',.53,.561,5.79],['MC',.76,.833,9.65],['Thr',.6,.665,10.77]]],
  ['Gregg 2022', 'Ini', [['PC',22,23.7,7.73]]],
  ['Gregg 2022', 'Cre', [['PC',20,21.2,6]]]
];
const OPT = [ // [artículo, fase es, fase en, publicada $/t, app $/t]
  ['Maldonado-Fuentes et al. (2020)', 'Iniciación', 'Starter', 8982.85, 8982.83], ['Maldonado-Fuentes et al. (2020)', 'Finalización', 'Finisher', 9345.90, 9345.88],
  ['Obeidat et al. (2025)', 'Iniciación', 'Starter', 8395.21, 8395.19], ['Obeidat et al. (2025)', 'Crecimiento', 'Grower', 8573.13, 8573.11],
  ['Bauer et al. (2025)', 'Preiniciación', 'Pre-starter', 7916.56, 7916.54], ['Bauer et al. (2025)', 'Iniciación', 'Starter', 7777.62, 7777.60]
];

/* =====================================================================
   GRÁFICOS (SVG generado, en el idioma activo y con los colores del tema)
   ===================================================================== */
const svgEl = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${body}</svg>`;
const tx = (x, y, s, o = {}) => `<text x="${x}" y="${y}" ${o.a ? `text-anchor="${o.a}"` : ''} font-size="${o.fs || 13}" ${o.w ? `font-weight="${o.w}"` : ''} ${o.c ? `class="${o.c}"` : ''} ${o.fill ? `style="fill:${o.fill}"` : ''} ${o.it ? 'font-style="italic"' : ''} ${o.ff ? `font-family="${o.ff}"` : ''}>${s}</text>`;

const CHARTS = {
  /* ---- región factible del modelo didáctico ---- */
  region(big) {
    const W = 680, H = big ? 470 : 440, L = 64, R = 24, Tp = 20, B = 52;
    const x0 = 30, x1 = 66, y0 = 34, y1 = 62;
    const X = x => L + (x - x0) / (x1 - x0) * (W - L - R), Y = y => H - B - (y - y0) / (y1 - y0) * (H - Tp - B);
    const P = x => (2300 - 7.9 * x) / 46, E = x => (574000 - 5410 * x) / 6530, S2 = x => 94 - x, S1 = x => 100 - x;
    const cross = (f, g) => { let a = x0, b = x1; for (let k = 0; k < 80; k++) { const m = (a + b) / 2; ((f(a) - g(a)) * (f(m) - g(m)) <= 0) ? b = m : a = m; } return [(a + b) / 2, f((a + b) / 2)]; };
    const A = cross(P, E), Bv = cross(P, S2), C = cross(E, S2);
    const k = p => 24.5 * p[0] + 19.5 * p[1];
    const costo = p => 10 * (3000 - k(p));
    const line = (f, cls, col, dash) => `<line x1="${X(x0)}" y1="${Y(f(x0))}" x2="${X(x1)}" y2="${Y(f(x1))}" stroke="${col}" stroke-width="${cls}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
    const u = big ? 'p' : 'f';  // ids únicos: la portada y la figura dibujan el mismo gráfico
    let s = `<defs><clipPath id="cr${u}"><rect x="${L}" y="${Tp}" width="${W - L - R}" height="${H - Tp - B}"/></clipPath>
      <marker id="ar${u}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--acc)"/></marker>
      <linearGradient id="gf${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--pri);stop-opacity:.26"/><stop offset="1" style="stop-color:var(--pri);stop-opacity:.08"/></linearGradient></defs>`;
    for (let x = 30; x <= 66; x += 6) s += `<line class="grid" x1="${X(x)}" y1="${Tp}" x2="${X(x)}" y2="${H - B}"/>` + tx(X(x), H - B + 20, x, { a: 'middle', c: 'mut', fs: 12 });
    for (let y = 34; y <= 62; y += 4) s += `<line class="grid" x1="${L}" y1="${Y(y)}" x2="${W - R}" y2="${Y(y)}"/>` + tx(L - 10, Y(y) + 4, y, { a: 'end', c: 'mut', fs: 12 });
    s += `<g clip-path="url(#cr${u})">`;
    s += `<polygon points="${[A, C, Bv].map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}" style="fill:url(#gf${u});stroke:var(--pri);stroke-width:1.5"/>`;
    [1950, 2080, k(A)].forEach((kk, n) => { const f = x => (kk - 24.5 * x) / 19.5; s += `<line x1="${X(x0)}" y1="${Y(f(x0))}" x2="${X(x1)}" y2="${Y(f(x1))}" style="stroke:var(--acc);stroke-width:${n === 2 ? 2 : 1.2};stroke-dasharray:${n === 2 ? '0' : '5 5'};opacity:${n === 2 ? 1 : .7}"/>`; });
    s += line(P, 2.2, 'var(--b3)') + line(E, 2.2, 'var(--b6)') + line(S2, 1.6, 'var(--b7)', '7 4') + line(S1, 1.2, 'var(--faint)', '2 4');
    s += `</g>`;
    s += `<path d="M${X(C[0]) + 10} ${Y(C[1]) + 6} L${X(A[0]) - 12} ${Y(A[1]) - 8}" style="stroke:var(--acc);stroke-width:1.6;fill:none;stroke-dasharray:3 4" marker-end="url(#ar${u})"/>`;
    const lab = (x, y, t, col, a) => tx(x, y, t, { fs: 12.5, w: 700, fill: col, a });
    s += lab(X(37.2), Y(P(37.2)) + 18, T('PC ≥ 23 %', 'CP ≥ 23 %'), 'var(--b3)');
    s += lab(X(61.2), Y(E(61.2)) - 9, T('EMAn ≥ 3,050', 'AMEn ≥ 3,050'), 'var(--b6)', 'end');
    s += lab(X(31.2), Y(S2(31.2)) - 8, T('aceite ≤ 6 %', 'oil ≤ 6 %'), 'var(--b7)');
    s += lab(X(37), Y(S1(37)) - 8, T('aceite ≥ 0', 'oil ≥ 0'), 'var(--faint)');
    s += tx(X(39.4) + 8, Y((2080 - 24.5 * 39.4) / 19.5) + 4, T('isocosto', 'iso-cost'), { fs: 11.5, fill: 'var(--acc)', it: 1 });
    [[A, 'A', 14, -10], [Bv, 'B', 12, 18], [C, 'C', -16, -8]].forEach(([p, n, dx, dy]) => {
      s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${n === 'A' ? 6.5 : 4.5}" style="fill:${n === 'A' ? 'var(--acc)' : 'var(--paper)'};stroke:${n === 'A' ? 'var(--paper)' : 'var(--pri)'};stroke-width:2"/>` + tx(X(p[0]) + dx, Y(p[1]) + dy, n, { fs: 15, w: 700, a: 'middle', ff: 'var(--serif)' });
    });
    const bx = X(30.8), by = Y(40.6);
    s += `<rect x="${bx}" y="${by}" width="${big ? 250 : 236}" height="74" rx="10" style="fill:var(--paper);stroke:var(--line2)"/>`;
    s += tx(bx + 14, by + 22, T('Óptimo A', 'Optimum A'), { fs: 12, w: 700, fill: 'var(--acc)' });
    s += tx(bx + 14, by + 42, T(`maíz ${NF(A[0], 1)} % · soya ${NF(A[1], 1)} %`, `corn ${NF(A[0], 1)} % · SBM ${NF(A[1], 1)} %`), { fs: 12.5 });
    s += tx(bx + 14, by + 61, T(`aceite ${NF(100 - A[0] - A[1], 1)} % · $${NF(costo(A))} /t`, `oil ${NF(100 - A[0] - A[1], 1)} % · $${NF(costo(A))} /t`), { fs: 12.5 });
    s += tx((L + W - R) / 2, H - 10, T('Maíz, x (% de la dieta)', 'Corn, x (% of diet)'), { a: 'middle', fs: 13, w: 600 });
    s += `<text transform="translate(16 ${(Tp + H - B) / 2}) rotate(-90)" text-anchor="middle" font-size="13" font-weight="600">${T('Pasta de soya 46 %, y (%)', 'Soybean meal 46 %, y (%)')}</text>`;
    return svgEl(W, H, s, T('Región factible del modelo didáctico', 'Feasible region of the teaching model'));
  },

  /* ---- arquitectura del motor ---- */
  pipeline() {
    const W = 760, H = 300;
    const box = (x, y, w, h, t1, t2, col, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" style="fill:${fill || 'var(--paper)'};stroke:${col};stroke-width:1.6"/>` + tx(x + w / 2, y + (t2 ? h / 2 - 3 : h / 2 + 5), t1, { a: 'middle', fs: 14, w: 700, ff: 'var(--serif)' }) + (t2 ? tx(x + w / 2, y + h / 2 + 15, t2, { a: 'middle', fs: 11.5, c: 'mut' }) : '');
    const arr = (x1, y1, x2, y2, col = 'var(--line2)') => `<path d="M${x1} ${y1} L${x2} ${y2}" style="stroke:${col};stroke-width:2;fill:none" marker-end="url(#ap)"/>`;
    let s = `<defs><marker id="ap" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--faint)"/></marker></defs>`;
    const ins = [[T('Requerimientos b', 'Requirements b'), T('Bloques 1–3', 'Blocks 1–3')], [T('Matriz a', 'Matrix a'), T('Bloque 4', 'Block 4')], [T('Precios c · límites l, u', 'Prices c · limits l, u'), T('Bloque 5', 'Block 5')]];
    ins.forEach((t, i) => { s += box(8, 22 + i * 88, 170, 66, t[0], t[1], 'var(--b3)'); s += arr(178, 55 + i * 88, 222, 124 + i * 23); });
    s += box(224, 108, 120, 78, T('Modelo (1)', 'Model (1)'), T('escalado por fila', 'row scaling'), 'var(--ink)', 'var(--ink-s)');
    s += arr(344, 147, 376, 147);
    s += box(378, 108, 104, 78, T('Fase I', 'Phase I'), T('factibilidad', 'feasibility'), 'var(--pri)');
    s += arr(482, 147, 514, 147);
    s += box(516, 108, 104, 78, T('Fase II', 'Phase II'), 'Bland', 'var(--pri)');
    s += arr(620, 147, 640, 147);
    s += box(642, 96, 110, 102, T('Certificado', 'Certificate'), T('dualidad fuerte', 'strong duality'), 'var(--ok)', 'var(--ok-s)');
    s += arr(430, 186, 430, 228, 'var(--bad)');
    s += box(352, 230, 156, 56, T('Diagnóstico', 'Diagnosis'), T('una restricción a la vez', 'one constraint at a time'), 'var(--bad)', 'var(--bad-s)');
    s += tx(440, 210, T('infactible', 'infeasible'), { fs: 11.5, fill: 'var(--bad)', it: 1 });
    s += arr(697, 198, 697, 228, 'var(--ok)');
    s += box(560, 230, 192, 56, T('Resultados', 'Results'), T('x*, y*, d, JSON', 'x*, y*, d, JSON'), 'var(--acc)', 'var(--acc-s)');
    return svgEl(W, H, s, T('Arquitectura del motor de cálculo', 'Solver architecture'));
  },

  /* ---- flujo del símplex ---- */
  simplex() {
    const W = 760, H = 250;
    const st = (x, y, w, h, t, sub, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" style="fill:var(--paper);stroke:${col};stroke-width:1.6"/>` + tx(x + w / 2, y + 24, t, { a: 'middle', fs: 13.5, w: 700 }) + sub.map((l, i) => tx(x + w / 2, y + 44 + i * 16, l, { a: 'middle', fs: 11.5, c: 'mut' })).join('');
    const dia = (cx, cy, t) => `<path d="M${cx} ${cy - 30} L${cx + 52} ${cy} L${cx} ${cy + 30} L${cx - 52} ${cy}Z" style="fill:var(--soft);stroke:var(--line2);stroke-width:1.4"/>` + tx(cx, cy + 4, t, { a: 'middle', fs: 11.5, w: 700 });
    const arr = (d, col = 'var(--faint)') => `<path d="${d}" style="stroke:${col};stroke-width:1.8;fill:none" marker-end="url(#as)"/>`;
    let s = `<defs><marker id="as" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--faint)"/></marker></defs>`;
    s += st(6, 70, 150, 92, T('Forma estándar', 'Standard form'), [T('holguras s ≥ 0', 'slacks s ≥ 0'), T('artificiales r ≥ 0', 'artificials r ≥ 0')], 'var(--ink)');
    s += arr('M156 116 L190 116');
    s += st(192, 70, 156, 92, T('Fase I', 'Phase I'), [T('min Σ r', 'min Σ r'), T('base inicial = r', 'initial basis = r')], 'var(--pri)');
    s += arr('M348 116 L380 116');
    s += dia(434, 116, 'Σ r > 10⁻⁷ ?');
    s += arr('M434 146 L434 196', 'var(--bad)') + tx(442, 176, T('sí', 'yes'), { fs: 11.5, fill: 'var(--bad)', it: 1 });
    s += `<rect x="372" y="198" width="124" height="40" rx="10" style="fill:var(--bad-s);stroke:var(--bad)"/>` + tx(434, 223, T('infactible', 'infeasible'), { a: 'middle', fs: 13, w: 700, fill: 'var(--bad)' });
    s += arr('M486 116 L522 116', 'var(--ok)') + tx(502, 106, 'no', { fs: 11.5, fill: 'var(--ok)', it: 1, a: 'middle' });
    s += st(524, 62, 228, 108, T('Fase II · regla de Bland', 'Phase II · Bland’s rule'), [T('entra: menor índice con dⱼ < −10⁻⁹', 'enters: lowest index with dⱼ < −10⁻⁹'), T('sale: menor cociente; empate →', 'leaves: min ratio; tie →'), T('menor índice básico', 'lowest basic index')], 'var(--pri)');
    s += arr('M638 170 L638 196', 'var(--ok)');
    s += `<rect x="560" y="198" width="156" height="40" rx="10" style="fill:var(--ok-s);stroke:var(--ok)"/>` + tx(638, 223, T('óptimo x*, y*', 'optimum x*, y*'), { a: 'middle', fs: 13, w: 700, fill: 'var(--ok)' });
    s += `<path d="M752 92 C790 92 790 140 752 140" style="stroke:var(--faint);stroke-width:1.6;fill:none" marker-end="url(#as)"/>` + tx(756, 82, T('pivoteo', 'pivot'), { fs: 11.5, it: 1, c: 'mut' });
    return svgEl(W, H, s, T('Flujo del símplex en dos fases', 'Two-phase simplex flow'));
  },

  /* ---- dualidad ---- */
  dual() {
    const W = 760, H = 170, y = 86, L = 40, R = 40;
    let s = `<defs><linearGradient id="gp" x1="0" x2="1"><stop offset="0" style="stop-color:var(--pri);stop-opacity:0"/><stop offset="1" style="stop-color:var(--pri);stop-opacity:.35"/></linearGradient>
      <linearGradient id="gd" x1="1" x2="0"><stop offset="0" style="stop-color:var(--acc);stop-opacity:0"/><stop offset="1" style="stop-color:var(--acc);stop-opacity:.35"/></linearGradient></defs>`;
    const mid = W / 2;
    s += `<rect x="${L}" y="${y - 14}" width="${mid - L}" height="28" style="fill:url(#gd)"/><rect x="${mid}" y="${y - 14}" width="${W - R - mid}" height="28" style="fill:url(#gp)"/>`;
    s += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" class="ax"/>`;
    s += `<line x1="${mid}" y1="${y - 34}" x2="${mid}" y2="${y + 34}" style="stroke:var(--text);stroke-width:2"/>`;
    s += tx(mid, y - 44, 'Z* = W* = $8,805.03 /t', { a: 'middle', fs: 14, w: 700, ff: 'var(--serif)' });
    s += tx(mid, y + 56, T('brecha relativa 3.9 × 10⁻¹⁶', 'relative gap 3.9 × 10⁻¹⁶'), { a: 'middle', fs: 12, c: 'mut' });
    s += tx(mid + 22, y - 20, T('costo de cualquier dieta factible  →', 'cost of any feasible diet  →'), { fs: 12.5, fill: 'var(--pri)', w: 600 });
    s += tx(mid - 22, y + 30, T('←  valor de cualquier vector dual factible', '←  value of any feasible dual vector'), { fs: 12.5, fill: 'var(--acc-d)', w: 600, a: 'end' });
    s += tx(W - R, y + 30, T('primal: c⊤x ≥ Z*', 'primal: c⊤x ≥ Z*'), { a: 'end', fs: 12, c: 'mut', it: 1 });
    s += tx(L, y - 20, T('dual: b⊤y ≤ W*', 'dual: b⊤y ≤ W*'), { fs: 12, c: 'mut', it: 1 });
    return svgEl(W, H, s, T('Dualidad fuerte', 'Strong duality'));
  },

  /* ---- costo de endurecer requerimientos ---- */
  sombra() {
    const d = SOMBRA.map(r => [T(r[0], r[1]), r[2] * r[3] / 100]).sort((a, b) => b[1] - a[1]);
    const W = 700, rowH = 30, Tp = 10, L = 150, R = 70, H = Tp + d.length * rowH + 30;
    const max = 150, min = -10, X = v => L + (v - min) / (max - min) * (W - L - R);
    let s = '';
    [0, 25, 50, 75, 100, 125, 150].forEach(v => s += `<line class="grid" x1="${X(v)}" y1="${Tp}" x2="${X(v)}" y2="${H - 26}"/>` + tx(X(v), H - 8, '$' + v, { a: 'middle', c: 'mut', fs: 11.5 }));
    d.forEach((r, i) => {
      const y = Tp + i * rowH, neg = r[1] < 0, x0 = X(0), x1 = X(r[1]);
      s += tx(L - 12, y + 19, r[0], { a: 'end', fs: 13 });
      s += `<rect x="${Math.min(x0, x1)}" y="${y + 6}" width="${Math.abs(x1 - x0)}" height="${rowH - 12}" rx="4" style="fill:${neg ? 'var(--ok)' : i === 0 ? 'var(--b6)' : 'var(--pri)'};opacity:${i === 0 || neg ? 1 : .8}"/>`;
      s += tx(neg ? x0 + 6 : x1 + 6, y + 19, (neg ? '−$' : '$') + NF(Math.abs(r[1]), 2), { fs: 12, w: 700 });
    });
    s += `<line x1="${X(0)}" y1="${Tp}" x2="${X(0)}" y2="${H - 26}" style="stroke:var(--text);stroke-width:1.2"/>`;
    return svgEl(W, H, s, T('Costo de endurecer cada requerimiento 1 %', 'Cost of tightening each requirement by 1 %'));
  },

  /* ---- masa frente a costo ---- */
  costo() {
    const tot = FORMULA.reduce((a, r) => a + r[2] * r[3], 0);
    const d = FORMULA.map(r => [T(r[0], r[1]), r[2], 100 * r[2] * r[3] / tot]);
    const W = 700, rowH = 30, Tp = 34, L = 168, R = 60, H = Tp + d.length * rowH + 26, max = 60, X = v => L + v / max * (W - L - R);
    let s = '';
    s += `<rect x="${L}" y="6" width="12" height="12" rx="3" style="fill:var(--b4)"/>` + tx(L + 18, 16, T('% de la masa', '% of mass'), { fs: 12, w: 600 });
    s += `<rect x="${L + 130}" y="6" width="12" height="12" rx="3" style="fill:var(--b6)"/>` + tx(L + 148, 16, T('% del costo', '% of cost'), { fs: 12, w: 600 });
    [0, 10, 20, 30, 40, 50, 60].forEach(v => s += `<line class="grid" x1="${X(v)}" y1="${Tp - 4}" x2="${X(v)}" y2="${H - 22}"/>` + tx(X(v), H - 6, v + ' %', { a: 'middle', c: 'mut', fs: 11.5 }));
    d.forEach((r, i) => {
      const y = Tp + i * rowH;
      s += tx(L - 12, y + 18, r[0], { a: 'end', fs: 12.5 });
      s += `<rect x="${L}" y="${y + 4}" width="${Math.max(1.5, X(r[1]) - L)}" height="10" rx="3" style="fill:var(--b4)"/>`;
      s += `<rect x="${L}" y="${y + 15}" width="${Math.max(1.5, X(r[2]) - L)}" height="10" rx="3" style="fill:var(--b6)"/>`;
      s += tx(Math.max(X(r[1]), X(r[2])) + 6, y + 19, `${NF(r[1], r[1] < 1 ? 2 : 1)} · ${NF(r[2], 1)}`, { fs: 11, c: 'mut' });
    });
    return svgEl(W, H, s, T('Participación en la masa y en el costo', 'Share of mass and of cost'));
  },

  /* ---- proteína ideal ---- */
  ideal() {
    const W = 700, rowH = 46, Tp = 8, L = 128, R = 40, H = Tp + IDEAL.length * rowH + 8;
    let s = '';
    IDEAL.forEach((r, i) => {
      const y = Tp + i * rowH + 24, lo = Math.min(r[3], r[2]) - 6, hi = Math.max(r[4], r[2]) + 6, X = v => L + (v - lo) / (hi - lo) * (W - L - R);
      const ok = r[2] >= r[3] - 1;
      s += tx(L - 14, y + 5, T(r[0], r[1]), { a: 'end', fs: 13.5, w: 600 });
      s += `<line x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" class="ax"/>`;
      s += `<rect x="${X(r[3])}" y="${y - 9}" width="${X(r[4]) - X(r[3])}" height="18" rx="9" style="fill:var(--ok-s);stroke:var(--ok);stroke-width:1"/>`;
      s += tx(X(r[3]), y + 24, r[3], { a: 'middle', fs: 11, c: 'mut' }) + tx(X(r[4]), y + 24, r[4], { a: 'middle', fs: 11, c: 'mut' });
      s += `<circle cx="${X(r[2])}" cy="${y}" r="7" style="fill:${ok ? 'var(--pri)' : 'var(--warn)'};stroke:var(--paper);stroke-width:2"/>`;
      s += tx(X(r[2]), y - 13, NF(r[2], 1), { a: 'middle', fs: 12, w: 700 });
    });
    return svgEl(W, H, s, T('Perfil de proteína ideal', 'Ideal-protein profile'));
  },

  /* ---- validación ---- */
  validacion() {
    const grupos = [['EM', T('Energía', 'Energy'), ['EM']], ['PC', T('Proteína', 'Protein'), ['PC']], ['AA', T('Aminoácidos', 'Amino acids'), ['Lys', 'Met', 'MC', 'Thr', 'Trp', 'Arg', 'Ile', 'Val']], ['Min', T('Ca, P disp., Na', 'Ca, avail. P, Na'), ['Ca', 'Pd', 'Na']]];
    const papers = ['Maldonado-Fuentes 2020', 'Obeidat 2025', 'Bauer 2025', 'Gregg 2022'], cols = ['var(--b1)', 'var(--b5)', 'var(--b3)', 'var(--b7)'];
    const W = 720, rowH = 64, Tp = 34, L = 140, R = 20, H = Tp + grupos.length * rowH + 30, lim = 30, X = v => L + (Math.max(-lim, Math.min(lim, v)) + lim) / (2 * lim) * (W - L - R);
    let s = '';
    const lx = [0, 178, 290, 392]; papers.forEach((p, i) => { s += `<circle cx="${L + lx[i] + 6}" cy="12" r="5.5" style="fill:${cols[i]}"/>` + tx(L + lx[i] + 16, 16, p, { fs: 11.5 }); });
    grupos.forEach((g, gi) => {
      const y = Tp + gi * rowH, band = (g[0] === 'EM' || g[0] === 'PC') ? 3 : 10;
      s += `<rect x="${X(-10)}" y="${y + 6}" width="${X(10) - X(-10)}" height="${rowH - 12}" style="fill:var(--soft)"/>`;
      s += `<rect x="${X(-3)}" y="${y + 6}" width="${X(3) - X(-3)}" height="${rowH - 12}" style="fill:var(--ok-s)"/>`;
      s += tx(L - 14, y + rowH / 2 + 5, g[1], { a: 'end', fs: 13, w: 600 });
      let n = 0;
      VAL.forEach(v => v[2].forEach(c => {
        if (!g[2].includes(c[0])) return;
        const pi = papers.indexOf(v[0]), jitter = ((n++ * 37) % 9 - 4) * 4.2, cx = X(c[3]), cy = y + rowH / 2 + jitter;
        s += c[4] ? `<path d="M${cx} ${cy - 7} L${cx + 7} ${cy} L${cx} ${cy + 7} L${cx - 7} ${cy}Z" style="fill:none;stroke:${cols[pi]};stroke-width:1.8"/>`
          : `<circle cx="${cx}" cy="${cy}" r="5.2" style="fill:${cols[pi]};opacity:.88;stroke:var(--paper);stroke-width:1"/>`;
      }));
    });
    [-30, -20, -10, -3, 0, 3, 10, 20, 30].forEach(v => s += tx(X(v), H - 8, (v === -30 ? '≤ ' : v === 30 ? '≥ ' : '') + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + ' %', { a: 'middle', fs: 11, c: 'mut' }));
    s += `<line x1="${X(0)}" y1="${Tp}" x2="${X(0)}" y2="${H - 24}" style="stroke:var(--text);stroke-width:1"/>`;
    return svgEl(W, H, s, T('Diferencias de la validación', 'Validation differences'));
  }
};
function drawCharts(){
  $$('figure[data-chart]').forEach(f => {
    let box = f.querySelector('.chart');
    if (!box) { box = document.createElement('div'); box.className = 'chart'; f.insertBefore(box, f.firstChild); }
    box.innerHTML = CHARTS[f.dataset.chart]();
  });
  $('#coverArt').innerHTML = `<div class="chart" style="box-shadow:var(--shadow-lg)">${CHARTS.region(true)}</div>`;
  $('#tOpt').innerHTML = OPT.map(o => `<tr><td>${o[0]} · ${T(o[1], o[2])}</td><td class="r">${NF(o[3], 2)}</td><td class="r"><b>${NF(o[4], 2)}</b></td><td class="c"><span class="badge ok">✓</span></td></tr>`).join('');
}

/* =====================================================================
   IDIOMA, TEMA, FIGURAS, ÍNDICE, BÚSQUEDA (mismo esqueleto que el
   Instructivo del Productor)
   ===================================================================== */
function getLang(){
  const u = new URLSearchParams(location.search).get('lang');
  if (u === 'es' || u === 'en') return u;
  try { const s = localStorage.getItem('ratioavis_lang'); if (s === 'es' || s === 'en') return s; } catch (_) {}
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}
let LANG = getLang();
function setLang(l){
  LANG = l; document.documentElement.lang = l; document.documentElement.dataset.lang = l;
  $$('.seg button').forEach(b => b.classList.toggle('on', b.dataset.lang === l));
  $('#q').placeholder = l === 'es' ? 'Buscar en el instructivo…' : 'Search the guide…';
  document.title = l === 'es' ? 'RatioAvis · Instructivo del Científico' : 'RatioAvis · Scientist Guide';
  $('#pdfBtn').href = l === 'es' ? 'instructivo/RatioAvis-Instructivo-Cientifico.pdf' : 'instructivo/RatioAvis-Scientist-Guide.pdf';
  try { localStorage.setItem('ratioavis_lang', l); } catch (_) {}
  drawCharts(); buildToc(); numberFigures(); buscar();
}
$$('.seg button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

function setTheme(t){
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  $('#temaBtn').textContent = dark ? '☀' : '☾';
}
try { setTheme(localStorage.getItem('ratioavis_tema')); } catch (_) { setTheme(null); }
$('#temaBtn').addEventListener('click', () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const nt = cur === 'dark' ? 'light' : 'dark'; setTheme(nt); try { localStorage.setItem('ratioavis_tema', nt); } catch (_) {}
});

$$('figure[data-fig]').forEach(fig => {
  const id = fig.dataset.fig, cap = fig.querySelector('figcaption');
  const order = (fig.dataset.marks || '').split(',').filter(Boolean).map(Number);
  const holder = document.createElement('div');
  ['es', 'en'].forEach(l => {
    const shot = document.createElement('div'); shot.className = 'shot'; shot.lang = l;
    const img = new Image(); img.src = `instructivo/img/${id}-${l}.jpg`; img.loading = new URLSearchParams(location.search).has('eager') ? 'eager' : 'lazy'; img.decoding = 'async';
    img.alt = (cap ? cap.querySelector(`[lang="${l}"] b`)?.textContent : '') || id;
    shot.appendChild(img);
    const data = CAP[`${id}-${l}`];
    order.forEach((mi, n) => {
      const m = data && data.marks && data.marks[mi]; if (!m) return;
      const mk = document.createElement('span'); mk.className = 'mk';
      mk.style.left = m.l + '%'; mk.style.top = m.t + '%'; mk.style.width = (m.r - m.l) + '%'; mk.style.height = (m.b - m.t) + '%';
      mk.innerHTML = `<span class="ring"></span><span class="num">${n + 1}</span>`;
      shot.appendChild(mk);
    });
    shot.addEventListener('click', () => { const z = $('#zoom .zi'); z.innerHTML = ''; const c = shot.cloneNode(true); c.querySelector('img').loading = 'eager'; z.appendChild(c); $('#zoom').classList.add('on'); });
    holder.appendChild(shot);
  });
  fig.insertBefore(holder, fig.firstChild);
});
$('#zoom').addEventListener('click', () => $('#zoom').classList.remove('on'));
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#zoom').classList.remove('on'); $('#toc').classList.remove('open'); } });

function numberFigures(){
  let i = 0;
  $$('figure .fn').forEach(fn => { i++; fn.textContent = (LANG === 'es' ? 'Figura ' : 'Figure ') + i; });
}
const GRUPOS = { leer: ['Preliminares', 'Front matter'], modelo: ['Método', 'Method'], datos: ['El caso', 'The case'], validacion: ['Evidencia y uso', 'Evidence and use'] };
function txt(el){ const x = el.querySelector(`[lang="${LANG}"]`); return (x || el).textContent.trim(); }
function buildToc(){
  const ol = $('#tocList'); ol.innerHTML = '';
  $$('section.chap').forEach(sec => {
    const g = GRUPOS[sec.id]; if (g) { const li = document.createElement('li'); li.className = 'grp'; li.textContent = g[LANG === 'es' ? 0 : 1]; ol.appendChild(li); }
    const h2 = sec.querySelector('h2[lang="' + LANG + '"]') || sec.querySelector('h2');
    const li = document.createElement('li'); li.dataset.sec = sec.id;
    li.innerHTML = `<a href="#${sec.id}" style="--c:${getComputedStyle(sec).getPropertyValue('--c')}"><span class="n">${sec.dataset.toc}</span><span>${h2 ? h2.textContent : ''}</span></a>`;
    ol.appendChild(li);
    const subs = $$('h3[id][data-n]', sec);
    if (subs.length) {
      const so = document.createElement('ol'); so.className = 'sub';
      subs.forEach(h => { const s = document.createElement('li'); s.dataset.sec = h.id; s.innerHTML = `<a href="#${h.id}">${txt(h)}</a>`; so.appendChild(s); });
      li.appendChild(so);
    }
    const nav = sec.querySelector('.inchap');
    if (nav) nav.innerHTML = subs.map(h => `<a href="#${h.id}" data-n="${h.dataset.n}">${txt(h)}</a>`).join('');
    subs.forEach(h => { if (!h.querySelector('.sn')) h.insertAdjacentHTML('afterbegin', `<span class="sn">${h.dataset.n}</span>`); });
  });
  spy();
}
$('#tocList').addEventListener('click', e => { if (e.target.closest('a')) $('#toc').classList.remove('open'); });
$('#menuBtn').addEventListener('click', () => $('#toc').classList.toggle('open'));
function spy(){
  const y = scrollY + 120; let cur = null;
  $$('section.chap, h3[id]').forEach(el => { if (el.getBoundingClientRect().top + scrollY <= y) cur = el.id; });
  $$('#tocList a').forEach(a => a.classList.toggle('act', a.getAttribute('href') === '#' + cur));
  const h = document.documentElement.scrollHeight - innerHeight;
  $('#leido').style.width = (h > 0 ? 100 * scrollY / h : 0) + '%';
  $('.totop').classList.toggle('on', scrollY > 900);
}
addEventListener('scroll', spy, { passive: true });

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function buscar(){
  const q = norm($('#q').value.trim()), hits = $('#hits');
  const items = $$('#tocList > li[data-sec]');
  if (q.length < 2) { items.forEach(li => { li.classList.remove('hide'); $$('.sub li', li).forEach(s => s.classList.remove('hide')); }); hits.textContent = ''; return; }
  let n = 0;
  items.forEach(li => {
    const sec = document.getElementById(li.dataset.sec);
    let any = false;
    $$('.sub li', li).forEach(s => {
      const h = document.getElementById(s.dataset.sec); let seg = '', el = h;
      do { seg += ' ' + (el.matches && el.matches(`[lang="${LANG}"]`) ? el.textContent : $$(`[lang="${LANG}"]`, el).map(x => x.textContent).join(' ')); el = el.nextElementSibling; } while (el && el.tagName !== 'H3');
      const ok = norm(seg).includes(q); s.classList.toggle('hide', !ok); if (ok) { any = true; n++; }
    });
    const self = norm($$(`[lang="${LANG}"]`, sec).map(x => x.textContent).join(' ')).includes(q); if (self && !any) n++;
    li.classList.toggle('hide', !(self || any));
  });
  hits.textContent = n ? (LANG === 'es' ? `${n} coincidencia${n > 1 ? 's' : ''}` : `${n} match${n > 1 ? 'es' : ''}`) : (LANG === 'es' ? 'Sin coincidencias' : 'No matches');
}
$('#q').addEventListener('input', buscar);
$('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { const a = $('#tocList li:not(.hide) .sub li:not(.hide) a') || $('#tocList li:not(.hide) a'); if (a) a.click(); } });

const GLOS = [
  ['Base óptima', 'Optimal basis', 'Conjunto de variables básicas en el óptimo; mientras no cambie, precios sombra y costos reducidos son constantes.', 'Set of basic variables at the optimum; while it does not change, shadow prices and reduced costs stay constant.'],
  ['Brecha primal–dual', 'Primal–dual gap', 'Diferencia relativa entre el costo de la dieta y el valor dual; cero en el óptimo.', 'Relative difference between diet cost and dual value; zero at the optimum.'],
  ['Costo reducido', 'Reduced cost', 'Aumento del costo por punto % que se obligue a entrar a un ingrediente fuera de la base.', 'Cost increase per % point a non-basic ingredient is forced in.'],
  ['Degeneración', 'Degeneracy', 'Vértice con alguna variable básica en cero; puede provocar ciclos sin una regla anticiclado.', 'Vertex with a basic variable at zero; may cause cycling without an anti-cycling rule.'],
  ['Digestible ileal estandarizado (DIE)', 'Standardized ileal digestible (SID)', 'Fracción del aminoácido absorbida al final del íleon, corregida por pérdidas endógenas basales.', 'Fraction of the amino acid absorbed by the end of the ileum, corrected for basal endogenous losses.'],
  ['Factibilidad', 'Feasibility', 'Existencia de al menos una dieta que cumple todas las restricciones.', 'Existence of at least one diet meeting every constraint.'],
  ['Holgura complementaria', 'Complementary slackness', 'Una restricción no activa tiene precio sombra cero, y viceversa.', 'A non-binding constraint has a zero shadow price, and vice versa.'],
  ['Precio de entrada', 'Entry price', 'Precio por debajo del cual un ingrediente no usado entraría a la fórmula: c − d.', 'Price below which an unused ingredient would enter the formula: c − d.'],
  ['Precio sombra', 'Shadow price', 'Variable dual: cambio del costo óptimo por unidad de lado derecho de una restricción.', 'Dual variable: change in optimal cost per unit of a constraint’s right-hand side.'],
  ['Programación lineal', 'Linear programming', 'Optimización de una función lineal sujeta a restricciones lineales.', 'Optimization of a linear function subject to linear constraints.'],
  ['Proteína ideal', 'Ideal protein', 'Perfil de aminoácidos esenciales expresado como % de la lisina.', 'Essential amino-acid profile expressed as % of lysine.'],
  ['Regla de Bland', 'Bland’s rule', 'Criterio de pivoteo por menor índice que evita ciclos en el símplex.', 'Lowest-index pivoting rule that prevents cycling in simplex.'],
  ['Restricción activa', 'Binding constraint', 'Restricción que se cumple con igualdad en el óptimo.', 'Constraint met with equality at the optimum.'],
  ['Variable artificial', 'Artificial variable', 'Variable auxiliar de la fase I para obtener una base inicial factible.', 'Auxiliary phase-I variable used to obtain an initial feasible basis.']
];
$('#glos').innerHTML = GLOS.map(g => `<dt><span lang="es">${g[0]}<small>${g[1]}</small></span><span lang="en">${g[1]}<small>${g[0]}</small></span></dt><dd><span lang="es">${g[2]}</span><span lang="en">${g[3]}</span></dd>`).join('');

document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const el = document.getElementById(b.dataset.copy); const t = el.querySelector('p') ? el.querySelector('p').innerText : el.innerText;
  try { navigator.clipboard.writeText(t); const o = b.textContent; b.textContent = LANG === 'es' ? 'Copiado ✓' : 'Copied ✓'; setTimeout(() => b.textContent = o, 1400); } catch (_) {}
});
addEventListener('beforeprint', () => $$('img[loading="lazy"]').forEach(i => i.loading = 'eager'));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', drawCharts);

setLang(LANG);
addEventListener('load', () => { const h = decodeURIComponent(location.hash.slice(1)); const el = h && document.getElementById(h); if (el) { document.documentElement.style.scrollBehavior = 'auto'; el.scrollIntoView(); document.documentElement.style.scrollBehavior = ''; } });
