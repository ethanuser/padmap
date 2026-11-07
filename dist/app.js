import {presets, GROUPS, describe, keyName, keyText, assign, setOutput, exportConfig, parseImport, findRule, eventKey, eventMods,
  addMode, renameMode, removeMode, cycleOf, setCycle, MODE_VAR, MODE_COLORS, migrateColor, sameOutput} from './model.js';
import {zero2 as pad} from './controllers.js';
import {icon, keyCaps} from './icons.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const STORE = 'padmap-v3', ROT = 'padmap-rotation', THEME = 'padmap-theme';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
};
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const retrigger = (node, cls) => { if (!node) return; node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- state ---------- */
const example = await fetch('example.json').then(r => r.json());
const fresh = () => ({...parseImport(example), notify: 'brief'});
let state = fresh();
try {
  const saved = JSON.parse(store.get(STORE));
  if (saved?.rule && saved.layout && Array.isArray(saved.modes) && Number.isInteger(saved.vendor)) { parseImport(saved.rule); state = {hints: {}, notify: 'brief', ...saved}; }
  else {
    // Earlier versions: keep their mappings, take the current default button layout.
    const old = JSON.parse(store.get('padmap-v2') || store.get('padmap-v1') || store.get('clickshift-v1'));
    if (old?.rule) state = {...parseImport(old.rule), vendor: old.vendor ?? state.vendor, product: old.product ?? state.product};
  }
} catch {}
state.modes.forEach(m => m.color = migrateColor(m.color));
let mode = Math.min(1, state.modes.length - 1), selected = 'A', capturing = false, recording = false, heard = false, typing = false;

function toast(t) {
  $('#toast').textContent = t; $('#toast').classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 3200);
}
// Every change goes through save(), which keeps the state from before it.
// Each step remembers the mode and button it was made on, so undoing shows it.
// Changes with the same tag made close together (typing a mode name) are one step.
const hist = {undo: [], redo: [], last: JSON.stringify(state), tag: '', at: 0};
function save(tag = '') {
  const json = JSON.stringify(state), now = Date.now();
  if (json !== hist.last) {
    if (!(tag && tag === hist.tag && now - hist.at < 1500)) {
      hist.undo.push({json: hist.last, mode, selected});
      if (hist.undo.length > 200) hist.undo.shift();
    }
    hist.redo = []; hist.last = json; hist.tag = tag; hist.at = now;
    paintHistory();
  }
  if (!store.set(STORE, json)) toast('Browser storage is unavailable, so export the JSON to keep your changes');
}
function paintHistory() { $('#undo').disabled = !hist.undo.length; $('#redo').disabled = !hist.redo.length; }
function stepHistory(back) {
  const from = back ? hist.undo : hist.redo, to = back ? hist.redo : hist.undo, e = from.pop();
  if (!e) return;
  to.push({json: JSON.stringify(state), mode: e.mode, selected: e.selected});
  state = JSON.parse(e.json); hist.last = e.json; hist.tag = '';
  mode = Math.min(e.mode, state.modes.length - 1); selected = e.selected;
  capturing = recording = false; slotKey = '';
  store.set(STORE, e.json); closePop(); buildModes(); render(); paintHistory();
  retrigger(document.querySelector(`.slot[data-button="${selected}"]`), 'flash');
  toast(back ? 'Undone' : 'Redone');
}
const buttonName = n => pad.buttons[n] ? `${n} button` : n;
const hintKey = (m, n) => `${m}|${n}`;
const ruleFor = name => findRule(state, state.layout[name], mode);
const cycleFor = name => state.modes.length > 2 ? cycleOf(state, state.layout[name]) : null;
function descFor(name) {
  const d = describe(ruleFor(name)?.to, {modeName: state.modes[mode].name, hint: state.hints[hintKey(mode, name)], modes: state.modes});
  if (d.kind === 'none' && pad.buttons[name]?.power) return {kind: 'power', text: pad.buttons[name].power};
  if (d.kind === 'mode' && (d.cycle = cycleFor(name))) d.text = `${d.cycle === 'next' ? 'Next' : 'Previous'} mode, ${state.modes[d.mode]?.name}`;
  return d;
}

/* ---------- static icons ---------- */
const putIcon = (sel, name) => $(sel)?.prepend(icon(name));
putIcon('#undo', 'undo'); putIcon('#redo', 'redo'); putIcon('#guide', 'help'); putIcon('#options', 'options'); putIcon('#export .ic', 'download'); putIcon('#edit-mode', 'pencil'); putIcon('#add-mode', 'plus');
putIcon('#rotate-ccw', 'rotate-ccw'); putIcon('#rotate-cw', 'rotate-cw'); putIcon('#close-modal', 'close');
putIcon('#capture .ic', 'remote'); putIcon('#record .ic', 'keyboard'); putIcon('#picker-btn .chev', 'chevron');
$$('.ed-label .ic[data-icon]').forEach(n => n.append(icon(n.dataset.icon)));
// A mode's name always appears as a filled box in that mode's colour.
function modeChip(i) {
  const c = el('span', 'mode-chip', state.modes[i]?.name ?? 'deleted mode');
  if (state.modes[i]) c.style.setProperty('--chip', state.modes[i].color);
  return c;
}

/* ---------- button glyphs ---------- */
const tri = {Up: 'M12 5.5l6.5 10h-13z', Down: 'M12 18.5l-6.5-10h13z', Left: 'M5.5 12l10-6.5v13z', Right: 'M18.5 12l-10 6.5v-13z'};
function glyph(name) {
  const kind = pad.buttons[name]?.kind, s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'g'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML =
    kind === 'dpad' ? `<circle cx="12" cy="12" r="11.5"/><path class="gi" d="${tri[name]}"/>` :
    kind === 'face' ? `<circle cx="12" cy="12" r="11.5"/><text x="12" y="12.5">${name}</text>` :
    kind === 'shoulder' ? `<path class="solid" d="${name === 'L' ? 'M1 21V10Q1 3 8 3H23V21Z' : 'M23 21V10Q23 3 16 3H1V21Z'}"/><text x="${name === 'L' ? 13 : 11}" y="12.5">${name}</text>` :
    kind === 'small' ? `<circle cx="12" cy="12" r="11.5"/><path class="gs" d="${name === 'Start' ? 'M6.5 12h11M12 6.5v11' : 'M6.5 12h11'}"/>` :
    `<rect x="1" y="1" width="22" height="22"/><text x="12" y="12.5">?</text>`;
  return s;
}
// What an output does, as nodes: a coloured name, key caps, or a mode switch.
function actionNodes(name, {withKeys = false} = {}) {
  const d = descFor(name), to = ruleFor(name)?.to, out = [];
  if (d.kind === 'key') out.push(keyCaps(to[0]));
  else if (d.kind === 'mode') {
    const s = el('span', 'modeswitch');
    s.append(icon(d.cycle ? 'cycle' : 'swap'), el('span', 'txt', d.cycle ? (d.cycle === 'next' ? 'Next' : 'Previous') : 'Switch to'), modeChip(d.mode));
    out.push(s);
  }
  else if (d.kind === 'off' || d.kind === 'power') { const s = el('span', 'modeswitch'); s.append(icon(d.kind), d.text); out.push(s); }
  else out.push(el('span', d.preset?.tone ? 'tone-' + d.preset.tone : '', d.text));
  if (withKeys && d.kind === 'preset' && d.preset.to.key_code) out.push(keyCaps(d.preset.to));
  return {d, nodes: out};
}

