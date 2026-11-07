// Keys the 8BitDo Zero 2 sends in keyboard mode, held flat (D-pad left, XYAB right).
export const initialLayout = {
  L: 'k', R: 'm',
  Up: 'c', Down: 'd', Left: 'e', Right: 'f',
  X: 'h', A: 'g', B: 'j', Y: 'i',
  Select: 'n', Start: 'o',
};
export const MODE_VAR = '8bitdo_mode';
// Muted hues at one lightness and chroma (OKLCH 0.52 / ~0.08), so any two sit
// well together and all keep white text above 5:1.
export const MODE_COLORS = ['#147874', '#416c98', '#84587a', '#876125', '#4b7453', '#905845', '#5f697e', '#696969'];
const OLD_COLORS = ['#13a596', '#7357e6', '#df7f0b', '#2c7be0', '#d6437c', '#3c9a4c', '#8a6d3b', '#596273',
  '#0f8f82', '#6a4fd8', '#c96f00', '#2468c4', '#c23a70', '#2f8a40', '#7d6233', '#4f5866'];
// Maps colours saved by earlier versions onto the current palette.
export const migrateColor = c => OLD_COLORS.includes(c) ? MODE_COLORS[OLD_COLORS.indexOf(c) % 8] : c;

/* ---------- action library ---------- */
const k = (key_code, ...modifiers) => ({key_code, ...(modifiers.length ? {modifiers} : {})});
const cmd = 'left_command', shift = 'left_shift', ctrl = 'left_control';
// tone colours a name where it carries meaning (Anki's own answer colours).
export const presets = [
  {id: 'anki-show', group: 'Anki', name: 'Show answer', to: k('spacebar')},
  {id: 'anki-again', group: 'Anki', name: 'Again', to: k('1'), tone: 'red'},
  {id: 'anki-hard', group: 'Anki', name: 'Hard', to: k('2'), tone: 'orange'},
  {id: 'anki-good', group: 'Anki', name: 'Good', to: k('3'), tone: 'green'},
  {id: 'anki-easy', group: 'Anki', name: 'Easy', to: k('4'), tone: 'blue'},
  {id: 'anki-undo', group: 'Anki', name: 'Undo', to: k('z', cmd)},
  {id: 'anki-bury', group: 'Anki', name: 'Bury card', to: k('hyphen')},
  {id: 'anki-suspend', group: 'Anki', name: 'Suspend note', to: k('2', shift)},
  {id: 'anki-edit', group: 'Anki', name: 'Edit note', to: k('e')},
  {id: 'anki-replay', group: 'Anki', name: 'Replay audio', to: k('r')},
  {id: 'anki-flag', group: 'Anki', name: 'Red flag', to: k('1', ctrl), tone: 'red'},
  {id: 'anki-mark', group: 'Anki', name: 'Mark note', to: k('8', shift)},

  {id: 'video-play', group: 'Video', name: 'Play / pause', to: k('spacebar')},
  {id: 'video-back5', group: 'Video', name: 'Back 5 s', to: k('left_arrow')},
  {id: 'video-fwd5', group: 'Video', name: 'Forward 5 s', to: k('right_arrow')},
  {id: 'video-back10', group: 'Video', name: 'Back 10 s (YouTube)', to: k('j')},
  {id: 'video-fwd10', group: 'Video', name: 'Forward 10 s (YouTube)', to: k('l')},
  {id: 'video-full', group: 'Video', name: 'Full screen', to: k('f')},
  {id: 'video-mute', group: 'Video', name: 'Mute', to: k('m')},
  {id: 'video-cc', group: 'Video', name: 'Captions', to: k('c')},
  {id: 'video-faster', group: 'Video', name: 'Faster', to: k('period', shift)},
  {id: 'video-slower', group: 'Video', name: 'Slower', to: k('comma', shift)},

  {id: 'slides-next', group: 'Slides', name: 'Next slide', to: k('right_arrow')},
  {id: 'slides-prev', group: 'Slides', name: 'Previous slide', to: k('left_arrow')},
  {id: 'slides-start', group: 'Slides', name: 'Start presenting', to: k('return_or_enter', cmd)},
  {id: 'slides-black', group: 'Slides', name: 'Black screen', to: k('b')},

  {id: 'media-play', group: 'Media keys', name: 'Play / pause', to: {consumer_key_code: 'play_or_pause'}},
  {id: 'media-next', group: 'Media keys', name: 'Next track', to: {consumer_key_code: 'scan_next_track'}},
  {id: 'media-prev', group: 'Media keys', name: 'Previous track', to: {consumer_key_code: 'scan_previous_track'}},
  {id: 'media-volup', group: 'Media keys', name: 'Volume up', to: {consumer_key_code: 'volume_increment'}},
  {id: 'media-voldown', group: 'Media keys', name: 'Volume down', to: {consumer_key_code: 'volume_decrement'}},
  {id: 'media-mute', group: 'Media keys', name: 'Mute', to: {consumer_key_code: 'mute'}},
  {id: 'media-brightup', group: 'Media keys', name: 'Brightness up', to: {consumer_key_code: 'display_brightness_increment'}},
  {id: 'media-brightdown', group: 'Media keys', name: 'Brightness down', to: {consumer_key_code: 'display_brightness_decrement'}},

  {id: 'mouse-up', group: 'Mouse', name: 'Scroll up', to: {mouse_key: {vertical_wheel: -32}}},
  {id: 'mouse-down', group: 'Mouse', name: 'Scroll down', to: {mouse_key: {vertical_wheel: 32}}},
  {id: 'mouse-left', group: 'Mouse', name: 'Scroll left', to: {mouse_key: {horizontal_wheel: 32}}},
  {id: 'mouse-right', group: 'Mouse', name: 'Scroll right', to: {mouse_key: {horizontal_wheel: -32}}},
  {id: 'mouse-click', group: 'Mouse', name: 'Left click', to: {pointing_button: 'button1'}},
  {id: 'mouse-rclick', group: 'Mouse', name: 'Right click', to: {pointing_button: 'button2'}},

  {id: 'app-undo', group: 'Apps', name: 'Undo', to: k('z', cmd)},
  {id: 'app-redo', group: 'Apps', name: 'Redo', to: k('z', cmd, shift)},
  {id: 'app-copy', group: 'Apps', name: 'Copy', to: k('c', cmd)},
  {id: 'app-paste', group: 'Apps', name: 'Paste', to: k('v', cmd)},
  {id: 'app-back', group: 'Apps', name: 'Back', to: k('open_bracket', cmd)},
  {id: 'app-forward', group: 'Apps', name: 'Forward', to: k('close_bracket', cmd)},
  {id: 'app-nexttab', group: 'Apps', name: 'Next tab', to: k('tab', ctrl)},
  {id: 'app-prevtab', group: 'Apps', name: 'Previous tab', to: k('tab', ctrl, shift)},
  {id: 'app-closetab', group: 'Apps', name: 'Close tab', to: k('w', cmd)},
  {id: 'app-reload', group: 'Apps', name: 'Reload', to: k('r', cmd)},
  {id: 'app-switch', group: 'Apps', name: 'Switch app', to: k('tab', cmd)},
  {id: 'app-mission', group: 'Apps', name: 'Mission Control', to: {apple_vendor_keyboard_key_code: 'mission_control'}},
  {id: 'app-shot', group: 'Apps', name: 'Screenshot area', to: k('4', cmd, shift)},

  {id: 'key-up', group: 'Keys', name: 'Up arrow', to: k('up_arrow')},
  {id: 'key-down', group: 'Keys', name: 'Down arrow', to: k('down_arrow')},
  {id: 'key-left', group: 'Keys', name: 'Left arrow', to: k('left_arrow')},
  {id: 'key-right', group: 'Keys', name: 'Right arrow', to: k('right_arrow')},
  {id: 'key-space', group: 'Keys', name: 'Space', to: k('spacebar')},
  {id: 'key-return', group: 'Keys', name: 'Return', to: k('return_or_enter')},
  {id: 'key-esc', group: 'Keys', name: 'Escape', to: k('escape')},
  {id: 'key-tab', group: 'Keys', name: 'Tab', to: k('tab')},
  {id: 'key-delete', group: 'Keys', name: 'Delete', to: k('delete_or_backspace')},
  {id: 'key-pgup', group: 'Keys', name: 'Page up', to: k('page_up')},
  {id: 'key-pgdn', group: 'Keys', name: 'Page down', to: k('page_down')},
  {id: 'key-home', group: 'Keys', name: 'Home', to: k('home')},
  {id: 'key-end', group: 'Keys', name: 'End', to: k('end')},
];
export const GROUPS = [...new Set(presets.map(p => p.group))];
// Groups whose names are unambiguous in any mode. Plain keys like "3" only get
// a name (Good) when the mode is named after that group.
const GENERIC = new Set(['Media keys', 'Mouse', 'Apps']);

