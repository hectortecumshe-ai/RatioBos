"""Instructivo del Científico de RatioBos: figuras con datos de la app y armado del HTML."""
import html as _html
import json
import os
import re

from armar import (AQUI, RAIZ, VERSION, DOI, AUTORES, CLARO, OSCURO, leer, bi, fig, banda, doi, js)

PUNTOFIJO = [[1.6, 2.0604], [1.65, 1.9877], [1.7, 1.9529], [1.75, 1.9277], [1.8, 1.91], [1.85, 1.895], [1.9, 1.8854], [1.95, 1.879],
             [2.0, 1.876], [2.05, 1.8751], [2.1, 1.8786], [2.15, 1.8832], [2.2, 1.8911], [2.25, 1.9012], [2.3, 1.9146], [2.35, 1.9291],
             [2.4, 1.9469], [2.45, 1.9666]]
ITERS = [[2.05, 1.8751], [1.9013, 1.8854], [1.8878, 1.8875]]
FRONTERA = [(0, 25.93, 5.148), (2000, 26.02, 5.114), (5000, 26.58, 4.963), (8000, 26.66, 4.954), (20000, 28.03, 4.866)]


def ejes(s, X, Y, xs, ys, x0, x1, y0, y1, dx=2, dy=2, xlab=('', ''), ylab=('', '')):
    for v in ys:
        s.append(f'<line class="ln" x1="{x0}" x2="{x1}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke-dasharray="2 4"/>'
                 f'<text x="{x0-8}" y="{Y(v)+4:.1f}" text-anchor="end" font-size="12" class="mu">{v:.{dy}f}</text>')
    for v in xs:
        s.append(f'<text x="{X(v):.1f}" y="{y0+18}" text-anchor="middle" font-size="12" class="mu">{v:.{dx}f}</text>')
    s.append(f'<line class="ln" x1="{x0}" x2="{x1}" y1="{y0}" y2="{y0}"/>')
    s.append(bi(xlab[0], xlab[1], x=f'{(x0+x1)/2:.0f}', y=str(y0 + 38), text_anchor='middle', font_size='12.5', class_='mu'))
    s.append(f'<g transform="translate(16 {(y0+y1)/2:.0f}) rotate(-90)">' + bi(ylab[0], ylab[1], x='0', y='0', text_anchor='middle', font_size='12.5', class_='mu') + '</g>')


