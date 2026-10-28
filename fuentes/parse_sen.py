"""Lee los ficheros del Ministerio del Interior de elecciones al Senado (tipo 03) y deja un pickle normalizado por elección.
Uso: python3 parse_sen.py [aaaa-mm ...]   (sin argumentos: todas las de raw/)
Salida: build/pk/<aaaa-mm>.pkl con dict(cand, circ, cands, mun, sec) — ver build_sen.py."""
import os, sys, glob, pickle, collections, re
RAW = os.path.join(os.path.dirname(__file__), '..', 'raw')
PK = os.path.join(os.path.dirname(__file__), 'pk'); os.makedirs(PK, exist_ok=True)
DIRS = {d[2:6] + '-' + d[6:8]: d for d in sorted(os.listdir(RAW))}
ISL = ('07', '35', '38')

def rd(e, n):
    d = DIRS[e]; fs = glob.glob(f'{RAW}/{d}/{n}03*.DAT')
    return open(fs[0], encoding='latin1').read().splitlines() if fs else []

def I(x):
    try: return int(x)
    except ValueError: return 0

def title(s):
    s = s.strip()
    if not s: return s
    if s.isupper() or s.islower():
        out = []
        for w in s.lower().split(' '):
            out.append(w if w in ('de', 'del', 'la', 'las', 'los', 'y', 'i', 'el', 'da', 'do', 'dos', 'das') else '-'.join(x[:1].upper() + x[1:] for x in w.split('-')))
        s = ' '.join(out); s = s[:1].upper() + s[1:]
    s = re.sub(r'\.([a-zà-ÿ])', lambda m: '.' + m.group(1).upper(), s)
    return re.sub(r'\s+', ' ', s)

def parse(e):
    year = int(e[:4]); mesa = DIRS[e].endswith('MESA')
    cand = {}
    for l in rd(e, '03'):
        cand[int(l[8:14])] = dict(sig=l[14:64].strip(), nom=l[64:214].strip(), cprov=int(l[214:220] or 0), cnac=int(l[226:232] or 0))
    # candidatos titulares
    C = {}
    L04 = rd(e, '04'); hasT = any(l[24] == 'T' for l in L04)
    for l in L04:
        if hasT and l[24] != 'T': continue
        p, d, o = l[9:11], l[11], l[12:15]
        code = p + d + o
        if year <= 1982:
            # en los ficheros antiguos el nombre completo se reparte en los tres campos de 25 caracteres, cortando palabras
            raw = ''
            for f in (l[25:50], l[50:75], l[75:100]):
                raw += f if len(f.rstrip()) == 25 else f.rstrip() + ' '
            nm = title(raw)
        else:
            nm = title(' '.join(x.strip() for x in (l[25:50], l[50:75], l[75:100]) if x.strip()))
        C[code] = dict(code=code, p=p, d=d, o=int(o), cand=int(l[15:21]), nord=int(l[21:24]), nm=nm, sx=l[100:101], el=l[119:120] == 'S', v=0)
    # circunscripciones (07)
    circ = {}
    for l in rd(e, '07'):
        c, p, d = l[9:11], l[11:13], l[13]
        if p == '99': continue
        if p in ISL and d == '9': continue
        cid = p + d
        rec = dict(id=cid, cc=c, p=p, d=d, n=l[14:64].strip(), censo=int(l[85:93]), bl=int(l[125:133]), nu=int(l[133:141]), vc=int(l[141:149]), s=int(l[149:155]))
        if cid in circ:  # duplicados en ficheros antiguos
            if rec['vc'] + rec['bl'] < circ[cid]['vc'] + circ[cid]['bl']: continue
        circ[cid] = rec
    # votos por candidato (08)
    for l in rd(e, '08'):
        p = l[11:13]
        if p == '99': continue
        code = l[14:20]; v = int(l[20:28])
        if code in C: C[code]['v'] = v; C[code]['s08'] = int(l[28:33] or 0)
        else: print(e, 'código sin candidato en 08', code, v)
    if any(x.get('s08') for x in C.values()):
        for x in C.values(): x['el'] = bool(x.get('s08'))
    # circ de cada candidato
    for k, x in C.items():
        cid = x['p'] + (x['d'] if x['p'] in ISL else '9')
        x['cid'] = cid
        if cid not in circ: print(e, 'candidato sin circunscripción', k, x['nm'])
    out = dict(e=e, year=year, mesa=mesa, cand=cand, C=C, circ=circ)
    # municipios: 05 (datos comunes) y 06 (votos por senador)
    M05 = {}
    for l in rd(e, '05'):
        if l[16:18] != '99': continue
        M05[l[11:16]] = dict(n=l[18:118].strip(), dist=l[118], pob=int(l[128:136] or 0), censo=int(l[149:157] or 0), bl=I(l[189:197]), nu=I(l[197:205]), vc=I(l[205:213]))
    M06 = collections.defaultdict(dict)
    for l in rd(e, '06'):
        if l[14:16] != '99': continue
        M06[l[9:14]][l[16:22]] = int(l[22:30])
    out['M05'] = M05; out['M06'] = dict(M06)
    if mesa:
        sec = collections.defaultdict(lambda: dict(censo=0, bl=0, nu=0, vc=0, v=collections.Counter()))
        cera = collections.defaultdict(lambda: dict(censo=0, bl=0, nu=0, vc=0, v=collections.Counter()))
        for l in rd(e, '09'):
            p, m = l[11:13], l[13:16]
            if p == '99': continue
            s3 = l[18:22].strip().zfill(3)[-3:]
            key = (p, m, l[16:18] + s3)
            tgt = cera[p] if m == '999' else sec[key]
            tgt['censo'] += I(l[30:37]); tgt['bl'] += I(l[65:72]); tgt['nu'] += I(l[72:79]); tgt['vc'] += I(l[79:86])
        for l in rd(e, '10'):
            p, m = l[11:13], l[13:16]
            if p == '99': continue
            s3 = l[18:22].strip().zfill(3)[-3:]
            code = l[23:29]; v = I(l[29:36])
            tgt = cera[p] if m == '999' else sec[(p, m, l[16:18] + s3)]
            tgt['v'][code] += v
        out['sec'] = {k: dict(v, v=dict(v['v'])) for k, v in sec.items()}
        out['cera'] = {k: dict(v, v=dict(v['v'])) for k, v in cera.items()}
    pickle.dump(out, open(f'{PK}/{e}.pkl', 'wb'))
    el = sum(1 for x in C.values() if x['el'])
    print(e, 'circ', len(circ), 'escaños', sum(c['s'] for c in circ.values()), 'electos', el, 'cands', len(C), 'mun', len(M05), 'sec', len(out.get('sec', {})))
    return out

if __name__ == '__main__':
    for e in (sys.argv[1:] or DIRS): parse(e)
