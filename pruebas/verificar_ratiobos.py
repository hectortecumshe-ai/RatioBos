"""Verifica con HiGHS (SciPy) una ración exportada desde RatioBos (vista científica,
botón «Modelo y solución (JSON)»). Reconstruye el modelo lineal a partir de los
ingredientes, los requerimientos y el consumo, lo resuelve y compara el costo y
la fórmula con los de la app.   Uso:  python verificar_ratiobos.py archivo_modelo.json"""
import json
import sys

import numpy as np
from scipy.optimize import linprog

m = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "ratiobos_modelo.json", encoding="utf-8"))
ings, req, dmi = m["ingredientes"], m["requerimientos"], m["consumoMS"]
FORRAJE = {"for", "ens"}
MCP_A, MCP_B, MP_MCP, D_RUP = 42.73, 0.087, 0.64, 0.80      # Galyean y Tedeschi (2014); NASEM (2016)


def aporte(ing, k):
    """Aporte de 1 kg de MS del ingrediente al nutriente k (misma definición que la app)."""
    c = ing["comp"]
    tnd = 0 if ing["cat"] == "gras" else c.get("TND", 0)          # la grasa no alimenta a los microbios
    pc, pdr = c.get("PC", 0), c.get("PDR", 0)
    if k == "PM":
        return MP_MCP * MCP_B * tnd * 10 + pc * 10 * (1 - pdr / 100) * D_RUP
    if k == "PDRb":
        return pc * 10 * pdr / 100 - MCP_B * tnd * 10
    if k == "PDR":
        return pc * pdr / 100
    if k == "FDNef":
        return c.get("FDN", 0) * c.get("pef", 0)
    if k == "For":
        return 100 if ing["cat"] in FORRAJE else 0
    return c.get(k, 0)


def constante(k):
    """Término constante de la síntesis microbiana por kg de MS (depende del consumo)."""
    return {"PM": MP_MCP * MCP_A / dmi, "PDRb": -MCP_A / dmi}.get(k, 0)


precio = np.array([i["precio"] / max(i["comp"]["MS"] / 100, 0.01) for i in ings])   # $ por kg de MS
A_ub, b_ub = [], []
for k, (lo, hi) in req.items():
    fila = np.array([aporte(i, k) for i in ings])
    if lo is not None:
        A_ub.append(-fila); b_ub.append(-100 * (lo - constante(k)))
    if hi is not None:
        A_ub.append(fila); b_ub.append(100 * (hi - constante(k)))
cotas = [(i.get("min") or 0, i["max"] if i.get("max") not in (None, "") else 100) for i in ings]
r = linprog(precio, A_ub=np.array(A_ub), b_ub=b_ub, A_eq=[np.ones(len(ings))], b_eq=[100],
            bounds=cotas, method="highs")
if r.status != 0:
    sys.exit("HiGHS: " + r.message)

app = {f["id"]: f["pct"] for f in m["solucion"]["formula"]}
costo_app, costo_highs = m["solucion"]["costoKgMS"], r.fun / 100
print(f"{'Ingrediente':38s} {'RatioBos':>9s} {'HiGHS':>9s}")
for i, x in zip(ings, r.x):
    if x > 1e-6 or app.get(i["id"], 0) > 1e-6:
        print(f"{i['nombre'][:38]:38s} {app.get(i['id'], 0):9.3f} {x:9.3f}")
print(f"\nCosto por kg de MS · RatioBos: {costo_app:.6f}  HiGHS: {costo_highs:.6f}")
print(f"Diferencia relativa: {abs(costo_app - costo_highs) / costo_highs:.2e}")
