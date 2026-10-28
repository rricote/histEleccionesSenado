"""Mapeo de candidaturas (agrupadas por cod_nac) a partidos canónicos, nombres y colores por elección."""
import re

# clave -> (nombre por defecto, color claro, color oscuro)
STY = {
 'PSOE': ('PSOE', '#e30613', '#f0535b'),
 'PP': ('PP', '#1d84ce', '#4aa3e8'),
 'UCD': ('UCD', '#2faa6a', '#4fcb8a'),
 'CDS': ('CDS', '#f0a500', '#f5b83a'),
 'IU': ('IU', '#8f2d56', '#c0628a'),
 'PODEMOS': ('Podemos', '#7b3f98', '#a678c6'),
 'SUMAR': ('Sumar', '#e6007e', '#f2489f'),
 'CS': ('Cs', '#eb6109', '#f58a3d'),
 'UPYD': ('UPyD', '#cc3399', '#e060b4'),
 'VOX': ('Vox', '#5aa31f', '#7cc43a'),
 'ECP': ('En Comú Podem', '#b5446e', '#d4739a'),
 'COMPROMIS': ('Compromís', '#e08a1e', '#f0a850'),
 'ENMAREA': ('En Marea', '#3b8d8d', '#5fb5b5'),
 'MASPAIS': ('Más País', '#00a79d', '#33c6bd'),
 'EQUO': ('Equo', '#6aa84f', '#8cc470'),
 'CIU': ('CiU', '#1d3f94', '#5577cc'),
 'JUNTS': ('Junts', '#00a99d', '#2bc7ba'),
 'ERC': ('ERC', '#e8890c', '#f29a2a'),
 'PNV': ('PNV', '#0b6b3a', '#3aa56a'),
 'BILDU': ('EH Bildu', '#8a9a0a', '#adc12a'),
 'HB': ('HB', '#6b7d12', '#98ad3a'),
 'EA': ('EA', '#2f9e44', '#58c070'),
 'EE': ('EE', '#c2410c', '#e0703a'),
 'BNG': ('BNG', '#3aa0c4', '#5bbbdc'),
 'CC': ('CC', '#d9b800', '#ecc82a'),
 'UPN': ('UPN', '#a3324a', '#cf5a73'),
 'CUP': ('CUP', '#f2c200', '#f5d33d'),
 'PA': ('PA', '#2e7d32', '#5fa863'),
 'PAR': ('PAR', '#7b5ea7', '#a089c8'),
 'UV': ('UV', '#c7691d', '#e0924e'),
 'CHA': ('CHA', '#c2185b', '#e0507f'),
 'PSP': ('PSP-US', '#d94a4a', '#ec7a7a'),
 'CG': ('CG', '#4a7fb0', '#78a5d0'),
 'NABAI': ('Na-Bai', '#d94f8a', '#ee7aa9'),
 'NAVARRASUMA': ('Navarra Suma', '#2a6ebb', '#5b9be0'),
 'PRC': ('PRC', '#8aa31f', '#aac44a'),
 'FAC': ('Foro', '#4b6584', '#7c92ae'),
 'PACMA': ('PACMA', '#7fb800', '#9fd32b'),
 'NC': ('Nueva Canarias', '#e07b00', '#f29a2a'),
 'TERUEL': ('Teruel Existe', '#1f9e8f', '#3cc3b3'),
 'VERDES': ('Los Verdes', '#4caf50', '#74c878'),
 'SALF': ('Se Acabó La Fiesta', '#b8860b', '#d6a428'),
 'FN': ('Fuerza Nueva', '#6b5b3a', '#a08f66'),
 'ICV': ('IC-V', '#a0522d', '#c58660'),
 'PDECAT': ('PDeCAT', '#2a6ebb', '#5b9be0'),
}
EXTRA = ['#7b3f98', '#a0522d', '#5f6caf', '#c0733f', '#2e8b8b', '#9c9c3c', '#b34a6e', '#6b8e23']

def toks(s):
    s = s.upper().replace("'", '').replace('´', '').replace('`', '')
    return set(t for t in re.split(r'[^A-ZÀ-Ý0-9]+', s) if t)