const canon = t => JSON.stringify(Object.keys(t).sort().map(key => [key, Array.isArray(t[key]) ? [...t[key]].sort() : t[key]]));
export const sameOutput = (a, b) => !!a && !!b && canon(a) === canon(b);

// What a manipulator's `to` does: {kind, text, preset?, mode?}.
// kind: none | off | mode | preset | key | other
export function describe(to, {modeName = '', hint, modes = []} = {}) {
  if (!to) return {kind: 'none', text: 'Not mapped'};
  if (to.length !== 1) return {kind: 'other', text: 'Key sequence'};
  const t = to[0];
  if (t.set_variable) { const i = t.set_variable.value; return {kind: 'mode', mode: i, text: `Switch to ${modes[i]?.name ?? 'mode ' + (i + 1)}`}; }
  if (t.key_code === 'vk_none') return {kind: 'off', text: 'Does nothing'};
  const mn = modeName.trim().toLowerCase();
  const p = presets.find(p => p.id === hint && sameOutput(p.to, t))
    || presets.find(p => sameOutput(p.to, t) && p.group.toLowerCase() === mn)
    || presets.find(p => sameOutput(p.to, t) && GENERIC.has(p.group));
  if (p) return {kind: 'preset', text: p.name, preset: p};
  if (t.key_code) return {kind: 'key', text: keyText(t)};
  return {kind: 'other', text: 'Imported action'};
}

