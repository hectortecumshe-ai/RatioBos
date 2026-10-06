"""Arma los instructivos de RatioBos a partir de las partes de esta carpeta.
Uso: python armar.py            (genera ../../instructivo-productor.html)"""
import json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..'))
VERSION = '1.0.0'
DOI = ''          # ← cuando Zenodo asigne el DOI, escríbelo aquí (p. ej. '10.5281/zenodo.123')
AUTORES = 'Héctor Tecumshé Mojica-Zárate · Luis Ángel Barrera-Guzmán'

leer = lambda n: open(os.path.join(AQUI, n), encoding='utf-8').read()

# ---------------------------------------------------------------- bloques y colores
BLOQUES = [  # id, es, en, minutos, resumen es, resumen en, frase rápida es, frase rápida en
 ('b1', 'Animal', 'Animal', '1 min', 'Tipo, biotipo y sexo', 'Type, biotype and sex',
  'Tipo de animal, biotipo (cruza, cebú…) y sexo.', 'Animal type, biotype (cross, zebu…) and sex.'),
 ('b2', 'Región', 'Region', '2 min', 'Estado, temporada y corrales', 'State, season and pens',
  'Toca tu estado y la temporada. Revisa el ITH, la sombra y el piso.', 'Tap your state and season. Check THI, shade and floor.'),
 ('b3', 'Requerimientos', 'Requirements', '2 min', 'Peso y meta de ganancia', 'Weight and gain target',
  'Peso del lote y ganancia diaria objetivo.', 'Lot weight and daily gain target.'),
 ('b4', 'Manejo', 'Management', '2 min', 'Implante, lote y precios', 'Implant, lot and prices',
  'Implante, ionóforo, cabezas, carga del carro, compra y venta.', 'Implant, ionophore, head count, wagon load, buy and sell.'),
 ('b5', 'Ingredientes', 'Ingredients', '3 min', 'Los que puedes conseguir', 'The ones you can get',
  'Marca lo que hay. Corrige la MS del ensilaje.', 'Tick what you have. Fix the silage DM.'),
 ('b6', 'Precios', 'Prices', '5 min', 'Puestos en el rancho', 'Delivered to the ranch',
  'Precio de esta semana, puesto en el rancho. Revisa los máximos.', 'This week’s delivered price. Check the maximums.'),
 ('b7', 'Formulación', 'Formulation', '1 min', 'La ración más barata', 'The cheapest ration',
  '⚙ Formular. Revisa el semáforo e imprime la hoja del carro.', '⚙ Formulate. Check the traffic light and print the wagon sheet.'),
 ('b8', 'Programa', 'Program', '2 min', 'Días, costo y utilidad', 'Days, cost and profit',
  '⚙ Formular el programa: días en corral y utilidad por cabeza.', '⚙ Formulate the program: days on feed and profit per head.'),
 ('b9', 'Tablero', 'Dashboard', '3 min', 'Indicadores y gráficas', 'Indicators and charts',
  'GDP, eficiencia, conversión, B : C y la ganancia óptima.', 'ADG, efficiency, conversion, B : C and the optimal gain.'),
 ('b10', 'Sostenibilidad', 'Sustainability', '3 min', 'Agua, suelo y gases', 'Water, land and gases',
  'Huella de la ración y frontera costo–huella.', 'Ration footprint and cost–footprint frontier.'),
 ('b11', 'Informe', 'Report', '1 min', 'Para tu asesor', 'For your advisor',
  'PDF para tu asesor y Guardar proyecto (.json).', 'PDF for your advisor and Save project (.json).'),
]
CLARO = ['#2f5d50', '#4f7d3a', '#2f6f8f', '#7a5c99', '#a7801c', '#b86a2a', '#b05434', '#8a3f5a', '#39718a', '#3f8a5c', '#4a5d6b']
OSCURO = ['#8fc2ad', '#a9cf7e', '#7fbddb', '#bba3d6', '#e3c063', '#e9a066', '#ea926b', '#e08aa8', '#86c3dc', '#86d1a2', '#9fb4c2']

