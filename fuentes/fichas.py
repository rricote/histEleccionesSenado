"""Convierte senado_fichas.json (lista de senadores por legislatura + texto de cada ficha del Senado) en senado.json:
  {leg: {"des": [[nombre, órgano, partido siglas, partido nombre, ccaa]], "el": [[nombre, circ, partido siglas, partido nombre, ind]], "kind", "note"}}
Designados al inicio de la legislatura = designados (o designación real) con fecha de credencial hasta 120 días después de la
sesión constitutiva y que no sustituyen a otro senador."""
import json, re, sys, os, datetime as dt
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else f'{HERE}/senado_fichas.json'
CONST = ['13/07/1977', '27/03/1979', '18/11/1982', '15/07/1986', '21/11/1989', '29/06/1993', '27/03/1996', '05/04/2000', '02/04/2004', '01/04/2008',
         '13/12/2011', '13/01/2016', '19/07/2016', '21/05/2019', '03/12/2019', '17/08/2023']
DAYS = int(os.environ.get('DAYS', 90))
D = lambda s: dt.datetime.strptime(s, '%d/%m/%Y')
CCORG = {'Andaluc': '01', 'Arag': '02', 'Asturias': '03', 'Balears': '04', 'Baleares': '04', 'Canarias': '05', 'Cantabria': '06', 'Castilla-La Mancha': '07', 'Castilla y Le': '08',
         'Catalu': '09', 'Extremadura': '10', 'Galicia': '11', 'Madrid': '12', 'Navarra': '13', 'Vasco': '14', 'Murcia': '15', 'Rioja': '16', 'Valencian': '17', 'Valenci': '17'}
GRP = {'GPUCD': ('UCD', 'Unión de Centro Democrático'), 'GPS': ('PSOE', 'Partido Socialista Obrero Español'), 'GPSS': ('PSOE', 'Socialistas del Senado'), 'GPAI': ('IND', 'Agrupación Independiente'),
       'GPI': ('IND', 'Independientes'), 'GPMXS': ('IND', 'Grupo Mixto'), 'GPEDC': ('SENDEM', 'Entesa dels Catalans'), 'GPPS': ('PSOE', 'Progresistas y Socialistas Independientes'), 'GPSV': ('PNV', 'Senadores Vascos')}

def parse(txt):
    o = {}
    m = re.search(r'(Electo|Electa|Designado|Designada|Designación real)[^.]*?(?::\s*([^.]*?))?\.Fecha: (\d\d/\d\d/\d{4})', txt)
    if m: o['tipo'] = 'R' if 'real' in m.group(1) else m.group(1)[0]; o['lugar'] = (m.group(2) or '').strip(); o['fecha'] = m.group(3)
    m = re.search(r'Baja \(([^)]*\)?)\): (\d\d/\d\d/\d{4})', txt); o['baja'] = m.group(2) if m else ''
    m = re.search(r'GRUPO PARLAMENTARIO[^(]*\(([^)]+)\)', txt); o['grupo'] = m.group(1) if m else ''
    m = re.search(r'Partido político: (.*)', txt)
    pn = m.group(1) if m else ''
    pn = re.split(r'\s*(?:Información al Ciudadano|Cargos en el Senado|Legislatura actual|Participa|Agenda|Fecha anterior|Sustituye a|Otras Legislaturas|\$\()', pn)[0].strip()
    ms = re.search(r'\(([^()]*)\)\s*$', pn); o['ps'] = ms.group(1) if ms else pn; o['pn'] = re.sub(r'\s*\([^()]*\)\s*$', '', pn)
    m = re.search(r'Formación electoral por la que se presentó a las elecciones: (.*?)Partido político', txt)
    o['fe'] = m.group(1).strip() if m else ''
    o['sust'] = 'Sustituye a' in txt
    return o