/* ---------- keys ---------- */
export const MOD_ORDER = ['left_control', 'left_option', 'left_shift', 'left_command'];
const MOD_TEXT = {left_command: '⌘', left_shift: '⇧', left_option: '⌥', left_control: '⌃', right_command: '⌘', right_shift: '⇧', right_option: '⌥', right_control: '⌃'};
const KEYNAME = {spacebar: 'Space', hyphen: '-', equal_sign: '=', return_or_enter: 'Return', escape: 'Esc', tab: 'Tab',
  delete_or_backspace: 'Delete', delete_forward: 'Fwd Del', up_arrow: '↑', down_arrow: '↓', left_arrow: '←', right_arrow: '→',
  open_bracket: '[', close_bracket: ']', backslash: '\\', semicolon: ';', quote: "'", comma: ',', period: '.', slash: '/',
  grave_accent_and_tilde: '`', caps_lock: 'Caps', page_up: 'Page Up', page_down: 'Page Down', home: 'Home', end: 'End'};
export const keyName = code => KEYNAME[code] || code.toUpperCase();
export const sortMods = mods => [...(mods || [])].sort((a, b) => MOD_ORDER.indexOf(a) - MOD_ORDER.indexOf(b));
export const keyText = t => t?.key_code ? [...sortMods(t.modifiers).map(m => MOD_TEXT[m] || m), keyName(t.key_code)].join(' ') : '';

/* ---------- rules ---------- */
const modeOf = m => m.conditions?.find(c => c.type === 'variable_if' && c.name === MODE_VAR);
export function findRule(state, key, mode) { return state.rule.manipulators.find(m => m.from?.key_code === key && modeOf(m)?.value === mode); }
export function assign(state, button, key) {
  const old = state.layout[button];
  const taken = Object.entries(state.layout).find(([b, k]) => b !== button && k === key);
  if (taken) throw Error(`${key.toUpperCase()} already belongs to ${taken[0]}, so re-capture ${taken[0]} first`);
  for (const m of state.rule.manipulators) if (m.from?.key_code === old) m.from.key_code = key;
  state.layout[button] = key;
}
export function setOutput(state, key, mode, to) {
  const m = findRule(state, key, mode);
  if (!to) { state.rule.manipulators = state.rule.manipulators.filter(x => x !== m); return; }
  if (m) { m.to = to; return; }
  state.rule.manipulators.push({type: 'basic', from: {key_code: key}, to, conditions: [
    {type: 'device_if', identifiers: [{vendor_id: state.vendor, product_id: state.product}]},
    {type: 'variable_if', name: MODE_VAR, value: mode}]});
}

