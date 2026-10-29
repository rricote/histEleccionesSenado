'use strict';
/* ===== Utilidades compartidas: resultados de las elecciones al Senado (adaptado de la web del Congreso) ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (x, d = 1) => (x * 100).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }) + '%';
const nf = (x, d = 0) => Number(x).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });
const pts = x => { const t = nf(Math.abs(x) * 100, 1); return (Math.abs(x) * 100 < 0.05 ? '' : x > 0 ? '+' : '−') + t };
const sgn = (x, d = 0) => (x > 0 ? '+' : x < 0 ? '−' : '') + nf(Math.abs(x), d);
const Q = new URLSearchParams(location.search);
/* respaldo: si el visor no conserva la cadena de consulta, el destino se recupera de sessionStorage (una sola vez) */
try { const n = JSON.parse(sessionStorage.getItem('nav') || 'null'); sessionStorage.removeItem('nav');
  if (n && n.page === location.pathname.split('/').pop() && ![...Q].length) for (const k in n.q) Q.set(k, n.q[k]) } catch (e) { }
function nav(u) { try { const [pg, qs] = u.split('?'); sessionStorage.setItem('nav', JSON.stringify({ page: pg, q: Object.fromEntries(new URLSearchParams(qs || '')) })) } catch (e) { } location.href = u }
document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey) return; const h = a.getAttribute('href'); if (h && !/^(https?:|#|mailto:)/.test(h)) { try { const [pg, qs] = h.split('?'); sessionStorage.setItem('nav', JSON.stringify({ page: pg, q: Object.fromEntries(new URLSearchParams(qs || '')) })) } catch (x) { } } }, true);
const ELEC = Q.get('e') || '2023-07';
const BASE = 'datos/' + ELEC + '/';
/* Todos los datos se cargan como scripts (.json.js): así funcionan igual en http(s) y abriendo el archivo con doble clic (file://). */
const jget = u => new Promise((ok, ko) => {
  const w = (window.__J = window.__J || {});
  if (w[u]) return ok(w[u]);
  const sc = document.createElement('script'); sc.charset = 'utf-8'; sc.src = u + '.js';
  sc.onload = () => w[u] ? ok(w[u]) : ko(new Error(u + ' vacío')); sc.onerror = () => ko(new Error(u + ' no encontrado'));
  document.head.appendChild(sc);
});
const bk = pid => Math.floor(+pid / 9);                    // los datos de cada elección van en 6 paquetes de provincias
const loadProv = async pid => (await jget(BASE + 'prov_b' + bk(pid) + '.json'))[pid];
const loadMunMap = async pid => (await jget('mapas/mun.json'))[pid];
const loadCcMap = async cc => { try { return await jget('mapas/ccaa_mun/' + cc + '.json') } catch (e) { return null } };
const loadSecMap = async pid => { if (!G.sections) return null; try { return (await jget('mapas/sec/' + G.mapyear + '/b' + bk(pid) + '.json'))[pid] || null } catch (e) { return null } };
function notesHTML() {
  const src = G.sections ? 'Ministerio del Interior: resultados del Senado por mesa (votos de cada candidato). Cada mesa se agrega por sección censal, municipio, circunscripción y provincia; el voto CERA (residentes en el extranjero) solo cuenta en el total de la circunscripción.'
    : G.muni ? 'Ministerio del Interior: resultados del Senado por municipio y circunscripción. De esta elección no hay datos por mesa, así que no se puede bajar a sección censal.' : 'Ministerio del Interior: resultados del Senado por circunscripción (de esta elección no se publicaron datos por municipio).';
  const my = G.sections ? `<div><b>Mapas.</b> Las secciones censales se dibujan con el seccionado del INE de ${G.mapyear}${G.year < 2001 ? ' (el más antiguo disponible; algunas secciones han cambiado desde entonces y no tienen polígono)' : ''}; los municipios, con los límites actuales.</div>` : '';
  const vt = '<div><b>Voto de un partido.</b> En el Senado se vota a personas: cada elector marca hasta 3 candidatos en las provincias (2 en Gran Canaria, Mallorca y Tenerife, 1 en Ceuta, Melilla y el resto de islas). El voto de un partido en un territorio es el de su candidato más votado allí, y los porcentajes son sobre las papeletas válidas (incluidas las que van en blanco), por lo que no suman 100.</div>';
  const ds = G.des ? `<div><b>Senadores designados.</b> ${esc(G.des.note || 'Designados por los parlamentos autonómicos al inicio de la legislatura, según las fichas de senadores del Senado de España.')}</div>` : '<div><b>Senadores designados.</b> Sin datos de designados para esta legislatura: se muestran solo los electos.</div>';
  const ind = '<div><b>Independientes.</b> Los candidatos independientes dentro de la lista de un partido se marcan con dos colores (gris claro y el del partido). Para los senadores electos la marca sale de su ficha en el Senado (partido político «Independiente» aunque se presentaran por otra formación); para el resto de candidatos, de la indicación «(independiente)» que el Ministerio del Interior añade a algunos nombres. Las candidaturas formadas solo por independientes van en gris liso.</div>';
  return `<div><b>Fuente.</b> ${src}</div>${vt}${ds}${ind}${my}` + (G.notas || []).map(n => `<div>${esc(n)}</div>`).join('');
}
const AUTONOMAS = { '51': '51001', '52': '52001' };           // Ceuta y Melilla: van directas a municipio
const DEF_PROV = '28', DEF_MUN = '28079', DEF_CC = '01', DEF_CIRC = '289';        // Madrid por defecto (comunidad: Andalucía)
const UNIPROV = { '03': '33', '04': '07', '06': '39', '12': '28', '13': '31', '15': '30', '16': '26', '18': '51', '19': '52' };   // comunidades de una sola provincia
const CCABBR = { '01': 'AND', '02': 'ARA', '03': 'AST', '04': 'BAL', '05': 'CAN', '06': 'CNT', '07': 'CLM', '08': 'CYL', '09': 'CAT', '10': 'EXT', '11': 'GAL', '12': 'MAD', '13': 'NAV', '14': 'PVA', '15': 'MUR', '16': 'RIO', '17': 'VAL', '18': 'CEU', '19': 'MEL' };
const CCSHORT = { '03': 'Asturias', '04': 'Baleares', '12': 'Madrid', '13': 'Navarra', '15': 'Murcia', '17': 'C. Valenciana', '18': 'Ceuta', '19': 'Melilla', '07': 'Castilla-La Mancha', '08': 'Castilla y León' };

const ABBR = { '15': 'COR', '27': 'LUG', '33': 'AST', '39': 'CAN', '48': 'BIZ', '20': 'GIP', '31': 'NAV', '17': 'GIR', '36': 'PON', '32': 'OUR', '24': 'LEO', '34': 'PAL', '09': 'BUR', '01': 'ALA', '26': 'RIO', '22': 'HUE', '25': 'LLE', '08': 'BCN', '49': 'ZAM', '47': 'VLL', '40': 'SEG', '42': 'SOR', '19': 'GUA', '50': 'ZAR', '43': 'TAR', '37': 'SAL', '05': 'AVI', '28': 'MAD', '16': 'CUE', '44': 'TER', '12': 'CAS', '10': 'CAC', '45': 'TOL', '13': 'CRE', '02': 'ALB', '46': 'VAL', '07': 'BAL', '06': 'BAD', '14': 'COD', '23': 'JAE', '30': 'MUR', '03': 'ALI', '21': 'HUV', '41': 'SEV', '29': 'MAL', '18': 'GRA', '04': 'ALM', '11': 'CAD', '35': 'LPA', '38': 'TFE', '51': 'CEU', '52': 'MEL' };
let G = null, NP = 0;

/* enlaces que conservan la elección elegida */
function href(page, params) { const u = new URLSearchParams(params || {}); if (Q.get('e')) u.set('e', Q.get('e')); const s = u.toString(); return page + (s ? '?' + s : '') }
const hProv = id => href('provincia.html', { p: id });
const hCirc = cid => cid[2] === '9' ? href('provincia.html', { p: cid.slice(0, 2) }) : href('provincia.html', { c: cid });
const hMun = id => href('municipio.html', { m: id });
const hCc = cc => UNIPROV[cc] ? hProv(UNIPROV[cc]) : href('index.html', { cc });
const ccName = cc => (G.ccx(cc) || {}).n || '';
const ccOfProv = pid => G.prov[G.pi[pid]].cc;

async function loadG() {
  G = await jget(BASE + 'general.json'); NP = G.parties.length;
  const z = () => new Array(NP).fill(0);
  G.ci = {}; G.circ.forEach((c, j) => { G.ci[c.id] = j; c.v = z(); c.es = z(); c.nc = z();
    c.c.forEach(r => { const i = r[1]; if (r[2] > c.v[i]) c.v[i] = r[2]; c.es[i] += r[3]; c.nc[i]++ }); c.isl = c.id[2] !== '9' });
  const agg = (o, list) => { Object.assign(o, { censo: 0, bl: 0, nu: 0, vb: 0, s: 0, v: z(), es: z() }); list.forEach(c => { ['censo', 'bl', 'nu', 'vb', 's'].forEach(k => o[k] += c[k]); c.v.forEach((x, i) => o.v[i] += x); c.es.forEach((x, i) => o.es[i] += x) }); return o };
  G.pi = {}; G.prov.forEach((p, j) => { G.pi[p.id] = j; agg(p, p.circs.map(id => G.circ[G.ci[id]])); p.cl = p.circs.map(id => G.circ[G.ci[id]]) });
  G.circ.forEach(c => { c.cc = G.prov[G.pi[c.p]].cc; c.pn = G.prov[G.pi[c.p]].n });
  G.cc = G.ccaa.map(c => { const ps = G.prov.filter(p => p.cc === c.id), o = agg({ id: c.id, n: c.n, provs: ps.map(p => p.id) }, ps.flatMap(p => p.cl)); return o }).filter(c => c.provs.length);
  G.ci2 = {}; G.cc.forEach((c, j) => G.ci2[c.id] = j);
  const n = G.nat; n.s = n.el.reduce((a, b) => a + b, 0); n.es = n.el; n.des = n.des || z(); n.tot = n.el.map((x, i) => x + (n.des[i] || 0));
  G.ccx = id => G.cc[G.ci2[id]];
  const css = (f) => G.parties.map(p => `--c-${p.k}:${f(p)};`).join('');
  const st = document.createElement('style');
  st.textContent = `:root{${css(p => p.c)}--c-INDX:#c9ced4}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${css(p => p.d)}--c-INDX:#5d646c}}:root[data-theme="dark"]{${css(p => p.d)}--c-INDX:#5d646c}`;
  document.head.appendChild(st);
  return G;
}
const pcol = i => `var(--c-${G.parties[i].k})`;
const swatch = (i, ind) => `<span class="sw" style="background:${ind ? `linear-gradient(90deg,var(--c-INDX) 50%,${pcol(i)} 50%)` : pcol(i)}"${ind ? ' title="Independiente en la lista de ' + esc(G.parties[i].n) + '"' : ''}></span>`;
/* candidato: [nombre, partido, votos, electo, independiente] */
const candLabel = r => `<span class="wn">${swatch(r[1], r[4])}${esc(r[0])}</span>`;

/* ---- D'Hondt sobre cuotas (suma 1 con el voto en blanco) ---- */
function dh(t, seats, out) {
  out.fill(0); const el = []; for (let k = 0; k < t.length; k++) if (t[k] >= 0.03) el.push(k);
  for (let n = 0; n < seats; n++) { let b = -1, bq = -1; for (const k of el) { const q = t[k] / (out[k] + 1); if (q > bq) { bq = q; b = k } } if (b < 0) break; out[b]++ }
}
const _o = () => new Array(NP).fill(0);
/* cuota (sobre voto válido, con blancos) de cada partido en una circunscripción o municipio */
function shares(v, bl, vb) { let t = bl; for (const x of v) t += x; if (vb !== undefined) t = vb; return { valid: t, row: v.map(x => t ? x / t : 0) } }
function seatsAt(row, k, x, seats) {
  const rest = 1 - row[k], f = rest > 0 ? (1 - x) / rest : 0, t = new Array(row.length), out = _o();
  for (let i = 0; i < row.length; i++) t[i] = i === k ? x : row[i] * f;
  dh(t, seats, out); return out[k];
}
/* voto que necesitaría el partido k para llegar a `target` escaños, con el resto escalado en proporción */
function needShare(row, k, seats, target) {
  if (target < 1 || target > seats) return null;
  if (seatsAt(row, k, 0.999, seats) < target) return null;
  let lo = 0, hi = 0.999;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (seatsAt(row, k, mid, seats) >= target) hi = mid; else lo = mid }
  return hi;
}
function quotients(row, seats) {
  const q = [];
  for (let k = 0; k < row.length; k++) if (row[k] >= 0.03) for (let d = 1; d <= seats + 1; d++) q.push({ k, d, q: row[k] / d });
  q.sort((a, b) => b.q - a.q);
  return q.slice(0, seats + 3).map((x, i) => ({ ...x, n: i + 1, won: i < seats }));
}
/* barrera efectiva: voto mínimo que necesitaría un partido nuevo para sacar el primer escaño (los demás se reducen en proporción) */
function effThreshold(row, seats) {
  const win = x => {
    const f = 1 - x, q = [];
    for (let k = 0; k < row.length; k++) { const s = row[k] * f; if (s >= 0.03) for (let d = 1; d <= seats; d++) q.push(s / d) }
    q.sort((a, b) => b - a);
    const last = q.length >= seats ? q[seats - 1] : 0;
    return x > last;
  };
  if (!win(0.999)) return null;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (win(mid)) hi = mid; else lo = mid }
  return hi;
}
/* análisis de una provincia a partir de sus votos */
function analyze(p) {
  const { valid, row } = shares(p.v, p.bl), seats = p.s, out = _o();
  const t = row.slice(); dh(t, seats, out);
  const q = quotients(row, seats), lastW = q.filter(x => x.won).slice(-1)[0] || null, firstO = q.find(x => !x.won) || null;
  const order = row.map((x, i) => i).filter(i => p.v[i] > 0).sort((a, b) => p.v[b] - p.v[a]);
  return { valid, row, seats, es: out, q, lastW, firstO, order, blShare: p.bl / valid };
}
/* ganador por votos y margen (en cuota de voto válido) */
function winOf(v, bl, vb) {
  let b = -1, s = -1, t = bl; for (let i = 0; i < v.length; i++) { t += v[i]; if (b < 0 || v[i] > v[b]) { s = b; b = i } else if (s < 0 || v[i] > v[s]) s = i }
  if (vb !== undefined) t = vb;
  if (b < 0 || v[b] <= 0) return null;
  return { w: b, s: s < 0 ? -1 : s, m: (v[b] - (s < 0 ? 0 : v[s])) / t, sh: v[b] / t, valid: t };
}
/* partido con más escaños (desempate por votos); si no hay escaños, el más votado */
function swin(u) { const es = u.es; if (es && es.some(x => x > 0)) { let b = -1; es.forEach((x, i) => { if (x > 0 && (b < 0 || x > es[b] || (x === es[b] && u.v[i] > u.v[b]))) b = i }); return b } const w = winOf(u.v, u.bl, u.vb); return w ? w.w : -1 }
function shade(w, m, m0 = 0.30) { return `fill:${pcol(w)};fill-opacity:${(0.32 + 0.68 * Math.min(1, m / m0)).toFixed(2)}` }