/* ---------- controller drawing and rotation ---------- */
$('#pad').innerHTML = `<svg role="img" aria-label="${pad.name}"><g id="padg">${pad.svg}</g></svg>`;
let theta = [0, 90, 180, 270].includes(+store.get(ROT)) ? +store.get(ROT) : 0, rotFrame;
// Letters and the − / + marks stay upright however the controller is turned.
const uprights = $$('#padg text, #padg .stroke').map(n => {
  const b = pad.buttons[n.closest('[data-button]').dataset.button];
  return [n, n.tagName === 'text' ? +n.getAttribute('x') : b.x, n.tagName === 'text' ? +n.getAttribute('y') : b.y];
});
// Fit the drawing at angle `deg` inside the fixed pad box: the box never changes
// size, so nothing around it moves when the controller turns.
function padTransform(deg = theta) {
  const svg = $('#pad svg'), cw = svg.clientWidth, ch = svg.clientHeight;
  if (!cw || !ch) return;
  const [W0, H0] = pad.extent, upp = Math.max(W0 / cw, H0 / ch), VW = cw * upp, VH = ch * upp;
  svg.setAttribute('viewBox', `${pad.cx - VW / 2} ${pad.cy - VH / 2} ${VW} ${VH}`);
  const a = deg * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
  const k = Math.min(1, VW / (W0 * c + H0 * s), VH / (W0 * s + H0 * c));
  $('#padg').setAttribute('transform', `translate(${pad.cx} ${pad.cy}) rotate(${deg}) scale(${k}) translate(${-pad.cx} ${-pad.cy})`);
  for (const [n, x, y] of uprights) n.setAttribute('transform', `rotate(${-deg} ${x} ${y})`);
}
function rotateTo(target, done) {
  cancelAnimationFrame(rotFrame);
  const from = theta, start = performance.now(), dur = reduced() ? 0 : 420;
  const step = now => {
    const t = dur ? Math.min(1, (now - start) / dur) : 1, e = 1 - Math.pow(1 - t, 3);
    theta = from + (target - from) * e; padTransform(); drawLeaders();
    // the ease-out has done ~94% of the turn by 60% of the time, so show the lines then
    if (t >= .6) lsvg.classList.remove('moving');
    if (t < 1) rotFrame = requestAnimationFrame(step); else done?.();
  };
  rotFrame = requestAnimationFrame(step);
}
const turn = dir => {
  const next = Math.round(theta / 90) * 90 + 90 * dir;
  store.set(ROT, String(((next % 360) + 360) % 360));
  lsvg.classList.add('moving');
  applyPlan(planFor(next), true);
  rotateTo(next, () => { drawLeaders(); lsvg.classList.remove('moving'); });
};
$('#rotate-cw').onclick = () => turn(1);
$('#undo').onclick = () => stepHistory(true);
$('#redo').onclick = () => stepHistory(false);
$('#rotate-ccw').onclick = () => turn(-1);

/* ---------- leader lines ---------- */
// Lines run under the buttons: a mask cut out in the shape of every button
// hides any part of a line that crosses one, so no symbol is ever covered.
const lsvg = $('#leaders');
lsvg.innerHTML = `<defs><mask id="lmask" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">
  <rect x="-5000" y="-5000" width="10000" height="10000" fill="#fff"/><g id="lmask-shapes" fill="#000" stroke="#000" stroke-width="5"></g></mask></defs>
  <g id="llines" mask="url(#lmask)"></g>`;
// Shapes go in drawing order; the body is cut back in (white) so the parts of
// the shoulder buttons hidden behind it don't hide lines crossing the body.
$$('#padg .cap, #padg .dpad-base, #padg .body').forEach(n => {
  const c = n.cloneNode(); c.removeAttribute('class'); n.maskClone = c;
  if (n.classList.contains('body')) { c.setAttribute('fill', '#fff'); c.setAttribute('stroke', 'none'); }
  $('#lmask-shapes').append(c);
});
function relMatrix() {
  const st = $('#stage').getBoundingClientRect();
  lsvg.setAttribute('viewBox', `0 0 ${st.width} ${st.height}`);
  return lsvg.getScreenCTM().inverse().multiply($('#padg').getScreenCTM());
}
const through = (m, [x, y]) => { const p = new DOMPoint(x, y).matrixTransform(m); return [p.x, p.y]; };
const kneeX = (x1, tx) => x1 + (tx - x1) * .3;
function drawLeaders() {
  if (getComputedStyle(lsvg).display === 'none') return;
  const st = $('#stage').getBoundingClientRect(), rel = relMatrix();
  $('#lmask-shapes').setAttribute('transform', `matrix(${rel.a} ${rel.b} ${rel.c} ${rel.d} ${rel.e} ${rel.f})`);
  const g = $('#llines'), seen = new Set();
  for (const slot of $$('.slot[data-side]')) {
    const n = slot.dataset.button, b = pad.buttons[n], r = slot.getBoundingClientRect(), left = slot.dataset.side === 'left';
    const pts = [...(plan.via[n] || []), [b.x, b.y]].map(p => through(rel, p));
    const x1 = (left ? r.right - 2 : r.left + 2) - st.left, y1 = r.top + r.height / 2 - st.top;
    let line = g.querySelector(`[data-for="${n}"]`);
    if (!line) { line = document.createElementNS(NS, 'polyline'); line.dataset.for = n; g.append(line); }
    line.setAttribute('points', [[x1, y1], [kneeX(x1, pts[0][0]), y1], ...pts].map(p => p.join(',')).join(' '));
    line.classList.toggle('sel', n === selected);
    if (n === selected) g.append(line); // highlighted line on top
    seen.add(n);
  }
  g.querySelectorAll('polyline').forEach(l => { if (!seen.has(l.dataset.for)) l.remove(); });
}

