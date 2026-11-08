"""Enlaces de los instructivos que funcionan fuera de esta computadora (también dentro de los PDF).
Al imprimir el PDF desde el servidor local, un enlace relativo («./», «instructivo-productor.html») se volvía
http://localhost:…/ y nadie más podía abrirlo. Aquí cada <a href> relativo pasa a la dirección pública de la app,
y la portada gana un enlace visible para abrir la app. Es idempotente: se puede aplicar varias veces.
Uso como módulo: html = web(html, 'https://hectortecumshe-ai.github.io/RatioVitis/')
Uso directo:     python enlaces_web.py <URL de la app> archivo.html [archivo.html …]"""
import re, sys

def web(html, app):
    app = app if app.endswith('/') else app + '/'
    def absoluto(m):
        h = m.group(2)
        if re.match(r'^(https?:|mailto:|#|data:|javascript:)', h): return m.group(0)
        h = '' if h in ('./', '.') else re.sub(r'^\./', '', h)
        return m.group(1) + app + h + m.group(3)
    html = re.sub(r'(<a\b[^>]*?\bhref=")([^"]*)(")', absoluto, html)
    if 'class="app-web"' not in html:
        corto = app.replace('https://', '').rstrip('/')
        enlace = (f'<div class="app-web"><span lang="es">Abrir la app:</span><span lang="en">Open the app:</span> '
                  f'<a href="{app}"><b>{corto}</b></a></div>')
        html = html.replace('<div class="meta">', '<div class="meta">\n        ' + enlace, 1)
    return html

if __name__ == '__main__':
    app, archivos = sys.argv[1], sys.argv[2:]
    for f in archivos:
        s = open(f, encoding='utf-8').read(); n = web(s, app)
        open(f, 'w', encoding='utf-8', newline='\n').write(n)
        print(f, 'enlaces relativos que quedan:', len(re.findall(r'<a\b[^>]*\bhref="(?!https?:|#|mailto:)', n)))