def css():
    c = leer('base.css')
    c = c.replace('RatioAvis · Instructivo del Productor', 'RatioBos · Instructivos')
    c = c.replace('serif clásica, verde pino y cobre', 'serif clásica, verde pino y terracota')
    # acento terracota, como la app
    c = c.replace('--acc:#c0772b; --acc-d:#8a5214; --acc-s:rgba(192,119,43,.12);', '--acc:#b05434; --acc-d:#8a3a1f; --acc-s:rgba(176,84,52,.12);')
    c = c.replace('--acc:#e2a15c; --acc-d:#f0c08a; --acc-s:rgba(226,161,92,.14);', '--acc:#ea926b; --acc-d:#f4b596; --acc-s:rgba(234,146,107,.14);')
    viejo_c = '--b1:#2f5d50; --b2:#5c8538; --b3:#2f6f8f; --b4:#b0841f; --b5:#c0772b; --b6:#a0502e; --b7:#755a8c; --b8:#4a5d6b;'
    viejo_o = '--b1:#8fc2ad; --b2:#a9cf7e; --b3:#7fbddb; --b4:#e3c063; --b5:#e2a15c; --b6:#e39272; --b7:#bba3d6; --b8:#9fb4c2;'
    assert viejo_c in c and viejo_o in c
    c = c.replace(viejo_c, ' '.join(f'--b{i+1}:{x};' for i, x in enumerate(CLARO)))
    c = c.replace(viejo_o, ' '.join(f'--b{i+1}:{x};' for i, x in enumerate(OSCURO)))
    c = c.replace('.cover .steps{display:grid;grid-template-columns:repeat(8,1fr);', '.cover .steps{display:grid;grid-template-columns:repeat(11,1fr);')
    c = c.replace('.cover .steps div{padding:14px 12px 16px;', '.cover .steps div{padding:12px 8px 14px;')
    c = c.replace('  .cover .steps div:nth-child(4){border-right:0}', '  .cover .steps div:nth-child(4n){border-right:0}')
    c = c.replace('  .cover .steps div:nth-child(-n+4){border-bottom:1px solid var(--line)}', '  .cover .steps div:nth-child(-n+8){border-bottom:1px solid var(--line)}')
    c += '''
/* ---------- figuras propias (SVG con datos de la app) ---------- */
figure.svgfig{padding:18px 18px 4px}
figure.svgfig svg{display:block;width:100%;height:auto;font-family:var(--sans)}
figure.svgfig svg text:not([fill]):not(.mu){fill:var(--text)}
figure.svgfig svg .mu{fill:var(--muted)}
figure.svgfig svg .ln{stroke:var(--line2)}
.chap-head .big{min-width:1.2ch}
'''
    return c

def js(titulo_es, titulo_en, pdf_es, pdf_en):
    j = leer('base.js')
    def rp(a, b):
        nonlocal j
        assert a in j, 'no está en base.js: ' + a[:60]
        j = j.replace(a, b)
    rp("'ratioavis_lang'", "'ratiobos_lang'")
    rp("'ratioavis_tema'", "'ratiobos_tema'")
    rp("'RatioAvis · Instructivo del Productor' : 'RatioAvis · Producer Guide'", f"'{titulo_es}' : '{titulo_en}'")
    rp("'instructivo/RatioAvis-Instructivo-Productor.pdf' : 'instructivo/RatioAvis-Producer-Guide.pdf'", f"'instructivo/{pdf_es}' : 'instructivo/{pdf_en}'")
    # capítulos de dos cifras y figuras propias
    rp("$$('figure[data-fig] .fn', sec).forEach(fn => { i++; fn.textContent = (LANG === 'es' ? 'Figura ' : 'Figure ') + (/^\\d$/.test(n) ? n + '.' + i : i); });",
                  "$$('figure .fn', sec).forEach(fn => { i++; fn.textContent = (LANG === 'es' ? 'Figura ' : 'Figure ') + n + '.' + i; });")
    rp("if (subs.length && /^\\d$/.test(sec.dataset.toc))", "if (subs.length && /^[\\dA-Z]+$/.test(sec.dataset.toc) && sec.dataset.toc !== 'P')")
    rp("const GRUPOS = { leer: ['Para empezar', 'Getting started'], b1: ['Los ocho bloques', 'The eight blocks'], mezclar: ['Consulta', 'Reference'] };",
                  "const GRUPOS = { leer: ['Para empezar', 'Getting started'], b1: ['Los once bloques', 'The eleven blocks'], corral: ['Consulta', 'Reference'] };")
    i = j.index('const GLOS = [');
    k = j.index('];', i) + 2
    j = j[:i] + 'const GLOS = ' + json.dumps(GLOS, ensure_ascii=False, indent=0) + ';' + j[k:]
    assert 'ratioavis' not in j.lower(), 'quedó una referencia a RatioAvis'
    return j