def fig_puntofijo(compacta=False):
    W, H = (520, 340) if compacta else (760, 400)
    x0, x1, y1, y0 = 64, W - 20, 20, H - 64
    X = lambda v: x0 + (v - 1.2) / (2.9 - 1.2) * (x1 - x0)
    Y = lambda v: y0 - (v - 1.2) / (2.9 - 1.2) * (y0 - y1)
    s = [f'<svg viewBox="0 0 {W} {H}" role="img">']
    for a, b in [(1.2, 1.575), (2.475, 2.9)]:
        s.append(f'<rect x="{X(a):.1f}" y="{y1}" width="{X(b)-X(a):.1f}" height="{y0-y1}" fill="var(--b8)" opacity=".08"/>')
    s.append(bi('sin solución', 'infeasible', x=f'{X(1.39):.1f}', y=str(y1 + 18), text_anchor='middle', font_size='12', class_='mu'))
    s.append(bi('sin solución', 'infeasible', x=f'{X(2.69):.1f}', y=str(y1 + 18), text_anchor='middle', font_size='12', class_='mu'))
    ejes(s, X, Y, [1.2, 1.6, 2.0, 2.4, 2.8], [1.2, 1.6, 2.0, 2.4, 2.8], x0, x1, y0, y1, 1, 1,
         ('ENm supuesta g (Mcal/kg MS)', 'assumed NEm g (Mcal/kg DM)'), ('ENm de la ración', 'ration NEm'))
    s.append(f'<line x1="{X(1.2):.1f}" y1="{Y(1.2):.1f}" x2="{X(2.9):.1f}" y2="{Y(2.9):.1f}" stroke="var(--muted)" stroke-dasharray="6 5"/>')
    s.append(bi('ENm ración = g', 'ration NEm = g', x=f'{X(2.62):.1f}', y=f'{Y(2.62)-8:.1f}', text_anchor='end', font_size='12', class_='mu'))
    pts = ' '.join(f'{X(a):.1f},{Y(b):.1f}' for a, b in PUNTOFIJO)
    s.append(f'<polyline points="{pts}" fill="none" stroke="var(--b7)" stroke-width="3"/>')
    for a, b in PUNTOFIJO:
        s.append(f'<circle cx="{X(a):.1f}" cy="{Y(b):.1f}" r="2.6" fill="var(--b7)"/>')
    path = ' '.join(f'{X(a):.1f},{Y(a):.1f} {X(a):.1f},{Y(b):.1f} {X(b):.1f},{Y(b):.1f}' for a, b in ITERS)
    s.append(f'<polyline points="{path}" fill="none" stroke="var(--b3)" stroke-width="1.8"/>')
    for k, (a, b) in enumerate(ITERS):
        s.append(f'<circle cx="{X(a):.1f}" cy="{Y(b):.1f}" r="5" fill="var(--paper)" stroke="var(--b3)" stroke-width="2"/>')
        if not compacta and k != 1:
            dxl = 8 if k == 0 else -18
            s.append(f'<text x="{X(a)+dxl:.1f}" y="{Y(b)+20:.1f}" font-size="12" font-weight="700" fill="var(--b3)">{k+1}</text>')
    s.append(f'<circle cx="{X(1.888):.1f}" cy="{Y(1.888):.1f}" r="7" fill="var(--b7)"/>')
    s.append(bi('punto fijo g* = 1.888', 'fixed point g* = 1.888', x=f'{X(1.888)-12:.1f}', y=f'{Y(1.888)-14:.1f}', text_anchor='end', font_size='13', font_weight='700'))
    s.append('</svg>')
    if compacta:
        return f'<div class="chart">{"".join(s)}</div>'
    return fig(''.join(s), '<b>El punto fijo del caso.</b> Curva terracota: ENm de la ración de costo mínimo para cada ENm supuesta; línea punteada: identidad. En azul, las tres iteraciones que hizo la app desde g = 2.05. Fuera de 1.6–2.45 Mcal/kg el programa lineal no tiene solución.',
               '<b>The case fixed point.</b> Terracotta curve: NEm of the least-cost ration for each assumed NEm; dashed line: identity. In blue, the three iterations the app made from g = 2.05. Outside 1.6–2.45 Mcal/kg the linear program has no solution.')


def fig_frontera():
    W, H = 760, 330
    x0, x1, y1, y0 = 70, 740, 20, 260
    X = lambda v: x0 + (v - 4.84) / (5.18 - 4.84) * (x1 - x0)
    Y = lambda v: y0 - (v - 25.6) / (28.4 - 25.6) * (y0 - y1)
    s = [f'<svg viewBox="0 0 {W} {H}" role="img">']
    ejes(s, X, Y, [4.85, 4.95, 5.05, 5.15], [26.0, 26.5, 27.0, 27.5, 28.0], x0, x1, y0, y1, 2, 1,
         ('kg CO₂e por kg ganado', 'kg CO₂e per kg gained'), ('$ de alimento por kg ganado', 'feed $ per kg gained'))
    pts = ' '.join(f'{X(c):.1f},{Y(p):.1f}' for w, p, c in sorted(FRONTERA, key=lambda t: t[2]))
    s.append(f'<polyline points="{pts}" fill="none" stroke="var(--b10)" stroke-width="3"/>')
    for w, p, c in FRONTERA:
        eq = w == 5000
        s.append(f'<circle cx="{X(c):.1f}" cy="{Y(p):.1f}" r="{7 if eq else 5}" fill="{"var(--b7)" if eq else "var(--paper)"}" stroke="{"var(--b7)" if eq else "var(--b10)"}" stroke-width="2.2"/>')
        izq = w == 8000
        s.append(f'<text x="{X(c)+(-10 if izq else 10):.1f}" y="{Y(p)-9:.1f}" font-size="12" font-weight="{700 if eq else 400}"{" text-anchor=\"end\"" if izq else ""}>w = {w:,}</text>')
    s.append(bi('equilibrio: −3.6 % de huella, +2.5 % de costo', 'balance: −3.6 % footprint, +2.5 % cost', x=f'{X(4.963)+10:.1f}', y=f'{Y(26.58)+20:.1f}', font_size='12', fill='var(--b7)'))
    s.append('</svg>')
    return fig(''.join(s), '<b>Frontera costo–huella del caso.</b> Cada punto es una ración óptima con un precio interno del carbono <i>w</i> ($/t CO₂e). Con <i>w</i> = 1,000, 3,500 y 12,000 la ración no cambia respecto al punto anterior. Cada tonelada evitada en el equilibrio cuesta ≈ $3,500.',
               '<b>Cost–footprint frontier for the case.</b> Each point is an optimal ration under an internal carbon price <i>w</i> ($/t CO₂e). At <i>w</i> = 1,000, 3,500 and 12,000 the ration does not change from the previous point. Each tonne avoided at the balance point costs ≈ $3,500.')


