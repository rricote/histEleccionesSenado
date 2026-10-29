"""Construye los datos del artefacto del Senado a partir de build/pk/<e>.pkl (parse_sen.py) y de las fichas del Senado (senado.json).
Salida: out/datos/<e>/general.json.js, prov_b<k>.json.js, municipios.json.js y out/datos/elecciones.json.js"""
import os, sys, re, json, pickle, collections, unicodedata
sys.path.insert(0, os.path.dirname(__file__))
import parties as P
from groups_cfg import CFG as GCFG, UPBLOC
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'out')
ISL = ('07', '35', '38')
DATES = {'1977-06': '15 de junio de 1977', '1979-03': '1 de marzo de 1979', '1982-10': '28 de octubre de 1982', '1986-06': '22 de junio de 1986',
 '1989-10': '29 de octubre de 1989', '1993-06': '6 de junio de 1993', '1996-03': '3 de marzo de 1996', '2000-03': '12 de marzo de 2000',
 '2004-03': '14 de marzo de 2004', '2008-03': '9 de marzo de 2008', '2011-11': '20 de noviembre de 2011', '2015-12': '20 de diciembre de 2015',
 '2016-06': '26 de junio de 2016', '2019-04': '28 de abril de 2019', '2019-11': '10 de noviembre de 2019', '2023-07': '23 de julio de 2023'}