GLOS = [
  ['Acidosis ruminal', 'Rumen acidosis', 'Exceso de ácido en el rumen por mucho grano y poca fibra; baja el consumo y causa cojeras.', 'Too much acid in the rumen from much grain and little fibre; cuts intake and causes lameness.'],
  ['Base seca (MS)', 'Dry basis (DM)', 'El alimento sin su agua. Así se comparan los ingredientes y se calcula la ración.', 'Feed without its water. Ingredients are compared and the ration computed this way.'],
  ['Beneficio : costo', 'Benefit : cost', 'Lo que entra entre lo que sale. Mayor que 1 significa utilidad.', 'Money in over money out. Above 1 means profit.'],
  ['Biotipo', 'Biotype', 'Grupo de razas que se comportan parecido: británico, continental, cebú, cruza, criollo, lechero.', 'Group of breeds that behave alike: British, Continental, zebu, cross, Criollo, dairy.'],
  ['Conversión alimenticia', 'Feed conversion', 'Kilos de alimento (MS) por kilo de peso ganado. Más baja, mejor.', 'Kilos of feed (DM) per kilo of weight gained. Lower is better.'],
  ['CO₂ equivalente (CO₂e)', 'CO₂ equivalent (CO₂e)', 'Gases sumados según su efecto en el clima: 1 kg de metano = 27 kg de CO₂; 1 kg de óxido nitroso = 273.', 'Gases added by their climate effect: 1 kg methane = 27 kg CO₂; 1 kg nitrous oxide = 273.'],
  ['Eficiencia alimenticia', 'Feed efficiency', 'Kilos ganados por kilo de alimento. Más alta, mejor.', 'Kilos gained per kilo of feed. Higher is better.'],
  ['Energía neta de ganancia (ENg)', 'Net energy for gain (NEg)', 'La energía del alimento que se convierte en kilos, en Mcal por kg de MS.', 'The feed energy that becomes kilos, in Mcal per kg DM.'],
  ['Energía neta de mantenimiento (ENm)', 'Net energy for maintenance (NEm)', 'La energía que el animal gasta solo en mantenerse vivo, sin ganar peso.', 'The energy the animal spends just staying alive, without gaining weight.'],
  ['FDN físicamente efectiva (FDNfe)', 'Physically effective NDF (peNDF)', 'La fibra larga que hace rumiar y produce saliva, el amortiguador natural del rumen.', 'Long fibre that makes cattle chew cud and produce saliva, the rumen’s natural buffer.'],
  ['GDP', 'ADG', 'Ganancia diaria de peso, en kg por día.', 'Average daily gain, in kg per day.'],
  ['Ionóforo', 'Ionophore', 'Aditivo (monensina, lasalocida) que mejora el aprovechamiento de la energía y reduce la acidosis.', 'Additive (monensin, lasalocid) that improves energy use and reduces acidosis.'],
  ['ITH', 'THI', 'Índice de temperatura y humedad: el calor que siente el animal.', 'Temperature-humidity index: the heat the animal feels.'],
  ['Mínimo costo', 'Least cost', 'La ración más barata entre todas las que cumplen los requerimientos.', 'The cheapest ration among all those that meet the requirements.'],
  ['Precio de entrada', 'Entry price', 'Precio al que un ingrediente que quedó fuera empezaría a convenir.', 'Price at which an ingredient left out would start to pay off.'],
  ['Precio de equilibrio', 'Break-even price', 'Precio de venta por kilo en pie al que el lote ni gana ni pierde.', 'Sale price per kilo live weight at which the lot neither gains nor loses.'],
  ['Premezcla', 'Premix', 'Mezcla previa de los ingredientes pequeños con un poco de grano molido, para repartirlos bien.', 'A pre-blend of the small ingredients with a little ground grain, so they spread evenly.'],
  ['Proteína metabolizable (PM)', 'Metabolizable protein (MP)', 'La proteína que de verdad llega al intestino: la de los microbios del rumen más la que no se degrada.', 'The protein that actually reaches the gut: rumen microbial protein plus undegraded protein.'],
  ['Sostenibilidad', 'Sustainability', 'Según la FAO: producir hoy sin comprometer la capacidad de producir mañana, en lo ambiental, lo económico y lo social.', 'As FAO defines it: producing today without compromising the capacity to produce tomorrow, environmentally, economically and socially.'],
  ['Tal como se ofrece (TCO)', 'As fed (AF)', 'El alimento con su agua, como lo pesa la báscula del carro.', 'Feed with its water, as the wagon scale weighs it.'],
  ['Urea', 'Urea', 'Nitrógeno no proteico barato que los microbios del rumen convierten en proteína. Máximo ≈ 1 % de la MS.', 'Cheap non-protein nitrogen that rumen microbes turn into protein. At most ≈ 1 % of DM.'],
]

