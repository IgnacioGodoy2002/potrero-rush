/* V6: bounded skinned opponents. Visual movement never changes collision/scoring rules. */
import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
const UP=new THREE.Vector3(0,1,0);
const PI=Math.PI,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export const RIVALS=[
 {id:'rayo',root:'V6_Rayo_Rig',name:'RAYO',label:'CORTE CORTO · PASO ÁGIL',description:'Camiseta coral, peinado corto y pasos laterales. Mirá la flecha sobre su cabeza para anticipar un cruce.',accent:'#f28b67',tempo:1.16},
 {id:'muro',root:'V6_Muro_Rig',name:'MURO',label:'HOMBROS ANCHOS · POSTURA FIRME',description:'Más ancho de hombros, pelo al ras y brazalete dorado. Su apariencia no cambia el tamaño de la colisión.',accent:'#e3b46b',tempo:.90},
 {id:'finta',root:'V6_Finta_Rig',name:'FINTA',label:'RULOS · MOVIMIENTO ELÁSTICO',description:'Rulos, vincha y camiseta cobre. Flexiona las rodillas y acompaña los cambios de carril con brazos y torso.',accent:'#e19c73',tempo:1.04},
 {id:'keeper',root:'V6_Keeper_Rig',name:'EL GUARDIÁN',label:'GUANTES · BLOQUEO · VOLADA',description:'Uniforme de arquero, mangas largas y guantes articulados. Ajusta las manos a la pelota y se recupera después de rechazarla.',accent:'#95dcd1',tempo:1}
];
export function variantFor(seed){const n=Number.isFinite(seed)?seed:0;return Math.min(2,Math.floor(Math.abs(n%1)*3));}
function scratch(){return {a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3(),d:new THREE.Vector3(),p:new THREE.Vector3(),e:new THREE.Vector3(),u:new THREE.Vector3(),v:new THREE.Vector3(),q:new THREE.Quaternion(),q2:new THREE.Quaternion(),q3:new THREE.Quaternion()};}
function aim(bone,child,target,s){
 bone.getWorldPosition(s.u);child.getWorldPosition(s.v);s.v.sub(s.u).normalize();s.d.copy(target).sub(s.u).normalize();
 s.q.setFromUnitVectors(s.v,s.d);bone.getWorldQuaternion(s.q2);s.q.multiply(s.q2);bone.parent.getWorldQuaternion(s.q3).invert();bone.quaternion.copy(s.q3.multiply(s.q));bone.updateWorldMatrix(false,true);
}
function solve(actor,upper,lower,end,target,pole){
 const A=actor.bones[upper],B=actor.bones[lower],C=actor.bones[end],s=actor.ik;if(!A||!B||!C)return;
 actor.root.updateWorldMatrix(true,true);A.getWorldPosition(s.a);B.getWorldPosition(s.b);C.getWorldPosition(s.c);
 const l1=s.a.distanceTo(s.b),l2=s.b.distanceTo(s.c),distance=s.a.distanceTo(target),len=clamp(distance,Math.abs(l1-l2)+.001,l1+l2-.001);
 s.d.copy(target).sub(s.a).normalize();s.p.copy(pole).sub(s.a);s.p.addScaledVector(s.d,-s.p.dot(s.d));
 if(s.p.lengthSq()<1e-7)s.p.set(0,0,1);s.p.normalize();
 const along=(l1*l1-l2*l2+len*len)/(2*len),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 s.e.copy(s.a).addScaledVector(s.d,along).addScaledVector(s.p,height);actor.solvedTarget.copy(s.a).addScaledVector(s.d,len);
 aim(A,B,s.e,s);aim(B,C,actor.solvedTarget,s);
}
export class OpponentSystem {
 constructor(owner,gltf){
  this.owner=owner;this.r=owner.r;this.sources=[];this.pools=[[],[],[],[]];this.cursors=[0,0,0,0];this.previewActors=[];this.lastKeeper=null;
  for(const info of RIVALS){
   const root=gltf.scene.getObjectByName(info.root);if(!root)throw Error('No se pudo cargar el rival '+info.name);
   root.traverse(o=>{if(o.isBone&&o.userData.potreroBone)o.name=o.userData.potreroBone;});
   root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.setScalar(1);this.sources.push(root);
  }
 }
 makeActor(variant,attach=true){
  const root=clone(this.sources[variant]);root.name='RivalV6_'+RIVALS[variant].id;root.visible=false;const bones={};
  root.traverse(o=>{if(o.isBone)bones[o.name]=o;if(o.isMesh){o.frustumCulled=false;o.castShadow=variant===3;o.receiveShadow=false;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){m.side=THREE.DoubleSide;const n=m.userData.roleName||m.name;if(['Jersey_Base','Jersey_Stripe','Shorts','Socks'].includes(n)){m.roughness=.86;m.normalMap=this.owner.fabric;m.normalScale?.set(.055,.055);}}}});
  const mixer=new THREE.AnimationMixer(root),actions={};for(const [n,c] of Object.entries(this.owner.clips))actions[n]=mixer.clipAction(c);
  const actor={root,bones,mixer,actions,variant,role:variant===3?'keeper':'defender',current:'',previous:'',fade:1,previousTime:0,hasAdditive:false,basePose:{},ik:scratch(),solvedTarget:new THREE.Vector3(),target:new THREE.Vector3(),pole:new THREE.Vector3(),offset:new THREE.Vector3(),rootQ:new THREE.Quaternion(),handQ:new THREE.Quaternion(),tempQ:new THREE.Quaternion(),palms:[new THREE.Vector3(),new THREE.Vector3()],rawPose:{},restore:false,lastEntity:null};
  for(const [n,b] of Object.entries(bones))actor.rawPose[n]={position:b.position.clone(),quaternion:b.quaternion.clone(),scale:b.scale.clone()};
  if(attach){this.r.actorRoot.add(root);this.pools[variant].push(actor);}return actor;
 }
 begin(){this.cursors.fill(0);}
 base(actor,time=0){
  if(actor.restore)for(const [n,p] of Object.entries(actor.rawPose)){const b=actor.bones[n];b.position.copy(p.position);b.quaternion.copy(p.quaternion);b.scale.copy(p.scale);}
  this.owner.sample(actor,'Defend',time);
  for(const [n,p] of Object.entries(actor.rawPose)){const b=actor.bones[n];p.position.copy(b.position);p.quaternion.copy(b.quaternion);p.scale.copy(b.scale);}actor.restore=true;
 }
 localLimb(actor,type,side,target,pole){
  const suffix=side<0?'L':'R';actor.target.set(...target);actor.pole.set(...pole);actor.root.localToWorld(actor.target);actor.root.localToWorld(actor.pole);
  solve(actor,type==='arm'?'UpperArm_'+suffix:'Thigh_'+suffix,type==='arm'?'Forearm_'+suffix:'Shin_'+suffix,type==='arm'?'Hand_'+suffix:'Foot_'+suffix,actor.target,actor.pole);
 }
 ready(actor,time,moving=0,beaten=0,crouch=0){
  this.base(actor,time);const v=actor.variant,tempo=RIVALS[v].tempo,phase=time*9.5*tempo;
  actor.bones.Hips.position.y-=.08+crouch+.02*Math.abs(Math.sin(phase))*moving;
  actor.bones.Chest.rotation.x+=.08+beaten*.24;actor.bones.Head.rotation.y+=Math.sin(time*2)*.035;
  actor.root.updateWorldMatrix(true,true);
  for(const side of [-1,1]){
   const ph=phase+(side>0?PI:0),lift=Math.max(0,Math.sin(ph))*.055*moving;
   this.localLimb(actor,'leg',side,[side*(.225+Math.sin(ph)*.020*moving),.147+lift,Math.cos(ph)*.035*moving],[side*.29,.48,.42]);
   this.localLimb(actor,'arm',side,[side*(.41+beaten*.08),1.10+Math.sin(ph)*.06*moving+beaten*.15,.22-beaten*.18],[side*.62,1.08,.10]);
  }
 }
 drawDefender(x,z,time,o,game){
  const v=variantFor(o.styleSeed),a=this.pools[v][this.cursors[v]++];if(!a)return;
  a.root.visible=true;a.root.position.set(x,0,z);a.root.scale.setScalar(1.09);
  const moving=o.crossing?1:.16,side=o.moveDir||0,beaten=clamp(o.beaten||0,0,1);
  a.root.rotation.set(.015,Math.PI+(o.facing||Math.PI)+side*.10*moving,(o.lean||0)-side*.075*moving);
  this.ready(a,time,moving,beaten);a.lastEntity=o.entityId||null;a.state=beaten?'beaten':o.crossing?'shuffle':'ready';
  this.r.add('disk',[x,.026,z],[1.00,1,.58],[.015,.045,.05,.21],[],null,{layer:1.5,unlit:true});return a;
 }
 reachPalm(actor,side,target,amount=1){
  const suffix=side<0?'L':'R',hand=actor.bones['Hand_'+suffix];actor.root.getWorldQuaternion(actor.rootQ);
  actor.handQ.setFromAxisAngle(UP,PI).premultiply(actor.rootQ);
  actor.offset.fromArray(hand.userData.palmLocal||[side*.025,.067,-.049]).multiplyScalar(actor.root.scale.x).applyQuaternion(actor.handQ);
  actor.target.copy(target).sub(actor.offset);actor.pole.set(side*.68,1.16,.04);actor.root.localToWorld(actor.pole);
  solve(actor,'UpperArm_'+suffix,'Forearm_'+suffix,'Hand_'+suffix,actor.target,actor.pole);
  hand.parent.getWorldQuaternion(actor.tempQ).invert();hand.quaternion.copy(actor.tempQ.multiply(actor.handQ));actor.root.updateWorldMatrix(true,true);
  actor.palms[side<0?0:1].fromArray(hand.userData.palmLocal||[side*.025,.067,-.049]);hand.localToWorld(actor.palms[side<0?0:1]);
 }
 keeperPose(a,x,z,time,o,game){
  const mode=game.mode==='pause'?game.beforePause:game.mode,s=game.shot,goalZ=o.goalZ??z-.8;
  const shot=!!s&&['flight','result','over'].includes(mode)&&!s.timeout;
  let reach=0,recovery=0,lean=0,tx=x,ty=1.1,endX=x,endY=0,travelAmount=0;
  if(shot){
   const p=mode==='flight'?clamp((game.modeTime-.30)/(.70*.64),0,1):1;reach=smooth(p);
   recovery=mode==='result'?smooth((game.modeTime-.12)/1.35):0;
   tx=s.diveX;ty=clamp(s.y,.55,2.15);const dir=Math.sign(tx-s.startKeeper),travel=Math.min(1,Math.abs(tx-s.startKeeper)/1.3);travelAmount=travel;
   lean=-dir*(ty<.90?1.0:.74)*travel;
   endX=tx-Math.sin(-lean)*1.23-dir*.10;endY=Math.max(.015,ty-Math.cos(lean)*1.23-.08);
   a.root.position.set(THREE.MathUtils.lerp(s.startKeeper,endX,reach),endY*reach,goalZ+.38);
   a.root.rotation.set(0,0,lean*reach);
   if(recovery){a.root.position.x=THREE.MathUtils.lerp(endX,tx,recovery);a.root.position.y*=1-recovery;a.root.rotation.z*=1-recovery;}
  }else{a.root.position.set(x,0,goalZ+.38);a.root.rotation.set(0,0,Math.sin(time*4)*.018);}
  a.root.scale.setScalar(1.09);a.root.visible=true;
  const crouch=shot?clamp(1.12-ty,0,.32)*reach*(1-recovery)*(1-travelAmount):0;
  this.ready(a,time,shot?0:.55,0,crouch);
  if(shot){a.bones.Foot_L.getWorldPosition(a.target);a.bones.Foot_R.getWorldPosition(a.pole);a.root.position.y+=Math.max(0,.16-Math.min(a.target.y,a.pole.y));a.root.updateWorldMatrix(true,true);}
  // Two anatomical arms target the same contact plane used by the ball path.
  for(const side of [-1,1]){
   const ready=a.target.set(side*.39,1.07,.30);a.root.localToWorld(ready);
   a.palms[side<0?0:1].set(tx+side*.10,ty-.025,goalZ+.66);
   ready.lerp(a.palms[side<0?0:1],reach*(1-recovery));
   const target=ready.clone();this.reachPalm(a,side,target);
  }
  a.state=shot?(recovery>.97?'ready':recovery>0?'recover':Math.abs(lean)>.25?(ty<.9?'dive-low':'dive-high'):'block'):'ready';
  a.contactTarget.set(tx,ty,goalZ+.85);a.root.updateWorldMatrix(true,true);return a;
 }
 drawKeeper(x,z,time,o,game){
  const a=this.pools[3][0];if(!a)return;a.contactTarget??=new THREE.Vector3();this.keeperPose(a,x,z,time,o,game);this.lastKeeper=a;
  this.r.add('disk',[a.root.position.x,.027,z],[1.12,1,.70],[.015,.045,.05,.24],[],null,{layer:1.5,unlit:true});
  const mode=game.mode==='pause'?game.beforePause:game.mode;
  if(game.shot?.outcome==='save'&&mode==='flight'){
   const since=game.modeTime-.748;if(since>=0&&since<.16){this.r.add('ring',[game.shot.diveX,clamp(game.shot.y,.55,2.15),o.goalZ+.90],[.48+since*2,.48+since*2,1],[.85,1,.90,(1-since/.16)*.7],[],null,{layer:4,unlit:true});}
  }
  return a;
 }
 setupPreview(scene){for(let v=0;v<4;v++){const a=this.makeActor(v,false);a.contactTarget=new THREE.Vector3();scene.add(a.root);this.previewActors.push(a);}}
 hidePreview(){for(const a of this.previewActors)a.root.visible=false;}
 preview(canvas,variant,motion,time,angle=0){
  const owner=this.owner,a=this.previewActors[variant];if(!a)return;this.hidePreview();owner.previewActor.root.visible=false;
  a.root.visible=true;a.root.position.set(0,0,0);a.root.scale.setScalar(1.09);a.root.rotation.set(0,angle,0);
  if(variant===3){
   const s=motion==='ready'?null:{outcome:'save',startKeeper:0,diveX:motion==='block'?0:motion==='left'?-.85:.85,y:motion==='low'?.65:motion==='block'?1.12:1.9};
   const t=time%2.8,g={mode:s?(t<1?'flight':'result'):'aim',modeTime:t<1?t:t-1,shot:s};this.keeperPose(a,0,.8,time,{goalZ:0},g);
   a.root.position.z-=.8;
   // Only rotate the review presentation, never alter the game save target.
   a.root.rotation.y+=angle;
  }else this.ready(a,time,motion==='shuffle'?1:.12,motion==='beaten'?smooth((Math.sin(time*3)+1)/2):0);
  owner.previewCamera.left=-1.6;owner.previewCamera.right=1.6;owner.previewCamera.top=1.5;owner.previewCamera.bottom=-1.5;owner.previewCamera.updateProjectionMatrix();
  owner.previewCamera.position.set(0,1.22,4.8);owner.previewCamera.lookAt(0,1.08,0);owner.previewRenderer.render(owner.previewScene,owner.previewCamera);
  const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(owner.previewRenderer.domElement,0,0,canvas.width,canvas.height);
 }
}
