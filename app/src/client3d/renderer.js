import * as THREE from 'three';
const Legacy=window.P3D.Renderer;
const vertex=`attribute vec4 instanceRGBA;
varying vec4 vRGBA; varying vec3 vN; varying vec2 vUV; varying float vDist;
void main(){mat4 m=modelMatrix*instanceMatrix;vec4 w=m*vec4(position,1.0);vRGBA=instanceRGBA;vUV=uv;
mat3 nm=mat3(m[0].xyz/max(dot(m[0].xyz,m[0].xyz),.00001),m[1].xyz/max(dot(m[1].xyz,m[1].xyz),.00001),m[2].xyz/max(dot(m[2].xyz,m[2].xyz),.00001));vN=normalize(nm*normal);vDist=distance(w.xyz,cameraPosition);gl_Position=projectionMatrix*viewMatrix*w;}`;
const fragment=`precision mediump float; varying vec4 vRGBA;varying vec3 vN;varying vec2 vUV;varying float vDist;uniform float uUnlit;uniform float uTextured;uniform sampler2D uTexture;uniform vec3 uFog;
void main(){vec4 c=vRGBA;if(uTextured>.5)c*=texture2D(uTexture,vUV);if(c.a<.025)discard;vec3 n=normalize(vN);float key=max(dot(n,normalize(vec3(-.6,1.,.8))),0.);float rim=max(dot(n,normalize(vec3(.7,.35,-1.))),0.);vec3 light=vec3(.47,.53,.57)+key*vec3(.54,.49,.37)+rim*vec3(.12,.21,.23);vec3 rgb=c.rgb*mix(light,vec3(1.),uUnlit);gl_FragColor=vec4(mix(rgb,uFog,smoothstep(52.,165.,vDist)),c.a);}`;
export class Renderer3D {
 constructor(canvas){
  this.canvas=canvas;this.backend=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  this.backend.setClearColor(0,0);this.backend.outputColorSpace=THREE.SRGBColorSpace;this.backend.toneMapping=THREE.ACESFilmicToneMapping;this.backend.toneMappingExposure=1.0;
  this.backend.shadowMap.enabled=true;this.backend.shadowMap.type=THREE.PCFSoftShadowMap;this.gl=this.backend.getContext();
  this.scene=new THREE.Scene();this.scene.fog=new THREE.Fog(0x12292f,52,165);this.camera=new THREE.PerspectiveCamera(55,1,.08,220);
  this.camera.position.set(0,3,8);this.scene.add(new THREE.HemisphereLight(0xd4eaff,0x52624b,1.7));
  this.key=new THREE.DirectionalLight(0xffead0,2.7);this.key.position.set(-4,7,5);this.key.castShadow=true;this.key.shadow.mapSize.set(1024,1024);Object.assign(this.key.shadow.camera,{left:-4.6,right:4.6,top:4.6,bottom:-4.6,near:.1,far:24});this.key.shadow.bias=-.0003;this.key.shadow.normalBias=.03;this.scene.add(this.key,this.key.target);
  const rim=new THREE.DirectionalLight(0xaccfff,1.3);rim.position.set(3,4,-7);this.scene.add(rim);
  this.actorRoot=new THREE.Group();this.scene.add(this.actorRoot);this.characters=null;
  this.shapes={};this.batches=new Map();this.textures={};this.clearColor=[.095,.165,.18];this.drawCalls=0;this._fog=new THREE.Vector3();
  const f=window.P3D.factories;
  this.addGeometry('box',f.box());this.addGeometry('sphere',f.sphere());this.addGeometry('cylinder',f.cylinder());this.addGeometry('cone',f.cylinder(.13));this.addGeometry('taper',f.cylinder(.8));this.addGeometry('disk',f.disk());this.addGeometry('ring',f.torus());
  this.addGeometry('quad',{v:[-.5,-.5,0,0,0,1,0,0,.5,-.5,0,0,0,1,1,0,.5,.5,0,0,0,1,1,1,-.5,.5,0,0,0,1,0,1],idx:[0,1,2,0,2,3]});
  const catcher=new THREE.Mesh(new THREE.PlaneGeometry(30,36),new THREE.ShadowMaterial({opacity:.23,depthWrite:false}));catcher.rotation.x=-Math.PI/2;catcher.position.set(0,.034,-8);catcher.receiveShadow=true;catcher.renderOrder=8;this.scene.add(catcher);this.resize();
 }
 addGeometry(name,data){
  const g=new THREE.BufferGeometry(),n=data.v.length/8,p=new Float32Array(n*3),no=new Float32Array(n*3),uv=new Float32Array(n*2);
  for(let i=0;i<n;i++){p.set(data.v.slice(i*8,i*8+3),i*3);no.set(data.v.slice(i*8+3,i*8+6),i*3);uv.set(data.v.slice(i*8+6,i*8+8),i*2);}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(no,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(data.idx);this.shapes[name]=g;
 }
 texture(name,image){let t=this.textures[name];if(!t){t=new THREE.CanvasTexture(image);t.colorSpace=THREE.NoColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;this.textures[name]=t;}else{t.image=image;t.needsUpdate=true;}return t;}
 resize(){const dpr=Math.min(devicePixelRatio||1,innerWidth<700?1.25:1.5);this.backend.setPixelRatio(dpr);this.backend.setSize(this.canvas.clientWidth,this.canvas.clientHeight,false);}
 begin(){for(const b of this.batches.values())b.data.length=0;this.characters?.begin();}
 _batch(b,count){
  const capacity=Math.max(16,2**Math.ceil(Math.log2(count)));
  if(b.mesh&&b.capacity>=count)return;
  if(b.mesh){this.scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.material.dispose();}
  const g=this.shapes[b.shape].clone();g.setAttribute('instanceRGBA',new THREE.InstancedBufferAttribute(new Float32Array(capacity*4),4).setUsage(THREE.DynamicDrawUsage));
  const m=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{uFog:{value:this._fog},uUnlit:{value:b.unlit},uTextured:{value:b.texture?1:0},uTexture:{value:b.texture?this.textures[b.texture]:null}},transparent:true,depthWrite:b.layer<5,side:THREE.DoubleSide,toneMapped:false});
  b.mesh=new THREE.InstancedMesh(g,m,capacity);b.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);b.mesh.frustumCulled=false;b.mesh.renderOrder=b.layer;this.scene.add(b.mesh);b.capacity=capacity;
 }
 render(eye,target,fov=55){
  this.eye=eye;this.camera.position.fromArray(eye);this.camera.aspect=this.canvas.clientWidth/this.canvas.clientHeight;this.camera.fov=fov;this.camera.lookAt(...target);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  this._fog.fromArray(this.clearColor);this.scene.fog.color.setRGB(...this.clearColor,THREE.SRGBColorSpace);
  for(const b of this.batches.values()){
   const count=b.data.length/20;if(!count){if(b.mesh)b.mesh.visible=false;continue;}this._batch(b,count);b.mesh.visible=true;b.mesh.count=count;
   const mx=b.mesh.instanceMatrix.array,col=b.mesh.geometry.attributes.instanceRGBA.array;
   for(let i=0;i<count;i++){for(let j=0;j<16;j++)mx[i*16+j]=b.data[i*20+j];for(let j=0;j<4;j++)col[i*4+j]=b.data[i*20+16+j];}
   b.mesh.instanceMatrix.needsUpdate=true;b.mesh.geometry.attributes.instanceRGBA.needsUpdate=true;
  }
  const hero=this.characters?.pools.hero.find(a=>a.root.visible);if(hero){const p=hero.root.position;this.key.position.set(p.x-4,7,p.z+5);this.key.target.position.set(p.x,1,p.z);this.key.target.updateMatrixWorld();}
  this.backend.render(this.scene,this.camera);this.drawCalls=this.backend.info.render.calls;this.vp=new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse).elements;
 }
}
for(const key of ['add','matrix','segment','project'])Renderer3D.prototype[key]=Legacy.prototype[key];