# ---------------------------------------------------------------- figuras propias
def bi(es, en, **kw):
    a = ' '.join(f'{"class" if k == "class_" else k.replace("_", "-")}="{v}"' for k, v in kw.items())
    return f'<text lang="es" {a}>{es}</text><text lang="en" {a}>{en}</text>'

def fig(svg, es, en):
    return (f'<figure class="svgfig">{svg}<figcaption><span class="fn"></span><span lang="es">{es}</span>'
            f'<span lang="en">{en}</span></figcaption></figure>')

ITH = {"NO": ["Noroeste", "Northwest", "#e0a13c", 72.7, 81.6, 64.1], "NN": ["Norte árido", "Arid north", "#c99b5e", 68.2, 72.0, 55.2],
       "NE": ["Noreste", "Northeast", "#d98c4a", 75.2, 77.9, 61.9], "CN": ["Centro-norte", "North-central", "#b5d98b", 63.2, 64.6, 56.3],
       "OB": ["Occidente y Bajío", "West and Bajío", "#5f9a4a", 67.6, 69.5, 61.5], "CE": ["Centro", "Central highlands", "#8fb3a5", 61.3, 60.6, 56.2],
       "GT": ["Golfo", "Gulf", "#3b6aa0", 79.3, 80.6, 71.9], "PS": ["Pacífico Sur", "South Pacific", "#9b4f2e", 78.7, 80.0, 75.0],
       "PY": ["Península de Yucatán", "Yucatán Peninsula", "#e8935f", 78.7, 80.0, 71.5]}

