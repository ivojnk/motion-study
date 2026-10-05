import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
await mkdir('public/draco', { recursive: true });
await mkdir('public/licenses', { recursive: true });
for (const file of ['draco_wasm_wrapper.js', 'draco_decoder.wasm']) {
  await copyFile('node_modules/three/examples/jsm/libs/draco/gltf/' + file, 'public/draco/' + file);
}
const notices = await Promise.all(['three/LICENSE', 'three-mesh-bvh/LICENSE'].map(async path => path + '\n' + await readFile('node_modules/' + path, 'utf8')));
await writeFile('public/licenses/third-party.txt', notices.join('\n\n') + '\n\nDraco decoder: Apache 2.0, Google Inc.\nhttps://github.com/google/draco/blob/main/LICENSE\n');
for (const font of ['dm-sans', 'manrope']) await copyFile('node_modules/@fontsource-variable/' + font + '/LICENSE', 'public/licenses/' + font + '-LICENSE.txt');
