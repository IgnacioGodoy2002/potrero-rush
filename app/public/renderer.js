/* Motor WebGL original y autocontenido. Geometría instanciada; no usa servicios externos. */
(function(root){'use strict';
const PI=Math.PI;
const V={sub:(a,b)=>a.map((x,i)=>x-b[i]),dot:(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{let n=Math.hypot(...a)||1;return a.map(v=>v/n);}};
const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mul(a,b){let m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)m[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return m;}
function trs(p=[0,0,0],s=[1,1,1],r=[0,0,0]){
 const [x=0,y=0,z=0]=r, cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
 // RY * RX * RZ, column-major.
 return new Float32Array([(cy*cz+sy*sx*sz)*s[0],cx*sz*s[0],(-sy*cz+cy*sx*sz)*s[0],0,(-cy*sz+sy*sx*cz)*s[1],cx*cz*s[1],(sy*sz+cy*sx*cz)*s[1],0,sy*cx*s[2],-sx*s[2],cy*cx*s[2],0,p[0],p[1],p[2],1]);
}
function view(eye,target){let z=V.norm(V.sub(eye,target)),x=V.norm(V.cross([0,1,0],z)),y=V.cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-V.dot(x,eye),-V.dot(y,eye),-V.dot(z,eye),1]);}
function perspective(fov,aspect,near=.1,far=220){let f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
function hex(h,alpha=1){if(Array.isArray(h))return h;let n=parseInt(h.replace('#',''),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255,alpha];}
function box(){let v=[],idx=[];const fs=[[[1,0,0],[[.5,-.5,-.5],[.5,-.5,.5],[.5,.5,.5],[.5,.5,-.5]]],[[-1,0,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[-.5,.5,-.5],[-.5,.5,.5]]],[[0,1,0],[[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]]],[[0,-1,0],[[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]]],[[0,0,1],[[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,.5],[.5,.5,.5]]],[[0,0,-1],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]]]];
 for(const [n,ps]of fs){let o=v.length/8;ps.forEach((p,i)=>v.push(...p,...n,...[[0,0],[1,0],[1,1],[0,1]][i]));idx.push(o,o+1,o+2,o,o+2,o+3);}return{v,idx};}
function sphere(lat=12,lon=18){let v=[],idx=[];for(let i=0;i<=lat;i++){let p=i/lat*PI;for(let j=0;j<=lon;j++){let t=j/lon*2*PI,x=Math.sin(p)*Math.sin(t),y=Math.cos(p),z=Math.sin(p)*Math.cos(t);v.push(x*.5,y*.5,z*.5,x,y,z,j/lon,1-i/lat);}}
 for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){let a=i*(lon+1)+j,b=a+lon+1;idx.push(a,b,a+1,b,b+1,a+1);}return{v,idx};}
function cylinder(top=1,segments=16){let v=[],idx=[];for(let i=0;i<=segments;i++){let a=i/segments*2*PI,x=Math.cos(a),z=Math.sin(a);v.push(x*.5,-.5,z*.5,x,(1-top)*.5,z,i/segments,0,x*.5*top,.5,z*.5*top,x,(1-top)*.5,z,i/segments,1);}
 for(let i=0;i<segments;i++){let k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}for(let s=0;s<2;s++){let o=v.length/8,y=s? .5:-.5;v.push(0,y,0,0,s?1:-1,0,.5,.5);for(let i=0;i<=segments;i++){let a=i/segments*2*PI,x=Math.cos(a)*.5*(s?top:1),z=Math.sin(a)*.5*(s?top:1);v.push(x,y,z,0,s?1:-1,0,x+.5,z+.5);if(i)idx.push(o,o+i,o+i+1);}}return{v,idx};}
