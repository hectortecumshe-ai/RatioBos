import json, numpy as np
from scipy.optimize import linprog
P = json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__),'problemas.json')))
acuerdo = 0; difs = []; malos = []; nopt = ninf = 0
for k,p in enumerate(P):
    c = np.array(p['c']); Aub=[];bub=[];Aeq=[];beq=[]
    for f in p['filas']:
        a = np.array(f['a']); b = f['b']
        if f['op']=='<=': Aub.append(a); bub.append(b)
        elif f['op']=='>=': Aub.append(-a); bub.append(-b)
        else: Aeq.append(a); beq.append(b)
    r = linprog(c, A_ub=np.array(Aub) if Aub else None, b_ub=bub or None, A_eq=np.array(Aeq) if Aeq else None, b_eq=beq or None, bounds=(0,None), method='highs')
    h = 'optimo' if r.status==0 else 'infactible' if r.status==2 else 'otro%d'%r.status
    if h == p['estado']:
        acuerdo += 1
        if h=='optimo':
            nopt += 1; difs.append(abs(r.fun - p['obj'])/max(1,abs(r.fun)))
        else: ninf += 1
    else: malos.append((k, p['estado'], h))
print('problemas', len(P), 'acuerdo', acuerdo, 'optimos', nopt, 'infactibles', ninf)
print('dif rel max costo', max(difs), 'media', sum(difs)/len(difs))
print('desacuerdos', malos[:10])