LEG = {e: i for i, e in enumerate(sorted(DATES))}
ROM = ['Constituyente', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']
CC = {'01': 'Andalucía', '02': 'Aragón', '03': 'Principado de Asturias', '04': 'Illes Balears', '05': 'Canarias', '06': 'Cantabria', '07': 'Castilla-La Mancha', '08': 'Castilla y León',
      '09': 'Cataluña', '10': 'Extremadura', '11': 'Galicia', '12': 'Comunidad de Madrid', '13': 'Comunidad Foral de Navarra', '14': 'País Vasco', '15': 'Región de Murcia',
      '16': 'La Rioja', '17': 'Comunitat Valenciana', '18': 'Ceuta', '19': 'Melilla'}
# estilos propios del Senado (coaliciones y candidaturas que no existen en el Congreso)
STY = dict(P.STY)
STY.update({
 'ENTESA': ('Entesa', '#b23a48', '#d8646f'),
 'SENDEM': ('Senadors per la Democràcia', '#b23a48', '#d8646f'),
 'CATSEN': ('Catalunya al Senat', '#1d3f94', '#5577cc'),
 'FA': ('Frente Autonómico', '#0b6b3a', '#3aa56a'),
 'IND': ('Independientes', '#a3a9b0', '#8b929a'),
 'REAL': ('Designados por el Rey', '#b8860b', '#d9ae3c'),
 'CAMBIO': ('Cambio-Aldaketa', '#c2185b', '#e0507f'),
 'AHI': ('AHI', '#3d8b5a', '#5fb07d'),
 'ASG': ('ASG', '#1f8a70', '#3db394'),
 'PSOESUMAR': ('PSOE-Sumar', '#e30613', '#f0535b'),
})
IND_C = ('#c9ced4', '#5d646c')   # gris claro (claro, oscuro) para independientes dentro de listas

STOP = {'I', 'Y', 'DE', 'DEL', 'LA', 'LAS', 'LOS', 'EL'}
VAR = {'JOSE': 'JOSEP', 'JAIME': 'JAUME', 'PEDRO': 'PERE', 'CARLOS': 'CARLES', 'FRANCISCO': 'FRANCESC', 'NORELL': 'MORELL'}
def norm(s):
    s = unicodedata.normalize('NFD', s.upper()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return [VAR.get(w, w) for w in re.sub(r'[^A-Z ]', ' ', s).split() if w not in STOP]

def senkey(sig, nom, year):
    if re.fullmatch(r'\s*(?:[A-Za-zÁÉÍÓÚÑ]\.\s*){2,}[A-Za-z]?\.?\s*', sig) or re.fullmatch(r'(?:[A-Z]\.){2,}[A-Z]?\.?(?:-[A-Z.]+)*', sig.replace(' ', '')):
        sig = sig.replace('.', '').replace(' ', '')
    S = sig.upper().replace(' ', ''); N = nom.upper()
    if S in ('IND', 'IND.', 'INDEP', 'INDEP.', 'INDEPENDIENTE', 'INDEPENDIENTES'): return 'IND'
    if S == 'SENDEM': return 'SENDEM'
    if S in ('UDC', 'UDC-IDCC', 'CDC') and 1979 <= year <= 2015: return 'CIU'
    if S.startswith('INDEP') or S in ('CDI', 'IND.SD', 'AE') or N.strip() in ('INDEPENDIENTES', 'AGRUPACION DE ELECTORES'): return 'IND'
    if S in ('SEN.DEM.', 'PSDPG') and year == 1977: return 'SENDEM' if 'SENADO' in N and S == 'SEN.DEM.' else 'IND'
    if year == 1977 and S == 'FA': return 'FA'
    if "ENTESA" in S or 'ENTESA' in N or ('PSC' in S and 'ERC' in S) or ('PSC' in S and 'ICV' in S): return 'ENTESA'
    if S.startswith('C.SENAT') or 'CATALUNYA AL SENAT' in N: return 'CATSEN'
    if S.startswith('CAMBIO-ALDA'): return 'CAMBIO'
    if 'PSOE-SUMAR' in S: return 'PSOESUMAR'
    if S == 'AHI' or 'AGRUPACION HERRE' in N.replace('Ñ', 'N'): return 'AHI'
    if S == 'ASG' or 'AGRUPACION SOCIALISTA GOMERA' in N: return 'ASG'
    if 'BILDU' in S or 'BILDU' in N: return 'BILDU'
    k = P.canon([sig], nom, year)
    if k == 'ECP' and year < 2015: k = None
    return k

def js(path, obj):
    os.makedirs(os.path.dirname(f'{OUT}/{path}'), exist_ok=True)
    s = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    open(f'{OUT}/{path}.js', 'w', encoding='utf8').write('(window.__J=window.__J||{})[%s]=%s;' % (json.dumps(path), s))
    return len(s)

def fixname(nm):
    nm = nm.strip()
    m = re.match(r"^(.*), (El|La|Los|Las|A|O|Os|As|L'|Els|Les|Sa|Ses|Es|Na)$", nm)
    return (m.group(2) + ('' if m.group(2).endswith("'") else ' ') + m.group(1)) if m else nm

VMAX = {4: 3, 3: 2, 2: 1, 1: 1}
SEN = json.load(open(f'{HERE}/senado.json', encoding='utf8')) if os.path.exists(f'{HERE}/senado.json') else {}
MAN = json.load(open(f'{HERE}/independientes.json', encoding='utf8')) if os.path.exists(f'{HERE}/independientes.json') else {}
_PK23 = pickle.load(open(f'{HERE}/pk/2023-07.pkl', 'rb'))
N23 = {k: fixname(v['n']) for k, v in _PK23['M05'].items()}
PROVN = {}
for l in open(f'{HERE}/../raw/03202307_MESA/07032307.DAT', encoding='latin1').read().splitlines():
    if l[13] == '9' and l[11:13] != '99': PROVN[l[11:13]] = (l[9:11], l[14:64].strip())

CONG = os.path.join(HERE, '..', '..', 'cong', 'datos')
def jl(f):
    t = open(f, encoding='utf8').read(); return json.loads(t[t.index('=', t.index(']')) + 1:].rstrip().rstrip(';'))
def implausible(c, mx):
    vb = c['vc'] + c['bl']
    return vb == 0 or vb < mx or vb < 0.25 * c['censo'] or vb > c['censo']
def cong_est(e, circ, MX):
    """papeletas válidas, blancos y nulos estimados con el Congreso del mismo día (cuando el Interior no los da para el Senado)"""
    g = jl(f'{CONG}/{e}/general.json.js'); pv = {p['id']: p for p in g['prov']}
    isl = {k: v['dist'] for k, v in _PK23['M05'].items()}
    out = {}
    for cid, c in circ.items():
        if not implausible(c, MX[cid]): continue
        p = c['p']
        if p not in ISL:
            q = pv[p]; out[cid] = (sum(q['v']) + q['bl'], q['bl'], q['nu'])
        else:
            pj = jl(f'{CONG}/{e}/prov_b{int(p) // 9}.json.js')[p]
            vb = bl = nu = 0
            for m in pj['m']:
                if isl.get(p + m[0]) == c['d']: vb += sum(m[5]) + m[3]; bl += m[3]; nu += m[4]
            out[cid] = (vb, bl, nu)
    return out

def build(e):
    d = pickle.load(open(f'{HERE}/pk/{e}.pkl', 'rb')); year = d['year']; mesa = d['mesa']
    cand = d['cand']; C = d['C']; circ = d['circ']
    MX = {cid: max([x['v'] for x in C.values() if x['cid'] == cid] or [0]) for cid in circ}
    est = cong_est(e, circ, MX) if any(implausible(c, MX[cid]) for cid, c in circ.items()) else {}
    for cid, (vb, bl, nu) in est.items():
        mxv = max([x['v'] for x in C.values() if x['cid'] == cid] or [0])
        circ[cid].update(vc=max(vb, mxv) - bl, bl=bl, nu=nu, est=1)
    # claves de partido por candidatura
    ck = {}
    for code, x in cand.items():
        k = senkey(x['sig'], x['nom'], year)
        ck[code] = k or ('X' + re.sub(r'[^A-Z0-9]', '', x['sig'].upper())[:12] or 'X%d' % code)
    # votos (mejor candidato por circunscripción) para ordenar partidos
    best = collections.defaultdict(lambda: collections.Counter())
    for x in C.values():
        k = ck[x['cand']]; best[x['cid']][k] = max(best[x['cid']][k], x['v'])
    tot = collections.Counter(); elk = collections.Counter(); nmk = {}; sigk = collections.defaultdict(collections.Counter)
    for cid, b in best.items():
        for k, v in b.items(): tot[k] += v
    for x in C.values():
        k = ck[x['cand']]; elk[k] += x['el']; sigk[k][cand[x['cand']]['sig']] += x['v']; nmk.setdefault(k, cand[x['cand']]['nom'])
    order = sorted(tot, key=lambda k: (-elk[k] > 0, -tot[k]))
    order = sorted(tot, key=lambda k: -tot[k])
    kidx = {k: i for i, k in enumerate(order)}
    parties = []; ex = 0; allv = sum(tot.values())
    for k in order:
        if k in STY:
            dn, c, dk = STY[k]; dn = P.disp_name(k, year, dn)
        else:
            sig = sigk[k].most_common(1)[0][0]; dn = sig if len(sig) <= 14 else sig.title()
            if elk[k] or tot[k] > 0.004 * allv: c = dk = P.EXTRA[ex % len(P.EXTRA)]; ex += 1
            else: c, dk = '#8a94a1', '#7a8593'
        nm = nmk[k]; parties.append(dict(k=k, n=dn, full=nm.title() if nm.isupper() else nm, c=c, d=dk))
    # independientes y designados (fichas del Senado)
    leg = LEG[e]; S = SEN.get(str(leg), {})
    indset = []   # (tokens del apellido, inicial del nombre)
    for r in S.get('el', []):
        if r[4] and not re.match(r'INDEPEND', r[5] if len(r) > 5 else '', re.I):
            ap = r[0].split()[-2:]; indset.append((norm(' '.join(ap)), norm(r[0])[0][0]))
    for r in MAN.get(e, []):
        indset.append((norm(r.get('apellidos') or ' '.join(r['nombre'].split()[-2:])), norm(r['nombre'])[0][0]))
    def is_ind(nm):
        t = norm(nm)
        if not t: return False
        for ap, ini in indset:
            if ap and all(w in t for w in ap) and t[0][0] == ini: return True
        return False
    circs = []
    for cid in sorted(circ):
        c = circ[cid]; cs = sorted((x for x in C.values() if x['cid'] == cid), key=lambda x: (-x['v'], x['o']))
        s = sum(1 for x in cs if x['el'])
        rows = []
        for x in cs:
            pi = kidx[ck[x['cand']]]; ind = 1 if (x.get('ind') or (x['el'] and is_ind(x['nm']))) else 0
            if parties[pi]['k'] == 'IND': ind = 0
            rows.append([x['nm'], pi, x['v'], 1 if x['el'] else 0, ind, x['code']])
        circs.append(dict(id=cid, p=c['p'], n=c['n'], s=s, est=c.get('est', 0), vmax=VMAX.get(s, max(1, s - 1)), censo=c['censo'], bl=c['bl'], nu=c['nu'], vb=c['vc'] + c['bl'], c=rows))
    # provincias
    provs = []
    for p in sorted({c['p'] for c in circs}):
        cc, pn = PROVN[p]; provs.append(dict(id=p, n=pn, cc=cc, circs=[c['id'] for c in circs if c['p'] == p]))
    NP = len(parties)
    nat = dict(censo=0, bl=0, nu=0, vb=0, v=[0] * NP, el=[0] * NP, cand=[0] * NP)
    for c in circs:
        for f in ('censo', 'bl', 'nu', 'vb'): nat[f] += c[f]
        bp = {}
        for r in c['c']:
            bp[r[1]] = max(bp.get(r[1], 0), r[2]); nat['el'][r[1]] += r[3]; nat['cand'][r[1]] += 1
        for i, v in bp.items(): nat['v'][i] += v
    # designados
    des = None
    if S.get('des'):
        dcnt = [0] * NP; extra = []; dl = []
        keyidx = {p['k']: i for i, p in enumerate(parties)}
        for r in S['des']:   # [nombre, órgano, partido siglas, partido nombre, ccaa]
            k = senkey(r[2], r[3], year) or ('X' + re.sub(r'[^A-Z0-9]', '', r[2].upper())[:12])
            if r[2].upper().startswith('INDEP') or not r[2]: k = 'IND'
            if S.get('kind') == 'real': k = 'REAL'
            if k not in keyidx:
                if k in STY: dn, c_, d_ = STY[k]; dn = P.disp_name(k, year, dn)
                else: dn, c_, d_ = r[2] or 'Otros', '#8a94a1', '#7a8593'
                parties.append(dict(k=k, n=dn, full=r[3].title() if r[3].isupper() else r[3], c=c_, d=d_)); keyidx[k] = len(parties) - 1
                for f in ('v', 'el', 'cand'): nat[f].append(0)
                dcnt.append(0)
            dcnt[keyidx[k]] += 1; dl.append([r[0], keyidx[k], r[1], r[4], r[3] if k == 'REAL' else ''])
        NP = len(parties); dcnt += [0] * (NP - len(dcnt))
        des = dict(n=dcnt, list=dl, kind=S.get('kind', 'auto'), note=S.get('note', ''))
    nat['des'] = des['n'] if des else [0] * NP
    gen = dict(id=e, title='Elecciones al Senado', date=DATES[e], year=year, leg=ROM[leg], sections=bool(mesa), muni=bool(d['M05']),
               mapyear=(2001 if year <= 2000 else year) if mesa else None, parties=parties, ccaa=[dict(id=k, n=v) for k, v in sorted(CC.items())],
               prov=provs, circ=circs, nat=nat, des=des, notas=[], groups=groups(e, parties))
    CNOTE = {('1979-03', '029'): 'Pedro Francisco Gutiérrez Pulido (UCD), cuarto en votos, fue proclamado senador, pero una sentencia del Tribunal Supremo del 18 de abril de 1979 le retiró el escaño, que pasó a Andrés José Picazo González (PSOE). Los ficheros del Interior conservan los votos del escrutinio y marcan como electo a Picazo.'}
    for c in circs:
        if (e, c['id']) in CNOTE: c['nota'] = CNOTE[(e, c['id'])]; gen['notas'].append(c['n'] + ': ' + CNOTE[(e, c['id'])])
    if year == 1977: gen['notas'].append('En 1977 se eligieron 207 senadores (El Hierro no tuvo senador propio hasta 1979) y el Rey designó otros 41.')
    if est: gen['notas'].append(('En %d circunscripciones' % len(est) if len(est) > 1 else 'En 1 circunscripción') + ' de esta elección (%s) el Ministerio del Interior no publica las papeletas válidas, en blanco y nulas del Senado, o publica cifras incompletas: se han estimado con las del Congreso del mismo día, así que sus porcentajes son aproximados.' % (', '.join(circ[k]['n'] for k in sorted(est))))
    # comprobación con municipios y secciones
    mun_out(e, d, gen)
    js(f'datos/{e}/general.json', gen)
    el = sum(nat['el']); print(e, 'partidos', NP, 'electos', el, 'designados', sum(nat['des']), 'IND marcados', sum(r[4] for c in circs for r in c['c']))
    return gen

def groups(e, parties):
    names = {p['k']: p['n'] for p in parties}; have = set(names); out = []
    for r in GCFG.get(e, []):
        lab, spec = (r if isinstance(r, tuple) else (None, r)); toks = []
        for t in spec.split('+'):
            if t == 'UP':
                if e in UPBLOC: toks += UPBLOC[e][1].split('+')
            else: toks.append(t)
        if 'PSOE' in toks: toks += ['ENTESA', 'PSOESUMAR']
        if 'CIU' in toks: toks += ['CATSEN']
        keys = [k for k in toks if k in have]
        if not keys: continue
        if lab is None: lab = ' + '.join((UPBLOC[e][0] if t == 'UP' else names.get(t, t)) for t in spec.split('+') if t == 'UP' or t in have)
        if any(o['keys'] == keys for o in out): continue
        out.append(dict(id='g%d' % len(out), label=lab, keys=keys))
    return out

def mun_out(e, d, gen):
    """municipios y secciones: votos de cada candidato de la circunscripción del municipio"""
    circ_of_prov = {p['id']: p['circs'] for p in gen['prov']}
    code_pos = {}   # código senador -> (cid, posición en la lista de la circunscripción)
    for c in gen['circ']:
        for j, r in enumerate(c['c']): code_pos[r[5]] = (c['id'], j)
    for c in gen['circ']:
        for r in c['c']: del r[5]
    M05 = d['M05']; buckets = collections.defaultdict(dict); mlist = []
    cidof = lambda p, dist: p + (dist if p in ISL else '9')
    ncand = {c['id']: len(c['c']) for c in gen['circ']}
    if not M05:
        js(f'datos/{e}/municipios.json', []); return
    chk = collections.Counter()
    if d['mesa']:
        bym = collections.defaultdict(list)
        for (p, m, cus), s in d['sec'].items(): bym[p + m].append((cus, s))
    for pid in sorted(circ_of_prov):
        muns = []
        for mid in sorted(k for k in M05 if k[:2] == pid):
            info = M05[mid]; cid = cidof(pid, info['dist'])
            if cid not in ncand: continue
            n = ncand[cid]
            def vec(vd):
                a = [0] * n
                for code, v in vd.items():
                    cp = code_pos.get(code)
                    if cp and cp[0] == cid: a[cp[1]] += v
                return a
            if d['mesa']:
                secs = []; mv = [0] * n; ce = bl = nu = 0
                for cus, s in sorted(bym.get(mid, [])):
                    a = vec(s['v']); secs.append([cus, s['censo'], s['bl'], s['nu'], s['vc'] + s['bl']] + a)
                    mv = [x + y for x, y in zip(mv, a)]; ce += s['censo']; bl += s['bl']; nu += s['nu']
                vb = sum(x[4] for x in secs)
                m06 = vec(d['M06'].get(mid, {}))
                chk['dif'] += sum(abs(x - y) for x, y in zip(mv, m06)); chk['tot'] += sum(m06)
            else:
                secs = []; mv = vec(d['M06'].get(mid, {})); ce, bl, nu, vb = info['censo'], info['bl'], info['nu'], info['vc'] + info['bl']
            nm = N23.get(mid, fixname(info['n']))
            muns.append([mid[2:], nm, ce, bl, nu, vb, cid, mv, secs, info['pob']])
            mlist.append([mid, nm, info['pob'], ce])
        buckets[int(pid) // 9][pid] = dict(p=pid, m=muns)
    for k, v in sorted(buckets.items()): js(f'datos/{e}/prov_b{k}.json', v)
    js(f'datos/{e}/municipios.json', mlist)
    if chk['tot']: print(e, 'mesas vs 06: diferencia %.3f%%' % (100 * chk['dif'] / chk['tot']))

if __name__ == '__main__':
    es = sys.argv[1:] or sorted(DATES)
    for e in es: build(e)
    js('datos/elecciones.json', [dict(id=e, label='Elecciones al Senado ' + e[:4] + ({'2019-04': ' (abril)', '2019-11': ' (noviembre)'}.get(e, '')), kind='Senado') for e in sorted(DATES, reverse=True)])
