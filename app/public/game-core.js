/* Potrero Rush — reglas independientes del render. Sin dependencias. */
(function(root){
'use strict';
const LANES=[-2.8,0,2.8], CLAMP=(n,a,b)=>Math.max(a,Math.min(b,n));
function rng(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
class Game{
 constructor(seed=Date.now()){this.seed=seed;this.mode='menu';this.events=[];this.entities=[];this.time=0;this.distance=0;this.x=0;this.lane=1;this.level=1;this.score=0;this.lives=3;this.combo=0;this.fever=0;this.feverTime=0;this.shield=false;this.magnet=0;this.dribble=0;this.cooldown=0;this.invulnerable=0;this.goals=0;this.coins=0;this.dribbles=0;this.maxCombo=0;this.goalAt=270;this.aim={x:0,y:1.5};this.keeperX=0;this.missions=[];}
 event(type,data={}){this.events.push({type,...data});}
 newRun(seed=Date.now()){
  Object.assign(this,{seed,random:rng(seed),mode:'run',time:0,distance:0,segmentStart:0,goalAt:270,nextRow:43,safeLane:1,row:0,entities:[],score:0,lives:3,level:1,lane:1,x:0,previousX:0,combo:0,maxCombo:0,fever:0,feverTime:0,shield:false,magnet:0,dribble:0,cooldown:0,invulnerable:1,coins:0,goals:0,dribbles:0,nearMisses:0,shot:null,fixedAim:null,power:0,modeTime:0,keeperX:0,aim:{x:0,y:1.5},shotWarning:false,events:[],runTime:0,finished:false});
  this.missions=[{id:'coins',goal:20,title:'Juntá 20 fichas',done:false},{id:'dribbles',goal:3,title:'Hacé 3 regates',done:false},{id:'goals',goal:2,title:'Marcá 2 goles',done:false}];
  this.event('start');this.event('toast',{text:'La pelota es tuya. ¡A jugar!',kind:'info'});this.fill();
 }
 get multiplier(){return Math.min(5,1+Math.floor(this.combo/3))*(this.feverTime>0?2:1);}
 get speed(){return Math.min(28,14.5+(this.level-1)*1.65)+(this.feverTime>0?2.4:0);}
 addScore(n){this.score+=Math.round(n*this.multiplier);}
 addCombo(){this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);}
 addFever(n){if(this.feverTime>0)return;this.fever=Math.min(100,this.fever+n);if(this.fever>=100){this.fever=0;this.feverTime=7;this.event('fever');this.event('toast',{text:'MODO CRACK · PUNTOS ×2',kind:'good'});}}
 move(dir){if(this.mode!=='run')return;this.lane=CLAMP(this.lane+Math.sign(dir),0,2);}
 action(){
  if(this.mode==='run'){
   if(this.cooldown>0)return false;
   this.dribble=.54;this.cooldown=this.feverTime>0?1.35:2.50;this.event('dribble');return true;
  }
  if(this.mode==='aim'&&this.modeTime>.3){this.fixedAim={...this.aim};this.mode='power';this.modeTime=0;this.power=.08;this.event('aimLocked');return true;}
  if(this.mode==='power'&&this.modeTime>.25){this.shoot();return true;}
  return false;
 }
 pause(){if(['run','aim','power','intro','flight','result'].includes(this.mode)){this.beforePause=this.mode;this.mode='pause';this.event('pause');}}
 resume(){if(this.mode==='pause'){this.mode=this.beforePause||'run';this.event('resume');}}
 makeRow(d){
  const R=this.random;let choices=[this.safeLane];if(this.safeLane>0)choices.push(this.safeLane-1);if(this.safeLane<2)choices.push(this.safeLane+1);
  this.safeLane=choices[Math.floor(R()*choices.length)];this.row++;
  const blocked=[0,1,2].filter(i=>i!==this.safeLane);
  let count=this.level>=2&&R()<Math.min(.78,.48+this.level*.045)?2:(R()<.34?2:1);
  // Every row reserves an unblocked lane. Moving defenders never enter it.
  if(R()<.5)blocked.reverse();
  for(let i=0;i<count;i++){
   const lane=blocked[i],type=(this.row===1&&i===0)||R()<.32?'cone':'defender';
   const moving=type==='defender'&&count===1&&R()<Math.min(.82,.48+this.level*.055);
   this.entities.push({id:`${this.row}-${i}`,type,d,lane,x:LANES[lane],toLane:moving?blocked[1]:lane,moving,moveStart:Math.max(35,43+this.level*.35),moveSpan:Math.max(6.4,10.2-this.level*.28),done:false,seed:R(),safeLane:this.safeLane});
  }
  for(let i=0;i<3;i++)this.entities.push({type:'coin',d:d+i*2.7,lane:this.safeLane,x:LANES[this.safeLane],done:false,seed:R()});
  if(this.row%7===0){const type=this.row%14===0?'shield':'magnet';this.entities.push({type,d:d+10,lane:this.safeLane,x:LANES[this.safeLane],done:false,seed:R()});}
  // A bonus is placed behind a defender: risk is optional, never forced.
  const defender=this.entities.find(e=>e.d===d&&e.type==='defender');
  if(defender&&R()<.6)this.entities.push({type:'coin',d:d+3.8,lane:defender.lane,x:defender.x,bonus:true,done:false,seed:R()});
 }
 fill(){while(this.nextRow<this.distance+155&&this.nextRow<this.goalAt-32){this.makeRow(this.nextRow);this.nextRow+=Math.max(17.5,this.speed*.94)+(this.random()-.5)*2.4;}}
 hurt(reason){
  if(this.invulnerable>0)return false;
  if(this.shield){this.shield=false;this.invulnerable=1.2;this.event('protected');this.event('toast',{text:'¡El escudo te salvó!',kind:'good'});return false;}
  this.lives=Math.max(0,this.lives-1);this.combo=0;this.fever=0;this.feverTime=0;this.invulnerable=1.45;this.event('hit',{reason});this.event('toast',{text:reason+' · −1 pelota',kind:'bad'});
  if(!this.lives)this.end(reason);return true;
 }
 end(reason='Fin del partido'){
  if(this.finished)return;
  this.finished=true;this.mode='over';this.reason=reason;this.event('gameover',{reason});
 }
 collect(e){
  e.done=true;
  if(e.type==='coin'){this.coins+=e.bonus?3:1;this.addScore(e.bonus?45:15);this.addFever(e.bonus?5:2);if(this.coins%8===0)this.addCombo();this.event('coin',{value:e.bonus?3:1,x:e.x,bonus:!!e.bonus});}
  if(e.type==='shield'){this.shield=true;this.event('powerup',{kind:'shield'});this.event('toast',{text:'ESCUDO · te cubre un choque',kind:'good'});}
  if(e.type==='magnet'){this.magnet=8;this.event('powerup',{kind:'magnet'});this.event('toast',{text:'IMÁN · 8 segundos de fichas',kind:'good'});}
 }
 update(dt){
  if(!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,.05);
  if(['menu','pause','over'].includes(this.mode))return;
  this.time+=dt;this.runTime+=dt;this.modeTime+=dt;
  for(const key of ['dribble','cooldown','invulnerable','magnet','feverTime'])this[key]=Math.max(0,this[key]-dt);
  this.keeperX=Math.sin(this.time*(1.66+Math.min(this.level,12)*.085))*3.08;
  if(this.mode==='run'){
   const previousDistance=this.distance;this.previousX=this.x;
   this.x+=(LANES[this.lane]-this.x)*(1-Math.exp(-dt*17));
   this.distance+=this.speed*dt;this.score+=this.speed*dt*1.25;
   this.fill();
   for(const e of this.entities){
    if(e.done)continue;
    const ahead=e.d-this.distance;
    if(e.moving&&ahead<(e.moveStart||43)){let p=CLAMP(((e.moveStart||43)-ahead)/(e.moveSpan||9),0,1);p=p*p*(3-2*p);e.x=LANES[e.lane]+(LANES[e.toLane]-LANES[e.lane])*p;}
    const dx=Math.abs(e.x-this.x);
    if(['coin','shield','magnet'].includes(e.type)){
     if((ahead<1.0&&ahead>-1.6&&dx<.90)||(e.type==='coin'&&this.magnet>0&&ahead<10&&ahead>-1)){this.collect(e);}
    }else if(ahead<.75&&e.d-previousDistance>-.95){
     if(dx<(e.type==='cone'?.65:.85)){
      e.done=true;
      if(e.type==='defender'&&this.dribble>0){this.dribbles++;this.addCombo();this.addScore(120);this.addFever(20);e.beaten=true;e.anim=.8;this.event('skill',{x:e.x});this.event('toast',{text:this.dribbles%2?'¡QUÉ GAMBETÓN!':'¡LO DEJASTE PAGANDO!',kind:'good'});}
      else this.hurt(e.type==='cone'?'Te llevaste un cono':'Te robaron la pelota');
     }else if(ahead<-.85){e.done=true;if(dx<1.85){this.nearMisses++;this.addScore(20);this.addFever(4);this.event('near');}}
    }
    if(this.mode==='over')break;
   }
   this.entities=this.entities.filter(e=>e.d>this.distance-12);
   if(this.goalAt-this.distance<35&&!this.shotWarning){this.shotWarning=true;this.event('toast',{text:'SE VIENE EL ARCO · prepará el remate',kind:'info'});}
   if(this.distance>=this.goalAt&&this.mode==='run'){
    this.distance=this.goalAt;this.lane=1;this.mode='intro';this.modeTime=0;this.entities=[];this.invulnerable=0;this.dribble=0;this.event('shotIntro');
   }
  }else if(this.mode==='intro'){
   this.x+=(0-this.x)*(1-Math.exp(-dt*8));
   if(this.modeTime>.9){this.mode='aim';this.modeTime=0;this.event('aimStart');}
  }else if(this.mode==='aim'){
   this.aim={x:Math.sin(this.modeTime*(1.80+Math.min(this.level,10)*.10))*3.92,y:1.55+Math.sin(this.modeTime*(2.55+Math.min(this.level,8)*.04)+.7)*.95};
   if(this.modeTime>5.5)this.shoot(true);
  }else if(this.mode==='power'){
   this.power=(Math.sin(this.modeTime*(4.25+Math.min(this.level,10)*.15)-Math.PI/2)+1)/2;
   if(this.modeTime>4.0)this.shoot(true);
  }else if(this.mode==='flight'){
   if(this.modeTime>1.0){this.resolveShot();}
  }else if(this.mode==='result'){
   if(this.modeTime>1.8)this.nextSegment();
  }
  for(const m of this.missions){if(!m.done&&this[m.id]>=m.goal){m.done=true;this.score+=500;this.event('mission',{title:m.title,bank:20});}}
 }
 shoot(timeout=false){
  if(!['aim','power'].includes(this.mode))return;
  const a=this.fixedAim||{...this.aim},p=timeout?0:this.power;
  let outcome='goal',cause='';
  let endX=a.x,endY=a.y;
  const ideal=Math.abs(p-.76)<.035;
  let diveX=this.keeperX+(a.x-this.keeperX)*.36;
  if(timeout){outcome='miss';cause='Se agotó el tiempo';endY=0;}
  else if(p<.60){outcome='save';cause='Remate sin fuerza';diveX=a.x;endY=Math.min(a.y,.75);}
  else if(p>.90){outcome='miss';cause='Se fue por arriba';endY=4.7+(p-.9)*9;}
  else if(Math.abs(a.x-diveX)<.98&&a.y<2.18){outcome='save';cause='El arquero te leyó';}
  const corner=Math.abs(a.x)>2.9&&a.y>1.72;
  this.shot={outcome,cause,ideal,corner,power:p,x:endX,y:endY,startKeeper:this.keeperX,diveX,timeout};
  this.mode='flight';this.modeTime=0;this.event('kick');
 }
 resolveShot(){
  const s=this.shot;
  if(s.outcome==='goal'){
   this.goals++;this.addCombo();const points=(500+(s.corner?350:0)+(s.ideal?150:0))*this.multiplier;this.score+=points;this.addFever(25);
   const recovered=this.goals%3===0&&this.lives<3;if(recovered)this.lives++;
   this.event('goal',{points,corner:s.corner,ideal:s.ideal,recovered,bank:20});
  }else{
   // Goal misses cost a life even with a shield. Shields only cover running collisions.
   const keepShield=this.shield;this.shield=false;this.invulnerable=0;this.hurt(s.cause||'Remate fallado');this.shield=keepShield;
   if(this.mode==='over')return;
   this.event('miss',{cause:s.cause});
  }
  this.mode='result';this.modeTime=0;
 }
 nextSegment(){
  this.level++;this.segmentStart=this.distance;this.goalAt+=270+Math.min(this.level-1,6)*12;this.nextRow=this.distance+42;this.entities=[];this.shotWarning=false;this.shot=null;this.fixedAim=null;this.mode='run';this.modeTime=0;this.cooldown=0;this.invulnerable=1.4;this.fill();this.event('segment',{level:this.level});
 }
 snapshot(){return {mode:this.mode,score:Math.floor(this.score),distance:Math.floor(this.distance),lives:this.lives,level:this.level,lane:this.lane,x:this.x,goals:this.goals,coins:this.coins,dribbles:this.dribbles,combo:this.combo,multiplier:this.multiplier,cooldown:this.cooldown,dribble:this.dribble,entities:this.entities.length,goalAt:this.goalAt};}
}
const api={Game,LANES,rng,CLAMP};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PotreroCore=api;
})(typeof window!=='undefined'?window:globalThis);
