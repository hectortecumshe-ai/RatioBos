
"use strict";
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const CAP = window.CAPTURAS || {};

/* ---------- idioma ---------- */
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
  document.title = l === 'es' ? 'RatioAvis · Instructivo del Productor' : 'RatioAvis · Producer Guide';
  try { localStorage.setItem('ratioavis_lang', l); } catch (_) {}
  $('#pdfBtn').href = l === 'es' ? 'instructivo/RatioAvis-Instructivo-Productor.pdf' : 'instructivo/RatioAvis-Producer-Guide.pdf';
  buildToc(); numberFigures(); buscar();
}
$$('.seg button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

/* ---------- tema ---------- */
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

/* ---------- figuras: dos idiomas + marcas sobre la captura ---------- */
$$('figure[data-fig]').forEach(fig => {
  const id = fig.dataset.fig, cap = fig.querySelector('figcaption');
  const order = (fig.dataset.marks || '').split(',').filter(Boolean).map(Number);
  const fix = Object.fromEntries((fig.dataset.fix || '').split(';').filter(Boolean).map(s => { const [k, v] = s.split(':'); return [+k, v.split(',').map(Number)]; }));
  const holder = document.createElement('div');
  ['es', 'en'].forEach(l => {
    const shot = document.createElement('div'); shot.className = 'shot'; shot.lang = l;
    const img = new Image(); img.src = `instructivo/img/${id}-${l}.jpg`; img.loading = new URLSearchParams(location.search).has('eager') ? 'eager' : 'lazy'; img.decoding = 'async';
    img.alt = (cap ? cap.querySelector(`[lang="${l}"] b, [lang="${l}"]`)?.textContent : '') || id;
    shot.appendChild(img);
    const data = CAP[`${id}-${l}`];
    order.forEach((mi, n) => {
      const m = data && data.marks && data.marks[mi];
      const mk = document.createElement('span'); mk.className = 'mk';
      if (fix[n]) { mk.classList.add('dotonly'); mk.style.left = fix[n][0] + '%'; mk.style.top = fix[n][1] + '%'; mk.style.width = mk.style.height = '0'; }
      else if (m) { mk.style.left = m.l + '%'; mk.style.top = m.t + '%'; mk.style.width = (m.r - m.l) + '%'; mk.style.height = (m.b - m.t) + '%'; }
      else return;
      mk.innerHTML = `<span class="ring"></span><span class="num">${n + 1}</span>`;
      shot.appendChild(mk);
    });
    shot.addEventListener('click', () => abrirZoom(shot));
    holder.appendChild(shot);
  });
  if (fig.dataset.phone) { holder.className = 'phone'; }
  fig.insertBefore(holder, fig.firstChild);
});
function numberFigures(){
  $$('section.chap').forEach(sec => {
    const n = sec.dataset.toc; let i = 0;
    $$('figure[data-fig] .fn', sec).forEach(fn => { i++; fn.textContent = (LANG === 'es' ? 'Figura ' : 'Figure ') + (/^\d$/.test(n) ? n + '.' + i : i); });
  });
}

/* ---------- visor ---------- */
function abrirZoom(shot){ const z = $('#zoom .zi'); z.innerHTML = ''; const c = shot.cloneNode(true); c.style.cursor = 'zoom-out'; c.querySelector('img').loading = 'eager'; z.appendChild(c); $('#zoom').classList.add('on'); }
$('#zoom').addEventListener('click', () => $('#zoom').classList.remove('on'));
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#zoom').classList.remove('on'); $('#toc').classList.remove('open'); } });

/* ---------- índice lateral ---------- */
const GRUPOS = { leer: ['Para empezar', 'Getting started'], b1: ['Los ocho bloques', 'The eight blocks'], mezclar: ['Consulta', 'Reference'] };
function txt(el){ const x = el.querySelector(`[lang="${LANG}"]`); return (x || el).textContent.trim(); }
function buildToc(){
  const ol = $('#tocList'); ol.innerHTML = '';
  $$('section.chap').forEach(sec => {
    const g = GRUPOS[sec.id]; if (g) { const li = document.createElement('li'); li.className = 'grp'; li.textContent = g[LANG === 'es' ? 0 : 1]; ol.appendChild(li); }
    const h2 = sec.querySelector('h2[lang="' + LANG + '"]') || sec.querySelector('h2');
    const li = document.createElement('li'); li.dataset.sec = sec.id;
    li.innerHTML = `<a href="#${sec.id}" style="--c:${getComputedStyle(sec).getPropertyValue('--c')}"><span class="n">${sec.dataset.toc}</span><span>${h2 ? h2.textContent : ''}</span></a>`;
    ol.appendChild(li);
    const subs = $$('h3[id]', sec);
    if (subs.length && /^\d$/.test(sec.dataset.toc)) {
      const so = document.createElement('ol'); so.className = 'sub';
      subs.forEach(h => { const s = document.createElement('li'); s.dataset.sec = h.id; s.innerHTML = `<a href="#${h.id}">${txt(h)}</a>`; so.appendChild(s); });
      li.appendChild(so);
    }
    const nav = sec.querySelector('.inchap');
    if (nav) nav.innerHTML = subs.map(h => `<a href="#${h.id}" data-n="${h.dataset.n || ''}">${txt(h)}</a>`).join('');
    subs.forEach(h => { if (h.dataset.n && !h.querySelector('.sn')) h.insertAdjacentHTML('afterbegin', `<span class="sn">${h.dataset.n}</span>`); });
  });
  spy();
}
$('#tocList').addEventListener('click', e => { if (e.target.closest('a')) $('#toc').classList.remove('open'); });
$('#menuBtn').addEventListener('click', () => $('#toc').classList.toggle('open'));

/* ---------- posición de lectura ---------- */
function spy(){
  const y = scrollY + 120; let cur = null;
  $$('section.chap, h3[id]').forEach(el => { if (el.getBoundingClientRect().top + scrollY <= y) cur = el.id; });
  $$('#tocList a').forEach(a => a.classList.toggle('act', a.getAttribute('href') === '#' + cur));
  const h = document.documentElement.scrollHeight - innerHeight;
  $('#leido').style.width = (h > 0 ? 100 * scrollY / h : 0) + '%';
  $('.totop').classList.toggle('on', scrollY > 900);
}
addEventListener('scroll', spy, { passive: true });

/* ---------- buscador ---------- */
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function buscar(){
  const q = norm($('#q').value.trim()), hits = $('#hits');
  const items = $$('#tocList > li[data-sec]');
  if (q.length < 2) { items.forEach(li => { li.classList.remove('hide'); $$('.sub li', li).forEach(s => s.classList.remove('hide')); }); hits.textContent = ''; return; }
  let n = 0;
  items.forEach(li => {
    const sec = document.getElementById(li.dataset.sec);
    const vis = el => norm($$(`[lang="${LANG}"]`, el).map(x => x.textContent).join(' ') + ' ' + (el.dataset.toc || ''));
    let any = false;
    $$('.sub li', li).forEach(s => {
      const h = document.getElementById(s.dataset.sec); let seg = '', el = h;
      do { seg += ' ' + (el.matches && el.matches(`[lang="${LANG}"]`) ? el.textContent : $$(`[lang="${LANG}"]`, el).map(x => x.textContent).join(' ')); el = el.nextElementSibling; } while (el && el.tagName !== 'H3');
      const ok = norm(seg).includes(q); s.classList.toggle('hide', !ok); if (ok) { any = true; n++; }
    });
    const self = vis(sec).includes(q); if (self && !any) n++;
    li.classList.toggle('hide', !(self || any));
  });
  hits.textContent = n ? (LANG === 'es' ? `${n} coincidencia${n > 1 ? 's' : ''}` : `${n} match${n > 1 ? 'es' : ''}`) : (LANG === 'es' ? 'Sin coincidencias' : 'No matches');
}
$('#q').addEventListener('input', buscar);
$('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { const a = $('#tocList li:not(.hide) .sub li:not(.hide) a') || $('#tocList li:not(.hide) a'); if (a) a.click(); } });

/* ---------- glosario ---------- */
const GLOS = [
  ['Ascitis', 'Ascites', 'Acumulación de líquido en el abdomen por exceso de trabajo del corazón; frecuente en la altura.', 'Fluid build-up in the abdomen from an overworked heart; common at altitude.'],
  ['Bache', 'Batch', 'Lo que se mezcla en una tanda de la mezcladora; por ejemplo, 1,000 kg.', 'What is mixed in one load of the mixer; for example, 1,000 kg.'],
  ['Balance electrolítico', 'Electrolyte balance', 'Sodio + potasio − cloro, en mEq/kg. Con calor conviene cerca de 250.', 'Sodium + potassium − chloride, in mEq/kg. In the heat, around 250 is advisable.'],
  ['Conversión alimenticia', 'Feed conversion ratio (FCR)', 'Kilos de alimento por kilo de peso ganado. Entre más baja, mejor.', 'Kilos of feed per kilo of weight gained. The lower, the better.'],
  ['Energía metabolizable (EM)', 'Metabolizable energy (ME)', 'La energía del alimento que el ave sí aprovecha, en kcal/kg.', 'The feed energy the bird can actually use, in kcal/kg.'],
  ['Fase', 'Phase', 'Periodo de la vida del pollo con su propia dieta: iniciación, crecimiento, finalización.', 'Period of the bird’s life with its own diet: starter, grower, finisher.'],
  ['Límite de inclusión', 'Inclusion limit', 'Mínimo y máximo % que puede llevar un ingrediente en la dieta.', 'Minimum and maximum % an ingredient may have in the diet.'],
  ['Lisina digestible', 'Digestible lysine', 'El aminoácido de referencia: el primero que falta en dietas de maíz y soya.', 'The reference amino acid: the first one lacking in corn–soy diets.'],
  ['Mínimo costo', 'Least cost', 'La fórmula más barata entre todas las que cumplen los requerimientos.', 'The cheapest formula among all those that meet the requirements.'],
  ['msnm', 'm a.s.l.', 'Metros sobre el nivel del mar.', 'Metres above sea level.'],
  ['Precio de entrada', 'Entry price', 'Precio al que un ingrediente que quedó fuera empezaría a convenir.', 'Price at which an ingredient left out would start to pay off.'],
  ['Premezcla', 'Premix', 'Mezcla previa de ingredientes de menos de 0.5 % con un poco de maíz, para repartirlos bien.', 'A pre-blend of ingredients under 0.5 % with a little corn, so they spread evenly.'],
  ['Proteína cruda (PC)', 'Crude protein (CP)', 'Contenido total de proteína del alimento, en %.', 'Total protein content of the feed, in %.'],
  ['Puesto en granja', 'Delivered to farm', 'Precio que incluye el flete y la descarga hasta tu granja.', 'Price including freight and unloading to your farm.'],
  ['Requerimiento', 'Requirement', 'Cantidad de un nutriente que el ave necesita por kilo de alimento.', 'Amount of a nutrient the bird needs per kilo of feed.'],
  ['Xantofilas', 'Xanthophylls', 'Pigmentos amarillos (maíz, gluten, cempasúchil) que dan color a la piel.', 'Yellow pigments (corn, gluten, marigold) that colour the skin.']
];
$('#glos').innerHTML = GLOS.map(g => `<dt><span lang="es">${g[0]}<small>${g[1]}</small></span><span lang="en">${g[1]}<small>${g[0]}</small></span></dt><dd><span lang="es">${g[2]}</span><span lang="en">${g[3]}</span></dd>`).join('');

/* ---------- al imprimir, carga todas las imágenes ---------- */
addEventListener('beforeprint', () => $$('img[loading="lazy"]').forEach(i => i.loading = 'eager'));


setLang(LANG);
/* al abrir con #ancla, ir ahí cuando las figuras ya ocupan su lugar */
addEventListener('load', () => { const h = decodeURIComponent(location.hash.slice(1)); const el = h && document.getElementById(h); if (el) { document.documentElement.style.scrollBehavior = 'auto'; el.scrollIntoView(); document.documentElement.style.scrollBehavior = ''; } });
