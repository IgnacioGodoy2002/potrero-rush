(function(root){'use strict';
const {trs,mul,hex,PI}=P3D;
const themes=[{name:'BARRIO BAJO LUCES',grass:'#1c674f',alt:'#216f54',stands:'#1c343e',sky:'#12292f',accent:'#c9ff5f'},{name:'LA HORA DORADA',grass:'#427253',alt:'#487b58',stands:'#403e49',sky:'#8c706c',accent:'#ffba79'},{name:'NOCHE ELÉCTRICA',grass:'#165e59',alt:'#1b6961',stands:'#222d49',sky:'#16223f',accent:'#bba0ff'}];
const kits=[{shirt:'#eff3df',trim:'#c9ff5f',shorts:'#263f44',boots:'#c9ff5f',name:'Barrio',price:0},{shirt:'#a98cff',trim:'#d9fe80',shorts:'#31254e',boots:'#d9fe80',name:'Violeta',price:120},{shirt:'#ff8463',trim:'#fff1d0',shorts:'#512f35',boots:'#fff1d0',name:'Atardecer',price:300}];
class World{
 constructor(renderer){this.r=renderer;this.clock=0;this.cameraShot=0;this.shake=0;this.particles=[];this.theme=themes[0];this.createTextures();this.characters=new PotreroCharacters.CharacterArt(renderer);const R=PotreroCore.rng(4842);this.crowd=[];for(let side of [-1,1])for(let section=0;section<5;section++)for(let row=0;row<4;row++)for(let n=0;n<11;n++){this.crowd.push({side,section,row,z:n*2.7,seed:R(),color:['#adc8b6','#ba895c','#708eaf','#c5d493','#e6d8c0','#c17874'][Math.floor(R()*6)]});}this.flecks=[];for(let i=0;i<210;i++)this.flecks.push({x:(R()-.5)*17,z:R()*170,size:.018+R()*.04});}
 createTextures(){
  const make=(name,w,h,fn)=>{let c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);this.r.texture(name,c);};
  make('billboard',1024,256,(c,w,h)=>{c.fillStyle='#152b31';c.fillRect(0,0,w,h);c.fillStyle='#c9ff5f';c.fillRect(0,h-14,w,14);c.font='italic 900 100px Arial';c.textAlign='center';c.fillText('POTRERO / RUSH',w/2,147);c.font='700 30px Arial';c.fillStyle='#e7eddf';c.fillText('LA CALLE NO TIENE ÚLTIMO NIVEL',w/2,208);});
  make('jersey',256,256,(c)=>{c.textAlign='center';c.fillStyle='#223d3f';c.font='900 170px Arial';c.fillText('10',128,204);c.font='bold 24px Arial';c.fillText('POTRERO',128,51);});
  make('pr',256,256,(c)=>{c.textAlign='center';c.fillStyle='#c9ff5f';c.font='italic 900 148px Arial';c.fillText('PR',120,182);});
  make('ball',512,256,(c,w,h)=>{c.fillStyle='#f7f5e8';c.fillRect(0,0,w,h);c.lineWidth=2;c.strokeStyle='#b9c1b7';for(let row=0;row<4;row++)for(let col=0;col<8;col++){let x=col*64+(row%2?32:0),y=row*73+10;c.beginPath();for(let n=0;n<6;n++){let a=n/6*PI*2;c.lineTo(x+Math.cos(a)*36,y+Math.sin(a)*36);}c.closePath();c.stroke();}c.fillStyle='#183037';for(let row=0;row<3;row++)for(let col=0;col<5;col++){let x=col*104+(row%2?50:0),y=38+row*90;c.beginPath();for(let n=0;n<5;n++){let a=n/5*PI*2-PI/2;c.lineTo(x+Math.cos(a)*24,y+Math.sin(a)*24);}c.fill();}});
 }
 burst(x,z,colors=['#d6ff79','#fff2ce'],count=24){for(let i=0;i<count;i++){let a=Math.random()*PI*2,v=1+Math.random()*4;this.particles.push({x,y:.4+Math.random(),z,vx:Math.cos(a)*v,vy:2+Math.random()*5,vz:Math.sin(a)*v,life:1+Math.random(),color:colors[i%colors.length],size:.05+Math.random()*.08});}}
 drawPlayer(x,z,time,kit,options={}){
  return this.characters.draw(x,z,time,kit,options,this.currentGame);
 }
 drawGoal(z,game){
  const r=this.r,W=4.4,H=3.25,white='#e8f1e0',net=[.66,.83,.76,.43];
  for(let x of [-W,W]){r.segment([x,.02,z],[x,H,z],.11,white);r.segment([x,H,z],[x,H-.15,z-2],.07,white);r.segment([x,H-.15,z-2],[x,.02,z-2],.065,white);}
  r.segment([-W,H,z],[W,H,z],.12,white);r.segment([-W,H-.15,z-2],[W,H-.15,z-2],.06,white);
  for(let x=-W;x<=W+.01;x+=.4)r.segment([x,.02,z-2],[x,H-.15,z-2],.013,net,null,{unlit:true,layer:4});
  for(let y=.02;y<=H;y+=.31){r.segment([-W,y,z-2],[W,y,z-2],.013,net,null,{unlit:true,layer:4});for(let x of[-W,W])r.segment([x,y,z],[x,y,z-2],.013,net,null,{unlit:true,layer:4});}
  r.add('box',[0,.017,z+2],[10,.025,.07],'#d9ecbd',[],null,{layer:1.2});
  for(let x of[-3.35,3.35]){r.add('ring',[x,2.33,z+.07],[1.2,1.2,1.2],'#d1ff79',[],null,{unlit:true});r.add('ring',[x,2.33,z+.08],[.92,.92,.92],[.75,1,.42,.22],[],null,{unlit:true});}
  this.drawPlayer(game.keeperX,z+.8,game.time,kits[0],{keeper:true,goalZ:z});
  if(game.mode==='aim'||game.mode==='power'){
   const a=game.mode==='power'?game.fixedAim:game.aim,cc=game.mode==='power'?'#ffe39a':'#fbfff3';
   r.add('ring',[a.x,a.y,z+.3],[.55,.55,.55],cc,[],null,{unlit:true,layer:4});
   r.add('box',[a.x,a.y,z+.32],[.075,.075,.05],'#efffc2',[],null,{unlit:true,layer:4});
   r.segment([a.x-.4,a.y,z+.32],[a.x-.24,a.y,z+.32],.032,cc,null,{unlit:true,layer:4});r.segment([a.x+.24,a.y,z+.32],[a.x+.4,a.y,z+.32],.032,cc,null,{unlit:true,layer:4});
  }
 }
 draw(game,dt,selected=0){
  const r=this.r;this.currentGame=game;this.clock+=game.mode==='pause'?0:dt;this.shake=Math.max(0,this.shake-dt*1.5);const t=this.clock;
  const menu=game.mode==='menu',paused=game.mode==='pause',effective=paused?game.beforePause:game.mode;
  const shotMode=['intro','aim','power','flight','result'].includes(effective)||(effective==='over'&&game.shot);
  const wantShot=shotMode?1:0;this.cameraShot+=(wantShot-this.cameraShot)*(1-Math.exp(-dt*4.5));
  const theme=themes[Math.floor((game.level-1)/2)%themes.length];this.theme=theme;r.clearColor=hex(theme.sky).slice(0,3);
  r.begin();const d=menu?0:game.distance;
  // Alternating grass, true-perspective field markings, and a continuous stadium.
  for(let i=-1;i<14;i++){let z=12-i*14+(d%28);r.add('box',[0,-.05,z],[19,.10,14.04],i%2?theme.grass:theme.alt,[],null,{layer:1});}
  for(let side of[-1,1]){
   r.add('box',[side*9.1,.006,-65],[.085,.022,165],'#c2d9aa',[],null,{layer:1.2});
   r.add('box',[side*9.9,-.06,-65],[1.5,.1,165],'#244840',[],null,{layer:1});
   for(let sec=0;sec<5;sec++){
    let z=8-sec*32+d%32;
    r.add('box',[side*10.2,.62,z-15],[.35,1.25,31.4],'#193940');
    r.add('box',[side*10.0,1.26,z-15],[.43,.07,31.4],theme.accent,[],null,{unlit:true});
    for(let row=0;row<4;row++){r.add('box',[side*(11.8+row*1.25),.40+row*.73,z-15],[2.0,.8,31.4],theme.stands);r.add('box',[side*(11.8+row*1.25),.84+row*.73,z-15],[1.8,.065,31.4],'#42636a');}
    r.add('quad',[side*9.99,.67,z-17],[10.4,1.1,1],'#ffffff',[0,-side*PI/2,0],null,{texture:'billboard',unlit:true});
    r.add('box',[side*16.9,5.8,z-15],[.20,7.2,.22],'#3e5961');
    r.add('box',[side*17.0,8.2,z-15],[9,.24,31.3],'#203a43',[0,0,side*.15]);
    r.segment([side*16.9,6.1,z-15],[side*12.5,8.1,z-15],.13,'#607d83');
    r.add('box',[side*13.8,7.94,z-15],[.10,.10,31.0],theme.accent,[],null,{unlit:true});
    if(sec%2===0){r.add('cylinder',[side*10.7,5.1,z-19],[.16,10.2,.16],'#5f7478');r.add('box',[side*10.7,10.12,z-19],[2.8,.7,.26],'#273e45');for(let b=-1;b<=1;b++)r.add('box',[side*10.7+b*.8,10.12,z-18.84],[.64,.42,.04],'#fff5d7',[],null,{unlit:true});}
   }
  }
  for(const c of this.crowd){let z=6-c.section*32-c.z+d%32;if(z>5)continue;const x=c.side*(11.15+c.row*1.25),y=1.04+c.row*.73;let hop=menu?0:Math.sin(t*2+c.seed*17)*.035;r.add('box',[x,y+hop,z],[.42,.47,.34],c.color);r.add('sphere',[x,y+.39+hop,z],[.27,.29,.27],'#b68c6e');}
  for(let i=0;i<4;i++){let z=7-i*44+d%44;r.add('box',[0,.01,z],[18.2,.018,.06],'#b9d4a0',[],null,{layer:1.2});}
  for(let x of[-1.4,1.4])for(let i=0;i<28;i++){let z=5-i*6+d%6;r.add('box',[x,.012,z],[.035,.020,1.25],[.72,.86,.65,.13],[],null,{layer:1.2,unlit:true});}
  for(const f of this.flecks){let z=4-f.z+d%10;r.add('box',[f.x,.004,z],[f.size,.012,f.size*3],[.34,.62,.40,.37],[],null,{layer:1.1});}
  if(menu)r.add('quad',[2,.022,-6],[5.5,5.5,1],[.73,.93,.66,.36],[-PI/2,0,0],null,{texture:'pr',unlit:true,layer:1.4});
  // Objects reuse GPU geometry, so long runs do not keep adding meshes.
  for(const e of game.entities){let z=game.distance-e.d;if(z>6||z<-155||(e.done&&!e.beaten))continue;
   if(e.type==='cone'){
    r.add('box',[e.x,.055,z],[.90,.11,.82],'#513e32');r.add('cone',[e.x,.48,z],[.61,.9,.61],'#f29b51');r.add('cone',[e.x,.54,z],[.36,.18,.36],'#fff0c9');r.add('disk',[e.x,.019,z],[1.1,1,.75],[.02,.09,.08,.25],[],null,{unlit:true,layer:1.5});
   }else if(e.type==='defender'){
    let beaten=e.beaten?Math.min(1,(z+1)/5):0;
    const ahead=e.d-game.distance,start=e.moveStart||43,span=e.moveSpan||9;
    const crossing=e.moving&&ahead<start&&ahead>start-span&&!e.beaten;
    this.drawPlayer(e.x+beaten*.8,z,t+e.seed*10,kits[0],{defender:true,facing:PI+beaten*2,lean:beaten*.28,run:!e.beaten,styleSeed:e.seed,crossing,moveDir:Math.sign(e.toLane-e.lane),beaten,entityId:e.id});
    r.add('ring',[e.x,.05,z],[1.25,1.25,1.25],[1,.47,.31,.65],[PI/2,0,0],null,{unlit:true});
    if(e.moving&&!e.done){r.add('cone',[e.x,2.8+Math.sin(t*5)*.08,z],[.22,.30,.22],'#ffd68a',[0,0,PI],null,{unlit:true});}
   }else if(e.type==='coin'){
    const y=.77+Math.sin(t*4+e.seed*12)*.10,cr=trs([e.x,y,z],[1,1,1],[0,t*1.6+e.seed,0]);
    r.add('cylinder',[0,0,0],[.55,.105,.55],e.bonus?'#e1f893':'#ffd77a',[PI/2,0,0],cr,{unlit:false});
    r.add('ring',[0,0,.058],[.45,.45,.45],'#fff0b6',[],cr,{unlit:true});
    r.add('box',[0,0,.06],[.085,.24,.022],'#b1823e',[],cr,{unlit:true});
   }else{
    const col=e.type==='shield'?'#a2e6ff':'#d4b5ff',y=1+Math.sin(t*3)*.16;
    r.add('sphere',[e.x,y,z],[.69,.69,.69],col,[],null,{unlit:true});r.add('ring',[e.x,y,z],[1,1,1],col,[0,t,0],null,{unlit:true});
    r.add('box',[e.x,y,z+.36],[.07,.30,.03],'#20445a',[],null,{unlit:true});r.add('box',[e.x,y,z+.36],[.30,.07,.03],'#20445a',[],null,{unlit:true});
   }
  }
  let goalZ=shotMode?-17:-(game.goalAt-game.distance)-17;if(menu)goalZ=-62;if(goalZ>-160)this.drawGoal(goalZ,game);
  const px=menu?(innerWidth<700?1.5:3.4):game.x;
  if(this.cameraShot<.5){const fade=game.invulnerable>0&&Math.floor(game.time*12)%2===0; if(!fade||menu){const spin=game.dribble>0?(1-game.dribble/.54)*PI*2:0;this.drawPlayer(px,0,menu?t:game.time,kits[selected],{idle:menu,run:!menu&&effective==='run',facing:menu?PI-.38:spin,lean:effective==='run'?(PotreroCore.LANES[game.lane]-game.x)*-.055:0,scale:menu?1.40:1,styleSeed:.26});}}
  let bx=menu?px-.4:game.x+.24,by=.265+Math.abs(Math.sin(game.time*10))*.055,bz=-.85;
  if(menu){by=.29+Math.abs(Math.sin(t*1.3))*.055;bz=-.62;}
  if(game.dribble>0){let p=(1-game.dribble/.54)*PI*2;bx=game.x+Math.sin(p)*.58;bz=-.85+Math.cos(p)*.25;}
  if(shotMode){bx=0;by=.26;bz=-8.6;if(!['result','over'].includes(effective))this.drawPlayer(.118,-7.93,game.time,kits[selected],{scale:.80,kick:effective==='flight',kickTime:game.modeTime});}
  if(effective==='flight'&&game.shot){
   const s=game.shot,p=Math.max(0,Math.min(1,(game.modeTime-.30)/.70));
   if(s.outcome==='save'){
    // La pelota viaja hasta las manos/cuerpo del arquero y recién después rebota.
    // Antes seguía hasta el punto de mira dentro del arco aunque la lógica dijera "atajada".
    const hit=.64,contactX=s.diveX,contactY=Math.max(.55,Math.min(2.15,s.y));
    if(p<=hit){
     const q=p/hit,arc=Math.sin(q*PI)*.46;
     bx=contactX*q;by=.26+(contactY-.26)*q+arc;bz=-8.6+(-16.15+8.6)*q;
    }else{
     const q=(p-hit)/(1-hit),deflect=Math.sign(contactX||.01)*1.15;
     bx=contactX+deflect*q;by=contactY+(0.42-contactY)*q+Math.sin(q*PI)*.38;bz=-16.15+4.35*q;
    }
   }else if(s.outcome==='miss'&&s.timeout){
    // Si se agota el tiempo, el remate muere antes de cruzar la línea.
    bx=s.x*p*.35;by=.26+Math.sin(p*PI)*.22;bz=-8.6+(-13.2+8.6)*p;
   }else{
    // Gol o tiro realmente desviado: la trayectoria coincide con el resultado.
    bx=s.x*p;by=.26+(s.y-.26)*p+Math.sin(p*PI)*.7;bz=-8.6+(-17.5+8.6)*p;
   }
  }
  if(['result','over'].includes(effective)&&game.shot){
   const s=game.shot;
   if(s.outcome==='save'){
    const deflect=Math.sign(s.diveX||.01)*1.15;
    bx=s.diveX+deflect;by=.42;bz=-11.8;
   }else if(s.outcome==='miss'&&s.timeout){bx=s.x*.35;by=.25;bz=-13.2;}
   else{bx=s.x;by=s.outcome==='goal'?Math.max(.30,s.y*.55):Math.max(.25,s.y);bz=-18;}
  }
  r.add('sphere',[bx,by,bz],[.48,.48,.48],'#ffffff',[game.distance*2.8+t*(menu?.3:0),0,game.x*.4],null,{texture:'ball'});
  r.add('disk',[bx,.021,bz],[.55,1,.38],[.01,.07,.07,.4],[],null,{layer:1.5,unlit:true});
  if(game.shield){r.add('ring',[px,.07,0],[1.55,1.55,1.55],'#90e4ff',[PI/2,0,t],null,{unlit:true});}
  if(game.magnet>0)r.add('ring',[px,.06,0],[2.8,2.8,2.8],[.75,.61,1,.30],[PI/2,0,0],null,{unlit:true});
  if(game.feverTime>0)r.add('ring',[px,.04,0],[2,2,2],[.86,1,.39,.40],[PI/2,0,0],null,{unlit:true});
  const pdt=paused?0:dt;
  for(const p of this.particles){p.life-=pdt;p.x+=p.vx*pdt;p.y+=p.vy*pdt;p.z+=p.vz*pdt;p.vy-=9*pdt;r.add('box',[p.x,Math.max(.03,p.y),p.z],[p.size,p.size*.35,p.size*.8],hex(p.color,Math.min(p.life,1)),[t*3,t*2,t],null,{unlit:true,layer:4});}this.particles=this.particles.filter(p=>p.life>0);
  let a=this.cameraShot,mobile=innerWidth<700;
  let eye=menu?[0,3.5,8.5]:[game.x*.12,5.2*(1-a)+4.15*a,10.5*(1-a)+(mobile?4.0:1.5)*a];
  let target=menu?[0,1.20,-9]:[game.x*.09,1.15*(1-a)+1.55*a,-14-3*a];
  if(this.shake>0){eye[0]+=(Math.random()-.5)*this.shake*.3;eye[1]+=(Math.random()-.5)*this.shake*.15;}
  r.render(eye,target,mobile?(menu?74:74-a*6):(menu?53:54-a*6));
 }
}
root.PotreroWorld={World,kits,themes};
})(window);