/* ---------- which box goes where, per orientation ---------- */
// Flat and upside down use the hand-tuned order in the controller definition
// (upside down is the same picture turned, so the columns swap and reverse).
// Sideways views are planned: try every split of buttons into the two columns,
// pick entry points around each button, and keep the arrangement whose lines
// cross each other and pass under other buttons the least.
const planCache = {};
function planFor(deg) {
  const r = ((Math.round(deg / 90) * 90) % 360 + 360) % 360;
  const via = Object.fromEntries(Object.entries(pad.buttons).map(([n, b]) => [n, b.via || []]));
  if (r === 0) return {left: pad.columns[0], right: pad.columns[1], via};
  if (r === 180) return {left: [...pad.columns[1]].reverse(), right: [...pad.columns[0]].reverse(), via};
  return planCache[r] ||= autoPlan(r);
}
function autoPlan(deg) {
  const saved = theta;
  padTransform(deg); const rel = relMatrix(); padTransform(saved);
  const scale = Math.hypot(rel.a, rel.b), st = $('#stage').getBoundingClientRect();
  const starts = side => [...$(`#col-${side}`).children].map(s => {
    const c = $(`#col-${side}`).getBoundingClientRect();
    return [(side === 'left' ? c.right : c.left) - st.left, c.top - st.top + s.offsetTop + s.offsetHeight / 2];
  });
  const slots = [...starts('left').map(p => ({p, side: 'left'})), ...starts('right').map(p => ({p, side: 'right'}))];
  const nL = $('#col-left').children.length;
  const names = Object.keys(pad.buttons).filter(n => n in state.layout);
  const obs = pad.obstacles.map(([x, y, r, owner]) => { const [cx, cy] = through(rel, [x, y]); return {cx, cy, r: r * scale, owner}; });
  const ownR = n => Math.max(...pad.obstacles.filter(o => o[3] === n).map(o => o[2]));
  const dirs = [null, ...Array.from({length: 8}, (_, i) => [Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)])];
  const hitsCircle = (a, b, o) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((o.cx - a[0]) * dx + (o.cy - a[1]) * dy) / L)) : 0;
    const px = a[0] + t * dx - o.cx, py = a[1] + t * dy - o.cy;
    return px * px + py * py < o.r * o.r;
  };
  const cross = (a, b, c, d) => {
    const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  // Best route from each slot to each button: {cost, segs, via}.
  const route = {};
  slots.forEach((s, i) => names.forEach(n => {
    const b = pad.buttons[n], anchor = through(rel, [b.x, b.y]);
    let best = null;
    for (const d of dirs) {
      const viaPad = d && [b.x + d[0] * (ownR(n) + 10), b.y + d[1] * (ownR(n) + 10)];
      const p0 = viaPad ? through(rel, viaPad) : anchor, k = [kneeX(s.p[0], p0[0]), s.p[1]];
      const segs = viaPad ? [[s.p, k], [k, p0], [p0, anchor]] : [[s.p, k], [k, anchor]];
      let cost = viaPad ? 1 : 0;
      segs.forEach(([a, c]) => obs.forEach(o => { if (o.owner !== n && hitsCircle(a, c, o)) cost += 10; }));
      cost += (Math.hypot(k[0] - s.p[0], 0) + Math.hypot(p0[0] - k[0], p0[1] - k[1])) * .004;
      if (!best || cost < best.cost) best = {cost, segs: segs.slice(0, 2), via: viaPad ? [viaPad] : []};
    }
    route[i + '|' + n] = best;
  }));
  const evaluate = order => { // order[i] = button in slot i
    let cost = 0;
    const rs = order.map((n, i) => route[i + '|' + n]);
    rs.forEach(r => cost += r.cost);
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++)
      for (const [a, b] of rs[i].segs) for (const [c, d] of rs[j].segs) if (cross(a, b, c, d)) cost += 6;
    return cost;
  };
  const anchorY = n => through(rel, [pad.buttons[n].x, pad.buttons[n].y])[1];
  let best = null;
  const pickL = (start, chosen) => {
    if (chosen.length === nL) {
      const L = [...chosen].sort((a, b) => anchorY(a) - anchorY(b));
      const R = names.filter(n => !chosen.includes(n)).sort((a, b) => anchorY(a) - anchorY(b));
      const order = [...L, ...R], cost = evaluate(order);
      if (!best || cost < best.cost) best = {cost, order};
      return;
    }
    for (let i = start; i <= names.length - (nL - chosen.length); i++) pickL(i + 1, [...chosen, names[i]]);
  };
  pickL(0, []);
  // Polish with swaps until nothing improves.
  for (let improved = true; improved;) {
    improved = false;
    for (let i = 0; i < best.order.length; i++) for (let j = i + 1; j < best.order.length; j++) {
      const o = [...best.order]; [o[i], o[j]] = [o[j], o[i]];
      const c = evaluate(o);
      if (c < best.cost - 1e-6) { best = {cost: c, order: o}; improved = true; }
    }
  }
  const via = {};
  best.order.forEach((n, i) => via[n] = route[i + '|' + n].via);
  return {left: best.order.slice(0, nL), right: best.order.slice(nL), via};
}

/* ---------- mapping boxes ---------- */
let slotKey = '', plan = planFor(0);
function buildSlots() {
  const key = Object.keys(state.layout).join();
  if (key === slotKey) return;
  slotKey = key;
  const make = n => {
    const b = el('button', 'slot'); b.dataset.button = n;
    b.append(glyph(n), el('span', 'act'), el('span', 'out'));
    b.onclick = () => pick(n);
    return b;
  };
  const extra = Object.keys(state.layout).filter(n => !pad.buttons[n]);
  const onPad = Object.keys(state.layout).filter(n => pad.buttons[n]).map(make);
  $('#col-left').replaceChildren(...onPad.slice(0, pad.columns[0].length));
  $('#col-right').replaceChildren(...onPad.slice(pad.columns[0].length));
  $('#extras').hidden = !extra.length; $('#extras').replaceChildren(...extra.map(make));
  applyPlan(planFor(theta), false);
}
// Put each box in its planned place; when animated, boxes glide from where they were.
function applyPlan(next, animate) {
  plan = next;
  const slots = new Map($$('#col-left .slot, #col-right .slot').map(s => [s.dataset.button, s]));
  const before = new Map([...slots].map(([n, s]) => [n, s.getBoundingClientRect()]));
  const place = (side, names) => $(`#col-${side}`).append(...names.filter(n => slots.has(n)).map(n => { const s = slots.get(n); s.dataset.side = side; return s; }));
  place('left', next.left); place('right', next.right);
  if (!animate || reduced()) return;
  for (const [n, s] of slots) {
    const a = before.get(n), b = s.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
    if (dx || dy) s.animate([{transform: `translate(${dx}px, ${dy}px)`}, {transform: 'none'}], {duration: 420, easing: 'cubic-bezier(0.2, 0, 0, 1)'});
  }
}
function fillSlot(b) {
  const n = b.dataset.button, {d, nodes} = actionNodes(n);
  b.dataset.kind = d.kind;
  b.classList.toggle('sel', n === selected);
  b.setAttribute('aria-pressed', String(n === selected));
  b.setAttribute('aria-label', `${buttonName(n)}: ${d.text}`);
  b.querySelector('.act').replaceChildren(...nodes);
  b.querySelector('.out').replaceChildren(d.kind === 'preset' && d.preset.to.key_code ? keyCaps(d.preset.to) : '');
}
function pick(name) { selected = name; capturing = recording = false; render(); }

