import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { acceleratedRaycast, computeBoundsTree } from 'three-mesh-bvh';
import { muscleForMesh } from './data/muscles.js';
import { bindTapSelection } from './tap-selection.js';
import { choicePalette, createChoicePanel, muscleKey, nearbyChoices } from './muscle-choice.js';

export async function createViewer(canvas, onSelect, onStatus) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.minDistance = 0.25;
  controls.maxDistance = 8;
  controls.enablePan = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9b8896, 2.3));
  const key = new THREE.DirectionalLight(0xfff5e9, 2.4);
  key.position.set(3, 3, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9dcff, 1.4);
  fill.position.set(-3, 1, -3);
  scene.add(fill);
  const muscleMaterial = new THREE.MeshStandardMaterial({ color: 0xb96668, roughness: 0.85 });
  const boneMaterial = new THREE.MeshStandardMaterial({ color: 0xe3d9c8, roughness: 0.9 });
  const focusMaterial = new THREE.MeshStandardMaterial({ color: 0x754ac2, emissive: 0x3c1567, emissiveIntensity: 0.25, roughness: 0.65, depthTest: false });
  const dimMaterial = new THREE.MeshStandardMaterial({ color: 0xd1b9bc, roughness: 0.9 });
  const choiceMaterials = choicePalette.map(({ color }) => new THREE.MeshBasicMaterial({ color, depthTest: false }));
  let choiceState = null;
  let modelChoiceState = null;
  let choicePanel = null;
  const group = new THREE.Group();
  scene.add(group);
  let frame = null;
  function render() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => { frame = null; renderer.render(scene, camera); updateChoiceMarks(); });
  }
  controls.addEventListener('change', render);
  function resize() {
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement);
  resize();
  const draco = new DRACOLoader();
  draco.setDecoderPath(import.meta.env.BASE_URL + 'draco/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  let skeleton = null;
  let skeletonPromise = null;
  let selected = null;
  let selectedAnatomyName = null;
  let selectedPatterns = {};
  let isolated = false;
  let pickingEnabled = true;
  const muscleMeshes = [];
  const available = new Set();
  const gltf = await loader.loadAsync(import.meta.env.BASE_URL + 'models/muscular.glb');
  gltf.scene.updateMatrixWorld(true);
  // Flatten only owned meshes, preserving world transforms; nested structures stay independently visible.
  const candidates = [];
  gltf.scene.traverse(node => { if (node.isMesh) candidates.push(node); });
  for (const mesh of candidates) {
    let owner = mesh;
    while (owner && !owner.userData.za_name) owner = owner.parent;
    const name = owner?.userData.za_name || mesh.name;
    const muscle = muscleForMesh(name);
    const isMuscle = /muscle|diaphragm/i.test(name) && !/fascia|bursa|retinaculum|tendon/i.test(name);
    if (!isMuscle && !muscle) continue;
    group.attach(mesh);
    mesh.userData.courseMuscleId = muscle?.id || null;
    mesh.userData.anatomyName = name;
    mesh.material = muscleMaterial;
    mesh.geometry.computeBoundsTree = computeBoundsTree;
    mesh.geometry.computeBoundsTree();
    mesh.raycast = acceleratedRaycast;
    muscleMeshes.push(mesh);
    if (muscle) available.add(muscle.id);
  }
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const height = box.getSize(new THREE.Vector3()).y;
  const distance = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.12;
  let currentView = 'front';
  function view(direction = currentView, targetBox = null) {
    clearChoice();
    currentView = direction;
    const target = targetBox?.getCenter(new THREE.Vector3()) || center;
    const span = targetBox ? Math.max(...targetBox.getSize(new THREE.Vector3()).toArray()) : height;
    const d = targetBox ? Math.max(span * 2.2, 0.5) : distance * Math.max(1, 0.65 / camera.aspect);
    controls.target.copy(target);
    const offset = direction === 'back' ? new THREE.Vector3(0, 0, -d) : direction === 'side' ? new THREE.Vector3(d, 0, 0) : new THREE.Vector3(0, 0, d);
    camera.position.copy(target).add(offset);
    controls.update();
    render();
  }
  view('front');
  function isSelected(mesh) {
    return selected ? matchesSelection(mesh, selected, selectedPatterns) : Boolean(selectedAnatomyName && mesh.userData.anatomyName === selectedAnatomyName);
  }
  function matchesSelection(mesh, ids, patterns) {
    const id = mesh.userData.courseMuscleId;
    const matchesId = Array.isArray(ids) ? ids.includes(id) : id === ids;
    return matchesId && (!patterns[id]?.length || patterns[id].some(part => mesh.userData.anatomyName.includes(part)));
  }
  function updateMaterials() {
    const coloredChoices = modelChoiceState || choiceState;
    const hasSelection = Boolean(coloredChoices || selected || selectedAnatomyName);
    for (const mesh of muscleMeshes) {
      const active = isSelected(mesh);
      const choiceIndex = coloredChoices?.choices.findIndex(choice => choice.key === muscleKey(mesh)) ?? -1;
      mesh.visible = !isolated || !hasSelection || (coloredChoices ? choiceIndex >= 0 : active);
      mesh.material = coloredChoices ? choiceIndex >= 0 && (coloredChoices.preview === null || coloredChoices.preview === choiceIndex) ? choiceMaterials[choiceIndex] : dimMaterial : active ? focusMaterial : hasSelection ? dimMaterial : muscleMaterial;
      mesh.renderOrder = coloredChoices ? choiceIndex >= 0 && (coloredChoices.preview === null || coloredChoices.preview === choiceIndex) ? 10 : 0 : active ? 10 : 0;
    }
    render();
  }
  function setIsolated(value) {
    isolated = Boolean(value);
    updateMaterials();
  }
  function highlight(id, anatomyName = null, patterns = {}) {
    clearChoice();
    clearModelChoices();
    selected = Array.isArray(id) ? id.length ? [...id] : null : id || null;
    selectedAnatomyName = id ? null : anatomyName || null;
    selectedPatterns = structuredClone(patterns || {});
    updateMaterials();
  }
  function select(id, direction = 'front', focus = false, highlight = true, patterns = {}) {
    clearChoice();
    clearModelChoices();
    selected = highlight ? Array.isArray(id) ? id.length ? [...id] : null : id : null;
    selectedAnatomyName = null;
    selectedPatterns = structuredClone(patterns || {});
    updateMaterials();
    const selectedBox = new THREE.Box3();
    if (focus && id) muscleMeshes.filter(mesh => matchesSelection(mesh, id, selectedPatterns)).forEach(mesh => selectedBox.expandByObject(mesh));
    view(direction, !selectedBox.isEmpty() ? selectedBox : null);
  }
  function clearModelChoices() {
    if (!modelChoiceState) return;
    modelChoiceState.marks.forEach(mark => mark.remove());
    modelChoiceState.lines.remove();
    modelChoiceState = null;
  }
  function showModelChoices(ids, direction = 'front', preserveCamera = false) {
    if (!Array.isArray(ids) || ids.length !== 4 || new Set(ids).size !== 4 || !ids.every(id => available.has(id))) {
      clearModelChoices();
      updateMaterials();
      return false;
    }
    clearChoice();
    if (preserveCamera && modelChoiceState?.choices.every((choice, index) => choice.key === ids[index])) {
      updateMaterials();
      return true;
    }
    clearModelChoices();
    selected = null;
    selectedAnatomyName = null;
    selectedPatterns = {};
    const combinedBox = new THREE.Box3();
    const choices = ids.map(id => {
      const meshes = muscleMeshes.filter(mesh => mesh.userData.courseMuscleId === id);
      meshes.forEach(mesh => combinedBox.expandByObject(mesh));
      // Anchor to a real mesh on one side, rather than the gap between both sides.
      const representative = meshes.reduce((largest, mesh) => {
        const size = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3()).lengthSq();
        return !largest || size > largest.size ? { mesh, size } : largest;
      }, null).mesh;
      const point = new THREE.Box3().setFromObject(representative).getCenter(new THREE.Vector3());
      return { key: id, hit: { object: representative, point } };
    });
    const lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lines.classList.add('choice-lines');
    lines.setAttribute('aria-hidden', 'true');
    choices.forEach((choice, index) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'choice-color-' + index);
      lines.append(line);
    });
    const marks = choices.map((choice, index) => {
      const mark = document.createElement('span');
      mark.className = 'choice-mark model-choice-mark choice-color-' + index;
      mark.textContent = (index + 1) + ' ' + choicePalette[index].symbol;
      mark.setAttribute('aria-hidden', 'true');
      return mark;
    });
    canvas.parentElement.append(lines, ...marks);
    modelChoiceState = { choices, marks, lines, preview: null };
    if (!preserveCamera) view(direction, combinedBox);
    updateMaterials();
    return true;
  }
  const raycaster = new THREE.Raycaster();
  raycaster.firstHitOnly = true;
  function clearChoice() {
    if (!choiceState) return;
    const previous = choiceState;
    choiceState = null;
    previous.marks.forEach(mark => mark.remove());
    previous.lines.remove();
    choicePanel?.close();
    updateMaterials();
  }
  function updateChoiceMarks() {
    const state = modelChoiceState || choiceState;
    if (!state) return;
    const rect = canvas.getBoundingClientRect();
    state.lines.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
    const positions = [];
    const margin = modelChoiceState ? 24 : 18;
    const spacing = modelChoiceState ? 46 : 38;
    state.choices.forEach((choice, index) => {
      const point = choice.hit.point.clone().project(camera);
      const mark = state.marks[index];
      mark.hidden = Math.abs(point.x) > 1 || Math.abs(point.y) > 1 || Math.abs(point.z) > 1;
      const x = (point.x + 1) * rect.width / 2;
      const y = (1 - point.y) * rect.height / 2;
      const position = { x: Math.max(margin, Math.min(rect.width - margin, x)), y: Math.max(margin, Math.min(rect.height - margin, y)) };
      for (const previous of positions) {
        if (Math.hypot(position.x - previous.x, position.y - previous.y) < spacing) position.y = previous.y + spacing <= rect.height - margin ? previous.y + spacing : previous.y - spacing;
      }
      positions.push(position);
      mark.style.left = position.x + 'px';
      mark.style.top = position.y + 'px';
      mark.classList.toggle('is-preview', state.preview === index);
      const line = state.lines.children[index];
      line.setAttribute('x1', x); line.setAttribute('y1', y);
      line.setAttribute('x2', position.x); line.setAttribute('y2', position.y);
      line.style.display = mark.hidden ? 'none' : '';
    });
  }
  choicePanel = createChoicePanel(canvas.closest('.atlas-panel'), {
    preview(choice) {
      if (!choiceState) return;
      choiceState.preview = choiceState.choices.indexOf(choice);
      updateMaterials();
    },
    confirm(choice) {
      clearChoice();
      onSelect(choice.hit.object.userData.courseMuscleId, choice.hit.object.userData.anatomyName, true);
      canvas.focus({ preventScroll: true });
    },
    cancel() { clearChoice(); canvas.focus({ preventScroll: true }); }
  });
  const unbindTapSelection = bindTapSelection(canvas, event => {
    if (!pickingEnabled) return;
    clearChoice();
    const rect = canvas.getBoundingClientRect();
    const visibleMeshes = muscleMeshes.filter(mesh => mesh.visible);
    const samples = [];
    const radius = event.pointerType === 'touch' ? 18 : 12;
    const offsets = [[0, 0]];
    for (const r of [radius / 2, radius]) for (let i = 0; i < 8; i++) offsets.push([Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r]);
    for (const [x, y] of offsets) {
      const px = event.clientX - rect.left + x;
      const py = event.clientY - rect.top + y;
      if (px < 0 || py < 0 || px > rect.width || py > rect.height) continue;
      raycaster.setFromCamera(new THREE.Vector2(2 * px / rect.width - 1, 1 - 2 * py / rect.height), camera);
      const hits = raycaster.intersectObjects(visibleMeshes, false);
      // Match the selected purple overlay, otherwise only offer frontmost visible surfaces.
      const hit = hits.find(({ object }) => isSelected(object)) || hits[0];
      samples.push({ hit, distance: Math.hypot(x, y) });
    }
    const choices = nearbyChoices(samples);
    if (!choices.length) return;
    const lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lines.classList.add('choice-lines');
    lines.setAttribute('aria-hidden', 'true');
    choices.forEach((choice, index) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'choice-color-' + index);
      lines.append(line);
    });
    canvas.parentElement.append(lines);
    const marks = choices.map((choice, index) => {
      const mark = document.createElement('span');
      mark.className = 'choice-mark choice-color-' + index;
      mark.textContent = choicePalette[index].symbol;
      mark.setAttribute('aria-hidden', 'true');
      canvas.parentElement.append(mark);
      return mark;
    });
    choiceState = { choices, marks, lines, preview: null };
    updateMaterials();
    choicePanel.open(choices);
  });
  canvas.addEventListener('keydown', event => {
    if (event.key === 'Escape' && choiceState) { event.preventDefault(); clearChoice(); return; }
    const delta = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(delta);
    let handled = true;
    if (event.key === 'ArrowLeft') spherical.theta -= 0.15;
    else if (event.key === 'ArrowRight') spherical.theta += 0.15;
    else if (event.key === 'ArrowUp') spherical.phi = Math.max(0.1, spherical.phi - 0.1);
    else if (event.key === 'ArrowDown') spherical.phi = Math.min(Math.PI - 0.1, spherical.phi + 0.1);
    else if (['+', '='].includes(event.key)) spherical.radius = Math.max(controls.minDistance, spherical.radius * 0.9);
    else if (event.key === '-') spherical.radius = Math.min(controls.maxDistance, spherical.radius * 1.1);
    else handled = false;
    if (!handled) return;
    event.preventDefault();
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
    render();
  });
  async function showSkeleton(show) {
    if (!show) { if (skeleton) skeleton.visible = false; render(); return; }
    if (!skeletonPromise) skeletonPromise = loader.loadAsync(import.meta.env.BASE_URL + 'models/skeletal.glb').then(result => {
      skeleton = result.scene;
      skeleton.traverse(mesh => { if (mesh.isMesh) mesh.material = boneMaterial; });
      scene.add(skeleton);
    }).catch(error => { skeletonPromise = null; throw error; });
    await skeletonPromise;
    skeleton.visible = document.querySelector('#bones').checked;
    render();
  }
  onStatus('ready');
  return { available, select, highlight, view, render, showSkeleton, showModelChoices, setIsolated,
    setPickingEnabled(value) { pickingEnabled = value; if (!value) clearChoice(); },
    dispose() { clearChoice(); clearModelChoices(); choicePanel?.dispose(); unbindTapSelection(); observer.disconnect(); controls.dispose(); draco.dispose(); if (frame !== null) cancelAnimationFrame(frame); scene.traverse(n => n.geometry?.dispose()); [muscleMaterial, boneMaterial, focusMaterial, dimMaterial, ...choiceMaterials].forEach(m => m.dispose()); renderer.dispose(); } };
}