/* ---------- modes ---------- */
const cleanName = s => String(s).replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 24);
// A button cycles when, in every mode, it switches to the next (or previous)
// mode. With two modes a plain toggle counts as cycling forward, so adding a
// third mode extends it instead of leaving the new mode with no way out.
const switchTarget = (state, key, i) => {
  const to = findRule(state, key, i)?.to;
  const sv = to?.length === 1 && to[0].set_variable;
  return sv?.name === MODE_VAR ? sv.value : null;
};
export function cycleOf(state, key) {
  const n = state.modes.length;
  if (n < 2) return null;
  for (const [dir, step] of [['next', 1], ['prev', n - 1]])
    if (state.modes.every((_, i) => switchTarget(state, key, i) === (i + step) % n)) return dir;
  return null;
}
export function setCycle(state, key, dir) {
  const n = state.modes.length, step = dir === 'prev' ? n - 1 : 1;
  for (let i = 0; i < n; i++) setOutput(state, key, i, [{set_variable: {name: MODE_VAR, value: (i + step) % n}}]);
}
const cyclingKeys = state => [...new Set(state.rule.manipulators.map(m => m.from?.key_code))].map(k => [k, cycleOf(state, k)]).filter(([, d]) => d);

export function addMode(state, name) {
  const cycles = cyclingKeys(state);
  const used = new Set(state.modes.map(m => m.color));
  state.modes.push({name: cleanName(name) || `Mode ${state.modes.length + 1}`, color: MODE_COLORS.find(c => !used.has(c)) || MODE_COLORS[state.modes.length % MODE_COLORS.length]});
  for (const [k, d] of cycles) setCycle(state, k, d);
  return state.modes.length - 1;
}
export function renameMode(state, i, name) { state.modes[i].name = cleanName(name) || state.modes[i].name; }
// Removes mode i: its mappings go, later modes shift down, and buttons that
// switched to it stop switching.
export function removeMode(state, i) {
  if (state.modes.length < 2) throw Error('Keep at least one mode');
  const cycles = cyclingKeys(state);
  state.rule.manipulators = state.rule.manipulators.filter(m => modeOf(m)?.value !== i && m.to?.[0]?.set_variable?.value !== i);
  for (const m of state.rule.manipulators) {
    const c = modeOf(m); if (c && c.value > i) c.value--;
    const sv = m.to?.[0]?.set_variable; if (sv?.name === MODE_VAR && sv.value > i) sv.value--;
  }
  state.modes.splice(i, 1);
  if (state.modes.length > 1) for (const [k, d] of cycles) setCycle(state, k, d);
}

