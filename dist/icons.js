// Two stroke icon sets with the same weight: UI icons on a 20px grid (drawn at
// 18px, centred in their box) and key-cap symbols on a 16px grid (drawn at 13px).
import {sortMods, keyName} from './model.js';

const KEY = {
  left_command: 'M6 6V4.5A1.5 1.5 0 1 0 4.5 6H11.5A1.5 1.5 0 1 0 10 4.5V11.5A1.5 1.5 0 1 0 11.5 10H4.5A1.5 1.5 0 1 0 6 11.5Z',
  left_shift: 'M8 2.5L13.5 8.5H10.5V13.5H5.5V8.5H2.5Z',
  left_option: 'M1.5 4.5H5.5L10.5 11.5H14.5M9.5 4.5H14.5',
  left_control: 'M3.5 10L8 5.5L12.5 10',
  up_arrow: 'M8 13.5V3M3.5 7.5L8 3L12.5 7.5',
  down_arrow: 'M8 2.5V13M3.5 8.5L8 13L12.5 8.5',
  left_arrow: 'M13.5 8H3M7.5 3.5L3 8L7.5 12.5',
  right_arrow: 'M2.5 8H13M8.5 3.5L13 8L8.5 12.5',
  return_or_enter: 'M13 3V9.5H3.5M6.5 6.5L3.5 9.5L6.5 12.5',
  delete_or_backspace: 'M5.5 3.5H14.5V12.5H5.5L1.5 8ZM8 6L11.5 9.5M11.5 6L8 9.5',
  tab: 'M1.5 8H12M8.5 4.5L12 8L8.5 11.5M14.5 4V12',
};
KEY.right_command = KEY.left_command; KEY.right_shift = KEY.left_shift; KEY.right_option = KEY.left_option; KEY.right_control = KEY.left_control;

