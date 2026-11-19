const fs=require('node:fs'),assert=require('node:assert/strict');
const raw=fs.readFileSync('public/models/potrero-player.glb');assert.equal(raw.readUInt32LE(0),0x46546c67);
const size=raw.readUInt32LE(12),doc=JSON.parse(raw.subarray(20,20+size));
const rig=doc.nodes.find(n=>n.name==='Potrero_Rig');assert(rig);assert.equal(doc.skins.length,1);assert.equal(doc.skins[0].joints.length,18);
const names=doc.materials.map(m=>m.name);assert(names.includes('IdentityBack'));assert(names.includes('IdentityFront'));
for(const a of doc.animations){const duration=Math.max(...a.samplers.map(s=>doc.accessors[s.input].max[0]));assert(duration>=4.89);}
const skinned=doc.nodes.filter(n=>n.skin!==undefined);assert(skinned.length);for(const n of skinned)for(const p of doc.meshes[n.mesh].primitives){assert(p.attributes.JOINTS_0!==undefined);assert(p.attributes.WEIGHTS_0!==undefined);}
console.log('3D GLB validated: 18 bones, skin weights, editable jersey panels and complete animation timeline.');