/* ---------- modes ---------- */
function buildModes() {
  const wrap = $('#modes');
  wrap.querySelectorAll('.tab').forEach(t => t.remove());
  state.modes.forEach((m, i) => {
    const t = el('button', 'tab'); t.setAttribute('role', 'tab'); t.dataset.i = i; t.style.setProperty('--c', m.color);
    t.append(el('span', 'sw'), el('span', '', m.name));
    if (i === 0) { t.append(icon('start', 'i start')); t.dataset.tip = 'The remote starts in this mode'; }
    t.onclick = () => setMode(i);
    wrap.append(t);
  });
}
function fillModes() {
  document.documentElement.style.setProperty('--mode', state.modes[mode].color);
  const tabs = $$('#modes .tab');
  tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === mode)); t.tabIndex = i === mode ? 0 : -1; });
  const cur = tabs[mode], thumb = $('#modes .thumb'), wrap = $('#modes');
  if (cur) {
    // The fill spans the whole strip and is clipped to the selected tab, so at the
    // first and last tab it meets the frame exactly instead of by a rounded width.
    thumb.style.width = wrap.scrollWidth > wrap.clientWidth + 1 ? wrap.scrollWidth + 'px' : '100%';
    const t = thumb.getBoundingClientRect(), r = cur.getBoundingClientRect();
    const sep = tabs[mode + 1] ? parseFloat(getComputedStyle(tabs[mode + 1]).borderLeftWidth) : 0;
    const L = mode === 0 ? 0 : r.left - t.left, R = mode === tabs.length - 1 ? 0 : Math.max(0, t.right - r.right - sep);
    thumb.style.clipPath = `inset(0 ${R}px 0 ${L}px)`;
  }

}
function setMode(i) {
  if (i === mode) return;
  mode = i; closePop(); retrigger($('#stage'), 'swap'); render();
}
$('#modes').addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  setMode((mode + (e.key === 'ArrowRight' ? 1 : -1) + state.modes.length) % state.modes.length);
  $$('#modes .tab')[mode].focus();
});
$('#add-mode').onclick = () => {
  const i = addMode(state, `Mode ${state.modes.length + 1}`);
  save(); buildModes(); setMode(i); openModeEditor(true);
};
$('#edit-mode').onclick = () => openModeEditor(false);
function openModeEditor(fresh) {
  const pop = $('#pop'), m = state.modes[mode];
  pop.className = 'pop form'; pop.replaceChildren();
  const nameLabel = el('label', '', 'Name'), name = el('input'); name.value = m.name; name.maxLength = 24; nameLabel.append(name);
  name.oninput = () => { renameMode(state, mode, name.value); save('rename' + mode); buildModes(); render(); };
  const colors = el('div', 'swatches'); colors.setAttribute('role', 'radiogroup'); colors.setAttribute('aria-label', 'Colour');
  MODE_COLORS.forEach(c => {
    const s = el('button'); s.style.setProperty('--c', c); s.setAttribute('role', 'radio'); s.setAttribute('aria-label', c); s.setAttribute('aria-checked', String(c === m.color));
    s.onclick = () => { m.color = c; save(); buildModes(); render(); colors.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === s))); };
    colors.append(s);
  });
  const colorLabel = el('label', '', 'Colour'); colorLabel.append(colors);
  const row = el('div', 'row');
  const del = el('button', 'quiet danger'); del.append(icon('trash'), 'Delete mode');
  del.disabled = state.modes.length < 2;
  del.onclick = () => {
    if (!del.classList.contains('confirm')) { del.classList.add('confirm'); del.lastChild.textContent = 'Click again to delete'; return; }
    deleteMode(mode);
  };
  const done = el('button', 'primary', 'Done'); done.onclick = () => closePop(true);
  row.append(del, done);
  pop.append(nameLabel, colorLabel);
  if (mode === 0) pop.append(el('p', 'note', 'The remote starts in this mode'));
  pop.append(row);
  showPop($('#edit-mode'));
  name.focus(); if (fresh) name.select();
  name.onkeydown = e => { if (e.key === 'Enter') closePop(true); };
}
function deleteMode(i) {
  const name = state.modes[i].name;
  removeMode(state, i);
  const hints = {};
  for (const [k, v] of Object.entries(state.hints)) { const [m, n] = k.split('|'); if (+m < i) hints[k] = v; else if (+m > i) hints[hintKey(+m - 1, n)] = v; }
  state.hints = hints;
  mode = Math.min(i, state.modes.length - 1);
  save(); closePop(); buildModes(); render(); toast(`Deleted ${name}`);
}

/* ---------- popover ---------- */
let popAnchor = null;
function showPop(anchor, {minWidth = 0} = {}) {
  const pop = $('#pop'), r = anchor.getBoundingClientRect();
  popAnchor = anchor; anchor.setAttribute('aria-expanded', 'true');
  pop.hidden = false; pop.style.top = pop.style.bottom = ''; pop.style.left = ''; pop.style.width = '';
  if (minWidth) pop.style.width = Math.max(r.width, minWidth) + 'px';
  const w = pop.offsetWidth, bannerH = $('#banner').offsetHeight;
  pop.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
  const below = innerHeight - bannerH - r.bottom - 12, above = r.top - 12;
  if (below >= Math.min(300, pop.scrollHeight) || below >= above) { pop.style.top = r.bottom + 4 + 'px'; pop.style.maxHeight = Math.min(420, below) + 'px'; }
  else { pop.style.bottom = innerHeight - r.top + 4 + 'px'; pop.style.maxHeight = Math.min(420, above) + 'px'; }
  retrigger(pop, 'opening');
}
function closePop(refocus) {
  const pop = $('#pop');
  if (pop.hidden) return;
  pop.hidden = true;
  popAnchor?.setAttribute('aria-expanded', 'false');
  if (refocus) popAnchor?.focus();
  popAnchor = null;
}
document.addEventListener('pointerdown', e => { if (!$('#pop').hidden && !$('#pop').contains(e.target) && !popAnchor?.contains(e.target)) closePop(); });
$('#pop').addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); closePop(true); } });