def tabla_articulos(V):
    lug = {'ea2022': ('Culiacán, Sinaloa', 'Toretes cruzados, finalización', 'Crossbred bulls, finishing'),
           'pl2022': ('El Centro, California', 'Becerros Holstein, crecimiento', 'Holstein calves, growing'),
           'ra2018': ('El Centro, California', 'Novillos Holstein, 1–112 d', 'Holstein steers, d 1–112'),
           'cp2020': ('Culiacán, Sinaloa', 'Toretes en clima tropical (sombra)', 'Bulls in tropical climate (shade)'),
           'rc2025': ('Zacatecas', 'Becerros enteros de alto riesgo', 'High-risk bull calves'),
           'gv2017': ('El Centro, California', 'Novillos, maíz rolado contra hojueleado', 'Steers, dry-rolled vs flaked corn'),
           'mo2023': ('El Centro, California', 'Becerros Holstein, DDGS', 'Holstein calves, DDGS'),
           'sc2024': ('El Centro, California', 'Becerros Holstein, PM y metionina', 'Holstein calves, MP and methionine'),
           'ca2022': ('El Centro, California', 'Novillos Holstein, PM y virginiamicina', 'Holstein steers, MP and virginiamycin')}
    filas = ''.join(f'<tr><td>{c["corta"]}</td><td>{lug[c["id"]][0]}</td><td lang="es">{lug[c["id"]][1]}</td><td lang="en">{lug[c["id"]][2]}</td>'
                    f'<td class="r">{len(c["fases"])}</td><td class="r">{sum(len(f["perf"]) for f in c["fases"])}</td></tr>' for c in V)
    nd = sum(len(c['fases']) for c in V)
    ng = sum(len(f['perf']) for c in V for f in c['fases'])
    return (f'<div class="tbl"><table><thead><tr><th lang="es">Artículo</th><th lang="en">Paper</th><th lang="es">Lugar</th><th lang="en">Site</th>'
            f'<th lang="es">Animales</th><th lang="en">Animals</th><th class="r" lang="es">Dietas</th><th class="r" lang="en">Diets</th>'
            f'<th class="r" lang="es">Grupos</th><th class="r" lang="en">Groups</th></tr></thead><tbody>{filas}'
            f'<tr class="hl"><td><b>Total</b></td><td></td><td></td><td class="r"><b>{nd}</b></td><td class="r"><b>{ng}</b></td></tr></tbody></table></div>')


