# Mayorías posibles por elección. Cada fila: "A+B+C" (etiqueta automática) o (etiqueta, "A+B+C").
# Tokens = claves de partido; 'UP' = bloque Podemos y confluencias.
UPBLOC = {'2015-12': ('Podemos y confluencias', 'PODEMOS+ECP+COMPROMIS+ENMAREA'), '2016-06': ('Unidos Podemos y confluencias', 'PODEMOS+ECP+COMPROMIS+ENMAREA'),
          '2019-04': ('Unidas Podemos y confluencias', 'PODEMOS+ECP+COMPROMIS+ENMAREA'), '2019-11': ('Unidas Podemos y confluencias', 'PODEMOS+ECP+COMPROMIS+ENMAREA')}
CFG = {
 '1977-06': ['UCD', 'UCD+PP', 'UCD+CIU', 'UCD+CIU+PNV', ('UCD + AP + CiU + PNV', 'UCD+PP+CIU+PNV'), 'PSOE', ('PSOE + PSP + PCE', 'PSOE+PSP+IU'), ('PSOE + PSP + PCE + CiU', 'PSOE+PSP+IU+CIU'), ('PSOE + PSP + PCE + CiU + PNV + EE', 'PSOE+PSP+IU+CIU+PNV+EE')],
 '1979-03': ['UCD', 'UCD+PP', 'UCD+CIU', 'UCD+CIU+PNV', ('UCD + CD + CiU + PNV', 'UCD+PP+CIU+PNV'), 'PSOE', 'PSOE+IU', 'PSOE+IU+PA', ('PSOE + PCE + PA + CiU + PNV', 'PSOE+IU+PA+CIU+PNV')],
 '1982-10': ['PSOE', 'PSOE+IU', 'PSOE+CIU', 'PSOE+IU+CIU+PNV', 'PP', 'PP+UCD', 'PP+UCD+CDS', 'PP+CIU', 'PP+CIU+PNV', 'PP+UCD+CDS+CIU+PNV'],
 '1986-06': ['PSOE', 'PSOE+IU', 'PSOE+CDS', 'PSOE+IU+CDS', 'PSOE+CIU', 'PP', 'PP+CDS', 'PP+CDS+CIU', 'PP+CDS+CIU+PNV'],
 '1989-10': ['PSOE', 'PSOE+IU', 'PSOE+CDS', 'PSOE+IU+CDS', 'PSOE+CIU', 'PP', 'PP+CDS', 'PP+CIU', 'PP+CDS+CIU', 'PP+CDS+CIU+PNV'],
 '1993-06': ['PSOE', 'PSOE+IU', 'PSOE+CIU', 'PSOE+CIU+PNV', 'PSOE+IU+CIU+PNV+CC', 'PP', 'PP+CIU', 'PP+CIU+PNV', 'PP+CIU+PNV+CC'],
 '1996-03': ['PP', 'PP+CIU', 'PP+CIU+PNV', 'PP+CIU+PNV+CC', 'PSOE', 'PSOE+IU', 'PSOE+CIU', 'PSOE+IU+CIU+PNV', 'PSOE+IU+CIU+PNV+CC+BNG'],
 '2000-03': ['PP', 'PP+CIU', 'PP+CIU+PNV', 'PP+CIU+PNV+CC', 'PSOE', 'PSOE+IU', 'PSOE+CIU', 'PSOE+IU+CIU+PNV', 'PSOE+IU+CIU+PNV+CC+BNG'],
 '2004-03': ['PSOE', 'PSOE+IU', 'PSOE+ERC', 'PSOE+IU+ERC', 'PSOE+IU+ERC+CIU', ('PSOE + IU + ERC + PNV + BNG + CC + CHA + EA + Na-Bai', 'PSOE+IU+ERC+PNV+BNG+CC+CHA+EA+NABAI'), 'PP', 'PP+CIU', 'PP+CIU+PNV', 'PP+CIU+PNV+CC'],
 '2008-03': ['PSOE', 'PSOE+IU', 'PSOE+UPYD', 'PSOE+CIU', 'PSOE+IU+ERC+PNV+BNG+CC+NABAI', 'PP', 'PP+UPYD', 'PP+CIU', 'PP+UPYD+CIU', 'PP+UPYD+CIU+PNV+CC'],
 '2011-11': ['PP', 'PP+UPYD', 'PP+CIU', 'PP+UPYD+CIU', 'PP+UPYD+CIU+PNV+CC+FAC', 'PSOE', 'PSOE+P88', 'PSOE+P88+UPYD', ('PSOE + CHA-IU + Amaiur + ERC + PNV + BNG + Compromís + CC', 'PSOE+P88+BILDU+ERC+PNV+BNG+COMPROMIS+CC')],
 '2015-12': ['PP', 'PP+CS', 'PP+CS+CIU', 'PP+CS+CIU+PNV+CC', 'PSOE', 'PSOE+CS', 'PSOE+UP+IU', 'PSOE+CS+UP+IU', ('PSOE + Podemos y confluencias + IU + ERC + DL + PNV + Bildu + CC', 'PSOE+UP+IU+ERC+CIU+PNV+BILDU+CC')],
 '2016-06': ['PP', 'PP+CS', 'PP+CS+CIU', 'PP+CS+CIU+PNV+CC', 'PSOE', 'PSOE+CS', 'PSOE+UP', 'PSOE+CS+UP', ('PSOE + Unidos Podemos y confluencias + ERC + CDC + PNV + Bildu + CC', 'PSOE+UP+ERC+CIU+PNV+BILDU+CC')],
 '2019-04': ['PP', 'PSOE', 'PSOE+CS', 'PSOE+UP', 'PSOE+UP+PNV', ('PSOE + Unidas Podemos y confluencias + ERC + PNV + Bildu + otros', 'PSOE+UP+ERC+PNV+BILDU+CC+NAVARRASUMA'), 'PP+CS', 'PP+CS+VOX', ('PP + Cs + Vox + Navarra Suma + CC', 'PP+CS+VOX+NAVARRASUMA+CC')],
 '2019-11': ['PP', 'PSOE', 'PSOE+CS', 'PSOE+UP', 'PSOE+UP+MASPAIS', 'PSOE+UP+MASPAIS+PNV', ('PSOE + Unidas Podemos + Más País + ERC + PNV + Bildu + BNG + CUP + otros', 'PSOE+UP+MASPAIS+ERC+PNV+BILDU+BNG+CUP+NABAI+CC+TERUEL'), 'PP+CS', 'PP+VOX', 'PP+CS+VOX', ('PP + Cs + Vox + Navarra Suma + CC', 'PP+CS+VOX+NAVARRASUMA+CC')],
 '2023-07': [('PP', 'PP'), ('PP + Vox', 'PP+VOX'), ('PP + Vox + derecha (UPN, CC, PNV)', 'PP+VOX+UPN+CC+PNV+SALF'), ('PP + Vox + derecha + Junts', 'PP+VOX+UPN+CC+PNV+SALF+JUNTS'),
   ('PSOE + Sumar + socios de investidura', 'PSOE+SUMAR+PODEMOS+ERC+JUNTS+BILDU+PNV+BNG+CC'), ('PSOE + Sumar + socios sin Junts', 'PSOE+SUMAR+PODEMOS+ERC+BILDU+PNV+BNG+CC'), ('PSOE + Sumar', 'PSOE+SUMAR'), ('Solo PSOE', 'PSOE')],
}
def groups_for(e, parties):
    names = {p['k']: p['n'] for p in parties}; have = set(names)
    out = []
    for r in CFG[e]:
        lab, spec = (r if isinstance(r, tuple) else (None, r))
        toks = []
        for t in spec.split('+'):
            if t == 'UP':
                if e in UPBLOC: toks += UPBLOC[e][1].split('+')
            else: toks.append(t)
        keys = [k for k in toks if k in have]
        if not keys: continue
        if lab is None:
            lab = ' + '.join((UPBLOC[e][0] if t == 'UP' else names.get(t, t)) for t in spec.split('+') if t == 'UP' or t in have)
        if any(o['keys'] == keys for o in out): continue
        out.append(dict(id='g%d' % len(out), label=lab, keys=keys))
    return out