/* ---------- action picker ---------- */
function pickerOptions() {
  const key = state.layout[selected], d = descFor(selected), opts = [];
  opts.push({group: '', id: '@record', name: 'Record a shortcut from your keyboard', special: true, icon: 'keyboard'});
  if (d.kind === 'key' || d.kind === 'other') opts.push({group: 'Current', id: '@current', name: d.kind === 'key' ? 'Custom shortcut' : d.text, to: ruleFor(selected).to[0]});
  if (state.modes.length > 2) for (const dir of ['next', 'prev'])
    opts.push({group: 'Modes', id: '@' + dir, name: `${dir === 'next' ? 'Next' : 'Previous'} mode`, cycle: dir, sub: `cycles all ${state.modes.length}`});
  state.modes.forEach((m, i) => { if (i !== mode) opts.push({group: 'Modes', id: '@mode' + i, name: `Switch to ${m.name}`, chip: i, to: {set_variable: {name: MODE_VAR, value: i}}}); });
  const mn = state.modes[mode].name.toLowerCase();
  [...GROUPS].sort((a, b) => (b.toLowerCase() === mn) - (a.toLowerCase() === mn))
    .forEach(g => presets.filter(p => p.group === g).forEach(p => opts.push({group: g, id: p.id, name: p.name, tone: p.tone, to: p.to, preset: p})));
  opts.push({group: 'Other', id: '@none', name: `Not mapped, types ${keyName(key)}`}, {group: 'Other', id: '@off', name: 'Does nothing', icon: 'off', to: {key_code: 'vk_none'}});
  return opts;
}
function currentId() {
  const d = descFor(selected);
  return {none: '@none', power: '@none', off: '@off', mode: d.cycle ? '@' + d.cycle : '@mode' + d.mode, preset: d.preset?.id, key: '@current', other: '@current'}[d.kind];
}
function openPicker() {
  const pop = $('#pop'); pop.className = 'pop'; pop.replaceChildren();
  const search = el('div', 'search'), input = el('input');
  input.placeholder = 'Search actions or keys'; input.setAttribute('aria-label', 'Search actions');
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-controls', 'picker-list'); input.setAttribute('aria-expanded', 'true');
  search.append(icon('search'), input);
  const list = el('div', 'list'); list.id = 'picker-list'; list.setAttribute('role', 'listbox');
  pop.append(search, list);
  const all = pickerOptions(), cur = currentId();
  let items = [], active = 0;
  const setActive = (i, scroll = true) => {
    active = i; items.forEach((x, j) => x.row.classList.toggle('active', j === i));
    if (items[i]) { input.setAttribute('aria-activedescendant', items[i].row.id); if (scroll) items[i].row.scrollIntoView({block: 'nearest'}); }
  };
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    list.replaceChildren(); items = [];
    let last = null;
    for (const o of all.filter(o => !q || o.special || [o.name, o.group, o.to?.key_code ? keyText(o.to) : ''].some(s => s.toLowerCase().includes(q)))) {
      if (o.group !== last) { if (o.group) list.append(el('div', 'grp eyebrow', o.group)); last = o.group; }
      const row = el('div', 'opt' + (o.special ? ' special' : ''));
      row.id = 'opt-' + items.length; row.setAttribute('role', 'option'); row.setAttribute('aria-selected', String(o.id === cur));
      const tick = el('span', 'tick'); if (o.id === cur) tick.append(icon('check'));
      row.append(tick);
      if (o.icon) row.append(icon(o.icon));
      if (o.cycle) { row.append(icon('cycle')); const nm = el('span', 'nm', o.name); nm.append(el('span', 'sub', o.sub)); row.append(nm); }
      else if (o.chip != null) { row.append(icon('swap')); const nm = el('span', 'nm modeswitch', 'Switch to'); nm.append(modeChip(o.chip)); row.append(nm); }
      else row.append(el('span', 'nm' + (o.tone ? ' tone-' + o.tone : ''), o.name));
      if (o.to?.key_code && o.to.key_code !== 'vk_none') row.append(keyCaps(o.to));
      const idx = items.length;
      row.onpointermove = () => { if (active !== idx) setActive(idx, false); };
      row.onclick = () => choose(o);
      list.append(row); items.push({o, row});
    }
    if (items.length < 2) list.append(el('div', 'empty', 'Nothing matches, so record the shortcut instead'));
    const at = items.findIndex(x => x.o.id === cur);
    setActive(q ? Math.min(1, items.length - 1) : Math.max(0, at));
  };
  input.oninput = draw;
  input.onkeydown = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(items.length - 1, active + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, active - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (items[active]) choose(items[active].o); }
  };
  pop.hidden = false; draw();
  showPop($('#picker-btn'), {minWidth: 320});
  items[active]?.row.scrollIntoView({block: 'nearest'});
  input.focus();
}
function choose(o) {
  closePop(o.id !== '@record');
  if (o.id === '@record') return startRecord();
  if (o.id === '@current') return;
  const key = state.layout[selected];
  if (o.cycle) {
    setCycle(state, key, o.cycle);
    state.modes.forEach((_, i) => delete state.hints[hintKey(i, selected)]);
    save(); render(); retrigger(document.querySelector(`.slot[data-button="${selected}"]`), 'flash');
    return toast(`${buttonName(selected)} now steps through all ${state.modes.length} modes`);
  }
  setOutput(state, key, mode, o.id === '@none' ? null : [structuredClone(o.to)]);
  if (o.preset) state.hints[hintKey(mode, selected)] = o.id; else delete state.hints[hintKey(mode, selected)];
  save(); render();
  retrigger(document.querySelector(`.slot[data-button="${selected}"]`), 'flash');
}
$('#picker-btn').onclick = () => $('#pop').hidden || popAnchor !== $('#picker-btn') ? openPicker() : closePop();
$('#picker-btn').addEventListener('keydown', e => { if (e.key === 'ArrowDown' && $('#pop').hidden) { e.preventDefault(); openPicker(); } });

/* ---------- editor ---------- */
function fillEditor() {
  $('#ed-glyph').replaceChildren(glyph(selected));
  $('#ed-name').textContent = buttonName(selected);
  $('#input-key').textContent = keyName(state.layout[selected]);
  $('#ed-mode').textContent = state.modes[mode].name;
  const {d, nodes} = actionNodes(selected, {withKeys: true});
  if (d.kind === 'none') nodes.splice(0, nodes.length, el('span', 'muted', `Not mapped, types ${keyName(state.layout[selected])}`));
  $('#picker-value').replaceChildren(...nodes);
  const cap = $('#capture'), rec = $('#record');
  cap.classList.toggle('on', capturing); rec.classList.toggle('on', recording);
  if (!cap.classList.contains('done')) cap.querySelector('.lbl').textContent = capturing ? 'Press it now' : 'Re-capture';
  if (!rec.classList.contains('done')) rec.querySelector('.lbl').textContent = recording ? 'Press keys now' : 'Record shortcut';
  for (const b of [cap, rec]) b.setAttribute('aria-label', b.querySelector('.lbl').textContent);
}
function flashDone(btn, text) {
  btn.classList.add('done'); btn.querySelector('.ic').replaceChildren(icon('check')); btn.querySelector('.lbl').textContent = text;
  clearTimeout(btn.timer);
  btn.timer = setTimeout(() => { btn.classList.remove('done'); btn.querySelector('.ic').replaceChildren(icon(btn.dataset.icon)); fillEditor(); }, 1500);
}
$('#capture').onclick = () => { capturing = !capturing; recording = false; render(); };
$('#record').onclick = () => (recording ? stopRecord() : startRecord());
function startRecord() { recording = true; capturing = false; render(); }
function stopRecord() { recording = false; render(); }