const UI = {
  help: 'M10 2.5A7.5 7.5 0 1 0 10 17.5A7.5 7.5 0 1 0 10 2.5ZM7.6 7.9A2.4 2.4 0 1 1 11 10.1C10.4 10.4 10 10.9 10 11.6V12.2M10 14V14.6',
  options: 'M3 6H10M15 6H17M3 14H5M10 14H17M10 4H15V8H10ZM5 12H10V16H5Z',
  pencil: 'M12.5 4L16 7.5L7.5 16H4V12.5ZM10.5 6L14 9.5',
  plus: 'M10 4V16M4 10H16',
  // Clockwise and counter-clockwise turns: the arrowhead sits on the end of the arc.
  user: 'M10 3.5A3.25 3.25 0 1 0 10 10A3.25 3.25 0 1 0 10 3.5ZM4 16.5C4.8 13.6 7 12.5 10 12.5C13 12.5 15.2 13.6 16 16.5',
  code: 'M6.5 6L2.5 10L6.5 14M13.5 6L17.5 10L13.5 14M11.5 3.5L8.5 16.5',
  book: 'M10 6C8.3 4.7 6.2 4.2 3.5 4.2V15C6.2 15 8.3 15.5 10 16.8C11.7 15.5 13.8 15 16.5 15V4.2C13.8 4.2 11.7 4.7 10 6ZM10 6V16.8',
  message: 'M3.5 4.5H16.5V13.5H8L3.5 17Z',
  coffee: 'M4.5 7.5H14V12.5A4 4 0 0 1 10 16.5H8.5A4 4 0 0 1 4.5 12.5ZM14 8.5H15.25A2 2 0 0 1 15.25 12.5H14M7.5 3V5M11 3V5',
  power: 'M10 2.5V9.17M14.71 5.29A6.67 6.67 0 1 1 5.29 5.29',
  cycle: 'M16.25 7.92A6.67 6.67 0 0 0 4.17 6.25M3.75 12.08A6.67 6.67 0 0 0 15.83 13.75M16.67 2.92V7.92H11.67M3.33 17.08V12.08H8.33',
  undo: 'M7.5 4.17L3.33 8.33L7.5 12.5M4.33 8.33H12.5A4.17 4.17 0 0 1 12.5 16.67H9.17',
  redo: 'M12.5 4.17L16.67 8.33L12.5 12.5M15.67 8.33H7.5A4.17 4.17 0 0 0 7.5 16.67H10.83',
  'rotate-cw': 'M17.5 10A7.5 7.5 0 1 1 10 2.5C12.1 2.5 14.1 3.33 15.6 4.78L17.5 6.67M17.5 2.5V6.67H13.33',
  'rotate-ccw': 'M2.5 10A7.5 7.5 0 1 0 10 2.5C7.9 2.5 5.9 3.33 4.4 4.78L2.5 6.67M2.5 2.5V6.67H6.67',
  download: 'M10 3V12M5.5 8.5L10 13L14.5 8.5M3.5 16.5H16.5',
  upload: 'M10 13V4M5.5 7.5L10 3L14.5 7.5M3.5 16.5H16.5',
  copy: 'M7 7H16.5V16.5H7ZM13 7V3.5H3.5V13H7',
  reset: 'M3.5 10A6.5 6.5 0 1 0 5.4 5.4M3.5 3V7H7.5',
  mac: 'M3.5 4.5H16.5V13H3.5ZM1.5 15.5H18.5',
  start: 'M7 5L15 10L7 15Z',
  system: 'M2.5 4H17.5V13.5H2.5ZM7 16.5H13M10 13.5V16.5',
  sun: 'M10 6.5A3.5 3.5 0 1 0 10 13.5A3.5 3.5 0 1 0 10 6.5ZM10 2V3.5M10 16.5V18M2 10H3.5M16.5 10H18M4.4 4.4L5.4 5.4M14.6 14.6L15.6 15.6M4.4 15.6L5.4 14.6M14.6 5.4L15.6 4.4',
  moon: 'M16 12.5A6.5 6.5 0 1 1 7.5 4A5.2 5.2 0 0 0 16 12.5Z',
  close: 'M5 5L15 15M15 5L5 15',
  chevron: 'M6 8L10 12L14 8',
  check: 'M4.5 10.5L8 14L15.5 6',
  search: 'M9 4A5 5 0 1 0 9 14A5 5 0 1 0 9 4ZM12.6 12.6L16.5 16.5',
  // keyboard: Record shortcut (what the Mac should do)
  keyboard: 'M2.5 5.5H17.5V14.5H2.5ZM5.5 8.5H7M9.25 8.5H10.75M13 8.5H14.5M6.5 11.5H13.5',
  // remote: Re-capture (which key the remote sends)
  remote: 'M6 5.5H14A4.5 4.5 0 0 1 14 14.5H6A4.5 4.5 0 0 1 6 5.5ZM6.5 8.5V11.5M5 10H8M12.5 8.5H15V11H12.5Z',
  swap: 'M3 7H14M12 4L15 7L12 10M17 13H6M8 10L5 13L8 16',
  off: 'M10 3A7 7 0 1 0 10 17A7 7 0 1 0 10 3ZM5 5L15 15',
  trash: 'M3.5 5.5H16.5M8 5.5V3.5H12V5.5M5 5.5L5.8 16.5H14.2L15 5.5',
};

export function icon(name, cls = 'i') {
  const ui = name in UI, s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', ui ? '0 0 20 20' : '0 0 16 16');
  s.setAttribute('class', cls + (ui ? ' ui' : ' key'));
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<path d="${ui ? UI[name] : KEY[name]}"/>`;
  return s;
}

const MOD_NAME = {left_command: 'Command', left_shift: 'Shift', left_option: 'Option', left_control: 'Control'};
function cap(content, label) {
  const k = document.createElement('kbd'); k.className = 'cap';
  if (typeof content === 'string') k.textContent = content; else k.append(content);
  if (label) k.setAttribute('aria-label', label);
  return k;
}
// Key caps for a key output, e.g. ⇧ ⌘ 4 as three caps with drawn symbols.
export function keyCaps(t, extraMods = []) {
  const w = document.createElement('span'); w.className = 'caps';
  for (const m of sortMods([...(t?.modifiers || []), ...extraMods])) w.append(cap(icon(m), MOD_NAME[m] || m));
  if (t?.key_code) w.append(KEY[t.key_code] ? cap(icon(t.key_code), keyName(t.key_code)) : cap(keyName(t.key_code)));
  return w;
}
