const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const raw=fs.readFileSync('public/models/potrero-rivals-v6.glb');assert.equal(raw.readUInt32LE(0),0x46546c67);assert(raw.length<6*1024*1024);
const d=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)));const variants=d.nodes.filter(n=>n.extras?.potreroVariant);
assert.deepEqual(variants.map(n=>n.extras.potreroVariant).sort(),['finta','keeper','muro','rayo']);assert.equal(d.skins.length,5);
for(const skin of d.skins)assert.equal(skin.joints.length,18);
for(const n of d.nodes.filter(n=>n.skin!==undefined))for(const p of d.meshes[n.mesh].primitives){assert(p.attributes.JOINTS_0!==undefined);assert(p.attributes.WEIGHTS_0!==undefined);}
assert.equal(d.nodes.filter(n=>n.extras?.palmLocal).length,2);
for(const n of d.nodes.filter(n=>n.extras?.palmLocal))assert(n.extras.palmLocal.every(Number.isFinite));
const expected={'public/game-core.js':'e58a831e7aa4814df194e392a84e77b3574a601abc22ee85e8ac8822c00d5ac8','public/profile.js':'c5ec22487660900f123909434380630b3769b34cad3ea5c0f8af929f2d0763bc','public/models/potrero-player-v5.glb':'ddec71bbafdef351ebba1b1ef040836d64ea66d20da226e9e340e6b41777633a'};
for(const [f,hash]of Object.entries(expected))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),hash,'V5 invariant: '+f);
console.log('V6: four distinct skinned rivals, two glove anchors, bounded asset size; V5 hero, name validation and B gameplay byte-identical.');