function render() {
  if (!state.layout[selected]) selected = Object.keys(state.layout)[0];
  if (!state.modes[mode]) mode = 0;
  const focused = document.activeElement?.closest?.('.slot')?.dataset.button;
  buildSlots();
  $$('.slot').forEach(fillSlot);
  if (focused) document.querySelector(`.slot[data-button="${focused}"]`)?.focus({preventScroll: true});
  $$('#pad [data-button]').forEach(g => g.classList.toggle('sel', g.dataset.button === selected));
  fillModes();
  fillEditor();
  idleBanner();
  requestAnimationFrame(drawLeaders);
}

/* ---------- status banner ---------- */
function banner(kind, title, sub, last) {
  const b = $('#banner'); b.dataset.state = kind;
  $('#bn-title').textContent = title; $('#bn-sub').textContent = sub;
  if (last) $('#bn-last').replaceChildren(...last);
}
function idleBanner() {
  if (capturing) return banner('capture', `Press the ${buttonName(selected)} on your remote`, 'Its key becomes this button\'s remote key, Esc cancels');
  if (recording) return banner('capture', `Press the shortcut ${buttonName(selected)} should send`, 'Hold any modifiers, then the key, Esc cancels. Browser shortcuts like ⌘W are in the list instead');
  if (!document.hasFocus()) return banner('paused', 'Not listening', 'Click anywhere on this page to listen for your remote');
  if (typing) return banner('paused', 'Paused while you type', 'Leave the text field to listen again');
  if ($('#banner').dataset.state === 'warn') return;
  if (heard) banner('ok', 'Listening, remote connected', 'Keys arrive straight from the remote, so Karabiner is not remapping it');
  else banner('listening', 'Listening', 'Press any button on your remote');
}
function press(name, on) {
  $$(`#pad [data-button="${name}"], .slot[data-button="${name}"]`).forEach(n => n.classList.toggle('pressed', on));
  const kind = pad.buttons[name]?.kind;
  if (kind === 'shoulder') $(`#pad [data-button="${name}"] .cap`).maskClone?.setAttribute('transform', on ? 'translate(0 5)' : '');
  if (kind === 'dpad') { held[on ? 'add' : 'delete'](name); tiltTo(); }
}
function releaseAll() { $$('.pressed').forEach(n => n.classList.remove('pressed')); $$('#pad .b.shoulder .cap').forEach(c => c.maskClone?.setAttribute('transform', '')); held.clear(); tiltTo(); }

/* ---------- D-pad tilt ---------- */
// Holding a direction tips the D-pad toward it: each point is turned about the
// centre in 3D and drawn in perspective, so the held arm sinks and narrows and
// the opposite arm rises. Holding two directions tips it diagonally.
const held = new Set(), DIR = {Up: [0, -1], Down: [0, 1], Left: [-1, 0], Right: [1, 0]};
const tiltShapes = $$('#padg [data-pts]').map(n => ({n, pts: n.dataset.pts.split(' ').map(p => p.split(',').map(Number))}));
let tilt = [0, 0], tiltFrame;
function drawTilt([tx, ty]) {
  const a = Math.hypot(tx, ty), [cx, cy] = pad.dpadCenter, V = 240;
  const dx = a ? tx / a : 0, dy = a ? ty / a : 0, cos = Math.cos(a), sin = Math.sin(a);
  for (const {n, pts} of tiltShapes) {
    const d = 'M' + pts.map(([x, y]) => {
      const px = x - cx, py = y - cy, s = px * dx + py * dy, k = V / (V + s * sin), along = s * cos - s;
      return [cx + k * (px + along * dx), cy + k * (py + along * dy)].map(v => +v.toFixed(2)).join(' ');
    }).join('L') + 'Z';
    n.setAttribute('d', d); n.maskClone?.setAttribute('d', d);
  }
}
function tiltTo() {
  let [x, y] = [...held].reduce(([x, y], n) => [x + DIR[n][0], y + DIR[n][1]], [0, 0]);
  const len = Math.hypot(x, y), A = 0.36;
  const target = len ? [x / len * A, y / len * A] : [0, 0], from = [...tilt], start = performance.now(), dur = reduced() ? 0 : 90;
  cancelAnimationFrame(tiltFrame);
  const step = now => {
    const t = dur ? Math.min(1, (now - start) / dur) : 1, e = 1 - Math.pow(1 - t, 3);
    tilt = [from[0] + (target[0] - from[0]) * e, from[1] + (target[1] - from[1]) * e]; drawTilt(tilt);
    if (t < 1) tiltFrame = requestAnimationFrame(step);
  };
  tiltFrame = requestAnimationFrame(step);
}
const arrow = () => el('span', 'arrow', '→');