def fig_ith():
    W, x0, x1, top, fila = 760, 190, 740, 46, 30
    X = lambda v: x0 + (v - 50) / (90 - 50) * (x1 - x0)
    H = top + fila * len(ITH) + 44
    s = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="ITH">']
    bandas = [(50, 75, '#2f8f4a'), (75, 79, '#2d78b0'), (79, 84, '#b5730c'), (84, 90, '#b8382e')]
    for a, b, c in bandas:
        s.append(f'<rect x="{X(a):.1f}" y="{top-14}" width="{X(b)-X(a):.1f}" height="{fila*len(ITH)+10}" fill="{c}" opacity=".09"/>')
    for v, es, en in [(62, 'normal', 'normal'), (77, 'alerta', 'alert'), (81.5, 'peligro', 'danger'), (87, 'emergencia', 'emergency')]:
        s.append(bi(es, en, x=f'{X(v):.1f}', y=str(top - 22), text_anchor='middle', font_size='12', font_weight='700', class_='mu'))
    for i, (k, (es, en, col, seca, llu, fre)) in enumerate(sorted(ITH.items(), key=lambda kv: -kv[1][4])):
        y = top + i * fila + 8
        s.append(f'<line class="ln" x1="{x0}" x2="{x1}" y1="{y}" y2="{y}" stroke-dasharray="2 4"/>')
        s.append(bi(es, en, x=str(x0 - 12), y=str(y + 4), text_anchor='end', font_size='13', font_weight='700' if k == 'OB' else '400'))
        lo, hi = min(seca, llu, fre), max(seca, llu, fre)
        s.append(f'<line x1="{X(lo):.1f}" x2="{X(hi):.1f}" y1="{y}" y2="{y}" stroke="{col}" stroke-width="5" stroke-linecap="round" opacity=".55"/>')
        for v, forma in [(fre, 'f'), (seca, 's'), (llu, 'l')]:
            cx = X(v)
            if forma == 'f':
                s.append(f'<circle cx="{cx:.1f}" cy="{y}" r="6" fill="var(--paper)" stroke="{col}" stroke-width="2.4"/>')
            elif forma == 's':
                s.append(f'<circle cx="{cx:.1f}" cy="{y}" r="6.5" fill="{col}"/>')
            else:
                s.append(f'<rect x="{cx-6:.1f}" y="{y-6}" width="12" height="12" transform="rotate(45 {cx:.1f} {y})" fill="{col}"/>')
    yb = top + fila * len(ITH) + 4
    for v in range(50, 91, 5):
        s.append(f'<text x="{X(v):.1f}" y="{yb+14}" text-anchor="middle" font-size="12" class="mu">{v}</text>')
    ly = yb + 34
    s.append(f'<circle cx="{x0}" cy="{ly-4}" r="6" fill="var(--paper)" stroke="var(--text)" stroke-width="2"/>' + bi('fresca', 'cool', x=str(x0 + 12), y=str(ly), font_size='12'))
    s.append(f'<circle cx="{x0+110}" cy="{ly-4}" r="6.5" fill="var(--text)"/>' + bi('seca y caliente', 'dry and hot', x=str(x0 + 122), y=str(ly), font_size='12'))
    s.append(f'<rect x="{x0+264}" y="{ly-10}" width="12" height="12" transform="rotate(45 {x0+270} {ly-4})" fill="var(--text)"/>' + bi('lluvias', 'rainy', x=str(x0 + 282), y=str(ly), font_size='12'))
    s.append(bi('ITH medio, sin sombra', 'mean THI, no shade', x=str(x1), y=str(ly), text_anchor='end', font_size='12', class_='mu'))
    s.append('</svg>')
    return fig(''.join(s), '<b>El calor de México por región y temporada.</b> ITH medio de cada región (sin descontar sombra ni biotipo). El trópico húmedo y las costas pasan la zona de alerta en seca y lluvias; el altiplano casi nunca. Datos de la app.',
               '<b>Mexico’s heat by region and season.</b> Mean THI for each region (before shade or biotype credit). The humid tropics and coasts cross into the alert zone in the dry and rainy seasons; the highlands hardly ever do. Data from the app.')

