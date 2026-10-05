import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the viewer's selection functions with scene/camera boundaries replaced.
const source = fs.readFileSync(new URL('../src/viewer.js', import.meta.url), 'utf8');
const selectionSource = source.slice(source.indexOf('  function isSelected('), source.indexOf('  const raycaster ='));
function selection() {
  const muscleMeshes = [
    { userData: { courseMuscleId: 'pectoralis', anatomyName: 'Left pectoralis muscle' } },
    { userData: { courseMuscleId: 'pectoralis', anatomyName: 'Right pectoralis muscle' } },
    { userData: { courseMuscleId: 'biceps', anatomyName: 'Biceps muscle' } },
    { userData: { courseMuscleId: null, anatomyName: 'Small muscle' } },
    { userData: { courseMuscleId: null, anatomyName: 'Other muscle' } },
  ];
  const views = [];
  const context = { muscleMeshes, views, selected: null, selectedAnatomyName: null, isolated: false,
    muscleMaterial: 'normal', focusMaterial: 'purple', dimMaterial: 'dim', render() {},
    view: (...args) => views.push(args), THREE: { Box3: class { isEmpty() { return true; } } } };
  vm.createContext(context);
  vm.runInContext(selectionSource, context);
  return context;
}

test('pending mapped highlight updates both sides without resetting the camera', () => {
  const viewer = selection();
  viewer.highlight('pectoralis');
  assert.deepEqual(viewer.muscleMeshes.map(mesh => mesh.material), ['purple', 'purple', 'dim', 'dim', 'dim']);
  assert.equal(viewer.views.length, 0);
  viewer.highlight('biceps');
  assert.deepEqual(viewer.muscleMeshes.map(mesh => mesh.renderOrder), [0, 0, 10, 0, 0]);
  assert.equal(viewer.views.length, 0);
});

test('unmapped anatomy highlights only the picked structure and can be cleared', () => {
  const viewer = selection();
  viewer.highlight(null, 'Small muscle');
  assert.deepEqual(viewer.muscleMeshes.map(mesh => mesh.material), ['dim', 'dim', 'dim', 'purple', 'dim']);
  viewer.isolated = true; viewer.updateMaterials();
  assert.deepEqual(viewer.muscleMeshes.map(mesh => mesh.visible), [false, false, false, true, false]);
  viewer.highlight(null);
  assert.ok(viewer.muscleMeshes.every(mesh => mesh.visible && mesh.material === 'normal'));
  assert.equal(viewer.views.length, 0);
});

test('normal card selection clears an anatomical preview and restores requested view', () => {
  const viewer = selection();
  viewer.highlight(null, 'Small muscle');
  viewer.select('biceps', 'back', false, false);
  assert.ok(viewer.muscleMeshes.every(mesh => mesh.material === 'normal'));
  assert.equal(viewer.selectedAnatomyName, null);
  assert.equal(viewer.views[0][0], 'back');
});