addEventListener('keydown', e => {
  if ($('#modal').open || !$('#pop').hidden || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
  const key = eventKey(e), mods = eventMods(e);

  if (recording) {
    e.preventDefault();
    if (e.key === 'Escape' && !mods.length) return stopRecord();
    if (!key) { $('#bn-last').replaceChildren(keyCaps(null, mods)); return; } // modifiers held so far
    if (e.repeat) return;
    const to = {key_code: key, ...(mods.length ? {modifiers: mods} : {})};
    setOutput(state, state.layout[selected], mode, [to]);
    delete state.hints[hintKey(mode, selected)];
    recording = false; save(); render();
    $('#bn-last').replaceChildren(el('span', 'lbl', 'Recorded'), keyCaps(to));
    flashDone($('#record'), 'Recorded'); retrigger(document.querySelector(`.slot[data-button="${selected}"]`), 'flash');
    return;
  }
  if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.code === 'KeyZ' || (e.code === 'KeyY' && !e.shiftKey))) {
    e.preventDefault(); if (!e.repeat) stepHistory(e.code === 'KeyZ' && !e.shiftKey);
    return;
  }
  if (capturing) {
    if (e.key === 'Escape') { capturing = false; render(); return; }
    if (!key || mods.length) return;
    e.preventDefault(); if (e.repeat) return;
    try { assign(state, selected, key); save(); flashDone($('#capture'), `Captured ${keyName(key)}`); }
    catch (err) { toast(err.message); }
    capturing = false; render(); return;
  }
  if (!key || key === 'tab' || key === 'escape') return;

  const entry = !mods.length && Object.entries(state.layout).find(([, k]) => k === key);
  if (entry) {
    e.preventDefault(); if (e.repeat) return;
    heard = true; selected = entry[0];
    const to = ruleFor(selected)?.to, sv = to?.[0]?.set_variable;
    const shown = actionNodes(selected).nodes;
    if (sv?.name === MODE_VAR && state.modes[sv.value]) { mode = sv.value; retrigger($('#stage'), 'swap'); }
    $('#banner').dataset.state = 'ok';
    render();
    banner('ok', 'Listening, remote connected', 'Keys arrive straight from the remote, so Karabiner is not remapping it',
      [keyCaps({key_code: key}), arrow(), glyph(selected), el('span', 'lbl', buttonName(selected)), arrow(), ...shown]);
    retrigger($('#banner'), 'hit'); press(selected, true);
    return;
  }
  // Not a raw remote key: does it look like something Karabiner sends for it?
  const hit = state.rule.manipulators.find(m => m.to?.[0]?.key_code && sameOutput({key_code: key, ...(mods.length ? {modifiers: mods} : {})}, m.to[0]));
  if (hit) {
    const btn = Object.keys(state.layout).find(n => state.layout[n] === hit.from.key_code);
    banner('warn', 'Karabiner is remapping your remote', 'Turn its rule off in Karabiner while you set up here, then back on',
      [keyCaps(hit.to[0]), el('span', 'lbl', `is what ${btn ? buttonName(btn) : hit.from.key_code} sends`)]);
    retrigger($('#banner'), 'hit');
  } else if (!mods.length) {
    banner('warn', 'Not one of this remote\'s keys', 'If your remote sent it, select the button and use Re-capture', [keyCaps({key_code: key})]);
    retrigger($('#banner'), 'hit');
    clearTimeout(idleBanner.timer);
    idleBanner.timer = setTimeout(() => { if ($('#banner').dataset.state === 'warn' && !hit) { $('#banner').dataset.state = ''; idleBanner(); } }, 4000);
  }
});
addEventListener('keyup', e => {
  const key = eventKey(e), entry = key && Object.entries(state.layout).find(([, k]) => k === key);
  if (entry) press(entry[0], false); else if (!key) releaseAll();
});
addEventListener('blur', () => { releaseAll(); capturing = recording = false; fillEditor(); idleBanner(); });
addEventListener('focus', idleBanner);
document.addEventListener('focusin', e => { typing = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) && !e.target.closest('.pop'); idleBanner(); });
document.addEventListener('focusout', () => { typing = false; setTimeout(idleBanner); });
new ResizeObserver(() => { padTransform(); drawLeaders(); fillModes(); }).observe($('#stage'));
$$('#pad [data-button]').forEach(g => {
  g.addEventListener('click', () => pick(g.dataset.button));
  g.addEventListener('pointerdown', () => press(g.dataset.button, true));
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) g.addEventListener(ev, () => g.classList.contains('pressed') && press(g.dataset.button, false));
});

/* ---------- tooltips ---------- */
const tip = $('#tip');
let tipTimer, warmUntil = 0;
function showTip(target) {
  // An open dialog sits in the top layer, so a tip for something inside it must live inside it too.
  const host = target.closest('dialog[open]') || document.body;
  if (tip.parentNode !== host) host.append(tip);
  tip.replaceChildren(target.dataset.tip);
  if (target.dataset.keys) { const k = target.dataset.keys.split(' '); tip.append(keyCaps({key_code: k.pop(), modifiers: k})); }
  tip.hidden = false;
  const r = target.getBoundingClientRect(), t = tip.getBoundingClientRect();
  tip.style.left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - 8) + 'px';
  tip.style.top = (r.bottom + 6 + t.height > innerHeight ? r.top - t.height - 6 : r.bottom + 6) + 'px';
}
function hideTip() { clearTimeout(tipTimer); if (!tip.hidden) warmUntil = Date.now() + 400; tip.hidden = true; }
document.addEventListener('pointerover', e => {
  const t = e.target.closest('[data-tip]'); if (!t || e.pointerType === 'touch') return;
  clearTimeout(tipTimer); tipTimer = setTimeout(() => showTip(t), Date.now() < warmUntil ? 0 : 450);
});
document.addEventListener('pointerout', e => { const t = e.target.closest('[data-tip]'); if (t && !t.contains(e.relatedTarget)) { clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 80); } });
document.addEventListener('focusin', e => { const t = e.target.closest?.('[data-tip]'); if (t?.matches(':focus-visible')) showTip(t); });
document.addEventListener('focusout', hideTip);
document.addEventListener('pointerdown', hideTip);

/* ---------- dialogs ---------- */
function modal(title, html) {
  capturing = recording = false; hideTip(); closePop();
  $('#modal-title').textContent = title; $('#modal-body').innerHTML = html;
  $$('#modal-body [data-ic]').forEach(b => b.prepend(icon(b.dataset.ic)));
  $('#modal').showModal(); $('#modal').focus();
}
$('#close-modal').onclick = () => $('#modal').close();
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) $('#modal').close(); });
$('#modal').addEventListener('close', render);
function confirmOn(button, text) {
  const original = [...button.childNodes];
  button.replaceChildren(icon('check'), text);
  clearTimeout(button.timer); button.timer = setTimeout(() => button.replaceChildren(...original), 1600);
}

// Inline references to controls show the same icon as the control itself.
const ref = (ic, text = '') => `<span class="ref${text ? '' : ' only'}" data-ic="${ic}">${text}</span>`;
$('#guide').onclick = () => modal('How it works', `<ol class="guide">
  <li><strong>Connect the remote</strong> to your Mac over Bluetooth in keyboard mode. The bar at the bottom shows whether this page hears it.</li>
  <li><strong>Pause Karabiner's rule</strong> for the remote while you set up, so this page gets the remote's own keys. If the rule is still on, the bar turns amber.</li>
  <li><strong>Pick a button</strong> by pressing it on the remote or clicking it here. Choose an action from the list, or use ${ref('keyboard', 'Record shortcut')} and press any key combination.</li>
  <li><strong>Add modes</strong> with ${ref('plus')} to give each button more jobs. In every mode, set one button to ${ref('swap', 'Switch to')} another mode. The remote starts in the mode marked ${ref('start')}.</li>
  <li><strong>Fix a wrong button</strong> if pressing one highlights another here: select the right one and use ${ref('remote', 'Re-capture')}.</li>
  <li><strong>Add it to Karabiner.</strong> Choose ${ref('download', 'Export')} then ${ref('copy', 'Copy')}. In Karabiner-Elements Settings, open Complex Modifications and click Add your own rule.
    <img class="shot" src="guide/step-add.webp" width="900" height="170" alt="Karabiner-Elements Settings with Complex Modifications selected in the sidebar (1) and the Add your own rule button (2)">
    Select all the example text, paste over it and click Save. Then switch the new rule on.
    <img class="shot" src="guide/step-save.webp" width="1000" height="257" alt="Karabiner's rule editor with the example text (3) and the Save button (4)">
    <p class="note">You can also Download the file, put it in <code>~/.config/karabiner/assets/complex_modifications/</code> and use Add predefined rule.</p></li>
</ol>`);