def fig_val_comp(V):
    W, H = 760, 380
    x0, x1, y1, y0 = 70, 470, 20, 320
    lo, hi = 0.9, 2.35
    X = lambda v: x0 + (v - lo) / (hi - lo) * (x1 - x0)
    Y = lambda v: y0 - (v - lo) / (hi - lo) * (y0 - y1)
    s = [f'<svg viewBox="0 0 {W} {H}" role="img">']
    ejes(s, X, Y, [1.0, 1.4, 1.8, 2.2], [1.0, 1.4, 1.8, 2.2], x0, x1, y0, y1, 1, 1,
         ('reportada por los autores (Mcal/kg)', 'reported by the authors (Mcal/kg)'), ('calculada por RatioBos', 'computed by RatioBos'))
    s.append(f'<line x1="{X(lo):.1f}" y1="{Y(lo):.1f}" x2="{X(hi):.1f}" y2="{Y(hi):.1f}" stroke="var(--muted)" stroke-dasharray="6 5"/>')
    for c in V:
        for f in c['fases']:
            for k, rep, app in f['comp']:
                if k == 'NEm':
                    s.append(f'<circle cx="{X(rep):.1f}" cy="{Y(app):.1f}" r="4.5" fill="var(--b3)" opacity=".8"/>')
                elif k == 'NEg':
                    s.append(f'<rect x="{X(rep)-4:.1f}" y="{Y(app)-4:.1f}" width="8" height="8" fill="var(--b7)" opacity=".8"/>')
    s.append(f'<circle cx="{x0+16}" cy="{y1+8}" r="4.5" fill="var(--b3)"/><text x="{x0+26}" y="{y1+12}" font-size="12.5">ENm</text>')
    s.append(f'<rect x="{x0+70}" y="{y1+4}" width="8" height="8" fill="var(--b7)"/><text x="{x0+84}" y="{y1+12}" font-size="12.5">ENg</text>')
    grupos = [('Energía neta', 'Net energy', ('NEm', 'NEg')), ('Proteína cruda', 'Crude protein', ('PC',)),
              ('Fibra y grasa', 'Fibre and fat', ('FDN', 'EE')), ('Ca, P y S', 'Ca, P and S', ('Ca', 'P', 'S'))]
    bx0, bx1 = 540, 740
    s.append(bi('Error absoluto medio', 'Mean absolute error', x=str(bx0), y=str(y1 + 12), font_size='13', font_weight='700'))
    for gi, (es, en, ks) in enumerate(grupos):
        e = [abs(app - rep) / rep * 100 for c in V for f in c['fases'] for k, rep, app in f['comp'] if k in ks]
        m = sum(e) / len(e)
        y = y1 + 50 + gi * 62
        s.append(bi(f'{es} · n = {len(e)}', f'{en} · n = {len(e)}', x=str(bx0), y=str(y), font_size='12.5'))
        w = (bx1 - bx0 - 50) * m / 10
        s.append(f'<rect x="{bx0}" y="{y+8}" width="{w:.1f}" height="16" rx="4" fill="{"var(--b3)" if m < 5 else "var(--b5)"}"/>'
                 f'<text x="{bx0+w+6:.1f}" y="{y+21}" font-size="13" font-weight="700">{m:.1f} %</text>')
    s.append('</svg>')
    return fig(''.join(s), '<b>Composición reportada contra calculada.</b> Izquierda: energía neta de las 19 dietas (la línea punteada es la igualdad). Derecha: error absoluto medio por grupo de nutrientes.',
               '<b>Reported versus computed composition.</b> Left: net energy of the 19 diets (dashed line = equality). Right: mean absolute error by nutrient group.')