def title(n):
    ap, _, nm = n.partition(', ')
    t = lambda s: ' '.join(w.capitalize() if w not in ('DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'I') else w.lower() for w in s.split())
    return (t(nm) + ' ' + t(ap)).strip()

def main():
    d = json.load(open(SRC, encoding='utf8')); L = d['lista']; F = d['fichas']
    out = {}
    P = {}
    for leg, id_, nm, tx in L:
        f = F.get(f'{id_}-{leg}')
        if f: P[(id_, leg)] = (nm, parse(f))
    # credenciales de designados (de cualquier legislatura), por comunidad
    DS = []
    for (id_, leg), (nm, o) in P.items():
        if 'fecha' in o and o['tipo'] in ('D', 'R'):
            cc = next((v for k, v in CCORG.items() if k in o['lugar']), '') if o['tipo'] == 'D' else 'R'
            ps, pn = o['ps'], o['pn']
            if not ps and o['grupo'] in GRP: ps, pn = GRP[o['grupo']]
            DS.append(dict(id=id_, leg=leg, nm=title(nm), lugar=o['lugar'] or 'Designación real', ps=ps, pn=pn, cc=cc, a=D(o['fecha']), b=D(o['baja']) if o['baja'] else dt.datetime(2100, 1, 1)))
    act = lambda t, cc: {x['id']: x for x in DS if x['cc'] == cc and x['a'] <= t < x['b']}
    for lg in range(16):
        C = D(CONST[lg]); T = C + dt.timedelta(days=DAYS); E_ = D(CONST[lg + 1]) if lg < 15 else dt.datetime(2026, 10, 6)
        des = []; el = []; nfill = 0
        missing = sum(1 for leg, id_, nm, tx in L if leg == lg and re.search('Designad|Designaci', tx) and (id_, leg) not in P)
        ccs = ['R'] if lg == 0 else sorted({x['cc'] for x in DS if x['cc'] not in ('', 'R')})
        for cc in ccs:
            a = act(T, cc)
            # escaños de la comunidad en esta legislatura: máximo de designados simultáneos (muestreo mensual)
            seats = max([len(act(C + dt.timedelta(days=30 * k), cc)) for k in range(0, max(1, (E_ - C).days // 30))] + [len(a)])
            if lg > 0 and len(a) < seats:
                prev = sorted((x for x in DS if x['cc'] == cc and x['b'] <= T and x['b'] > C - dt.timedelta(days=500) and x['id'] not in a), key=lambda x: -x['b'].timestamp())
                for x in prev[:seats - len(a)]: a[x['id']] = dict(x, fill=1); nfill += 1
            for x in a.values(): des.append([x['nm'], x['lugar'], x['ps'], x['pn'], '' if cc == 'R' else cc, x.get('fill', 0)])
        for (id_, leg), (nm, o) in P.items():
            if leg == lg and o.get('tipo') == 'E':
                ind = bool(re.search(r'INDEPEND', o['ps'] + ' ' + o['pn'], re.I)) or o['ps'].upper() in ('IND', 'IND.', 'INDEP.')
                el.append([title(nm), o['lugar'], o['ps'], o['pn'], ind, o.get('fe', '')])
        des.sort(key=lambda x: (x[4], x[0]))
        kind = 'real' if lg == 0 else 'auto'
        note = 'En la legislatura constituyente (1977) el Rey designó 41 senadores; el Senado da su grupo parlamentario, no su partido.' if lg == 0 else \
               ('Designados por los parlamentos autonómicos en el cargo tres meses después de la sesión constitutiva, según las fichas de senadores del Senado de España.' + (' En %d casos el Senado no conserva la nueva credencial tras las generales y se mantiene al último designado de esa comunidad, por lo que la cifra es aproximada.' % nfill if nfill else ''))
        out[str(lg)] = dict(des=des, el=el, kind=kind, note=note, missing=missing, fill=nfill)
        print(lg, 'designados', len(des), 'rellenados', nfill, 'electos con ficha', len(el), 'independientes', sum(1 for x in el if x[4]), 'designados sin ficha', missing)
    json.dump(out, open(f'{HERE}/senado.json', 'w', encoding='utf8'), ensure_ascii=False, indent=0)

if __name__ == '__main__': main()
