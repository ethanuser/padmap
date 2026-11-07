import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseImport, exportConfig, assign, setOutput, findRule, eventKey, describe, initialLayout, addMode, removeMode, keyText, cycleOf, setCycle} from '../dist/model.js';

const example = JSON.parse(fs.readFileSync(new URL('../dist/example.json', import.meta.url)));

test('example roundtrip preserves all actions and both mode toggles', () => {
  const s = parseImport(example), out = exportConfig(s);
  assert.deepEqual(out.rules[0].manipulators, example.manipulators);
  assert.equal(out.rules[0].enabled, undefined);
  assert.equal(findRule(s, 'n', 0).to[0].set_variable.value, 1);
  assert.equal(findRule(s, 'n', 1).to[0].set_variable.value, 0);
});

test('mode names come from the description and survive export', () => {
  const s = parseImport(example);
  assert.deepEqual(s.modes.map(m => m.name), ['Video', 'Anki']);
  const again = parseImport(exportConfig(s));
  assert.deepEqual(again.modes.map(m => m.name), ['Video', 'Anki']);
});

test('calibration updates both modes and rejects collisions', () => {
  const s = parseImport(example);
  assign(s, 'A', 'p');
  assert.equal(findRule(s, 'p', 1).to[0].key_code, '2');
  assert.equal(findRule(s, 'p', 0).to[0].key_code, 'w');
  assert.throws(() => assign(s, 'B', 'p'), /already belongs to A/);
});

test('custom outputs remain device and mode scoped', () => {
  const s = parseImport(example);
  setOutput(s, 'l', 1, [{key_code: 'x', modifiers: ['left_command']}]);
  assert.equal(findRule(s, 'l', 0), undefined);
  s.vendor = 123;
  const out = exportConfig(s);
  assert.ok(out.rules[0].manipulators.every(m => m.conditions.find(c => c.type === 'device_if').identifiers[0].vendor_id === 123));
  setOutput(s, 'l', 1, null);
  assert.equal(findRule(s, 'l', 1), undefined);
});

test('adding and removing modes renumbers rules and switches', () => {
  const s = parseImport(example);
  const slides = addMode(s, 'Slides (main), deck');
  assert.equal(s.modes[slides].name, 'Slides main deck');
  setOutput(s, 'h', slides, [{key_code: 'right_arrow'}]);
  setOutput(s, 'o', 1, [{set_variable: {name: '8bitdo_mode', value: slides}}]);
  removeMode(s, 0);
  assert.deepEqual(s.modes.map(m => m.name), ['Anki', 'Slides main deck']);
  assert.equal(findRule(s, 'h', 1).to[0].key_code, 'right_arrow');
  assert.equal(findRule(s, 'o', 0).to[0].set_variable.value, 1);
  // Select toggled Video and Anki, so it grew into a cycle and still cycles the two modes left
  assert.equal(cycleOf(s, 'n'), 'next');
  assert.equal(findRule(s, 'n', 0).to[0].set_variable.value, 1);
  assert.throws(() => { removeMode(s, 0); removeMode(s, 0); });
});

test('default layout matches the Zero 2 keyboard mode keys', () => {
  assert.deepEqual(initialLayout, {L: 'k', R: 'm', Up: 'c', Down: 'd', Left: 'e', Right: 'f', X: 'h', A: 'g', B: 'j', Y: 'i', Select: 'n', Start: 'o'});
  assert.equal(Object.keys(parseImport(example).layout).length, 12);
});

test('outputs are named only where the name is unambiguous', () => {
  assert.equal(describe([{key_code: 'spacebar'}], {modeName: 'Anki'}).text, 'Show answer');
  assert.equal(describe([{key_code: 'spacebar'}], {modeName: 'Video'}).text, 'Play / pause');
  assert.equal(describe([{key_code: '3'}], {modeName: 'Anki'}).text, 'Good');
  assert.equal(describe([{key_code: '3'}], {modeName: 'Slides'}).kind, 'key');
  assert.equal(describe([{key_code: 'z', modifiers: ['left_command']}], {modeName: 'Slides'}).text, 'Undo');
  assert.equal(describe([{key_code: 'right_arrow'}], {modeName: 'Slides', hint: 'key-right'}).text, 'Right arrow');
  assert.equal(describe([{set_variable: {name: '8bitdo_mode', value: 1}}], {modes: [{name: 'Video'}, {name: 'Anki'}]}).text, 'Switch to Anki');
  assert.equal(describe(null).kind, 'none');
  assert.equal(keyText({key_code: '4', modifiers: ['left_command', 'left_shift']}), '⇧ ⌘ 4');
});

test('invalid imports rejected and browser codes translated', () => {
  assert.throws(() => parseImport({rules: []}));
  assert.throws(() => parseImport({rules: [example, example]}));
  assert.equal(eventKey({code: 'Space'}), 'spacebar');
  assert.equal(eventKey({code: 'KeyJ'}), 'j');
});

test('cycling buttons step through every mode and follow added and removed modes', () => {
  const s = parseImport(example);
  addMode(s, 'Slides');
  assert.deepEqual([0, 1, 2].map(i => findRule(s, 'n', i).to[0].set_variable.value), [1, 2, 0], 'the toggle became a cycle');
  setCycle(s, 'o', 'prev');
  assert.equal(cycleOf(s, 'o'), 'prev');
  assert.deepEqual([0, 1, 2].map(i => findRule(s, 'o', i).to[0].set_variable.value), [2, 0, 1]);
  addMode(s, 'Fourth');
  assert.deepEqual([0, 1, 2, 3].map(i => findRule(s, 'o', i).to[0].set_variable.value), [3, 0, 1, 2]);
  removeMode(s, 1);
  assert.deepEqual([0, 1, 2].map(i => findRule(s, 'n', i).to[0].set_variable.value), [1, 2, 0]);
  assert.equal(cycleOf(s, 'o'), 'prev');
  setOutput(s, 'n', 1, [{key_code: 'x'}]);
  assert.equal(cycleOf(s, 'n'), null);
});

test('mode messages export to Karabiner and import back out', () => {
  const s = {...parseImport(example), notify: 'brief'};
  const sw = exportConfig(s).rules[0].manipulators.find(m => m.from.key_code === 'n' && m.to[0].set_variable.value === 1);
  assert.deepEqual(sw.to[1], {set_notification_message: {id: 'padmap.mode', text: 'Anki mode'}});
  assert.equal(sw.to_delayed_action.to_if_invoked[0].set_notification_message.text, '');
  assert.equal(sw.parameters['basic.to_delayed_action_delay_milliseconds'], 1200);
  const back = parseImport(exportConfig(s));
  assert.equal(back.notify, 'brief');
  assert.deepEqual(back.rule.manipulators, s.rule.manipulators);
  s.notify = 'always';
  const always = exportConfig(s).rules[0].manipulators.find(m => m.to.length > 1);
  assert.equal(always.to_delayed_action, undefined);
  assert.equal(parseImport(exportConfig(s)).notify, 'always');
  s.notify = 'off';
  assert.deepEqual(exportConfig(s).rules[0].manipulators, example.manipulators);
});