def canon(sigs, nombre, year):
    """sigs: lista de siglas del grupo nacional; nombre: nombre de la primera candidatura."""
    T = set()
    for s in sigs: T |= toks(s)
    N = nombre.upper()
    S = ' '.join(sigs).upper()
    def has(*k): return any(x in T for x in k)
    if 'PSOE-H' in S.replace(' ', ''): return 'PSOEH'
    if has('UCD'): return 'UCD'
    if year >= 2015 and has('PODEMOS'):
        if has('COM') and ('COMPROM' in N): return 'COMPROMIS'
        if 'EN MAREA' in N or has('MAREA'): return 'ENMAREA'
        return 'PODEMOS'
    if year >= 2015 and ('EN COMÚN-UNIDAS' in N or 'EN COMUN-UNIDAS' in N): return 'PODEMOS'
    if has('SUMAR'): return 'SUMAR'
    if has('ECP') or 'EN COMÚ' in N or 'EN COMU' in N: return 'ECP'
    if 'COMPROMÍS' in N or 'COMPROMIS' in N or has('COMPROMIS'): return 'COMPROMIS'
    if 'EN MAREA' in N: return 'ENMAREA'
    if 'MÁS PAÍS' in N or 'MAS PAIS' in N or 'MÉS COMPROM' in N: return 'MASPAIS' if 'PAÍS' in N or 'PAIS' in N else 'COMPROMIS'
    if has('PSA') and has('PA') and not has('PSOE'): return 'PA'
    if has('PSOE', 'PSC', 'PSDEG', 'PSDG'): return 'PSOE'
    if has('PSP'): return 'PSP'
    if has('PP', 'AP', 'CD', 'AID') or (year >= 1989 and N.startswith('PARTIDO POPULAR')) or 'ALIANZA POPULAR' in N or 'COALICION POPULAR' in N: return 'PP'
    if has('VOX'): return 'VOX'
    if has('FN', 'UN') and ('FUERZA NUEVA' in N or 'UNION NACIONAL' in N): return 'FN'
    if has('CS', 'CIUDADANOS') or 'CIUDADANOS' in N: return 'CS'
    if has('UPYD', 'UPD') or 'UNION PROGRESO' in N or 'UNIÓN PROGRESO' in N: return 'UPYD'
    if 'UNIDAD DE LOS COMUNISTAS' in N or 'MUC' in T: return None
    if 'MARXISTA' in N or 'M-L' in S: return None
    if has('IU', 'ICU', 'PCE', 'PSUC', 'PCA', 'IULV', 'IUC', 'IUV', 'EUIA') or 'IZQUIERDA UNIDA' in N: return 'IU'
    if has('CDS'): return 'CDS'
    if year >= 2017 and has('PDECAT'): return 'PDECAT'
    if has('CIU', 'PDPC', 'DL', 'CDC'): return 'CIU'
    if has('JXCAT', 'JUNTS') : return 'JUNTS'
    if has('ERC', 'ESQUERRA', 'ERFN', 'EC') or 'ESQUERRA REPUBLICANA' in N: return 'ERC'
    if has('PNV', 'EAJ'): return 'PNV'
    if has('AMAIUR') or 'EH BILDU' in S or 'EUSKAL HERRIA BILDU' in N: return 'BILDU'
    if has('HB') or 'HERRI BATASUNA' in N: return 'HB'
    if has('EA', 'EUE') and ('EUSKO ALKARTASUNA' in N): return 'EA'
    if has('EE') or 'EUSKADIKO EZKERRA' in N: return 'EE'
    if has('NABAI', 'GBAI') or 'NAFARROA BAI' in N or 'GEROA BAI' in N: return 'NABAI'
    if has('BNG') or 'BLOQUE NACIONALISTA GALEGO' in N: return 'BNG'
    if has('CG') and 'COALICION GALEGA' in N: return 'CG'
    if year >= 1986 and has('CC', 'CCA', 'AIC', 'PNC') or 'COALICION CANARIA' in N or 'COALICIÓN CANARIA' in N or 'AGRUPACIONES INDEPENDIENTES DE CANARIAS' in N: return 'CC'
    if has('UPN') or 'UNION DEL PUEBLO NAVARRO' in N: return 'UPN'
    if has('NA'): return 'NAVARRASUMA' if 'NAVARRA SUMA' in N else None
    if has('CUP') or 'CANDIDATURA D\'UNITAT POPULAR' in N: return 'CUP'
    if has('PAR') and 'ARAGON' in N: return 'PAR'
    if has('PA') and 'ANDALUC' in N: return 'PA'
    if has('UV') or 'UNIO VALENCIANA' in N: return 'UV'
    if has('CHA') or 'CHUNTA' in N: return 'CHA'
    if has('PRC'): return 'PRC'
    if has('FAC') or 'FORO' in N: return 'FAC'
    if has('PACMA') or 'ANIMALISTA' in N: return 'PACMA'
    if has('EQUO'): return 'EQUO'
    if 'TERUEL EXISTE' in N or 'ARAGON EXISTE' in N.replace('Ó','O') or 'ARAGÓN EXISTE' in N: return 'TERUEL'
    if 'SE ACABÓ LA FIESTA' in N or 'SE ACABO LA FIESTA' in N or has('SALF'): return 'SALF'
    if has('ICV', 'ICV') or 'INICIATIVA PER CATALUNYA' in N: return 'ICV'
    if 'LOS VERDES' in N or 'VERDES' in T or has('LV'): return 'VERDES'
    if has('NC') and 'NUEVA CANARIAS' in N: return 'NC'
    return None

def disp_name(key, year, default):
    n = {
      'PP': {1977: 'AP', 1979: 'CD', 1982: 'AP-PDP', 1986: 'CP'},
      'IU': {1977: 'PCE', 1979: 'PCE', 1982: 'PCE'},
      'CIU': {1977: 'PDPC', 2015: 'DL', 2016: 'CDC'},
      'PODEMOS': {2016: 'Unidos Podemos', 2019: 'Unidas Podemos'},
      'CC': {1986: 'AIC', 1989: 'AIC'},
      'BILDU': {2011: 'Amaiur'},
      'TERUEL': {2023: 'Aragón Existe'},
      'NABAI': {2004: 'Nafarroa Bai', 2008: 'Na-Bai', 2011: 'Na-Bai', 2015: 'Geroa Bai', 2016: 'Geroa Bai', 2019: 'Geroa Bai', 2023: 'Geroa Bai'},
      'FN': {1979: 'Unión Nacional'},
      'PA': {1977: 'PSA-PA', 1979: 'PSA-PA', 1982: 'PSA-PA'},
    }.get(key, {})
    return n.get(year, default)