function disk(){let v=[0,0,0,0,1,0,.5,.5],idx=[];for(let i=0;i<=40;i++){let a=i/40*2*PI,x=Math.cos(a)*.5,z=Math.sin(a)*.5;v.push(x,0,z,0,1,0,x+.5,z+.5);if(i)idx.push(0,i,i+1);}return{v,idx};}
function torus(){let v=[],idx=[],N=40,M=6;for(let i=0;i<=N;i++)for(let j=0;j<=M;j++){let a=i/N*2*PI,b=j/M*2*PI,R=.45+.035*Math.cos(b);v.push(Math.cos(a)*R,Math.sin(a)*R,Math.sin(b)*.035,Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b),i/N,j/M);}for(let i=0;i<N;i++)for(let j=0;j<M;j++){let a=i*(M+1)+j,b=a+M+1;idx.push(a,b,a+1,b,b+1,a+1);}return{v,idx};}
class Renderer{
 constructor(canvas){
  this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'high-performance',premultipliedAlpha:false});if(!gl)throw new Error('Este navegador no pudo iniciar WebGL. Activá la aceleración gráfica.');
  this.ext=gl.getExtension('ANGLE_instanced_arrays');this.shapes={};this.batches=new Map;this.textures={};this.clearColor=[.095,.165,.18];
  const vs=`precision highp float;attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;attribute vec4 i0;attribute vec4 i1;attribute vec4 i2;attribute vec4 i3;attribute vec4 iColor;uniform mat4 uVP;uniform vec3 uEye;varying vec3 vNormal;varying vec4 vColor;varying vec2 vUV;varying float vDistance;void main(){mat4 model=mat4(i0,i1,i2,i3);vec4 world=model*vec4(aPosition,1.0);mat3 nm=mat3(i0.xyz/max(dot(i0.xyz,i0.xyz),.000001),i1.xyz/max(dot(i1.xyz,i1.xyz),.000001),i2.xyz/max(dot(i2.xyz,i2.xyz),.000001));vNormal=normalize(nm*aNormal);vColor=iColor;vUV=aUV;vDistance=distance(world.xyz,uEye);gl_Position=uVP*world;}`;
  const fs=`precision mediump float;varying vec3 vNormal;varying vec4 vColor;varying vec2 vUV;varying float vDistance;uniform float uUnlit;uniform float uTextured;uniform sampler2D uTexture;uniform vec3 uFog;void main(){vec4 col=vColor;if(uTextured>.5)col*=texture2D(uTexture,vUV);if(col.a<.015)discard;vec3 n=normalize(vNormal);float key=max(dot(n,normalize(vec3(-.6,1.0,.8))),0.0);float rim=max(dot(n,normalize(vec3(.7,.35,-1.0))),0.0);vec3 lighting=vec3(.47,.53,.57)+key*vec3(.54,.49,.37)+rim*vec3(.12,.21,.23);vec3 rgb=col.rgb*mix(lighting,vec3(1.0),uUnlit);float fog=smoothstep(52.0,165.0,vDistance);gl_FragColor=vec4(mix(rgb,uFog,fog),col.a);}`;
  const compile=(type,source)=>{let s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const program=this.program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  this.attrs={};for(const n of ['aPosition','aNormal','aUV','i0','i1','i2','i3','iColor'])this.attrs[n]=gl.getAttribLocation(program,n);
  this.u={};for(const n of ['uVP','uEye','uUnlit','uTextured','uTexture','uFog'])this.u[n]=gl.getUniformLocation(program,n);
  this.instanceBuffer=gl.createBuffer();this.capacity=0;this.instanceData=new Float32Array(20*4096);
  this.addGeometry('box',box());this.addGeometry('sphere',sphere());this.addGeometry('cylinder',cylinder());this.addGeometry('cone',cylinder(.13));this.addGeometry('taper',cylinder(.8));this.addGeometry('disk',disk());this.addGeometry('ring',torus());
  this.addGeometry('quad',{v:[-.5,-.5,0,0,0,1,0,0,.5,-.5,0,0,0,1,1,0,.5,.5,0,0,0,1,1,1,-.5,.5,0,0,0,1,0,1],idx:[0,1,2,0,2,3]});
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);this.resize();
 }
 addGeometry(name,data){const gl=this.gl,vbo=gl.createBuffer(),ibo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.v),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(data.idx),gl.STATIC_DRAW);this.shapes[name]={vbo,ibo,count:data.idx.length};}
 texture(name,canvas){const gl=this.gl,t=this.textures[name]||gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);this.textures[name]=t;}
 resize(){let dpr=Math.min(window.devicePixelRatio||1,window.innerWidth<700?1.5:1.75),w=Math.round(this.canvas.clientWidth*dpr),h=Math.round(this.canvas.clientHeight*dpr);if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);}
 begin(){for(const b of this.batches.values())b.data.length=0;}
 add(shape,p,s,color,r=[0,0,0],parent=null,opt={}){let m=trs(p,s,r);if(parent)m=mul(parent,m);this.matrix(shape,m,color,opt);return m;}
 matrix(shape,m,color,opt={}){const c=hex(color),key=`${opt.layer||2}|${shape}|${opt.texture||''}|${opt.unlit?1:0}`;let b=this.batches.get(key);if(!b){b={shape,texture:opt.texture,unlit:opt.unlit?1:0,layer:opt.layer||2,data:[]};this.batches.set(key,b);}b.data.push(...m,c[0],c[1],c[2],c[3]??1);}
 segment(a,b,r,color,parent=null,opt={}){let d=V.sub(b,a),length=Math.hypot(...d);if(length<.00001)return;let y=V.norm(d),helper=Math.abs(y[1])>.98?[1,0,0]:[0,1,0],x=V.norm(V.cross(helper,y)),z=V.cross(x,y),p=a.map((v,i)=>(v+b[i])/2);let m=new Float32Array([x[0]*r,x[1]*r,x[2]*r,0,y[0]*length,y[1]*length,y[2]*length,0,z[0]*r,z[1]*r,z[2]*r,0,...p,1]);if(parent)m=mul(parent,m);this.matrix('cylinder',m,color,opt);}
 render(eye,target,fov=55){
  const gl=this.gl;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
  this.eye=eye;this.vp=mul(perspective(fov*PI/180,this.canvas.width/this.canvas.height),view(eye,target));gl.uniformMatrix4fv(this.u.uVP,false,this.vp);gl.uniform3fv(this.u.uEye,eye);gl.uniform3fv(this.u.uFog,this.clearColor);gl.uniform1i(this.u.uTexture,0);
  const batches=Array.from(this.batches.values()).filter(b=>b.data.length).sort((a,b)=>a.layer-b.layer);this.drawCalls=0;
  for(const batch of batches){
   const geom=this.shapes[batch.shape];gl.bindBuffer(gl.ARRAY_BUFFER,geom.vbo);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,geom.ibo);
   for(const [name,size,offset]of [['aPosition',3,0],['aNormal',3,12],['aUV',2,24]]){let loc=this.attrs[name];gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset);if(this.ext)this.ext.vertexAttribDivisorANGLE(loc,0);}
   gl.uniform1f(this.u.uUnlit,batch.unlit);gl.uniform1f(this.u.uTextured,batch.texture?1:0);if(batch.texture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures[batch.texture]);}
   gl.depthMask(batch.layer<5);
   if(this.ext){
    if(batch.data.length>this.instanceData.length)this.instanceData=new Float32Array(batch.data.length*2);
    this.instanceData.set(batch.data);gl.bindBuffer(gl.ARRAY_BUFFER,this.instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.instanceData.subarray(0,batch.data.length),gl.DYNAMIC_DRAW);
    for(let i=0;i<5;i++){let loc=this.attrs[i===4?'iColor':'i'+i];gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,4,gl.FLOAT,false,80,i*16);this.ext.vertexAttribDivisorANGLE(loc,1);}
    this.ext.drawElementsInstancedANGLE(gl.TRIANGLES,geom.count,gl.UNSIGNED_SHORT,0,batch.data.length/20);
   }else{
    for(let i=0;i<5;i++)gl.disableVertexAttribArray(this.attrs[i===4?'iColor':'i'+i]);
    for(let j=0;j<batch.data.length;j+=20){for(let i=0;i<5;i++){let o=j+i*4;gl.vertexAttrib4f(this.attrs[i===4?'iColor':'i'+i],...batch.data.slice(o,o+4));}gl.drawElements(gl.TRIANGLES,geom.count,gl.UNSIGNED_SHORT,0);}
   }
   this.drawCalls++;
  }gl.depthMask(true);
 }
 project(point){if(!this.vp)return{x:0,y:0,visible:false};let p=[...point,1],m=this.vp,q=[0,0,0,0];for(let r=0;r<4;r++)q[r]=m[r]*p[0]+m[4+r]*p[1]+m[8+r]*p[2]+m[12+r];return{x:(q[0]/q[3]*.5+.5)*this.canvas.clientWidth,y:(-.5*q[1]/q[3]+.5)*this.canvas.clientHeight,visible:q[3]>0};}
}
root.P3D={Renderer,trs,mul,V,hex,PI,factories:{box,sphere,cylinder,disk,torus}};
})(window);