/* ---- migas de pan y selectores ---- */
function crumbs(list) {
  $('#crumbs').innerHTML = list.map((c, i) => {
    const last = i === list.length - 1, lab = c.l ? `<small>${esc(c.l)}</small>` : '';
    return (i ? '<span class="sep">/</span>' : '') + (c.h && !last ? `<a href="${c.h}">${lab}${esc(c.t)}</a>` : `<span class="${last ? 'cur' : ''}">${lab}${esc(c.t)}</span>`);
  }).join('');
}
const ccOpts = sel => G.cc.slice().sort((a, b) => a.n.localeCompare(b.n, 'es')).map(c => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${esc(c.n)}</option>`).join('');
const circOpts = sel => G.prov.slice().sort((a, b) => a.n.localeCompare(b.n, 'es')).map(p => p.circs.length > 1 ? `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${esc(p.n)} (todas las islas)</option>` + p.cl.map(c => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>&nbsp;&nbsp;${esc(c.n)}</option>`).join('') : `<option value="${p.id}"${p.id === sel || p.circs[0] === sel ? ' selected' : ''}>${esc(p.n)}</option>`).join('');
const provOpts = sel => G.prov.slice().sort((a, b) => a.n.localeCompare(b.n, 'es')).map(p => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${esc(p.n)}</option>`).join('');
const dateLong = () => G.date;
function setPill() {}

/* ---- barras de voto ---- */
function voteBars(sel, v, bl, nu, censo, maxShow = 12) {
  const { valid, row } = shares(v, bl), idx = row.map((x, i) => i).filter(i => v[i] > 0).sort((a, b) => v[b] - v[a]);
  const top = idx.slice(0, maxShow), mx = Math.max(0.05, Math.ceil(row[top[0]] * 20) / 20);
  const rest = idx.slice(maxShow).reduce((a, i) => a + v[i], 0);
  $(sel).innerHTML = top.map(i => `<div class="prow"><div class="top"><span class="nm">${swatch(i)}${esc(G.parties[i].n)}</span><span class="pc">${fmt(row[i])}</span></div><div class="bar"><i style="width:${row[i] / mx * 100}%;background:${pcol(i)}"></i></div><div class="ft">${nf(v[i])} votos</div></div>`).join('')
    + `<div class="prow"><div class="top"><span class="nm"><span class="sw" style="background:var(--faint)"></span>Resto de candidaturas</span><span class="pc">${fmt(rest / valid)}</span></div><div class="bar"><i style="width:${rest / valid / mx * 100}%;background:var(--faint)"></i></div><div class="ft">${nf(rest)} votos</div></div>`
    + `<div class="prow"><div class="top"><span class="nm"><span class="sw" style="background:var(--rule)"></span>En blanco</span><span class="pc">${fmt(bl / valid)}</span></div><div class="bar"><i style="width:${bl / valid / mx * 100}%;background:var(--rule)"></i></div><div class="ft">${nf(bl)} votos · nulos ${nf(nu)}</div></div>`;
}

/* ---- mapa de provincias (cuadrados para Ceuta y Melilla, recuadro para Canarias) ---- */
function drawProvMap(target, MAP, cfg) {
  let h = '', selp = '';
  Object.keys(MAP.paths).forEach(id => {
    const j = G.pi[id]; if (j === undefined) return;
    const p = `<path data-id="${id}" tabindex="0" role="button" aria-label="${esc(cfg.title(id, j))}" class="${id === cfg.sel ? 'sel' : ''}" d="${MAP.paths[id]}" style="${cfg.style(id, j)}"><title>${esc(cfg.title(id, j))}</title></path>`;
    if (id === cfg.sel) selp = p; else h += p;
  });
  let sqs = ''; Object.keys(MAP.sq).forEach(id => {
    const j = G.pi[id]; if (j === undefined) return; const [x, y, s] = MAP.sq[id];
    sqs += `<rect data-id="${id}" tabindex="0" role="button" aria-label="${esc(cfg.title(id, j))}" class="sqr${id === cfg.sel ? ' sel' : ''}" x="${x}" y="${y}" width="${s}" height="${s}" rx="4" style="${cfg.style(id, j)}"><title>${esc(cfg.title(id, j))}</title></rect><text class="ml lt" x="${x + s / 2}" y="${y + s / 2}">${ABBR[id]}</text>`;
  });
  let tx = ''; Object.keys(MAP.lab).forEach(id => { if (G.pi[id] !== undefined && cfg.labels !== false) tx += `<text class="ml lt" x="${MAP.lab[id][0]}" y="${MAP.lab[id][1]}">${ABBR[id]}</text>` });
  const b = MAP.box;
  $(target).innerHTML = `<svg class="mapsvg" viewBox="0 0 ${MAP.w} ${MAP.h}" role="group" aria-label="Mapa de provincias">${h}${selp}${tx}${sqs}<rect class="bx" x="${b[0]}" y="${b[1]}" width="${b[2] - b[0]}" height="${b[3] - b[1]}" rx="6"/><text class="bt" x="${b[0] + 8}" y="${b[1] + 16}">Canarias</text></svg>`;
  $(target).querySelectorAll('[data-id]').forEach(el => {
    const id = el.dataset.id;
    el.onclick = () => cfg.pick(id);
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cfg.pick(id) } };
    if (cfg.hover) el.onmouseenter = () => cfg.hover(id);
  });
}

/* ---- mapa nacional en tres niveles: España entera, comunidades autónomas o provincias ---- */
function drawNatMap(target, MAP, CCM, cfg) {
  if (cfg.mode === 'prov') return drawProvMap(target, MAP, cfg);
  const b = MAP.box, box = `<rect class="bx" x="${b[0]}" y="${b[1]}" width="${b[2] - b[0]}" height="${b[3] - b[1]}" rx="6"/><text class="bt" x="${b[0] + 8}" y="${b[1] + 16}">Canarias</text>`;
  const SQ = { '18': '51', '19': '52' };
  let h = '', selp = '', tx = '', sqs = '';
  if (cfg.mode === 'esp') {
    const st = cfg.style('ES'), t = esc(cfg.title('ES'));
    h += `<path data-id="ES" d="${CCM.ES ? CCM.ES.d : Object.values(MAP.paths).join('')}" style="${st}"><title>${t}</title></path>`;
    Object.keys(MAP.sq).forEach(id => { const [x, y, s] = MAP.sq[id]; sqs += `<rect data-id="ES" class="sqr" x="${x}" y="${y}" width="${s}" height="${s}" rx="4" style="${st}"><title>${t}</title></rect><text class="ml lt" x="${x + s / 2}" y="${y + s / 2}">${ABBR[id]}</text>` });
    tx = `<text class="ml lt lg" x="470" y="430">ESPAÑA</text>`;
  } else {
    Object.keys(CCM).forEach(cc => {
      if (cc === 'ES' || G.ci2[cc] === undefined) return; const t = esc(cfg.title(cc));
      const p = `<path data-id="${cc}" tabindex="0" role="button" aria-label="${t}" class="${cc === cfg.sel ? 'sel' : ''}" d="${CCM[cc].d}" style="${cfg.style(cc)}"><title>${t}</title></path>`;
      if (cc === cfg.sel) selp = p; else h += p;
      const L = CCM[cc].l; if (L && cfg.labels !== false) tx += `<text class="ml lt" x="${L[0]}" y="${L[1]}">${CCABBR[cc]}</text>`;
    });
    Object.keys(SQ).forEach(cc => { if (G.ci2[cc] === undefined || !MAP.sq[SQ[cc]]) return; const [x, y, s] = MAP.sq[SQ[cc]], t = esc(cfg.title(cc));
      sqs += `<rect data-id="${cc}" tabindex="0" role="button" aria-label="${t}" class="sqr${cc === cfg.sel ? ' sel' : ''}" x="${x}" y="${y}" width="${s}" height="${s}" rx="4" style="${cfg.style(cc)}"><title>${t}</title></rect><text class="ml lt" x="${x + s / 2}" y="${y + s / 2}">${CCABBR[cc]}</text>` });
  }
  $(target).innerHTML = `<svg class="mapsvg" viewBox="0 0 ${MAP.w} ${MAP.h}" role="group" aria-label="Mapa de España">${h}${selp}${tx}${sqs}${box}</svg>`;
  $(target).querySelectorAll('[data-id]').forEach(el => {
    const id = el.dataset.id; el.onclick = () => cfg.pick(id);
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cfg.pick(id) } };
  });
}

/* ---- ranking de partidos para titulares ---- */
const art = k => (G.parties[k].n === 'PP' || /^(Vox|Sumar|Junts|Podemos|CC|BNG)/i.test(G.parties[k].n)) ? '' : (G.parties[k].n === 'PSOE' ? 'el ' : '');
const SEQ = ['PSP', 'IU', 'ICV', 'ECP', 'PODEMOS', 'SUMAR', 'ENMAREA', 'COMPROMIS', 'MASPAIS', 'EQUO', 'HB', 'BILDU', 'EA', 'EE', 'BNG', 'CUP', 'ERC', 'NC', 'PA', 'PSOE', 'CHA', 'NABAI', 'JUNTS', 'CIU', 'PDECAT', 'PNV', 'CC', 'UV', 'PAR', 'PRC', 'TERUEL', 'CS', 'UPYD', 'CDS', 'UCD', 'PP', 'FAC', 'UPN', 'NAVARRASUMA', 'SALF', 'FN', 'VOX', 'REAL'];

/* ---- barra fija: elección, provincia y municipio ---- */
async function mountBar(curProv, curMun, curCc) {
  const el = $('#bar'); if (!el) return;
  el.className = 'ctrl fixbar'; el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Elección, circunscripción y municipio');
  
  el.innerHTML = `<label class="fld" for="elecSel"><span class="lbl">Elecciones</span><select id="elecSel"></select></label>
    <label class="fld" for="provSel"><span class="lbl">Circunscripción</span><select id="provSel"></select></label>
    <label class="fld srch" for="munq"><span class="lbl">Municipio</span><input id="munq" list="munlist" placeholder="Busca un municipio…" autocomplete="off"><datalist id="munlist"></datalist></label>`;
  const EL = await jget('datos/elecciones.json');
  $('#elecSel').innerHTML = EL.map(x => `<option value="${x.id}"${x.id === ELEC ? ' selected' : ''}>${esc(x.label)}</option>`).join('');
  $('#elecSel').onchange = async e => {
    const ne = e.target.value, pg = location.pathname.split('/').pop() || 'index.html', P = new URLSearchParams(location.search);
    P.delete('e'); if (ne !== EL[0].id) P.set('e', ne);
    const go = (page, q) => { const u = new URLSearchParams(q || {}); if (ne !== EL[0].id) u.set('e', ne); const t = u.toString(); nav(page + (t ? '?' + t : '')) };
    try {
      if (pg === 'municipio.html' && P.get('m')) {
        const ml = await jget('datos/' + ne + '/municipios.json'), m = P.get('m');
        if (!ml.some(x => x[0] === m)) { const pid = m.slice(0, 2); return go('provincia.html', { p: pid }) }
      }
    } catch (err) { return go('index.html') }
    const t = P.toString(); nav(pg + (t ? '?' + t : ''));
  };
  $('#provSel').innerHTML = (curProv ? '' : '<option value="">Elige…</option>') + circOpts(curProv || '');
  $('#provSel').onchange = e => { if (e.target.value) nav(e.target.value.length === 2 ? hProv(e.target.value) : hCirc(e.target.value)) };
  let MUNS = null; const inp = $('#munq'), dl = $('#munlist');
  if (curMun) { inp.value = curMun; inp.addEventListener('focus', () => { inp.value = ''; inp.placeholder = curMun }); inp.addEventListener('blur', () => { if (!inp.value) inp.value = curMun }) }
  inp.addEventListener('focus', async () => {
    if (MUNS) return; MUNS = await jget(BASE + 'municipios.json'); MUNS.forEach(m => m.label = `${m[1]} · ${G.prov[G.pi[m[0].slice(0, 2)]].n}`); if (!MUNS.length) { inp.placeholder = 'Sin datos municipales'; }
    dl.innerHTML = MUNS.map(m => `<option value="${esc(m.label)}"></option>`).join('');
  }, { once: true });
  inp.addEventListener('change', () => { if (!MUNS) return; const m = MUNS.find(x => x.label === inp.value); if (m) nav(hMun(m[0])) });
}

function hoverFront(svg) { svg.onmouseover = e => { const p = e.target.closest && e.target.closest('path[data-m],path[data-k]'); if (p && !svg.classList.contains('nob') && p.parentNode.lastElementChild !== p) p.parentNode.appendChild(p) } }

/* ---- panel de detalle al pasar el ratón / fijar con clic ---- */
function unitPanelHTML(d) {
  const vc = d.v.reduce((a, b) => a + b, 0), valid = d.vb !== undefined ? d.vb : vc + d.bl, vt = valid + d.nu, w = winOf(d.v, d.bl, d.vb);
  const ref = d.ref, rvalid = ref ? (ref.vb !== undefined ? ref.vb : ref.v.reduce((a, b) => a + b, 0) + ref.bl) : 0;
  const idx = d.v.map((x, i) => i).filter(i => d.v[i] > 0).sort((a, b) => d.v[b] - d.v[a]);
  const show = idx.slice(0, 8), rest = idx.slice(8);
  const row = (i) => { const sh = d.v[i] / valid, rs = ref && rvalid ? ref.v[i] / rvalid : null, df = rs === null ? null : (sh - rs) * 100;
    return `<tr><td><span class="wn">${swatch(i)}${esc(G.parties[i].n)}</span></td><td class="num">${nf(d.v[i])}</td><td class="num"><b>${fmt(sh)}</b></td>${ref ? `<td class="num">${df === null ? '–' : (df > 0 ? '+' : df < 0 ? '−' : '') + nf(Math.abs(df), 1)}</td><td class="num">${ref.v[i] ? fmt(d.v[i] / ref.v[i]) : '–'}</td>` : ''}</tr>` };
  let rows = show.map(row).join('');
  if (rest.length) rows += `<tr><td>Otras candidaturas (${rest.length})</td><td class="num"></td><td class="num"></td>${ref ? '<td></td><td></td>' : ''}</tr>`;
  rows += `<tr><td>En blanco</td><td class="num">${nf(d.bl)}</td><td class="num"><b>${fmt(d.bl / valid)}</b></td>${ref ? '<td></td><td></td>' : ''}</tr>`;
  return `${d.action ? `<p class="up-act"><button type="button" class="btnlk" id="upact">${d.action.label}</button></p>` : ''}<div class="up-h"><h3>${esc(d.title)}</h3><div class="meta">${d.meta || ''}</div></div>
  <div class="kpis k3"><div><b>${d.censo ? fmt(vt / d.censo) : '–'}</b><span>participación (${nf(vt)} votantes de ${nf(d.censo)} electores)</span></div>
  <div><b>${w ? esc(G.parties[w.w].n) : '–'}</b><span>${w ? `más votado, con ${fmt(w.sh)} (${nf(d.v[w.w])} votos)` : 'sin votos a candidaturas'}</span></div>
  <div><b>${w && w.s >= 0 ? nf(d.v[w.w] - d.v[w.s]) : '–'}</b><span>${w && w.s >= 0 ? `votos de ventaja sobre ${esc(G.parties[w.s].n)} (${nf(w.m * 100, 1)} pts)` : ''}</span></div></div>
  <div class="tw">${d.cands ? d.cands : ''}<table class="pt mt prt vt"><thead><tr><th>Partido <small>(su candidato más votado)</small></th><th>Votos</th><th>% voto</th>${ref ? `<th title="Diferencia en puntos con ${esc(d.refName)}">Dif.</th><th title="Porcentaje de los votos del partido en ${esc(d.refName)} que salen de aquí">Peso en ${esc(d.refName)}</th>` : ''}</tr></thead><tbody>${rows}</tbody></table></div>
`;
}
function attachPanel(svg, selector, keyAttr, getData, hint) {
  let host = document.getElementById('upanel');
  if (!host) { host = document.createElement('div'); host.id = 'upanel'; host.className = 'upanel'; (document.getElementById('mapnote') || svg).insertAdjacentElement('afterend', host) }
  let pinned = null;
  const render = key => {
    if (!key) { host.innerHTML = `<p class="note up-hint">${hint}</p>`; return }
    const d = getData(key); if (!d) { host.innerHTML = ''; return }
    host.innerHTML = unitPanelHTML(d) ; const b = host.querySelector('#upact'); if (b) b.onclick = d.action.run;
  };
  const els = [...svg.querySelectorAll(selector)];
  const setPin = (key) => { pinned = key; els.forEach(p => p.classList.toggle('pin', key !== null && p.dataset[keyAttr] === key)); const pp = key && els.find(p => p.dataset[keyAttr] === key); if (pp) pp.parentNode.appendChild(pp); render(pinned) };
  els.forEach(p => {
    const k = p.dataset[keyAttr];
    p.onmouseenter = () => { if (pinned !== k) render(k) };
    p.onmouseleave = () => render(pinned);
    p.onclick = () => setPin(pinned === k ? null : k);
    p.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPin(pinned === k ? null : k) } };
  });
  render(null);
  return { pin: setPin };
}

/* ---- pestañas ---- */
function showTab(id) {
  document.querySelectorAll('.tabs [role=tab]').forEach(b => { const on = b.id === 'tab-' + id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1 });
  document.querySelectorAll('.panel[role=tabpanel]').forEach(p => { p.hidden = p.id !== 'p-' + id });
}
function mountTabs() {
  const tabs = [...document.querySelectorAll('.tabs [role=tab]')];
  tabs.forEach((b, i) => { b.onclick = () => showTab(b.id.slice(4));
    b.onkeydown = e => { const j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : -1; if (j >= 0) { e.preventDefault(); tabs[j].focus(); showTab(tabs[j].id.slice(4)) } } });
}

/* ---- bloque "Elige un partido" con tabla de los 10 primeros/últimos ---- */
function partyBlock(host, o) {
  const st = o.state = o.state || { party: o.ps[0], ord: 'pct_desc' };
  const ORD = { pct_desc: '% más alto del partido', pct_asc: '% más bajo del partido', v_desc: 'Más votos del partido', v_asc: 'Menos votos del partido' };
  const pv = o.parent.v, pvalid = o.parent.vb !== undefined ? o.parent.vb : pv.reduce((a, b) => a + b, 0) + o.parent.bl;
  const cell = (sh, v, hi, es) => `<td class="num pc${hi ? ' hi' : ''}">${fmt(sh)}<small>${nf(v)}${es ? ' · ' + es + ' sen.' : ''}</small></td>`;
  const draw = () => {
    const i = st.party, valid = u => u.vb !== undefined ? u.vb : u.v.reduce((a, b) => a + b, 0) + u.bl;
    const U = o.units.map(u => ({ u, valid: valid(u) })).filter(x => x.valid > 0).map(x => ({ ...x, pct: x.u.v[i] / x.valid, vt: x.u.v[i] }));
    const keyf = { pct_desc: (a, b) => b.pct - a.pct, pct_asc: (a, b) => a.pct - b.pct, v_desc: (a, b) => b.vt - a.vt, v_asc: (a, b) => a.vt - b.vt }[st.ord];
    const sorted = U.slice().sort((a, b) => keyf(a, b) || b.u.censo - a.u.censo), top = sorted.slice(0, 10);
    const byPct = U.slice().sort((a, b) => b.pct - a.pct), best = byPct[0], worst = byPct[byPct.length - 1];
    const won = o.units.filter(u => { const w = winOf(u.v, u.bl, u.vb); return w && w.w === i }).length;
    host.innerHTML = `<h2>Elige un partido</h2><p class="note">${o.note}</p>
    ${o.modes ? `<div class="seg2" role="group" aria-label="Nivel de la tabla">${o.modes.map(x => `<button type="button" data-mode="${x.id}" aria-pressed="${x.id === o.mode}">${x.label}</button>`).join('')}</div>` : ''}
    <div class="chips" role="group" aria-label="Partido">${o.ps.map(j => `<button type="button" class="chip" style="--c:${pcol(j)}" data-p="${j}" aria-pressed="${j === i}"><i></i>${esc(G.parties[j].n)} <small>${o.chipSub(j)}</small></button>`).join('')}</div>
    <div class="kpis"><div><b style="color:${pcol(i)}">${fmt(pv[i] / pvalid)}</b><span>del voto ${o.parentName} (${nf(pv[i])} votos)</span></div>
      <div><b>${nf(won)}</b><span>${o.unitsPl} donde es el más votado, de ${nf(o.units.length)}</span></div>
      <div><b>${best ? fmt(best.pct) : '–'}</b><span>mejor resultado: ${best ? esc(best.u.name) : ''}</span></div>
      <div><b>${worst ? fmt(worst.pct) : '–'}</b><span>peor resultado: ${worst ? esc(worst.u.name) : ''}</span></div></div>
    <div class="toolrow"><label class="fld sel" style="margin:0"><span class="lbl">Ordenar ${o.unitsPl}</span><select id="pbord">${Object.keys(ORD).map(k => `<option value="${k}"${k === st.ord ? ' selected' : ''}>${ORD[k]}</option>`).join('')}</select></label></div>
    <div class="tw"><table class="pt mt pbt"><thead><tr><th class="stk">${o.unitName}</th><th>Electores</th><th>Particip.</th><th>Más votado</th><th>% ganador</th><th>Ventaja</th>${o.ps.map(j => `<th class="${j === i ? 'hi' : ''}"><span class="wn">${swatch(j)}${esc(G.parties[j].n)}</span></th>`).join('')}<th>En blanco</th><th>Nulos</th></tr></thead><tbody>${top.map(({ u, valid }) => { const w = winOf(u.v, u.bl, u.vb);
      return `<tr class="rw" data-key="${esc(u.key)}"><td class="stk">${esc(u.name)}</td><td class="num">${nf(u.censo)}</td><td class="num">${fmt(u.part)}</td><td>${w ? `<span class="wn">${swatch(w.w)}${esc(G.parties[w.w].n)}</span>` : '–'}</td><td class="num">${w ? fmt(w.sh) : '–'}</td><td class="num">${w ? nf(w.m * 100, 1) + ' pts' : '–'}</td>${o.ps.map(j => cell(u.v[j] / valid, u.v[j], j === i, u.es && u.es[j])).join('')}${cell(u.bl / valid, u.bl)}<td class="num">${nf(u.nu)}</td></tr>` }).join('')}</tbody></table></div>
    <p class="note" style="margin:10px 0 0">Se muestran ${top.length} de ${nf(U.length)} ${o.unitsPl}. ${o.ord_note || ''}</p>`;
    host.querySelectorAll('.chip').forEach(b => b.onclick = () => { st.party = +b.dataset.p; draw() });
    host.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => o.onMode(b.dataset.mode));
    host.querySelector('#pbord').onchange = e => { st.ord = e.target.value; draw() };
    if (o.onRow) host.querySelectorAll('tr.rw').forEach(r => r.onclick = () => o.onRow(r.dataset.key));
    if (o.onRow) host.querySelectorAll('tr.rw').forEach(r => r.style.cursor = 'pointer');
  };
  draw();
}

/* ---- pestaña «Partidos»: % de voto de un partido por territorio, en mapa y tabla ----
   o.levels: [{ id, label, units: [{ key, name, v, bl, link }], labels: bool, draw(host, styleOf, textOf, pick) }]
   o.parent: { name, v, bl } (ámbito de la página); o.ps: partidos; o.chipSub(j) */
const PT_CSS = `.ptwrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:start}@media(max-width:860px){.ptwrap{grid-template-columns:minmax(0,1fr)}}
.ptmap{width:100%;height:auto;display:block;max-height:640px;margin:6px auto 0}.ptmap path,.ptmap rect{stroke:var(--surface);stroke-width:.8px;vector-effect:non-scaling-stroke;stroke-linejoin:round;cursor:pointer}
.ptmap.fine path{stroke-width:.35px}.ptmap path:hover,.ptmap rect:hover{stroke:var(--ink);stroke-width:2px}.ptmap text{font-family:var(--f-mono);font-weight:600;fill:var(--ink);stroke:var(--surface);paint-order:stroke;text-anchor:middle;dominant-baseline:central;pointer-events:none;font-variant-numeric:tabular-nums}
.ptgrad{display:inline-block;width:140px;height:10px;border-radius:2px;vertical-align:-1px}.pttab td.bar{width:80px;min-width:60px;max-width:110px}.pttab td.stk{min-width:150px;white-space:normal}.pttab td.bar i{display:block;height:8px;border-radius:2px}
.pttab tr.rw{cursor:pointer}.pttab tr.rw:hover td{background:var(--track)}`;
function partyTab(host, o) {
  if (!document.getElementById('ptcss')) { const st = document.createElement('style'); st.id = 'ptcss'; st.textContent = PT_CSS; document.head.appendChild(st) }
  const S = o.state = o.state || { party: o.ps[0], lv: o.levels[0].id, ord: 'pct' };
  const nat = shares(G.nat.v, G.nat.bl, G.nat.vb).row, par = shares(o.parent.v, o.parent.bl, o.parent.vb), isNat = !!o.parent.isNat;
  const sh = u => { const t = u.vb !== undefined ? u.vb : u.v.reduce((a, b) => a + b, 0) + u.bl; return t ? u.v[S.party] / t : null };
  const draw = () => {
    const i = S.party, L = o.levels.find(l => l.id === S.lv), U = L.units.map(u => ({ ...u, p: sh(u) })).filter(u => u.p !== null);
    const HASES = !!(U[0] && U[0].es), xs = U.map(u => u.p), mn = Math.min(...xs), mx = Math.max(...xs), rg = mx - mn || 1, by = {}; U.forEach(u => by[u.key] = u);
    const won = U.filter(u => { const w = winOf(u.v, u.bl, u.vb); return w && w.w === i }).length, srt = U.slice().sort((a, b) => b.p - a.p), best = srt[0], worst = srt[srt.length - 1];
    host.innerHTML = `<section class="card"><h2>Elige un partido</h2><p class="note">${esc(o.note)}</p>
      <div class="chips" role="group" aria-label="Partido">${o.ps.map(j => `<button type="button" class="chip" style="--c:${pcol(j)}" data-p="${j}" aria-pressed="${j === i}"><i></i>${esc(G.parties[j].n)} <small>${o.chipSub(j)}</small></button>`).join('')}</div>
      <div class="kpis"><div><b style="color:${pcol(i)}">${fmt(par.row[i])}</b><span>voto en ${esc(o.parent.name)} (${nf(o.parent.v[i])} votos)${isNat ? '' : ` · en España ${fmt(nat[i])}`}</span></div>
      ${o.seatKpi ? o.seatKpi(i) : ''}
      <div><b>${nf(won)}</b><span>${esc(L.pl)} donde es el más votado, de ${nf(U.length)}</span></div>
      <div><b>${best ? fmt(best.p) : '–'}</b><span>mejor resultado: ${best ? esc(best.name) : ''}${worst && worst !== best ? ` · peor: ${esc(worst.name)} (${fmt(worst.p)})` : ''}</span></div></div></section>
    <div class="ptwrap"><section class="card"><h2>Dónde vota más ${esc(G.parties[i].n)}</h2>
      <p class="note">${L.labels ? 'El número es el % de voto del partido en cada territorio.' : 'Con tantas unidades el número no se leería: solo el color indica el porcentaje.'} Más oscuro, más porcentaje (escala entre el mínimo y el máximo de ${esc(L.pl)}). Pulsa un territorio para abrir su vista.</p>
      ${o.levels.length > 1 ? `<div class="seg2" role="group" aria-label="Nivel">${o.levels.map(l => `<button type="button" data-lv="${l.id}" aria-pressed="${l.id === S.lv}">${esc(l.label)}</button>`).join('')}</div>` : ''}
      <div class="ptm"></div>
      <div class="leg2"><span>${fmt(mn)}</span><span class="ptgrad" style="background:linear-gradient(90deg,color-mix(in srgb,${pcol(i)} 8%,var(--surface)),${pcol(i)})"></span><span>${fmt(mx)} · % de ${esc(G.parties[i].n)}</span></div></section>
    <section class="card"><h2>${esc(L.one)} a ${esc(L.one.toLowerCase())}</h2><p class="note">% de las papeletas válidas que votan al candidato más votado de ${esc(G.parties[i].n)} en cada territorio. «Dif. España» = su % menos el ${fmt(nat[i])} del total nacional${isNat ? '' : `; «Dif. ${esc(o.parent.short || o.parent.name)}» = su % menos el ${fmt(par.row[i])} de ${esc(o.parent.name)}`}, en puntos. Pulsa una fila para abrir su vista.</p>
      <div class="seg2" role="group" aria-label="Orden"><button type="button" data-o="pct" aria-pressed="${S.ord === 'pct'}">Más votado</button><button type="button" data-o="dif" aria-pressed="${S.ord === 'dif'}">Menos votado</button><button type="button" data-o="az" aria-pressed="${S.ord === 'az'}">A-Z</button></div>
      <div class="tw tall"><table class="pt mt pttab"></table></div><p class="note ptn" style="margin:8px 0 0"></p></section></div>`;
    const styleOf = k => { const u = by[k]; return u ? `fill:${pcol(i)};fill-opacity:${(0.08 + 0.92 * (u.p - mn) / rg).toFixed(2)}` : 'fill:var(--track)' };
    const textOf = k => by[k] ? nf(by[k].p * 100, 1) + '%' : '';
    const titleOf = k => { const u = by[k]; return u ? `${u.name} · ${G.parties[i].n} ${fmt(u.p)} (${nf(u.v[i])} votos)${u.es ? ' · ' + nf(u.es[i]) + ' sen.' : ''} · Dif. España ${pts(u.p - nat[i]) || '0,0'}` : '' };
    const run = () => L.draw(host.querySelector('.ptm'), styleOf, L.labels ? textOf : null, titleOf, k => { const u = by[k]; if (u && u.link) nav(u.link) });
    if (host.__mo) { host.__mo.disconnect(); host.__mo = null }
    if (host.offsetParent) run(); else { host.__mo = new MutationObserver(() => { if (host.offsetParent) { host.__mo.disconnect(); host.__mo = null; run() } }); host.__mo.observe(host, { attributes: true, attributeFilter: ['hidden'] }) }
    const rows = U.slice().sort(S.ord === 'az' ? (a, b) => a.name.localeCompare(b.name, 'es') : S.ord === 'dif' ? (a, b) => a.p - b.p : (a, b) => b.p - a.p), LIM = 400, top = rows.slice(0, LIM);
    const d = x => `<span class="${x >= 0 ? 'gd' : 'bd'}">${pts(x) || '0,0'}</span>`;
    host.querySelector('.pttab').innerHTML = `<thead><tr><th class="stk">${esc(L.one)}</th><th>% voto</th><th></th><th>Votos</th>${HASES ? '<th>Senadores</th>' : ''}<th>Dif. España</th>${isNat ? '' : `<th>Dif. ${esc(o.parent.short || o.parent.name)}</th>`}<th title="Parte del voto del partido en toda España que sale de aquí">Peso en España</th>${isNat ? '' : `<th title="Parte del voto del partido en ${esc(o.parent.name)} que sale de aquí">Peso en ${esc(o.parent.short || o.parent.name)}</th>`}</tr></thead><tbody>${top.map(u =>
      `<tr class="rw" data-k="${esc(u.key)}"><td class="stk">${esc(u.name)}</td><td class="num"><b>${fmt(u.p)}</b></td><td class="bar"><i style="width:${(u.p / mx * 100).toFixed(1)}%;background:${pcol(i)}"></i></td><td class="num">${nf(u.v[i])}</td>${HASES ? `<td class="num s2">${u.es ? (u.es[i] || '–') : ''}</td>` : ''}<td class="num">${d(u.p - nat[i])}</td>${isNat ? '' : `<td class="num">${d(u.p - par.row[i])}</td>`}<td class="num">${G.nat.v[i] ? fmt(u.v[i] / G.nat.v[i], 2) : '–'}</td>${isNat ? '' : `<td class="num">${o.parent.v[i] ? fmt(u.v[i] / o.parent.v[i], 2) : '–'}</td>`}</tr>`).join('')}</tbody>`;
    host.querySelector('.ptn').textContent = rows.length > LIM ? `Se muestran ${LIM} de ${nf(rows.length)} ${L.pl} según el orden elegido.` : `${nf(rows.length)} ${L.pl}.`;
    host.querySelectorAll('.pttab tr.rw').forEach(r => r.onclick = () => { const u = by[r.dataset.k]; if (u && u.link) nav(u.link) });
    host.querySelectorAll('.chip').forEach(b => b.onclick = () => { S.party = +b.dataset.p; draw() });
    host.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { S.lv = b.dataset.lv; draw() });
    host.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { S.ord = b.dataset.o; draw() });
  };
  draw();
}
/* dibuja una lista de trazados [key, d] en un svg con % opcional en el centro de cada uno */
function ptSvg(host, shapes, vb, styleOf, textOf, titleOf, pick, fine) {
  host.innerHTML = `<svg class="ptmap pmap${fine ? ' fine' : ''}" viewBox="${vb === 'fit' ? '0 0 100 100' : vb}" role="img" aria-label="Mapa de % de voto">${shapes.map(([k, d]) => `<path d="${d}" data-k="${esc(k)}" style="${styleOf(k)}"><title>${esc(titleOf(k))}</title></path>`).join('')}<g class="ptl"></g></svg>`;
  const svg = host.querySelector('svg');
  if (vb === 'fit') { const bb = svg.getBBox(), pad = Math.max(bb.width, bb.height) * 0.02; svg.setAttribute('viewBox', `${bb.x - pad} ${bb.y - pad} ${bb.width + 2 * pad} ${bb.height + 2 * pad}`) }
  if (textOf) { const W = svg.viewBox.baseVal.width, fs = W * 0.024;
    svg.querySelector('.ptl').innerHTML = [...svg.querySelectorAll('path[data-k]')].map(p => { const b = p.getBBox(), t = textOf(p.dataset.k); return t ? `<text x="${b.x + b.width / 2}" y="${b.y + b.height / 2}" font-size="${fs}" stroke-width="${fs * 0.22}">${t}</text>` : '' }).join('') }
  svg.querySelectorAll('path[data-k]').forEach(p => p.onclick = () => pick(p.dataset.k));
}

/* ---- tooltip inmediato en los mapas (sustituye al <title> nativo, que tarda en salir) ---- */
(() => {
  let tt = null, cur = null;
  const box = () => tt || (tt = document.getElementById('tt'));
  const pos = e => { const t = box(); if (!t) return; const w = t.offsetWidth, h = t.offsetHeight; let x = e.clientX + 14, y = e.clientY + 16; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y + h > innerHeight - 8) y = e.clientY - h - 14; t.style.left = Math.max(4, x) + 'px'; t.style.top = Math.max(4, y) + 'px' };
  document.addEventListener('mouseover', e => {
    const el = e.target.closest && e.target.closest('svg#pmap path, svg#pmap rect, svg.mapsvg path, svg.mapsvg rect, svg.ptmap path, svg.ptmap rect');
    if (!el || !box()) return;
    const ti = el.querySelector(':scope > title');
    if (ti) { el.dataset.tt = ti.textContent; ti.remove() }
    if (!el.dataset.tt) return;
    cur = el; const t = box(); t.style.maxWidth = '340px'; t.textContent = el.dataset.tt; t.style.display = 'block'; pos(e);
  });
  document.addEventListener('mousemove', e => { if (cur) pos(e) });
  document.addEventListener('mouseout', e => { if (cur && !(e.relatedTarget && cur.contains(e.relatedTarget)) && e.target.closest && e.target.closest('svg') && (!e.relatedTarget || e.relatedTarget === document.documentElement || !e.relatedTarget.closest || e.relatedTarget.closest('svg#pmap path, svg#pmap rect, svg.mapsvg path, svg.mapsvg rect, svg.ptmap path, svg.ptmap rect') !== cur)) { const t = box(); if (t) t.style.display = 'none'; cur = null } });
})();

/* ---- zoom con la rueda, arrastre para desplazar y botón de restaurar vista (mapas SVG) ---- */
(function () {
  const parse = svg => (svg.getAttribute('viewBox') || '0 0 100 100').split(/[\s,]+/).map(Number);
  function st(svg) {
    if (svg.__z) return svg.__z;
    const z = svg.__z = { base: parse(svg), own: false, btn: null };
    z.set = v => { z.last = v.map(x => +x.toFixed(3)).join(' '); svg.setAttribute('viewBox', z.last); z.btn.hidden = v.every((x, k) => Math.abs(x - z.base[k]) < 1e-6) };
    new MutationObserver(() => { if (svg.getAttribute('viewBox') === z.last) return; z.base = parse(svg); z.btn.hidden = true }).observe(svg, { attributes: true, attributeFilter: ['viewBox'] });
    const host = svg.parentNode; if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const b = z.btn = document.createElement('button'); b.type = 'button'; b.className = 'zbtn'; b.hidden = true; b.textContent = '⟲ Restaurar vista'; b.title = 'Volver a la vista inicial del mapa';
    b.onclick = () => z.set(z.base.slice()); host.appendChild(b);
    return z;
  }
  const mapOf = t => t && t.closest ? t.closest('svg.natmap,svg.pmap') : null;
  document.addEventListener('wheel', e => {
    const svg = mapOf(e.target); if (!svg || !svg.getScreenCTM) return;
    e.preventDefault(); const z = st(svg), cur = parse(svg), b = z.base;
    const f = Math.pow(1.0018, e.deltaY); let w = cur[2] * f, h = cur[3] * f;
    if (w >= b[2] || h >= b[3]) { z.set(b.slice()); return }
    if (w < b[2] / 60) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    let x = p.x - (p.x - cur[0]) * f, y = p.y - (p.y - cur[1]) * f;
    z.set([x, y, w, h]);
  }, { passive: false });
  let drag = null, moved = false;
  document.addEventListener('mousedown', e => {
    if (e.button !== 0) return; const svg = mapOf(e.target); if (!svg) return; const z = st(svg);
    drag = { svg, z, x: e.clientX, y: e.clientY, v: parse(svg) }; moved = false;
  });
  window.addEventListener('mousemove', e => {
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    const v = drag.v, b = drag.z.base; if (v[2] >= b[2] - 1e-6) return;
    moved = true; const r = drag.svg.getBoundingClientRect(), k = Math.max(v[2] / r.width, v[3] / r.height);
    drag.z.set([v[0] - dx * k, v[1] - dy * k, v[2], v[3]]); drag.svg.classList.add('panning');
  });
  window.addEventListener('mouseup', () => { if (drag) drag.svg.classList.remove('panning'); drag = null });
  document.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false } }, true);
})();

/* =================== Senado: candidatos, cortes y umbrales =================== */
/* voto de cada partido en una unidad = el de su candidato más votado (vec: votos por candidato en el orden de circ.c) */
function partyV(circ, vec) { const v = new Array(NP).fill(0); circ.c.forEach((r, j) => { if (vec[j] > v[r[1]]) v[r[1]] = vec[j] }); return v }
/* umbral que garantiza k senadores a un partido con s escaños en juego y v votos por elector, aunque el resto de electores se coordine en su contra */
function guarantee(s, vmax, k) { if (k > Math.min(vmax, s)) return null; const m = s - k + 1; return Math.min(0.5, vmax / (vmax + m)) }
/* análisis de una circunscripción: candidatos ordenados, último electo, primero fuera y márgenes */
function circA(c) {
  const vb = c.vb, L = c.c.map((r, j) => ({ r, j, nm: r[0], i: r[1], v: r[2], el: !!r[3], ind: !!r[4], sh: vb ? r[2] / vb : 0 })).sort((a, b) => b.v - a.v);
  const E = L.filter(x => x.el), O = L.filter(x => !x.el), last = E[E.length - 1] || null, first = O[0] || null;
  L.forEach(x => { if (x.el) x.mg = first ? x.v - first.v : x.v; else x.mg = last ? x.v - last.v : 0 });
  const rival = last ? O.find(x => x.i !== last.i) || null : null;
  return { L, E, O, last, first, rival, vb, gap: last && first ? last.v - first.v : null };
}
const senW = n => n === 1 ? 'senador' : 'senadores';
const vEl = s => s === 4 ? 3 : s === 3 ? 2 : 1;
/* barras de voto por partido (candidato más votado) */
function senBars(sel, u, maxShow = 12) {
  const vb = u.vb, idx = u.v.map((x, i) => i).filter(i => u.v[i] > 0).sort((a, b) => u.v[b] - u.v[a]), top = idx.slice(0, maxShow);
  const mx = Math.max(0.05, Math.ceil(u.v[top[0]] / vb * 20) / 20);
  $(sel).innerHTML = top.map(i => `<div class="prow"><div class="top"><span class="nm">${swatch(i)}${esc(G.parties[i].n)}</span><span class="pc">${fmt(u.v[i] / vb)}</span></div><div class="bar"><i style="width:${u.v[i] / vb / mx * 100}%;background:${pcol(i)}"></i></div><div class="ft">${nf(u.v[i])} votos${u.es && u.es[i] ? ` · ${u.es[i]} ${senW(u.es[i])}` : ''}</div></div>`).join('')
    + `<div class="prow"><div class="top"><span class="nm"><span class="sw" style="background:var(--rule)"></span>Papeletas en blanco</span><span class="pc">${fmt(u.bl / vb)}</span></div><div class="bar"><i style="width:${u.bl / vb / mx * 100}%;background:var(--rule)"></i></div><div class="ft">${nf(u.bl)} papeletas · nulas ${nf(u.nu)}</div></div>`;
}
/* hemiciclo: lista de {i, kind:'E'|'D', ind} */
function hemiSVG(svg, seats, opts = {}) {
  const tot = seats.length, rows = tot > 230 ? 10 : 9, cx = 200, cy = 200, r0 = 78, R = 190, radii = [...Array(rows)].map((_, k) => r0 + (R - r0) * k / (rows - 1)), sr = radii.reduce((a, b) => a + b, 0);
  let cnt = radii.map(r => Math.round(tot * r / sr)); cnt[rows - 1] += tot - cnt.reduce((a, b) => a + b, 0);
  const p = []; radii.forEach((r, k) => { for (let j = 0; j < cnt[k]; j++) p.push([Math.PI - Math.PI * (cnt[k] === 1 ? .5 : j / (cnt[k] - 1)), r]) });
  p.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const rr = tot > 230 ? 3.9 : 4.4;
  svg.innerHTML = p.map((q, n) => { const s = seats[n]; if (!s) return ''; const x = (cx + q[1] * Math.cos(q[0])).toFixed(1), y = (cy - q[1] * Math.sin(q[0])).toFixed(1), t = `<title>${esc(G.parties[s.i].n)}${s.kind === 'D' ? (G.parties[s.i].k === 'REAL' ? ' · designación real' : ' · designado') : ' · electo'}${s.ind ? ' (independiente)' : ''}${s.nm ? ' · ' + esc(s.nm) : ''}</title>`;
    if (s.kind === 'D' && G.parties[s.i].k === 'REAL') { const r = rr * 1.15, X = +x, Y = +y + r * 0.1, f = v => v.toFixed(2);
      return `<path d="M${f(X - r)},${f(Y + .62 * r)}L${f(X - r)},${f(Y - .55 * r)}L${f(X - .5 * r)},${f(Y - .05 * r)}L${f(X)},${f(Y - .85 * r)}L${f(X + .5 * r)},${f(Y - .05 * r)}L${f(X + r)},${f(Y - .55 * r)}L${f(X + r)},${f(Y + .62 * r)}Z" fill="${pcol(s.i)}" stroke="var(--surface)" stroke-width=".6" stroke-linejoin="round">${t}</path>` }
    if (s.kind === 'D') return `<circle cx="${x}" cy="${y}" r="${rr - 1}" fill="var(--surface)" stroke="${pcol(s.i)}" stroke-width="2">${t}</circle>`;
    if (s.ind) return `<g><path d="M${x},${+y - rr}A${rr},${rr} 0 0 0 ${x},${+y + rr}Z" fill="var(--c-INDX)"/><path d="M${x},${+y - rr}A${rr},${rr} 0 0 1 ${x},${+y + rr}Z" fill="${pcol(s.i)}"/>${t}</g>`;
    return `<circle cx="${x}" cy="${y}" r="${rr}" fill="${pcol(s.i)}">${t}</circle>` }).join('');
}
const LEFT = ['PSP', 'IU', 'ICV', 'ECP', 'PODEMOS', 'SUMAR', 'ENMAREA', 'COMPROMIS', 'MASPAIS', 'EQUO', 'HB', 'BILDU', 'EA', 'EE', 'BNG', 'CUP', 'ERC', 'ENTESA', 'SENDEM', 'NC', 'PA', 'PSOESUMAR', 'PSOE', 'CHA', 'NABAI', 'CAMBIO', 'FA', 'ASG', 'JUNTS', 'CATSEN', 'CIU', 'PDECAT', 'PNV', 'AHI', 'CC', 'UV', 'PAR', 'PRC', 'TERUEL', 'IND', 'CS', 'UPYD', 'CDS', 'UCD', 'PP', 'FAC', 'UPN', 'NAVARRASUMA', 'SALF', 'FN', 'VOX', 'REAL'];
const seatKey = k => { const j = LEFT.indexOf(k); return j < 0 ? LEFT.indexOf('IND') : j };