def fig_energia():
    W, H = 760, 230
    x0, x1 = 30, 730
    tot = 7.75; m = 3.40; g = 4.35
    X = lambda v: x0 + v / tot * (x1 - x0)
    s = [f'<svg viewBox="0 0 {W} {H}" role="img">']
    s.append(bi('Lo que come un torete en un día: 7.75 kg de materia seca', 'What one bull eats in a day: 7.75 kg of dry matter', x=str(x0), y='26', font_size='15', font_weight='700'))
    s.append(f'<rect x="{x0}" y="44" width="{X(m)-x0:.1f}" height="54" rx="8" fill="var(--b3)" opacity=".85"/>')
    s.append(f'<rect x="{X(m)+3:.1f}" y="44" width="{x1-X(m)-3:.1f}" height="54" rx="8" fill="var(--b7)" opacity=".9"/>')
    s.append(bi('3.40 kg · para mantenerse', '3.40 kg · to stay alive', x=f'{(x0+X(m))/2:.1f}', y='70', text_anchor='middle', font_size='15', font_weight='700', fill='#fff'))
    s.append(bi('ENm 7.20 Mcal', 'NEm 7.20 Mcal', x=f'{(x0+X(m))/2:.1f}', y='88', text_anchor='middle', font_size='12.5', fill='#fff'))
    s.append(bi('4.35 kg · para ganar peso', '4.35 kg · to gain weight', x=f'{(X(m)+x1)/2:.1f}', y='70', text_anchor='middle', font_size='15', font_weight='700', fill='#fff'))
    s.append(bi('ENg 5.46 Mcal → 1.35 kg/d', 'NEg 5.46 Mcal → 1.35 kg/d', x=f'{(X(m)+x1)/2:.1f}', y='88', text_anchor='middle', font_size='12.5', fill='#fff'))
    # regla: kg
    for v in range(0, 8):
        s.append(f'<line class="ln" x1="{X(v):.1f}" x2="{X(v):.1f}" y1="102" y2="108"/><text x="{X(v):.1f}" y="122" text-anchor="middle" font-size="11.5" class="mu">{v}</text>')
    s.append(bi('kg de MS', 'kg DM', x=str(x1), y='122', text_anchor='end', font_size='11.5', class_='mu'))
    # explicación
    s.append(bi('44 % del alimento solo mantiene vivo al animal: ese gasto no depende de cuánto gane.',
                '44 % of the feed only keeps the animal alive: that cost does not depend on how much it gains.', x=str(x0), y='160', font_size='13.5'))
    s.append(bi('Por eso un animal que gana poco paga el mantenimiento con menos kilos y su costo por kilo ganado sube.',
                'That is why a slow-gaining animal spreads maintenance over fewer kilos and its cost per kilo gained rises.', x=str(x0), y='182', font_size='13.5'))
    s.append(bi('Más ganancia, mientras la ración lo permita, abarata cada kilo (capítulo 9).',
                'More gain, as far as the ration allows, makes each kilo cheaper (chapter 9).', x=str(x0), y='204', font_size='13.5', class_='mu'))
    s.append('</svg>')
    return fig(''.join(s), '<b>A dónde va el alimento.</b> Reparto del consumo del torete del caso entre mantenimiento y ganancia, según la app (sección 7.5).',
               '<b>Where the feed goes.</b> Split of the case bull’s intake between maintenance and gain, as computed by the app (section 7.5).')

def fig_programa():
    W, H = 760, 250
    x0, x1 = 30, 730
    fases = [('Recepción', 'Receiving', 42, '380→425', 1.08, 34, 3931, 'var(--b2)'), ('Crecimiento', 'Growing', 36, '425→474', 1.35, 25, 4481, 'var(--b8)'),
             ('Finalización', 'Finishing', 32, '474→520', 1.45, 8, 5643, 'var(--b7)')]
    tot = sum(f[2] for f in fases)
    s = [f'<svg viewBox="0 0 {W} {H}" role="img">']
    x = x0
    for es, en, d, kg, gdp, forr, cost, col in fases:
        w = (x1 - x0) * d / tot
        s.append(f'<rect x="{x+2:.1f}" y="30" width="{w-4:.1f}" height="64" rx="10" fill="{col}" opacity=".9"/>')
        s.append(bi(es, en, x=f'{x+14:.1f}', y='56', font_size='16', font_weight='700', fill='#fff'))
        s.append(bi(f'{d} días · {kg} kg', f'{d} days · {kg} kg', x=f'{x+14:.1f}', y='80', font_size='13', fill='#fff'))
        # forraje: barra proporcional
        s.append(bi('forraje', 'forage', x=f'{x+14:.1f}', y='124', font_size='12', class_='mu'))
        s.append(f'<rect x="{x+66:.1f}" y="114" width="{(w-90):.1f}" height="10" rx="5" fill="var(--soft)"/><rect x="{x+66:.1f}" y="114" width="{(w-90)*forr/45:.1f}" height="10" rx="5" fill="{col}"/>')
        s.append(f'<text x="{x+w-14:.1f}" y="124" text-anchor="end" font-size="12" font-weight="700">{forr} %</text>')
        s.append(bi('ganancia', 'gain', x=f'{x+14:.1f}', y='152', font_size='12', class_='mu'))
        s.append(f'<text x="{x+w-14:.1f}" y="152" text-anchor="end" font-size="15" font-weight="700">{gdp:.2f} kg/d</text>')
        s.append(bi('ración', 'ration', x=f'{x+14:.1f}', y='178', font_size='12', class_='mu'))
        s.append(f'<text x="{x+w-14:.1f}" y="178" text-anchor="end" font-size="15" font-weight="700">$ {cost:,}/t</text>')
        x += w
    s.append(f'<line class="ln" x1="{x0}" x2="{x1}" y1="200" y2="200"/>')
    for dd in range(0, 111, 10):
        xx = x0 + (x1 - x0) * dd / tot
        s.append(f'<line class="ln" x1="{xx:.1f}" x2="{xx:.1f}" y1="196" y2="204"/><text x="{xx:.1f}" y="220" text-anchor="middle" font-size="11.5" class="mu">{dd}</text>')
    s.append(bi('días en corral · 380 → 520 kg en 110 días (1.27 kg/d de promedio)', 'days on feed · 380 → 520 kg in 110 days (1.27 kg/d on average)', x=str(x0), y='242', font_size='12.5', class_='mu'))
    s.append('</svg>')
    return fig(''.join(s), '<b>El programa de un vistazo.</b> Al bajar el forraje sube la ganancia, pero también el costo de la ración. Datos del programa del caso.',
               '<b>The program at a glance.</b> As forage drops, gain rises, but so does the ration cost. Data from the case program.')

