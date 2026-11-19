/* Potrero Rush / illustrated 2.5D characters.
   The art is articulated in layers, then baked into bounded GPU atlases.
   No geometry or textures are allocated by draw(). User text is never HTML. */
(function(root){'use strict';
const CELL=448, PI=Math.PI;
const P={
 front:{cx:92,neck:[94,133],hips:[87,253],arms:[[49,165],[138,161]],elbows:[[32,215],[163,213]],hands:[[18,261],[163,257]],knees:[[64,309],[127,311]],legHips:[[62,260],[111,260]],
 head:[[26,0],[149,0],[148,125],[111,135],[90,146],[68,132],[30,120]],
 torso:[[74,130],[108,129],[129,138],[134,177],[125,195],[124,218],[131,249],[44,249],[49,218],[50,196],[42,182],[48,148],[58,140]],
 pelvis:[[45,242],[130,242],[138,269],[112,279],[87,267],[62,279],[37,272]],
 au:[[[43,143],[63,141],[61,182],[50,204],[37,225],[18,219],[28,195],[28,182]],[[122,134],[147,142],[168,178],[175,196],[177,217],[152,222],[144,199],[135,188],[123,184]]],
 al:[[[22,208],[43,214],[33,234],[24,244],[33,264],[27,279],[8,284],[0,270],[6,243]],[[151,208],[177,208],[180,247],[185,262],[176,278],[149,280],[137,262],[138,247],[153,232]]],
 lu:[[[41,252],[89,252],[85,278],[79,303],[80,320],[50,320],[49,303],[28,291]],[[88,252],[133,252],[145,292],[135,299],[143,322],[114,323],[106,304],[88,299]]],
 ll:[[[50,306],[80,306],[80,337],[77,357],[84,371],[80,398],[0,398],[0,373],[38,353],[49,350]],[[110,306],[141,307],[145,343],[151,353],[171,377],[174,398],[120,398],[117,378],[121,360],[114,340]]],
 shirt:[[74,133],[105,129],[132,134],[147,143],[166,178],[137,194],[124,180],[123,221],[131,246],[44,246],[48,201],[30,188],[31,179],[44,151],[58,139]],
 shorts:[[44,244],[131,244],[144,293],[107,304],[85,277],[78,303],[30,290]]},
 back:{cx:86,neck:[86,116],hips:[86,248],arms:[[43,153],[131,153]],elbows:[[26,210],[149,210]],hands:[[16,258],[157,258]],knees:[[56,299],[121,300]],legHips:[[60,255],[111,255]],
 head:[[33,0],[141,0],[142,108],[107,119],[68,120],[45,103],[33,70]],
 torso:[[68,115],[108,115],[130,128],[135,164],[125,184],[129,214],[133,239],[42,239],[46,211],[45,178],[37,160],[38,134]],
 pelvis:[[44,236],[131,236],[138,264],[106,270],[86,261],[62,272],[36,266]],
 au:[[[35,126],[56,127],[57,165],[44,195],[34,219],[12,213],[19,190],[15,171]],[[117,126],[138,133],[157,174],[155,184],[166,207],[166,221],[143,224],[137,201],[126,182],[116,160]]],
 al:[[[12,205],[34,211],[25,233],[22,240],[31,256],[29,267],[17,279],[0,275],[0,249],[7,229]],[[142,208],[167,208],[169,240],[173,255],[172,273],[157,279],[141,269],[138,257],[145,245],[154,240]]],
 lu:[[[42,241],[87,248],[80,276],[75,292],[66,308],[37,307],[38,287],[30,283]],[[88,246],[132,241],[142,283],[135,288],[140,308],[111,309],[106,294],[95,292]]],
 ll:[[[36,302],[68,303],[64,331],[56,350],[57,363],[61,379],[57,393],[4,393],[2,370],[27,353],[29,340]],[[110,302],[139,302],[143,342],[148,356],[165,368],[172,393],[118,393],[118,371],[120,360],[114,342]]],
 shirt:[[68,115],[108,115],[128,126],[142,139],[157,175],[133,187],[126,177],[128,209],[133,239],[42,239],[45,210],[46,179],[28,179],[16,172],[28,146],[38,130]],
 shorts:[[43,238],[132,238],[141,283],[94,292],[86,262],[76,291],[30,282]]}
};
function canvas(w,h){let c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function path(c,pts){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();}
function mix(a,b,t){let A=a.match(/[\da-f]{2}/gi).map(x=>parseInt(x,16)),B=b.match(/[\da-f]{2}/gi).map(x=>parseInt(x,16));return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function part(image,pts){let out=canvas(image.width,image.height),c=out.getContext('2d');path(c,pts);c.clip();c.drawImage(image,0,0);return out;}
function loadImage(url){return new Promise((ok,no)=>{let im=new Image;im.onload=()=>ok(im);im.onerror=()=>no(Error('No se pudo cargar el personaje. Revisá la conexión y recargá.'));im.src=url;});}
function uniform(raw,side,kit,profile,role){
 const im=canvas(raw.width,raw.height),c=im.getContext('2d'),p=P[side];c.drawImage(raw,0,0);
 const shirt=role==='keeper'?'#e8bc45':role==='defender'?'#df604f':kit.shirt;
 const dark=role==='keeper'||role==='defender'?'#1c3040':kit.shorts;
 const trim=role==='keeper'?'#fff3ce':role==='defender'?'#ffe4c3':kit.trim;
 c.save();path(c,p.shirt);c.clip();let grad=c.createLinearGradient(25,0,152,0);grad.addColorStop(0,mix(shirt,'#18313f',.34));grad.addColorStop(.31,shirt);grad.addColorStop(.59,mix(shirt,'#ffffff',.22));grad.addColorStop(.86,mix(shirt,'#263842',.22));grad.addColorStop(1,mix(shirt,'#16242b',.38));c.fillStyle=grad;c.fillRect(0,108,185,147);
 // Original club marks and preset lettering are covered by a newly painted kit.
 c.fillStyle=role==='hero'?(kit.name==='Barrio'?'#79b9a180':mix(shirt,trim,.35)+'60'):'#162c3c';
 if(role==='hero'){c.fillRect(p.cx-23,124,15,124);c.fillRect(p.cx+15,124,15,124);}else{c.fillRect(15,124,150,18);c.fillRect(0,225,185,8);}
 c.lineWidth=1.25;c.strokeStyle='#ffffff65';for(let dx of[-31,34]){c.beginPath();c.moveTo(p.cx+dx,148);c.bezierCurveTo(p.cx+dx-3,177,p.cx+dx+2,208,p.cx+dx+3,240);c.stroke();}
 c.lineWidth=1.6;for(let i=0;i<5;i++){let y=203+i*8;c.strokeStyle=i%2?'#ffffff35':'#19334125';c.beginPath();c.moveTo(p.cx-34,y+2);c.quadraticCurveTo(p.cx-8,y-1,p.cx+31,y+2);c.stroke();}
 c.strokeStyle=trim;c.lineWidth=4.5;c.beginPath();c.moveTo(p.cx-21,side==='back'?119:135);c.quadraticCurveTo(p.cx,side==='back'?121:155,p.cx+20,side==='back'?119:133);c.stroke();
 c.textAlign='center';c.fillStyle=role==='hero'?(kit.name==='Barrio'?'#193c43':'#fff8e5'):'#fff0cf';
 if(role==='hero'&&side==='back'){
  const name=profile.name||'';let fs=13;c.font='900 '+fs+'px Arial';while(c.measureText(name).width>72&&fs>6){c.font='900 '+(--fs)+'px Arial';}c.fillText(name,p.cx,146);
  c.font='900 52px Arial';c.fillText(String(profile.number||10),p.cx,199);
 }else if(role==='hero'){
  c.font='900 27px Arial';c.fillText(String(profile.number||10),p.cx-3,196);
  c.fillStyle=dark;c.beginPath();c.moveTo(p.cx+25,153);c.lineTo(p.cx+34,155);c.lineTo(p.cx+32,169);c.lineTo(p.cx+25,174);c.lineTo(p.cx+19,169);c.lineTo(p.cx+17,155);c.closePath();c.fill();c.fillStyle=trim;c.font='900 8px Arial';c.fillText('PR',p.cx+25,165);
 }else{c.font='900 18px Arial';c.fillText(role==='keeper'?'1':'◆',p.cx,193);}
 c.restore();
 c.save();path(c,p.shorts);c.clip();grad=c.createLinearGradient(30,242,143,290);grad.addColorStop(0,mix(dark,'#ffffff',.15));grad.addColorStop(.5,dark);grad.addColorStop(1,mix(dark,'#000000',.35));c.fillStyle=grad;c.fillRect(0,235,185,75);c.strokeStyle=trim;c.lineWidth=1.4;c.beginPath();c.moveTo(45,245);c.lineTo(34,286);c.moveTo(128,243);c.lineTo(139,287);c.stroke();
 if(side==='front'&&role==='hero'){c.fillStyle=trim;c.textAlign='center';c.font='900 13px Arial';c.fillText(String(profile.number||10),123,277);}c.restore();
 // Keep the original, antialiased illustrated silhouette.
 c.globalCompositeOperation='destination-in';c.drawImage(raw,0,0);c.globalCompositeOperation='source-over';return im;
}
function pieces(im,side){let p=P[side],o={};for(let key of['head','torso','pelvis'])o[key]=part(im,p[key]);for(let key of['au','al','lu','ll'])o[key]=p[key].map(poly=>part(im,poly));return o;}
function glove(c,x,y,angle){c.save();c.translate(x,y);c.rotate(angle);let g=c.createLinearGradient(-8,-13,8,10);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#a6c8c9');c.fillStyle=g;c.strokeStyle='#284554';c.lineWidth=1.2;c.beginPath();c.roundRect(-9,-16,18,27,6);c.fill();c.stroke();c.fillStyle='#78c9cf';c.fillRect(-9,5,18,6);c.strokeStyle='#65899380';for(let dx of[-4,0,4]){c.beginPath();c.moveTo(dx,-13);c.lineTo(dx,-3);c.stroke();}c.restore();}
function pose(c,parts,side,phase,action,role){
 const p=P[side],running=action==='run',cycle=phase*PI*2,s=Math.sin(cycle),bob=running?Math.abs(Math.sin(cycle))*3:0;
 c.save();c.translate(CELL*.5,18-bob);c.scale(1.01,1.01);c.translate(-p.cx,0);
 let legAngles=running?[s*.08,-s*.08]:[0,0],armAngles=running?[-s*.20,s*.20]:[-.025,.025];
 let elbows=running?[s*.13,-s*.13]:[0,0];
 if(action==='kick'){legAngles=[.04,-.58+phase*1.25];armAngles=[.22,-.27];}
 if(action==='celebrate'){armAngles=[1.8,-1.8];elbows=[.1,-.1];}
 if(action==='wave'){armAngles=[0,-2.1];elbows=[0,Math.sin(phase*PI*2)*.19];}
 if(role==='keeper'){
  if(action==='left'){armAngles=[1.30,.8];elbows=[-.2,.7];}
  else if(action==='right'){armAngles=[-.8,-1.30];elbows=[-.7,.2];}
  else if(action==='high'){armAngles=[2.40,-2.40];elbows=[-.1,.1];}
  else if(action==='block'){armAngles=[.45,-.45];elbows=[.75,-.75];}
  else {armAngles=[.23,-.23];elbows=[.35,-.35];}
 }
 // Legs are independently jointed; alternating foreshortening conveys rearward running.
 for(let i of[0,1]){
  let swing=running?Math.sin(cycle+i*PI):0,hip=p.legHips[i],knee=p.knees[i];
  c.save();c.translate(hip[0],hip[1]);c.rotate(legAngles[i]);c.scale(1,1-Math.max(0,swing)*.14);c.translate(-hip[0],-hip[1]);c.drawImage(parts.lu[i],0,0);
  c.translate(knee[0],knee[1]);c.rotate(running?Math.max(0,swing)*(i?-.18:.18):action==='kick'&&i===1?.40-phase*.8:0);c.scale(1,1-Math.max(0,swing)*.22);c.translate(-knee[0],-knee[1]);c.drawImage(parts.ll[i],0,0);c.restore();
 }
 c.drawImage(parts.pelvis,0,0);
 for(let i=0;i<2;i++){
  const a=p.arms[i],e=p.elbows[i];c.save();c.translate(...a);c.rotate(armAngles[i]);c.translate(-a[0],-a[1]);c.drawImage(parts.au[i],0,0);c.translate(...e);c.rotate(elbows[i]);c.translate(-e[0],-e[1]);c.drawImage(parts.al[i],0,0);if(role==='keeper')glove(c,...p.hands[i],i?-.13:.13);c.restore();
 }
 c.drawImage(parts.torso,0,0);
 c.save();c.translate(...p.neck);c.rotate(running?s*.017:0);c.scale(.94,.96);c.translate(-p.neck[0],-p.neck[1]);c.drawImage(parts.head,0,0);c.restore();c.restore();
}
class CharacterArt{
 constructor(r){this.r=r;this.loaded=false;this.profile={name:'',number:10};this.kit=null;this.atlases={};this.revision=0;
  this.ready=Promise.all([loadImage('/art/player-front.png'),loadImage('/art/player-back.png')]).then(images=>{this.raw={front:images[0],back:images[1]};this.loaded=true;this.buildOpponents();return this;});
 }
 geometry(name,index,rows){let x=index%4/4,y=Math.floor(index/4)/rows,w=1/4,h=1/rows,u0=x+.001,u1=x+w-.001,v0=1-y-h+.001,v1=1-y-.001;
  this.r.addGeometry(name,{v:[-.5,-.5,0,0,0,1,u0,v0,.5,-.5,0,0,0,1,u1,v0,.5,.5,0,0,0,1,u1,v1,-.5,.5,0,0,0,1,u0,v1],idx:[0,1,2,0,2,3]});
 }
 buildAtlas(key,count,paint){let rows=Math.ceil(count/4),atlas=canvas(CELL*4,CELL*rows),c=atlas.getContext('2d');for(let i=0;i<count;i++){c.save();c.translate((i%4)*CELL,Math.floor(i/4)*CELL);paint(c,i);c.restore();if(!this.r.shapes[key+i])this.geometry(key+i,i,rows);}this.atlases[key]=atlas;this.r.texture('art-'+key,atlas);return atlas;}
 buildOpponents(){
  const kit={shirt:'#eb6857',shorts:'#243645',trim:'#fff0d0',name:'Rival'};
  for(let role of['defender','keeper']){
   const im=uniform(this.raw.front,'front',kit,{name:'',number:1},role),parts=pieces(im,'front');
   this.buildAtlas(role,8,(c,i)=>pose(c,parts,'front',i/8,role==='defender'?'run':['run','run','run','block','left','right','high','block'][i],role));
  }
 }
 setPlayer(profile,kit){if(!this.loaded)return;const key=JSON.stringify([profile.name,profile.number,kit.name]);if(key===this.lastPlayer)return;this.lastPlayer=key;this.profile={name:profile.name||'',number:profile.number||10};this.kit=kit;
  const f=pieces(uniform(this.raw.front,'front',kit,this.profile,'hero'),'front'),b=pieces(uniform(this.raw.back,'back',kit,this.profile,'hero'),'back');
  this.buildAtlas('hero',16,(c,i)=>{let side=i===0||i===13||i===15?'front':'back',action=i>=2&&i<=9?'run':i>=10&&i<=12?'kick':i===13||i===14?'celebrate':i===15?'wave':'idle';pose(c,side==='front'?f:b,side,i>=2&&i<=9?(i-2)/8:i>=10&&i<=12?(i-10)/2:0,action,'hero');});this.revision++;
 }
 preview(target,back=false){if(!this.atlases.hero)return;let c=target.getContext('2d');c.clearRect(0,0,target.width,target.height);let i=back?1:0;c.drawImage(this.atlases.hero,i*CELL,0,CELL,CELL,0,0,target.width,target.height);}
 draw(x,z,time,kit,opt,game){
  if(!this.loaded||!this.atlases.hero)return false;
  const r=this.r,role=opt.keeper?'keeper':opt.defender?'defender':'hero',scale=opt.scale||1;
  let i=0,flip=1,slant=opt.lean||0,breathe=opt.idle?Math.sin(time*2)*.012:0;
  const effective=game?.mode==='pause'?game.beforePause:game?.mode;
  if(role==='hero'){
   if(opt.idle){i=0;}else if(opt.kick){i=10+Math.min(2,Math.floor((opt.kickTime||0)*8));}
   else if(opt.run){i=2+Math.floor(time*14)%8;if(game?.dribble>0){let phase=(1-game.dribble/.54)*PI*2;flip=Math.max(.30,Math.abs(Math.cos(phase)));if(Math.cos(phase)<0)i=0;slant+=Math.sin(phase)*.12;}}
   else i=1;
  }else if(role==='defender'){i=Math.floor(time*16)%8;slant+=Math.sin(time*8)*.025;}
  else{
   i=Math.floor(time*9)%3;
   if(game?.shot&&['flight','result','over'].includes(effective)){const t=effective==='flight'?game.modeTime:1,s=game.shot;if(t>.40)i=s.outcome==='save'?(s.y>1.65?6:s.y<.9?7:3):(s.diveX>s.startKeeper?5:4);}
   slant*=.24;
  }
  const h=3.1*scale,ground=.04+(opt.y||0),cy=ground+h*.431+breathe;
  r.add(role+i,[x,cy,z],[h*flip,h,1],'#ffffff',[0,0,slant],null,{texture:'art-'+role,unlit:true,layer:2.6});
  r.add('disk',[x,.018,z],[.88*scale,1,.63*scale],[.02,.07,.08,.38],[0,0,0],null,{layer:1.5,unlit:true});return true;
 }
}
root.PotreroCharacters={CharacterArt,CELL};
})(window);