def fig_val_costo(V):
    filas = [(c['corta'], i + 1, 100 * (1 - f['co'] / f['cp'])) for c in V for i, f in enumerate(c['fases'])]
    W, fila = 760, 19
    H = 30 + fila * len(filas) + 30
    x0, x1 = 300, 700
    mx = max(r[2] for r in filas)
    X = lambda v: x0 + v / mx * (x1 - x0 - 40)
    s = [f'<svg viewBox="0 0 {W} {H}" role="img">']
    for i, (cita, n, ah) in enumerate(filas):
        y = 24 + i * fila
        s.append(f'<text x="{x0-10}" y="{y+12}" text-anchor="end" font-size="12">{cita} · {n}</text>')
        s.append(f'<rect x="{x0}" y="{y+2}" width="{max(X(ah)-x0,1.5):.1f}" height="13" rx="3" fill="var(--b3)" opacity=".85"/>')
        s.append(f'<text x="{max(X(ah),x0+1.5)+6:.1f}" y="{y+13}" font-size="11.5">{ah:.1f} %</text>')
    s.append(bi('ahorro de la ración del optimizador frente a la publicada (mismos ingredientes y aportes)',
                'saving of the optimiser’s ration over the published one (same ingredients and supply)', x=str(x0 - 230), y=str(H - 6), font_size='12', class_='mu'))
    s.append('</svg>')
    return fig(''.join(s), '<b>Prueba del optimizador.</b> En las 19 dietas la app encontró una ración igual de nutritiva y más barata con los mismos ingredientes (costos con los precios de ejemplo de la app).',
               '<b>Optimiser test.</b> For all 19 diets the app found an equally nutritious, cheaper ration with the same ingredients (costs at the app’s example prices).')


def fig_val_ene(V):
    W, H = 760, 360
    x0, x1, y1, y0 = 70, 470, 20, 300
    lo, hi = 1.1, 2.3
    X = lambda v: x0 + (v - lo) / (hi - lo) * (x1 - x0)
    Y = lambda v: y0 - (v - lo) / (hi - lo) * (y0 - y1)
    s = [f'<svg viewBox="0 0 {W} {H}" role="img">']
    ejes(s, X, Y, [1.2, 1.5, 1.8, 2.1], [1.2, 1.5, 1.8, 2.1], x0, x1, y0, y1, 1, 1,
         ('publicada (Mcal/kg)', 'published (Mcal/kg)'), ('recalculada por RatioBos', 'recomputed by RatioBos'))
    s.append(f'<line x1="{X(lo):.1f}" y1="{Y(lo):.1f}" x2="{X(hi):.1f}" y2="{Y(hi):.1f}" stroke="var(--muted)" stroke-dasharray="6 5"/>')
    e = []
    for c in V:
        for f in c['fases']:
            for nm, nma, ng, nga, *_ in f['perf']:
                s.append(f'<circle cx="{X(nm):.1f}" cy="{Y(nma):.1f}" r="4.5" fill="var(--b3)" opacity=".85"/>')
                s.append(f'<rect x="{X(ng)-4:.1f}" y="{Y(nga)-4:.1f}" width="8" height="8" fill="var(--b7)" opacity=".85"/>')
                e += [abs(nma - nm) / nm * 100, abs(nga - ng) / ng * 100]
    n = len(e) // 2
    s.append(f'<circle cx="{x0+16}" cy="{y1+8}" r="4.5" fill="var(--b3)"/><text x="{x0+26}" y="{y1+12}" font-size="12.5">ENm</text>')
    s.append(f'<rect x="{x0+70}" y="{y1+4}" width="8" height="8" fill="var(--b7)"/><text x="{x0+84}" y="{y1+12}" font-size="12.5">ENg</text>')
    bx = 520
    s.append(bi('Grupos de animales', 'Animal groups', x=str(bx), y='70', font_size='13', class_='mu'))
    s.append(f'<text x="{bx}" y="112" font-size="40" font-weight="700">{n}</text>')
    s.append(bi('Error absoluto medio', 'Mean absolute error', x=str(bx), y='160', font_size='13', class_='mu'))
    s.append(f'<text x="{bx}" y="202" font-size="40" font-weight="700" fill="var(--b3)">{sum(e)/len(e):.2f} %</text>')
    s.append(bi('Error máximo', 'Largest error', x=str(bx), y='250', font_size='13', class_='mu'))
    s.append(f'<text x="{bx}" y="284" font-size="28" font-weight="700">{max(e):.1f} %</text>')
    s.append('</svg>')
    return fig(''.join(s), '<b>Energía neta observada.</b> Con los pesos, la ganancia y el consumo publicados, la app reproduce la ENm y la ENg «observadas» que reportan los autores (Zinn y Shen, 1998).',
               '<b>Observed net energy.</b> From the published weights, gain and intake, the app reproduces the “observed” NEm and NEg reported by the authors (Zinn &amp; Shen, 1998).')