def fig_gei():
    W, H = 760, 150
    x0, x1 = 30, 730
    partes = [('Producción del alimento', 'Feed production', 3.08, 'var(--b5)'), ('Metano del rumen', 'Rumen methane', 2.35, 'var(--b7)'),
              ('Óxido nitroso del estiércol', 'Manure nitrous oxide', 1.43, 'var(--b4)'), ('Metano del estiércol', 'Manure methane', 0.09, 'var(--b11)')]
    tot = sum(p[2] for p in partes)
    s = [f'<svg viewBox="0 0 {W} {H}" role="img">']
    s.append(bi(f'6.95 kg de CO₂e por animal al día', f'6.95 kg CO₂e per head per day', x=str(x0), y='24', font_size='15', font_weight='700'))
    x = x0
    for i, (es, en, v, col) in enumerate(partes):
        w = (x1 - x0) * v / tot
        s.append(f'<rect x="{x:.1f}" y="38" width="{max(w-2,2):.1f}" height="34" fill="{col}" opacity=".9"/>')
        if w > 70:
            s.append(f'<text x="{x+w/2:.1f}" y="60" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">{100*v/tot:.0f} %</text>')
        x += w
    y = 98
    for i, (es, en, v, col) in enumerate(partes):
        cx = x0 + (i % 2) * 360
        cy = y + (i // 2) * 24
        s.append(f'<rect x="{cx}" y="{cy-10}" width="12" height="12" rx="2" fill="{col}"/>')
        s.append(bi(f'{es} · {v:.2f} kg', f'{en} · {v:.2f} kg', x=str(cx + 20), y=str(cy), font_size='13'))
    s.append('</svg>')
    return fig(''.join(s), '<b>De dónde vienen los gases.</b> En una ración alta en grano, el campo que produjo el alimento pesa más que el rumen. Datos del caso.',
               '<b>Where the gases come from.</b> On a high-grain ration, the field that grew the feed weighs more than the rumen. Data from the case.')

# ---------------------------------------------------------------- piezas repetidas
def pasos():
    return ''.join(f'<div style="--c:var(--b{i+1})"><b>{i+1}</b><span lang="es">{b[1]}</span><span lang="en">{b[2]}</span></div>' for i, b in enumerate(BLOQUES))

def flujo():
    return ''.join(f'<a href="#{b[0]}" style="--c:var(--b{i+1})"><span class="k" lang="es">Paso {i+1}</span><span class="k" lang="en">Step {i+1}</span><span class="t">{b[3]}</span>'
                   f'<b lang="es">{b[1]}</b><b lang="en">{b[2]}</b><small lang="es">{b[4]}</small><small lang="en">{b[5]}</small></a>' for i, b in enumerate(BLOQUES))

def rapido():
    return ''.join(f'<li style="--c:var(--b{i+1})"><i>{i+1}</i><div><b lang="es">{b[1]}</b><b lang="en">{b[2]}</b><span lang="es">{b[6]}</span><span lang="en">{b[7]}</span></div></li>' for i, b in enumerate(BLOQUES))

def banda():
    return ''.join(f'<i style="background:var(--b{i+1})"></i>' for i in range(len(BLOQUES)))

def doi():
    return f'DOI <a href="https://doi.org/{DOI}">{DOI}</a> · ' if DOI else ''

# ---------------------------------------------------------------- productor
def productor():
    cuerpo = ''.join(leer(f'productor_{i}.html') for i in range(5))
    rep = {'BANDA': banda(), 'VERSION': VERSION, 'DOI': doi(), 'AUTORES': AUTORES, 'PASOS': pasos(), 'FLUJO': flujo(), 'RAPIDO': rapido(),
           'FIG_ITH': fig_ith(), 'FIG_ENERGIA': fig_energia(), 'FIG_PROGRAMA': fig_programa(), 'FIG_REGIONES': '', 'FIG_GEI': fig_gei()}
    for k, v in rep.items():
        cuerpo = cuerpo.replace('{{' + k + '}}', v)
    falta = re.findall(r'\{\{\w+\}\}', cuerpo)
    assert not falta, falta
    t_es, t_en = 'RatioBos · Instructivo del Productor', 'RatioBos · Producer Guide'
    pdf_es, pdf_en = 'RatioBos-Instructivo-Productor.pdf', 'RatioBos-Producer-Guide.pdf'
    html = f'''<!doctype html>
<html lang="es" data-lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t_es}</title>
<meta name="description" content="Instructivo del Productor de RatioBos: formula paso a paso la ración de mínimo costo para tu ganado de carne. · RatioBos Producer Guide: formulate the least-cost beef cattle ration step by step.">
<link rel="icon" href="logo.svg" type="image/svg+xml">
<style>
{css()}
</style>
</head>
<body>

<header class="top">
  <button class="ib" id="menuBtn" aria-label="Índice / Contents">☰</button>
  <a class="brand" href="./" title="RatioBos">
    <img src="logo.svg" alt="">
    <span>Ratio<i>Bos</i> <small lang="es">· Instructivo del Productor</small><small lang="en">· Producer Guide</small></span>
  </a>
  <span class="sp"></span>
  <a class="btn ghost no-print" href="./" target="_blank" rel="noopener"><span lang="es">Abrir la app</span><span lang="en">Open the app</span> ↗</a>
  <div class="seg" role="group" aria-label="Idioma / Language"><button data-lang="es">ES</button><button data-lang="en">EN</button></div>
  <a class="btn pdf" id="pdfBtn" title="PDF" href="instructivo/{pdf_es}" download><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/></svg><span>PDF</span></a>
  <button class="ib" id="temaBtn" aria-label="Tema / Theme">☾</button>
  <div id="leido"></div>
</header>

<div class="layout">
<aside class="toc" id="toc">
  <div class="search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
    <input id="q" type="search" autocomplete="off" placeholder="Buscar en el instructivo…" aria-label="Buscar / Search">
    <div class="hits" id="hits"></div>
  </div>
  <ol id="tocList"></ol>
</aside>

<main>
{cuerpo}
</main>
</div>

<a class="ib totop" href="#portada" aria-label="Arriba / Top">↑</a>
<div id="zoom" role="dialog" aria-label="Imagen ampliada / Enlarged image"><div class="zi"></div></div>

<script src="instructivo/capturas.js"></script>
<script>{js(t_es, t_en, pdf_es, pdf_en)}</script>
</body>
</html>
'''
    out = os.path.join(RAIZ, 'instructivo-productor.html')
    open(out, 'w', encoding='utf-8', newline='\n').write(html)
    print('instructivo-productor.html', round(len(html.encode('utf-8')) / 1024), 'KB')

if __name__ == '__main__':
    productor()
    import cien
    cien.cientifico()
