import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import { choicePalette, muscleKey } from '../src/muscle-choice.js';

const source = fs.readFileSync(new URL('../src/viewer.js', import.meta.url), 'utf8');
const selection = source.slice(source.indexOf('  function isSelected('), source.indexOf('  const raycaster ='));
const projection = source.slice(source.indexOf('  function updateChoiceMarks('), source.indexOf('  choicePanel ='));
const skeletonToggle = source.slice(source.indexOf('  async function showSkeleton('), source.indexOf('  onStatus('));
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
  const bonesInput = { checked: true };
  const skeletonModel = { visible: true, traverse() {} };
  const context = { THREE, document: { createElement: node, createElementNS: node, querySelector: () => bonesInput }, nodes, muscleMeshes,
    available: new Set(ids), muscleKey, choicePalette, choiceMaterials: ['blue', 'orange', 'green', 'pink'],
    muscleMaterial: 'normal', dimMaterial: 'dim', focusMaterial: 'purple', render() {},
    canvas: { parentElement: node(), getBoundingClientRect: () => ({ width: 280, height: 245 }) }, camera,
    selected: null, selectedAnatomyName: null, selectedPatterns: {}, isolated: false,
    choiceState: null, modelChoiceState: null, structuredClone, clearChoice() {}, view: (...args) => views.push(args), views,
    bonesInput, skeletonModel, skeleton: null, skeletonPromise: null, boneMaterial: 'bone', scene: { add() {} },
    loader: { async loadAsync() { return { scene: skeletonModel }; } } };
  vm.createContext(context); vm.runInContext((selection + projection + skeletonToggle).replaceAll('import.meta.env.BASE_URL', "'/'"), context);
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

test('isolation keeps all four candidates, colours, markers and camera across toggles and feedback', () => {
  const viewer = fixture();
  const ids = ['biceps', 'triceps', 'delt-front', 'pectoralis'];
  viewer.setIsolated(true);
  assert.ok(viewer.muscleMeshes.every(mesh => mesh.visible));
  viewer.showModelChoices(ids);
  const state = viewer.modelChoiceState;
  const materials = viewer.muscleMeshes.map(mesh => mesh.material);
  const assertIsolated = () => {
    assert.equal(viewer.isolated, true);
    assert.deepEqual(viewer.muscleMeshes.map(mesh => mesh.visible), [true, true, true, true, true, true, true, true, false, false]);
  };
  assertIsolated();
  viewer.setIsolated(false);
  assert.ok(viewer.muscleMeshes.every(mesh => mesh.visible));
  viewer.setIsolated(true);
  viewer.showModelChoices(ids, 'front', true);
  assertIsolated();
  assert.equal(viewer.modelChoiceState, state);
  assert.deepEqual(viewer.muscleMeshes.map(mesh => mesh.material), materials);
  assert.ok(state.marks.every(mark => !mark.removed));
  assert.equal(viewer.views.length, 1);
  viewer.showModelChoices(['triceps', 'delt-front', 'pectoralis', 'lats']);
  assert.equal(viewer.isolated, true);
  assert.deepEqual(viewer.muscleMeshes.map(mesh => mesh.visible), [false, false, true, true, true, true, true, true, true, true]);
});

test('isolation preserves a pending picked-muscle preview and its confirmation marks', () => {
  const viewer = fixture();
  const state = { choices: ['biceps', 'triceps'].map(key => ({ key })), preview: 1, marks: [], lines: {} };
  viewer.choiceState = state;
  viewer.clearChoice = () => { throw new Error('Visibility toggles must preserve the pending choice'); };
  viewer.setIsolated(true);
  assert.equal(viewer.choiceState, state);
  assert.deepEqual(viewer.muscleMeshes.map(mesh => mesh.visible), [true, true, true, true, false, false, false, false, false, false]);
  assert.deepEqual(viewer.muscleMeshes.slice(0, 4).map(mesh => mesh.material), ['dim', 'dim', 'orange', 'orange']);
  viewer.setIsolated(false);
  assert.ok(viewer.muscleMeshes.every(mesh => mesh.visible));
  assert.equal(viewer.choiceState.preview, 1);
  assert.equal(viewer.views.length, 0);
});

test('skeleton and isolation toggles remain independent with four highlighted candidates', async () => {
  const viewer = fixture();
  viewer.showModelChoices(['biceps', 'triceps', 'delt-front', 'pectoralis']);
  const state = viewer.modelChoiceState;
  await viewer.showSkeleton(true);
  viewer.setIsolated(true);
  assert.equal(viewer.skeleton.visible, true);
  viewer.bonesInput.checked = false;
  await viewer.showSkeleton(false);
  assert.equal(viewer.skeleton.visible, false);
  assert.equal(viewer.isolated, true);
  viewer.setIsolated(false);
  assert.equal(viewer.skeleton.visible, false);
  viewer.bonesInput.checked = true;
  await viewer.showSkeleton(true);
  assert.equal(viewer.skeleton.visible, true);
  assert.equal(viewer.isolated, false);
  assert.equal(viewer.modelChoiceState, state);
  assert.ok(state.marks.every(mark => !mark.removed));
  assert.equal(viewer.views.length, 1);
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