def referencias():
    src = open(os.path.join(RAIZ, 'src', '60_valid_teoria.js'), encoding='utf-8').read()
    i = src.index('const REFERENCIAS = [')
    j = src.index('\n];', i)
    refs = [m.group(1).replace("\\'", "'") for m in re.finditer(r"^\s*'(.*)',?\s*$", src[i:j], re.M)]
    refs.append('National Research Council. (1971). <i>A guide to environmental research on animals</i>. National Academy of Sciences.')
    refs.sort(key=lambda r: r.lower())
    link = lambda r: re.sub(r'(https://doi\.org/\S+?)(\.?)$', r'<a href="\1">\1</a>\2', r)
    return ''.join(f'<li>{link(r)}</li>' for r in refs), len(refs)


def codigo_py():
    t = _html.escape(open(os.path.join(RAIZ, 'pruebas', 'verificar_ratiobos.py'), encoding='utf-8').read(), quote=False)
    t = re.sub(r'(?m)^(\s*)(import|from|def|for|if|return|else)\b', r'\1<span class="k">\2</span>', t)
    t = re.sub(r'(?m)(#[^\n]*)$', r'<span class="c">\1</span>', t)
    return t


def css_cien():
    c = leer('base_cien.css')
    c = c.replace('RatioAvis · Instructivo del Científico', 'RatioBos · Instructivo del Científico')
    c = c.replace('--acc:#c0772b; --acc-d:#8a5214; --acc-s:rgba(192,119,43,.12);', '--acc:#b05434; --acc-d:#8a3a1f; --acc-s:rgba(176,84,52,.12);')
    c = c.replace('--acc:#e2a15c; --acc-d:#f0c08a; --acc-s:rgba(226,161,92,.14);', '--acc:#ea926b; --acc-d:#f4b596; --acc-s:rgba(234,146,107,.14);')
    vc = '--b1:#2f5d50; --b2:#5c8538; --b3:#2f6f8f; --b4:#b0841f; --b5:#c0772b; --b6:#a0502e; --b7:#755a8c; --b8:#4a5d6b;'
    vo = '--b1:#8fc2ad; --b2:#a9cf7e; --b3:#7fbddb; --b4:#e3c063; --b5:#e2a15c; --b6:#e39272; --b7:#bba3d6; --b8:#9fb4c2;'
    assert vc in c and vo in c
    c = c.replace(vc, ' '.join(f'--b{i+1}:{x};' for i, x in enumerate(CLARO)))
    c = c.replace(vo, ' '.join(f'--b{i+1}:{x};' for i, x in enumerate(OSCURO)))
    c += '''
/* ---------- figuras propias y referencias ---------- */
figure.svgfig{padding:18px 18px 4px}
figure.svgfig svg,.cover .art .chart svg{display:block;width:100%;height:auto;font-family:var(--sans)}
figure.svgfig svg text:not([fill]):not(.mu),.cover .art svg text:not([fill]):not(.mu){fill:var(--text)}
figure.svgfig svg .mu,.cover .art svg .mu{fill:var(--muted)}
figure.svgfig svg .ln,.cover .art svg .ln{stroke:var(--line2)}
.cover .art .chart{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:14px 14px 8px;box-shadow:var(--shadow)}
/* la ecuación de portada debajo de la gráfica */
.cover .art .eqc{bottom:-34px;left:auto;right:6%}
@media print{ .cover .pillars{height:auto!important;min-height:30mm} }
ul.refs{padding-left:1.2em;font-size:16px;line-height:1.55}
ul.refs li{margin:0 0 10px;padding-left:.2em}
ul.refs a{word-break:break-all}
'''
    return c