/* ---------- import / export ---------- */
// Karabiner can show the mode on screen when a button switches it: briefly
// (cleared after a moment or at the next press), always, or not at all.
export const NOTIFY_ID = 'padmap.mode', NOTIFY_MS = 1200;
export const modeLabel = name => /\bmode\b/i.test(name) ? name : `${name} mode`;
export function exportConfig(state, device = '8BitDo Zero 2') {
  const rule = structuredClone(state.rule), notify = state.notify || 'off';
  delete rule.enabled;
  if (notify !== 'off') for (const m of rule.manipulators) {
    const sv = m.to.length === 1 && m.to[0].set_variable;
    if (sv?.name !== MODE_VAR || !state.modes[sv.value]) continue;
    m.to.push({set_notification_message: {id: NOTIFY_ID, text: modeLabel(state.modes[sv.value].name)}});
    if (notify === 'brief') {
      const clear = [{set_notification_message: {id: NOTIFY_ID, text: ''}}];
      m.to_delayed_action = {to_if_invoked: clear, to_if_canceled: structuredClone(clear)};
      m.parameters = {...m.parameters, 'basic.to_delayed_action_delay_milliseconds': NOTIFY_MS};
    }
  }
  rule.description = `Pad Map: ${device} (${state.modes.map(m => m.name).join(', ')})`;
  for (const m of rule.manipulators) for (const c of m.conditions || []) if (c.type === 'device_if') c.identifiers = [{vendor_id: state.vendor, product_id: state.product}];
  return {title: `Pad Map: ${device}`, rules: [rule]};
}
function modeNames(description = '', count) {
  const fromParens = description.match(/\(([^)]*)\)\s*$/)?.[1].split(',').map(s => s.trim());
  const fromSlash = description.match(/:\s*(.+?)\s+mode toggle\s*$/i)?.[1].split('/').map(s => s.trim());
  const names = [fromParens, fromSlash].find(n => n?.length === count && n.every(Boolean));
  return names || Array.from({length: count}, (_, i) => `Mode ${i + 1}`);
}
// Takes the mode messages back out, so each manipulator's `to` is just its action.
function stripNotify(rule) {
  let notify = 'off';
  for (const m of rule.manipulators || []) {
    if (!Array.isArray(m.to) || !m.to.some(t => t.set_notification_message?.id === NOTIFY_ID)) continue;
    m.to = m.to.filter(t => t.set_notification_message?.id !== NOTIFY_ID);
    notify = m.to_delayed_action ? 'brief' : notify === 'brief' ? 'brief' : 'always';
    delete m.to_delayed_action;
    if (m.parameters) { delete m.parameters['basic.to_delayed_action_delay_milliseconds']; if (!Object.keys(m.parameters).length) delete m.parameters; }
  }
  return notify;
}
export function parseImport(data) {
  const rule = structuredClone(data.rules?.[0] || data);
  const notify = stripNotify(rule);
  if (!Array.isArray(rule.manipulators) || !rule.manipulators.length) throw Error('Choose a Karabiner rule or a file with a rules array');
  if (data.rules?.length > 1) throw Error('Import one rule at a time to avoid dropping additional rules');
  if (!rule.manipulators.every(m => m.type === 'basic' && m.from?.key_code && Array.isArray(m.to) && Number.isInteger(modeOf(m)?.value) && modeOf(m).value >= 0))
    throw Error(`This editor supports keyboard rules that use the ${MODE_VAR} variable, like the bundled example`);
  const device = rule.manipulators.flatMap(m => m.conditions || []).find(c => c.type === 'device_if')?.identifiers?.[0];
  if (!device || !Number.isInteger(device.vendor_id) || !Number.isInteger(device.product_id)) throw Error('The rule needs numeric vendor and product IDs');
  const count = Math.max(1, ...rule.manipulators.flatMap(m => [modeOf(m).value + 1, (m.to[0]?.set_variable?.value ?? -1) + 1]));
  const modes = modeNames(rule.description, count).map((name, i) => ({name: cleanName(name), color: MODE_COLORS[i % MODE_COLORS.length]}));
  const layout = {...initialLayout}, known = new Set(Object.values(layout));
  let i = 1;
  for (const m of rule.manipulators) if (!known.has(m.from.key_code)) { layout['Extra ' + i++] = m.from.key_code; known.add(m.from.key_code); }
  return {rule, layout, modes, hints: {}, vendor: device.vendor_id, product: device.product_id, notify};
}
export function eventKey(e) {
  if (/^Key[A-Z]$/.test(e.code)) return e.code.slice(3).toLowerCase();
  if (/^Digit\d$/.test(e.code)) return e.code.slice(5);
  if (/^F\d+$/.test(e.code)) return e.code.toLowerCase();
  return {Space: 'spacebar', Enter: 'return_or_enter', NumpadEnter: 'return_or_enter', Escape: 'escape', Tab: 'tab', Backspace: 'delete_or_backspace', Delete: 'delete_forward',
    ArrowUp: 'up_arrow', ArrowDown: 'down_arrow', ArrowLeft: 'left_arrow', ArrowRight: 'right_arrow', Minus: 'hyphen', Equal: 'equal_sign',
    BracketLeft: 'open_bracket', BracketRight: 'close_bracket', Backslash: 'backslash', Semicolon: 'semicolon', Quote: 'quote', Comma: 'comma',
    Period: 'period', Slash: 'slash', Backquote: 'grave_accent_and_tilde', PageUp: 'page_up', PageDown: 'page_down', Home: 'home', End: 'end'}[e.code] || null;
}
export const eventMods = e => [e.ctrlKey && 'left_control', e.altKey && 'left_option', e.shiftKey && 'left_shift', e.metaKey && 'left_command'].filter(Boolean);
