const fs=require('node:fs'),assert=require('node:assert/strict');
function read(p){const b=fs.readFileSync(p);assert.equal(b.readUInt32LE(0),0x46546c67);return {bytes:b.length,json:JSON.parse(b.subarray(20,20+b.readUInt32LE(12)))};}
const v4=read('public/models/potrero-player.glb'),v5=read('public/models/potrero-player-v5.glb');assert(v5.bytes<2_000_000);assert.notEqual(v5.bytes,v4.bytes);
const j=v5.json;assert.equal(j.skins[0].joints.length,18);assert(j.nodes.find(n=>n.name==='Potrero_Rig').extras.version==='5.0.0');
for(const name of ['IdentityFront','IdentityBack','EyeWhite','Iris','Pupil','Hair','HairHighlight','Jersey_Base'])assert(j.materials.some(m=>m.name===name));
assert(j.animations.some(a=>Math.max(...a.samplers.map(s=>j.accessors[s.input].max[0]))>=4.89));
for(const n of j.nodes.filter(n=>n.skin!==undefined))for(const p of j.meshes[n.mesh].primitives){assert(p.attributes.JOINTS_0!==undefined);assert(p.attributes.WEIGHTS_0!==undefined);assert(p.attributes.NORMAL!==undefined);}
assert.equal(fs.readFileSync('public/profile.js','utf8').includes("name:'NACHO'"),false);
console.log('V5: distinct sculpt under 2 MB, 18 deform joints, complete timeline and editable identity panels.');
