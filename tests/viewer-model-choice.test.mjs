import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { choicePalette, muscleKey } from '../src/muscle-choice.js';

const source = fs.readFileSync(new URL('../src/viewer.js', import.meta.url), 'utf8');
const selection = source.slice(source.indexOf('  function isSelected('), source.indexOf('  const raycaster ='));
const projection = source.slice(source.indexOf('  function updateChoiceMarks('), source.indexOf('  choicePanel ='));
function fixture() {
  const nodes = [];
  function node() {
    const value = { children: [], style: {}, attributes: {}, hidden: false, removed: false,
      classList: { add() {}, toggle() {} }, setAttribute(key, value) { this.attributes[key] = value; },
      append(...children) { this.children.push(...children); }, remove() { this.removed = true; } };
    nodes.push(value);
    return value;
  }
  const ids = ['biceps', 'triceps', 'delt-front', 'pectoralis', 'lats'];
  const muscleMeshes = ids.flatMap((id, index) => [-1, 1].map(side => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.1, .3, .1));
    mesh.position.set(side * .15, index * .1, 0);
    mesh.userData = { courseMuscleId: id, anatomyName: id + side };
    mesh.updateMatrixWorld(true);
    return mesh;
  }));
  const camera = new THREE.PerspectiveCamera(45, 1, .01, 100);
  camera.position.z = 3; camera.updateMatrixWorld(true);
  const views = [];
  const context = { THREE, document: { createElement: node, createElementNS: node }, nodes, muscleMeshes,
    available: new Set(ids), muscleKey, choicePalette, choiceMaterials: ['blue', 'orange', 'green', 'pink'],
    muscleMaterial: 'normal', dimMaterial: 'dim', focusMaterial: 'purple', render() {},
    canvas: { parentElement: node(), getBoundingClientRect: () => ({ width: 280, height: 245 }) }, camera,
    selected: null, selectedAnatomyName: null, selectedPatterns: {}, isolated: false,
    choiceState: null, modelChoiceState: null, structuredClone, clearChoice() {}, view: (...args) => views.push(args), views };
  vm.createContext(context); vm.runInContext(selection + projection, context);
  return context;
}

test('four muscles colour both sides, create matching markers, and survive camera-preserving feedback', () => {
  const viewer = fixture();
  const ids = ['biceps', 'triceps', 'delt-front', 'pectoralis'];
  assert.equal(viewer.showModelChoices(ids, 'front'), true);
  assert.deepEqual(viewer.muscleMeshes.map(mesh => mesh.material), ['blue', 'blue', 'orange', 'orange', 'green', 'green', 'pink', 'pink', 'dim', 'dim']);
  assert.deepEqual(Array.from(viewer.modelChoiceState.marks, mark => mark.textContent), ['1 ●', '2 ▲', '3 ■', '4 ◆']);
  assert.equal(viewer.modelChoiceState.lines.children.length, 4);
  assert.equal(viewer.views.length, 1);
  const originalMarks = viewer.modelChoiceState.marks;
  viewer.updateChoiceMarks();
  assert.ok(originalMarks.every(mark => !mark.hidden && Number.isFinite(parseFloat(mark.style.left))));
  viewer.showModelChoices(ids, 'front', true);
  assert.equal(viewer.modelChoiceState.marks, originalMarks);
  assert.equal(viewer.views.length, 1);
  viewer.select('lats', 'back');
  assert.equal(viewer.modelChoiceState, null);
  assert.ok(originalMarks.every(mark => mark.removed));
  assert.equal(viewer.muscleMeshes[8].material, 'purple');
});

test('invalid candidates clear fixed markers, and later highlighting restores the regular atlas', () => {
  const viewer = fixture();
  viewer.showModelChoices(['biceps', 'triceps', 'delt-front', 'pectoralis']);
  const marks = viewer.modelChoiceState.marks;
  assert.equal(viewer.showModelChoices(['biceps', 'triceps', 'delt-front', 'missing']), false);
  assert.ok(marks.every(mark => mark.removed));
  assert.ok(viewer.muscleMeshes.every(mesh => mesh.material === 'normal'));
  viewer.showModelChoices(['biceps', 'triceps', 'delt-front', 'pectoralis']);
  viewer.highlight('biceps');
  assert.equal(viewer.modelChoiceState, null);
  assert.equal(viewer.muscleMeshes[0].material, 'purple');
});
