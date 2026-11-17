import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { choicePalette, muscleKey, nearbyChoices } from '../src/muscle-choice.js';

const source = fs.readFileSync(new URL('../src/viewer.js', import.meta.url), 'utf8');
const tapSource = source.slice(source.indexOf('  const unbindTapSelection ='), source.indexOf("  canvas.addEventListener('keydown'"));

function fixture(ids, { pickingEnabled = true } = {}) {
  const meshes = ids.map(id => ({ visible: true, userData: { courseMuscleId: id, anatomyName: id + ' anatomy' } }));
  const selected = [];
  const opened = [];
  const nodes = [];
  let tap;
  let sampleIndex = 0;
  let cleared = 0;
  const node = () => {
    const element = { children: [], classList: { add() {} }, setAttribute() {}, append(...children) { this.children.push(...children); } };
    nodes.push(element);
    return element;
  };
  const context = {
    pickingEnabled, muscleMeshes: meshes, nearbyChoices, muscleKey, choicePalette, choiceState: null,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 300 }), parentElement: { append() {} } },
    bindTapSelection(canvas, callback) { tap = callback; return () => {}; },
    clearChoice() { cleared++; context.choiceState = null; },
    camera: {}, THREE: { Vector2: class {} }, isSelected: () => false,
    raycaster: { setFromCamera() {}, intersectObjects() { return meshes.length ? [{ object: meshes[sampleIndex++ % meshes.length], point: {} }] : []; } },
    document: { createElement: node, createElementNS: node }, updateMaterials() {},
    onSelect: (...args) => selected.push(args), choicePanel: { open: choices => opened.push(choices) },
  };
  vm.createContext(context);
  vm.runInContext(tapSource, context);
  return { context, selected, opened, nodes, get cleared() { return cleared; }, tap: pointerType => tap({ pointerType, clientX: 150, clientY: 150 }) };
}

for (const pointerType of ['mouse', 'touch']) {
  test(`${pointerType}: a single muscle is confirmed directly without a choice panel or markers`, () => {
    const viewer = fixture(['biceps', 'biceps']);
    viewer.context.choiceState = { previous: true };
    viewer.tap(pointerType);
    assert.deepEqual(viewer.selected, [['biceps', 'biceps anatomy', true]]);
    assert.equal(viewer.opened.length, 0);
    assert.equal(viewer.nodes.length, 0);
    assert.equal(viewer.context.choiceState, null);
    assert.equal(viewer.cleared, 1);
  });
}

test('multiple nearby muscles still require an explicit choice and confirmation', () => {
  const viewer = fixture(['biceps', 'triceps']);
  viewer.tap('touch');
  assert.equal(viewer.selected.length, 0);
  assert.deepEqual(viewer.opened[0].map(choice => choice.key), ['biceps', 'triceps']);
  assert.equal(viewer.context.choiceState.marks.length, 2);
});

test('a miss and disabled picking never submit an answer or open a choice panel', () => {
  for (const viewer of [fixture([]), fixture(['biceps'], { pickingEnabled: false })]) {
    viewer.tap('mouse');
    assert.equal(viewer.selected.length, 0);
    assert.equal(viewer.opened.length, 0);
    assert.equal(viewer.nodes.length, 0);
  }
});