// The row of links at the bottom of Options: who made it, the code, docs, feedback.
const LINKS = [
  ['user', 'https://github.com/ethanuser', 'Made by Ethan Nguyen'],
  ['code', 'https://github.com/ethanuser/padmap', 'Source code on GitHub'],
  ['book', 'https://karabiner-elements.pqrs.org/docs/json/', 'Karabiner JSON reference'],
  ['message', 'https://forms.gle/bjfMxpALeZdQ8KvK8', 'Suggest improvements'],
  ['coffee', 'https://buymeacoffee.com/ethannguyen', 'Buy me a coffee'],
];
$('#options').onclick = () => {
  modal('Options', `
    <div class="opt-section"><h3>Appearance</h3>
      <div class="seg" role="radiogroup" aria-label="Theme" id="theme-seg"><span class="thumb"></span>
        <button role="radio" data-v="system" data-ic="system" data-tip="Match system" aria-label="Match system"></button><button role="radio" data-v="light" data-ic="sun" data-tip="Light" aria-label="Light"></button><button role="radio" data-v="dark" data-ic="moon" data-tip="Dark" aria-label="Dark"></button></div></div>
    <div class="opt-section"><h3>Show the mode on screen</h3>
      <p class="note">When a button switches modes, Karabiner can show the mode's name in the corner of the screen</p>
      <div class="seg text" role="radiogroup" aria-label="Show the mode on screen" id="notify-seg"><span class="thumb"></span>
        <button role="radio" data-v="brief" data-tip="Shows the new mode for about a second">Briefly</button><button role="radio" data-v="always" data-tip="Keeps the current mode on screen">Always</button><button role="radio" data-v="off">Off</button></div></div>
    <div class="opt-section"><h3>Device</h3>
      <p class="note">Exported rules only apply to this ${pad.name}. Find its IDs in Karabiner-EventViewer under Devices</p>
      <div class="ids"><label>Vendor ID<input id="vendor" type="number" min="0" max="65535"></label><label>Product ID<input id="product" type="number" min="0" max="65535"></label></div></div>
    <div class="opt-section"><h3>Mappings</h3>
      <p class="note">Saved in this browser only</p>
      <div class="dialog-actions"><button id="import-btn" data-ic="upload">Import JSON</button><button id="reset-btn" class="danger" data-ic="reset">Reset to example</button></div></div>
    <div class="opt-section links">${LINKS.map(([ic, href, tip]) => `<a class="icon" href="${href}" target="_blank" rel="noopener" data-ic="${ic}" data-tip="${tip}" aria-label="${tip}"></a>`).join('')}</div>`);
  segmented($('#theme-seg'), () => store.get(THEME) || 'system', v => { store.set(THEME, v); applyTheme(); });
  segmented($('#notify-seg'), () => state.notify || 'off', v => { state.notify = v; save(); });
  $('#vendor').value = state.vendor; $('#product').value = state.product;
  ['vendor', 'product'].forEach(k => $('#' + k).onchange = () => {
    const input = $('#' + k), n = Number(input.value);
    if (!input.value || !Number.isInteger(n) || n < 0 || n > 65535) { toast('Enter a device ID between 0 and 65535'); input.value = state[k]; return; }
    state[k] = n; save(); toast('Device ID saved');
  });
  $('#import-btn').onclick = () => $('#file').click();
  $('#reset-btn').onclick = () => {
    const b = $('#reset-btn');
    if (!b.classList.contains('confirm')) { b.classList.add('confirm'); b.lastChild.textContent = 'Click again to replace your mappings'; return; }
    state = fresh(); mode = 1; selected = 'A'; slotKey = ''; save(); buildModes(); render(); $('#modal').close(); toast('Example restored');
  };
};
// A segmented control: one thumb slides to the chosen option.
function segmented(seg, get, set) {
  const btns = [...seg.querySelectorAll('button')], thumb = seg.querySelector('.thumb');
  const paint = () => {
    const i = Math.max(0, btns.findIndex(b => b.dataset.v === get()));
    btns.forEach((b, j) => b.setAttribute('aria-checked', String(j === i)));
    thumb.style.width = btns[i].offsetWidth + 'px'; thumb.style.transform = `translateX(${btns[i].offsetLeft}px)`;
  };
  btns.forEach(b => b.onclick = () => { set(b.dataset.v); paint(); });
  paint();
}
function applyTheme() { const t = store.get(THEME); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }

$('#export').onclick = () => {
  const cfg = exportConfig(state, pad.name);
  modal('Export Karabiner JSON', `<p>One rule with all ${state.modes.length} modes, for vendor ${state.vendor} and product ${state.product} (change these in Options). Copy it into Karabiner's Add your own rule, or download it as a rule file.</p>
    <textarea id="json-output" readonly aria-label="Generated Karabiner JSON"></textarea>
    <div class="dialog-actions" style="margin-top:12px"><button class="primary" id="download" data-ic="download">Download</button><button id="copy" data-ic="copy">Copy</button></div>`);
  $('#json-output').value = JSON.stringify(cfg.rules[0], null, 2);
  $('#download').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(cfg, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = `pad-map-${pad.id}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); confirmOn($('#download'), 'Downloaded');
  };
  $('#copy').onclick = async () => {
    try { await navigator.clipboard.writeText($('#json-output').value); confirmOn($('#copy'), 'Copied'); }
    catch { $('#json-output').select(); toast('Select the JSON and copy it manually'); }
  };
};

$('#file').onchange = async () => {
  try {
    const f = $('#file').files[0]; if (!f) return;
    if (f.size > 1000000) throw Error('Choose a JSON file under 1 MB');
    state = parseImport(JSON.parse(await f.text())); mode = 0; selected = 'A'; slotKey = ''; save(); buildModes(); render();
    $('#modal').close(); toast('Imported, now press each button to check it lands in the right place');
  } catch (err) { toast(err.message); }
  $('#file').value = '';
};

// Only when it is clearly a phone: a mobile browser with touch and no mouse or trackpad.
const NOTE = 'padmap-phone-note';
const phone = (navigator.userAgentData?.mobile || /iPhone|iPod|Android.+Mobile|Windows Phone/.test(navigator.userAgent))
  && matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
if (phone && !store.get(NOTE)) {
  $('#phone-note').hidden = false;
  putIcon('#phone-note .ic', 'mac'); putIcon('#phone-close', 'close');
  $('#phone-close').onclick = () => { store.set(NOTE, '1'); $('#phone-note').hidden = true; };
}

applyTheme();
paintHistory();
buildModes();
padTransform();
render();
