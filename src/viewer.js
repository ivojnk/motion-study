import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { acceleratedRaycast, computeBoundsTree } from 'three-mesh-bvh';
import { muscleForMesh } from './data/muscles.js';

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
  const group = new THREE.Group();
  scene.add(group);
  let frame = null;
  function render() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => { frame = null; renderer.render(scene, camera); });
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
  let isolated = false;
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
  function updateMaterials() {
    for (const mesh of muscleMeshes) {
      const active = selected && mesh.userData.courseMuscleId === selected;
      mesh.visible = !isolated || !selected || active;
      mesh.material = active ? focusMaterial : selected ? dimMaterial : muscleMaterial;
      mesh.renderOrder = active ? 10 : 0;
    }
    render();
  }
  function select(id, direction = 'front', focus = false, highlight = true) {
    selected = highlight ? id : null;
    updateMaterials();
    const selectedBox = new THREE.Box3();
    if (focus && id) muscleMeshes.filter(mesh => mesh.userData.courseMuscleId === id).forEach(mesh => selectedBox.expandByObject(mesh));
    view(direction, !selectedBox.isEmpty() ? selectedBox : null);
  }
  const raycaster = new THREE.Raycaster();
  raycaster.firstHitOnly = true;
  let pointerStart = null;
  canvas.addEventListener('pointerdown', event => { pointerStart = [event.clientX, event.clientY]; });
  canvas.addEventListener('pointerup', event => {
    if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 6) return;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(2 * (event.clientX - rect.left) / rect.width - 1, 1 - 2 * (event.clientY - rect.top) / rect.height), camera);
    const hits = raycaster.intersectObjects(muscleMeshes.filter(mesh => mesh.visible), false);
    const hit = hits[0]?.object;
    if (hit) onSelect(hit.userData.courseMuscleId, hit.userData.anatomyName);
  });
  canvas.addEventListener('keydown', event => {
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
  return { available, select, view, render, showSkeleton, setIsolated(value) { isolated = value; updateMaterials(); },
    dispose() { observer.disconnect(); controls.dispose(); draco.dispose(); if (frame !== null) cancelAnimationFrame(frame); scene.traverse(n => n.geometry?.dispose()); [muscleMaterial, boneMaterial, focusMaterial, dimMaterial].forEach(m => m.dispose()); renderer.dispose(); } };
}