def js_cien(t_es, t_en, pdf_es, pdf_en):
    j = js(t_es, t_en, pdf_es, pdf_en)
    a = "const GRUPOS = { leer: ['Para empezar', 'Getting started'], b1: ['Los once bloques', 'The eleven blocks'], corral: ['Consulta', 'Reference'] };"
    assert a in j
    j = j.replace(a, "const GRUPOS = { leer: ['Para empezar', 'Getting started'], animal: ['Método', 'Method'], validacion: ['Evidencia', 'Evidence'], repro: ['Uso científico', 'Scientific use'] };")
    assert "$('#glos').innerHTML" in j
    j = j.replace("$('#glos').innerHTML", "if ($('#glos')) $('#glos').innerHTML")
    j += '''
/* ---------- copiar código y texto de métodos ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const el = document.getElementById(b.dataset.copy); const t = el.querySelector('p') ? el.querySelector('p').innerText : el.innerText;
  try { navigator.clipboard.writeText(t); const o = b.textContent; b.textContent = LANG === 'es' ? '✓ Copiado' : '✓ Copied'; setTimeout(() => b.textContent = o, 1400); } catch (_) {}
});
'''
    return j


def cientifico():
    V = json.load(open(os.path.join(AQUI, 'validacion.json'), encoding='utf-8'))
    cuerpo = ''.join(leer(f'cien_{i}.html') for i in range(4))
    refs, nref = referencias()
    rep = {'BANDA': banda(), 'VERSION': VERSION, 'DOI': doi(), 'AUTORES': AUTORES,
           'CITA_DOI': (f'https://doi.org/{DOI}' if DOI else 'https://github.com/hectortecumshe-ai/RatioBos'),
           'FIG_PORTADA': fig_puntofijo(True), 'FIG_PUNTOFIJO': fig_puntofijo(), 'FIG_FRONTERA': fig_frontera(),
           'TABLA_ARTICULOS': tabla_articulos(V), 'FIG_VAL_COMP': fig_val_comp(V), 'FIG_VAL_COSTO': fig_val_costo(V), 'FIG_VAL_ENE': fig_val_ene(V),
           'REFERENCIAS': refs, 'CODIGO_PY': codigo_py()}
    for k, v in rep.items():
        cuerpo = cuerpo.replace('{{' + k + '}}', v)
    falta = re.findall(r'\{\{\w+\}\}', cuerpo)
    assert not falta, falta
    t_es, t_en = 'RatioBos · Instructivo del Científico', 'RatioBos · Scientist Guide'
    pdf_es, pdf_en = 'RatioBos-Instructivo-Cientifico.pdf', 'RatioBos-Scientist-Guide.pdf'
    plantilla = open(os.path.join(RAIZ, 'instructivo-productor.html'), encoding='utf-8').read()
    # misma cabecera y estructura que el del productor, con su CSS, cuerpo y script
    cab = plantilla[:plantilla.index('<style>')]
    cab = cab.replace('RatioBos · Instructivo del Productor', t_es)
    cab = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Instructivo del Científico de RatioBos: ecuaciones NASEM (2016), programación lineal con certificado de dualidad, ajuste de energía y consumo, huella IPCC (2019) y validación. · RatioBos Scientist Guide.">', cab)
    medio = plantilla[plantilla.index('</style>'):plantilla.index('<main>') + 6]
    medio = medio.replace('· Instructivo del Productor', '· Instructivo del Científico').replace('· Producer Guide', '· Scientist Guide')
    medio = medio.replace('RatioBos-Instructivo-Productor.pdf', pdf_es)
    pie = plantilla[plantilla.index('</main>'):plantilla.index('<script>', plantilla.index('capturas.js'))]
    out_html = f'{cab}<style>\n{css_cien()}\n{medio}\n{cuerpo}\n{pie}<script>{js_cien(t_es, t_en, pdf_es, pdf_en)}</script>\n</body>\n</html>\n'
    out = os.path.join(RAIZ, 'instructivo-cientifico.html')
    open(out, 'w', encoding='utf-8', newline='\n').write(out_html)
    print('instructivo-cientifico.html', round(len(out_html.encode('utf-8')) / 1024), 'KB ·', nref, 'referencias')
