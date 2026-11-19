import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {OpponentSystem,RIVALS} from './opponents.js';
const PI=Math.PI, X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const makeCanvas=()=>{const c=document.createElement('canvas');c.width=512;c.height=512;return c;};
function clipsFrom(gltf){
 const full=gltf.animations.find(a=>a.duration>4.7);if(!full)throw Error('El modelo no incluye el ciclo completo de animación.');
 const clips={};for(const [name,start,end] of [['Idle',0,61],['Run',61,86],['Kick',86,117],['Defend',117,148]]){
  const count=end-start,tracks=[];
  for(const track of full.tracks){const size=track.getValueSize(),sample=track.createInterpolant(),values=new Float32Array(count*size),times=new Float32Array(count);for(let i=0;i<count;i++){times[i]=i/30;values.set(sample.evaluate((start+i)/30),i*size);}const t=track.clone();t.times=times;t.values=values;tracks.push(t);}
  clips[name]=new THREE.AnimationClip(name,(count-1)/30,tracks);
 }return clips;
}
export class Character3D {
 constructor(renderer){
  this.r=renderer;renderer.characters=this;this.loaded=false;this.is3D=true;this.profile={name:'',number:10};this.signature='';this.kit=null;
  this.pools={hero:[],defender:[],keeper:[]};this.cursors={hero:0,defender:0,keeper:0};this.materials={};this.labelCanvases=[makeCanvas(),makeCanvas()];
  this.labelTextures=this.labelCanvases.map(c=>{const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=4;return t;});
  this.ready=this.load();
 }
 async load(){
  let base,hero;try{[base,hero]=await Promise.all([new GLTFLoader().loadAsync('/models/potrero-rivals-v6.glb?v=6'),new GLTFLoader().loadAsync('/models/potrero-player-v5.glb?v=5')]);}catch(e){throw Error('No se pudo cargar el jugador 3D. Revisá la conexión y recargá.');}
  this.sources={hero:hero.scene.getObjectByName('Potrero_Rig'),defender:base.scene.getObjectByName('Potrero_Rig'),keeper:base.scene.getObjectByName('Potrero_Rig')};
  if(Object.values(this.sources).some(s=>!s))throw Error('Falta el esqueleto del jugador.');this.source=this.sources.hero;
  this.roleClips={hero:clipsFrom(hero),defender:clipsFrom(hero),keeper:clipsFrom(hero)};this.clips=this.roleClips.hero;
  // One tiny shared fabric normal map, never a new texture per frame/player.
  const data=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;data[i]=128+(x%4<2?15:-15);data[i+1]=128+(y%4<2?13:-13);data[i+2]=253;data[i+3]=255;}
  this.fabric=new THREE.DataTexture(data,32,32);this.fabric.wrapS=this.fabric.wrapT=THREE.RepeatWrapping;this.fabric.repeat.set(9,9);this.fabric.needsUpdate=true;
  for(const role of ['hero','defender','keeper']){
   const set=this.materials[role]={};this.sources[role].traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(!set[m.name])set[m.name]=m.clone();});
   for(const [name,m] of Object.entries(set)){
    m.side=THREE.DoubleSide;
    if(name.startsWith('Identity')){m.transparent=true;m.opacity=role==='hero'?1:0;m.depthWrite=false;m.alphaTest=.1;m.polygonOffset=true;m.polygonOffsetFactor=-2;m.polygonOffsetUnits=-2;m.map=this.labelTextures[name==='IdentityBack'?1:0];m.needsUpdate=true;}
    if(role==='hero'){
     if(['Jersey_Base','Jersey_Stripe','Shorts','Socks'].includes(name)){m.roughness=.88;m.normalMap=this.fabric;m.normalScale.set(.075,.075);}
     if(name==='Skin')m.roughness=.64;if(name==='Boots')m.roughness=.37;
     if(name.startsWith('Hair'))m.roughness=.48;
    }
   }
   if(role!=='hero'){set.Jersey_Base.color.set(role==='keeper'?'#e9bf4d':'#e76951');set.Jersey_Stripe.color.set(role==='keeper'?'#f9d979':'#a83e36');set.Jersey_Trim.color.set('#213643');set.Shorts.color.set('#1e2d3b');set.Boots.color.set('#334351');}
  }
  this.opponents=new OpponentSystem(this,base);this.rivalInfo=RIVALS;
  for(let i=0;i<2;i++)this.pools.hero.push(this.makeActor('hero'));
  for(let v=0;v<3;v++)for(let i=0;i<18;i++)this.pools.defender.push(this.opponents.makeActor(v));
  this.pools.keeper.push(this.opponents.makeActor(3));
  this.previewActor=this.makeActor('hero',false);this.setupPreview();this.loaded=true;this.setPlayer(this.profile,this.kit||{shirt:'#eff3df',trim:'#77bedb',shorts:'#263f44',boots:'#fff2db',name:'Barrio'});return this;
 }
 makeActor(role,attach=true){
  const root=clone(this.sources[role]);root.name='Player3D_'+role;root.visible=false;const bones={};
  root.traverse(o=>{if(o.isBone)bones[o.name]=o;if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(m=>this.materials[role][m.name]):this.materials[role][o.material.name];const identity=Array.isArray(o.material)?o.material.every(m=>m.name.startsWith('Identity')):o.material.name.startsWith('Identity');o.castShadow=role==='hero'&&!identity;o.receiveShadow=role==='hero'&&!identity;o.frustumCulled=false;}});
  const mixer=new THREE.AnimationMixer(root),actions={};for(const [n,c] of Object.entries(this.roleClips[role]))actions[n]=mixer.clipAction(c);
  if(role==='keeper'){const geometry=new THREE.SphereGeometry(1,12,8),material=new THREE.MeshStandardMaterial({color:0xfff2cf,roughness:.8});for(const n of ['Hand_L','Hand_R']){const b=bones[n];if(!b)continue;const glove=new THREE.Mesh(geometry,material);glove.scale.set(.072,.065,.05);glove.position.set(0,.032,0);b.add(glove);}}
  if(attach)this.r.actorRoot.add(root);
  return {root,mixer,actions,bones,current:'',role,previous:'',fade:1,previousTime:0,lastTime:null,phase:0,bank:0,q:new THREE.Quaternion(),contact:new THREE.Vector3(),basePose:Object.fromEntries(['Chest','Head','Thigh_L','Thigh_R'].map(n=>[n,new THREE.Quaternion()])),hasAdditive:false};
 }
 sample(actor,name,time,delta=0,blend=false){
  if(actor.hasAdditive){for(const [n,q] of Object.entries(actor.basePose))actor.bones[n]?.quaternion.copy(q);actor.hasAdditive=false;}
  if(!actor.actions[name])name='Idle';
  if(actor.current!==name){
   actor.previous=blend?actor.current:'';actor.previousTime=actor.current?actor.actions[actor.current].time:0;actor.fade=actor.previous?0:1;
   for(const a of Object.values(actor.actions)){a.enabled=false;a.setEffectiveWeight(0);}
   actor.actions[name].reset().play();actor.current=name;
  }
  const a=actor.actions[name];a.enabled=true;a.time=name==='Kick'?clamp(time,0,a.getClip().duration-.00001):Math.max(0,time)%a.getClip().duration;
  if(!blend)actor.fade=1;else actor.fade=Math.min(1,actor.fade+delta/.14);
  const w=actor.fade*actor.fade*(3-2*actor.fade);a.setEffectiveWeight(w);
  if(actor.previous){const old=actor.actions[actor.previous];old.enabled=w<1;old.setEffectiveWeight(1-w);actor.previousTime+=delta;old.time=actor.previous==='Kick'?Math.min(actor.previousTime,old.getClip().duration-.00001):actor.previousTime%old.getClip().duration;if(w>=1)actor.previous='';}
  actor.mixer.update(0);
 }
 setPlayer(profile,kit){
  this.profile={name:String(profile?.name||''),number:profile?.number||10};this.kit=kit;if(!this.loaded)return;
  const signature=JSON.stringify([this.profile,kit]);if(signature===this.signature)return;this.signature=signature;
  const m=this.materials.hero;m.Jersey_Base.color.set(kit.shirt);m.Jersey_Stripe.color.set(kit.name==='Barrio'?'#77bedb':kit.trim);m.Jersey_Trim.color.set(kit.shorts);m.Shorts.color.set(kit.shorts);m.Boots.color.set(kit.name==='Barrio'?'#fff2db':kit.boots);
  for(let i=0;i<2;i++){const c=this.labelCanvases[i].getContext('2d');c.clearRect(0,0,512,512);c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle=kit.name==='Barrio'?'#182e40':'#fff6e1';
   if(i===1){let fs=55;c.font='900 '+fs+'px Arial';while(c.measureText(this.profile.name).width>450&&fs>19)c.font='900 '+(--fs)+'px Arial';c.fillText(this.profile.name,256,105);c.font='900 292px Arial';c.fillText(String(this.profile.number),256,430);}else{c.font='900 145px Arial';c.fillText(String(this.profile.number),228,320);}this.labelTextures[i].needsUpdate=true;
  }
 }
 begin(){this.opponents?.begin();for(const role of Object.keys(this.pools)){this.cursors[role]=0;for(const a of this.pools[role])a.root.visible=false;}}
 draw(x,z,time,kit,o={},game){
  if(!this.loaded)return;if(o.keeper)return this.opponents.drawKeeper(x,z,time,o,game);if(o.defender)return this.opponents.drawDefender(x,z,time,o,game);const role=o.keeper?'keeper':o.defender?'defender':'hero',actor=this.pools[role][this.cursors[role]++];if(!actor)return;
  const effective=game?.mode==='pause'?game.beforePause:game?.mode,paused=game?.mode==='pause';
  let delta=actor.lastTime===null?0:clamp(time-actor.lastTime,0,.05);const reset=actor.lastTime===null||time<actor.lastTime||time-actor.lastTime>1;actor.lastTime=time;if(paused)delta=0;
  if(reset){actor.phase=0;actor.bank=0;actor.current='';actor.previous='';}
  const anim=o.kick?'Kick':role==='keeper'?'Defend':o.run?'Run':'Idle';
  if(anim==='Run')actor.phase+=delta*(role==='hero'?clamp((game?.speed||14.5)/14.5,1,1.8):1);
  const phase=anim==='Kick'?o.kickTime||0:anim==='Run'?actor.phase:time;
  this.sample(actor,anim,phase,delta,role==='hero'&&!reset);
  let yaw=PI+(o.facing||0);if(o.idle)yaw+=Math.sin(time*.40)*.45;
  const scale=(o.scale||1)*1.09;actor.root.visible=true;actor.root.position.set(x,o.y||0,z);actor.root.scale.setScalar(scale);
  const lateral=role==='hero'&&effective==='run'?clamp(((window.PotreroCore.LANES[game?.lane]||0)-(game?.x||0))/2.8,-1,1):0;
  actor.bank+=(-lateral*.22-actor.bank)*(1-Math.exp(-delta*15));
  actor.root.rotation.set(0,yaw+actor.bank*.7,(o.lean||0)+actor.bank);
  if(role==='hero'){
   // Counter-balance shoulders/head while stepping laterally; skin weights remain intact.
   const b=actor.bones;for(const [n,q] of Object.entries(actor.basePose))if(b[n])q.copy(b[n].quaternion);actor.hasAdditive=true;b.Chest?.quaternion.multiply(actor.q.setFromAxisAngle(Z,-actor.bank*.24));b.Head?.quaternion.multiply(actor.q.setFromAxisAngle(Z,-actor.bank*.40));
   if(effective==='run'){b.Thigh_L?.quaternion.multiply(actor.q.setFromAxisAngle(Z,actor.bank*.17));b.Thigh_R?.quaternion.multiply(actor.q.setFromAxisAngle(Z,actor.bank*.17));}
   actor.root.updateMatrixWorld(true);
   if(o.kick&&b.Foot_R){actor.contact.set(0,.19,0);b.Foot_R.localToWorld(actor.contact);this.lastKickToe=actor.contact;}
  }
  this.r.add('disk',[x,.025,z],[.90*scale,1,.56*scale],[.015,.045,.05,.20],[],null,{layer:1.5,unlit:true});
 }
 setupPreview(){
  this.previewRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});this.previewRenderer.setSize(448,448,false);this.previewRenderer.outputColorSpace=THREE.SRGBColorSpace;this.previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;this.previewRenderer.toneMappingExposure=1;this.previewRenderer.setClearColor(0,0);
  this.previewScene=new THREE.Scene();this.previewScene.add(new THREE.HemisphereLight(0xd8eaff,0x66604e,1.6));const key=new THREE.DirectionalLight(0xffecd4,2.6);key.position.set(-3,4,5);this.previewScene.add(key);const rim=new THREE.DirectionalLight(0x91c6ff,1.5);rim.position.set(3,3,-4);this.previewScene.add(rim);
  this.previewCamera=new THREE.OrthographicCamera(-1.20,1.20,1.20,-1.20,.1,20);this.previewScene.add(this.previewActor.root);this.opponents.setupPreview(this.previewScene);
 }
 preview(canvas,back=false,angle=null,animation='Idle',time=0){
  if(!this.loaded)return;this.opponents.hidePreview();this.previewCamera.left=-1.20;this.previewCamera.right=1.20;this.previewCamera.top=1.20;this.previewCamera.bottom=-1.20;this.previewCamera.updateProjectionMatrix();const a=this.previewActor;this.sample(a,animation,time);a.root.visible=true;a.root.position.set(0,0,0);a.root.rotation.set(0,angle??(back?PI:0),0);a.root.scale.setScalar(1);this.previewCamera.position.set(0,1.24,4.5);this.previewCamera.lookAt(0,1.07,0);this.previewRenderer.render(this.previewScene,this.previewCamera);const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(this.previewRenderer.domElement,0,0,canvas.width,canvas.height);
 }
 stats(){return {type:'skinned-glb',version:'6.0.0',opponentModels:RIVALS.map(r=>r.id),opponentPack:'/models/potrero-rivals-v6.glb',heroModel:'/models/potrero-player-v5.glb',bones:18,clips:Object.keys(this.clips||{}),transitionSeconds:.14,kickContactSeconds:.30,pools:Object.fromEntries(Object.entries(this.pools).map(([r,p])=>[r,p.length])),loaded:this.loaded};}
}
