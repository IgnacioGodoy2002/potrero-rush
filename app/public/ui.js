(function(){'use strict';
const $=id=>document.getElementById(id), fmt=n=>Math.floor(n).toLocaleString('es-AR'), STORE='potrero-rush-v1';
const Profile=PotreroProfile;
function load(){const base={version:6,best:0,bank:0,totalGoals:0,selected:0,unlocked:[0],sound:true,player:{name:'',number:10,confirmed:false}};try{const p=JSON.parse(localStorage.getItem(STORE)||'null');if(!p||typeof p!=='object')return base;for(let k of ['best','bank','totalGoals'])if(Number.isFinite(p[k])&&p[k]>=0)base[k]=Math.floor(p[k]);if(Array.isArray(p.unlocked))base.unlocked=[...new Set([0,...p.unlocked.filter(i=>[0,1,2].includes(i))])];if(base.unlocked.includes(p.selected))base.selected=p.selected;base.sound=p.sound!==false;base.player=Profile.player(p.player);}catch(e){}return base;}
let progress=load(),dirty=false,lastSave=0;
function save(){try{localStorage.setItem(STORE,JSON.stringify(progress));dirty=false;return true;}catch(e){return false;/* Keep the session playable without storage. */}}
class Sound{
 constructor(){this.enabled=progress.sound;this.ctx=null;}
 init(){if(!this.enabled)return;try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.14;this.master.connect(this.ctx.destination);}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});}catch(e){}}
 tone(freq,duration=.1,type='sine',volume=.3,delay=0,end=null){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(25,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.025);}
 play(kind){if(!this.enabled)return;switch(kind){case 'coin':this.tone(980,.09,'sine',.17,0,1470);break;case 'dribble':this.tone(130,.11,'triangle',.20,0,380);break;case 'kick':this.tone(170,.15,'triangle',.6,0,40);break;case 'hit':this.tone(145,.26,'sawtooth',.14,0,48);break;case 'skill':case 'powerup':case 'mission':[510,640,810].forEach((f,i)=>this.tone(f,.14,'triangle',.20,i*.075));break;case 'goal':[523,659,784,1046].forEach((f,i)=>this.tone(f,.32,'triangle',.26,i*.08));break;case 'fever':[392,523,659,784,1046].forEach((f,i)=>this.tone(f,.23,'triangle',.22,i*.09));break;case 'miss':this.tone(220,.3,'triangle',.2,0,98);break;case 'start':this.tone(510,.1,'sine',.3);this.tone(760,.17,'sine',.3,.12);break;case 'aimLocked':this.tone(650,.08,'sine',.22);break;case 'step':this.tone(68,.055,'sine',.055,0,38);break;}}
 toggle(){this.enabled=!this.enabled;progress.sound=this.enabled;dirty=true;if(this.enabled){this.init();this.play('coin');}save();}
}
const sound=new Sound(),game=new PotreroCore.Game();let renderer,world;
let lockerIntent='edit',lockerKit=progress.selected,artReady=false,previewTimer=null,fieldTouched=false;
let overlay=null,toastTime=0,flashTime=0,lastMode='',lastTheme='',newRecord=false,lastKeySpace=0,stepTime=0;
const modalIds=['howModal','closetModal','rivalsModal','pauseModal','overModal','errorModal'];
function setHidden(id,hidden){$(id).classList.toggle('hidden',hidden);}
function showError(message){game.pause();$('errorMessage').textContent=message;setHidden('modalBackdrop',false);modalIds.forEach(id=>setHidden(id,id!=='errorModal'));}
try{renderer=new P3D.Renderer($('gameCanvas'));world=new PotreroWorld.World(renderer);}catch(e){showError(e.message||'La pantalla 3D no está disponible.');$('reloadBtn').onclick=()=>location.reload();return;}
function menuStats(){$('heroName').textContent=progress.player.name||'TU LUGAR EN LA CANCHA';$('heroNumber').textContent=progress.player.number;$('heroTagline').textContent=progress.player.confirmed?'ESTA CAMISETA ES TUYA.':'CREÁ TU JUGADOR.';$('bankMenu').textContent=fmt(progress.bank);$('bestMenu').textContent=String(progress.best).padStart(5,'0');$('soundBtn').classList.toggle('muted',!sound.enabled);$('soundBtn').setAttribute('aria-label',sound.enabled?'Desactivar sonido':'Activar sonido');}
function toast(text,kind='info'){const el=$('toast');el.textContent=text;el.className='toast '+kind;toastTime=2.2;}
function syncPanels(){
 document.body.classList.toggle('locker-open',overlay==='closet'||overlay==='rivals');
 const menu=game.mode==='menu';setHidden('menu',!menu);setHidden('hud',menu||game.mode==='over');setHidden('pauseBtn',menu||game.mode==='over');
 document.body.classList.toggle('playing',!menu);
 const modal=overlay==='how'?'howModal':overlay==='closet'?'closetModal':overlay==='rivals'?'rivalsModal':game.mode==='pause'?'pauseModal':game.mode==='over'?'overModal':null;
 modalIds.forEach(id=>setHidden(id,id!==modal));setHidden('modalBackdrop',!modal);
 const shooting=['intro','aim','power','flight','result'].includes(game.mode)||(game.mode==='pause'&&['intro','aim','power','flight','result'].includes(game.beforePause));document.body.classList.toggle('shooting',shooting);
 setHidden('shotUI',!['aim','power'].includes(game.mode));setHidden('shotResult',game.mode!=='result');
 if(game.mode==='aim'){$('shotStep').textContent='1 / 2 · ELEGÍ EL LUGAR';$('shotTitle').textContent='APUNTÁ AL ÁNGULO.';$('shotHelp').textContent='Fijá la mira lejos del arquero. Los aros suman un bonus.';$('shootBtn').innerHTML='FIJAR MIRA <span>ESPACIO / TOCÁ</span>';setHidden('powerMeter',true);}
 if(game.mode==='power'){$('shotStep').textContent='2 / 2 · ELEGÍ LA FUERZA';$('shotTitle').textContent='EL TOQUE JUSTO.';$('shotHelp').textContent='Tocá en la zona verde. Demasiada fuerza: afuera.';$('shootBtn').innerHTML='REMATAR <span>ESPACIO / TOCÁ</span>';setHidden('powerMeter',false);}
 if(game.mode==='result'){
  const s=game.shot,goal=s?.outcome==='goal';$('shotResult').classList.toggle('missed',!goal);
  $('resultWord').textContent=goal?(s.corner?'¡GOLAZO!':'¡GOOOL!'):'NO ENTRÓ.';
  $('resultKicker').textContent=goal?(s.corner?'AL ÁNGULO, PAPÁ.':s.ideal?'TOQUE PERFECTO.':'LA TRIBUNA EXPLOTA.'):'SEGUÍ. TODAVÍA HAY PARTIDO.';
  $('resultDetails').textContent=goal?`${s.displayPoints||500} PUNTOS${game.goals%3===0?' · +1 PELOTA (MÁX. 3)':''}`:game.shot.cause+' · −1 pelota';
 }
 menuStats();
}
function start(){
 const v=Profile.validate(progress.player.name,progress.player.number);
 if(!v.ok||!progress.player.confirmed||!artReady){showCloset('play');return false;}
 overlay=null;sound.init();world.characters.setPlayer(progress.player,PotreroWorld.kits[progress.selected]);game.newRun();world.particles=[];world.cameraShot=0;newRecord=false;lastMode='';syncPanels();$('playBtn').blur();$('retryBtn').blur();return true;
}
function closeOverlay(){const was=overlay;overlay=null;if(was==='closet'){clearTimeout(previewTimer);if(artReady)world.characters.setPlayer(progress.player,PotreroWorld.kits[progress.selected]);}syncPanels();if(was==='closet')$('playBtn').focus({preventScroll:true});if(was==='rivals')$('rivalsBtn').focus({preventScroll:true});}
function openHow(){overlay='how';syncPanels();}
function showCloset(intent='edit'){
 lockerIntent=intent;lockerKit=progress.selected;overlay='closet';fieldTouched=false;
 $('jerseyName').value=progress.player.confirmed?progress.player.name:'';$('jerseyNumber').value=String(progress.player.number||10);
 $('confirmPlayer').innerHTML=(intent==='play'?'CONFIRMAR Y JUGAR':'GUARDAR JUGADOR')+' <span>↗</span>';
 drawCloset();syncPanels();liveIdentity(true);if(innerWidth>700)setTimeout(()=>$('jerseyName').focus({preventScroll:true}),50);
}
function drawCloset(){
 $('closetBank').textContent=fmt(progress.bank);const n=Profile.number($('jerseyNumber').value).value||10;
 $('kitList').innerHTML=PotreroWorld.kits.map((kit,i)=>{
  const active=lockerKit===i,owned=progress.unlocked.includes(i),afford=progress.bank>=kit.price;
  return `<button type="button" class="kit-card ${active?'active':''}" data-kit="${i}" aria-pressed="${active}" aria-label="${kit.name}, ${owned?'disponible':kit.price+' fichas'}" ${!owned&&!afford?'disabled':''}><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M29 14 8 28l10 24 13-6v45h38V46l13 6 10-24-21-14-11 7H40z" fill="${kit.shirt}"/><path d="m29 14 11 7h20l11-7-7-4H36z" fill="${kit.trim}"/><path d="M37 25h8v64h-8m18-64h8v64h-8" fill="${kit.trim}" opacity=".42"/><text x="50" y="71" fill="${kit.shorts}" font-family="Arial" font-weight="900" font-size="29" text-anchor="middle">${n}</text></svg><strong>${kit.name}</strong><small>${active?'EQUIPADA':owned?'ELEGIR':'◈ '+kit.price}</small></button>`;
 }).join('');
 $('kitList').querySelectorAll('[data-kit]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.kit),kit=PotreroWorld.kits[i];if(!progress.unlocked.includes(i)){if(progress.bank<kit.price)return;progress.bank-=kit.price;progress.unlocked.push(i);dirty=true;save();}lockerKit=i;sound.init();sound.play('coin');drawCloset();liveIdentity(true);menuStats();});
}
function refreshPreview(){
 if(!artReady)return;const info=Profile.validate($('jerseyName').value,$('jerseyNumber').value);
 world.characters.setPlayer({name:info.nameError?'':info.name,number:info.number||10},PotreroWorld.kits[lockerKit]);
 renderMotionPreview(performance.now());
}
function liveIdentity(immediate=false){
 const raw=$('jerseyName').value,v=Profile.validate(raw,$('jerseyNumber').value);
 $('nameCount').textContent=Array.from(raw).length+' / 12';$('nameError').textContent=v.nameError;$('numberError').textContent=v.numberError;
 $('jerseyName').setAttribute('aria-invalid',String(!Profile.name(raw).ok&&fieldTouched));$('jerseyNumber').setAttribute('aria-invalid',String(!Profile.number($('jerseyNumber').value).ok));
 $('nameError').classList.toggle('invalid',!!v.nameError&&fieldTouched);$('numberError').classList.toggle('invalid',!!v.numberError);
 $('confirmPlayer').disabled=!v.ok||!artReady||!progress.unlocked.includes(lockerKit);
 $('previewIdentity').querySelector('strong').textContent=v.name&&!v.nameError?v.name:'TU CAMISETA';$('previewIdentity').querySelector('span').textContent='N.º '+(v.number||'—');
 const num=Profile.number($('jerseyNumber').value);$('numberDown').disabled=num.ok&&num.value<=1;$('numberUp').disabled=num.ok&&num.value>=99;
 clearTimeout(previewTimer);if(immediate)refreshPreview();else previewTimer=setTimeout(refreshPreview,100);return v;
}
$('jerseyName').addEventListener('input',()=>{fieldTouched=true;liveIdentity();});
$('jerseyName').addEventListener('blur',()=>{const n=Profile.name($('jerseyName').value);if(n.ok)$('jerseyName').value=n.value;liveIdentity();});
$('jerseyNumber').addEventListener('input',()=>{liveIdentity();drawCloset();});
for(const [id,dir] of [['numberDown',-1],['numberUp',1]])$(id).onclick=()=>{const current=Profile.number($('jerseyNumber').value).value||10;$('jerseyNumber').value=String(Math.max(1,Math.min(99,current+dir)));liveIdentity(true);drawCloset();};
$('lockerForm').addEventListener('submit',e=>{
 e.preventDefault();fieldTouched=true;const v=liveIdentity(true);if(!v.ok||!artReady){(v.nameError?$('jerseyName'):$('jerseyNumber')).focus();return;}
 progress.player={name:v.name,number:v.number,confirmed:true};progress.selected=lockerKit;progress.version=6;dirty=true;
 const persisted=save();world.characters.setPlayer(progress.player,PotreroWorld.kits[progress.selected]);clearTimeout(previewTimer);overlay=null;syncPanels();
 if(lockerIntent==='play')start();else toast('¡Tu jugador está listo!','good');
 if(!persisted)toast('Podés jugar. El navegador no permitió guardar tu elección.','info');
});
$('closetModal').addEventListener('keydown',e=>{
 if(e.code==='Escape'){e.preventDefault();e.stopPropagation();closeOverlay();}
 if(e.key==='Tab'){const els=[...$('closetModal').querySelectorAll('button:not(:disabled),input')],first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
world.characters.ready.then(()=>{
 artReady=true;world.characters.setPlayer(progress.player,PotreroWorld.kits[progress.selected]);$('artStatus').textContent='JUGADOR V5 · MODELO 3D ARTICULADO';
 if(overlay==='closet')liveIdentity(true);if(overlay==='rivals')drawRivals();
}).catch(error=>{$('artStatus').textContent=error.message;showError(error.message);});
let previewYaw=0,previewAnimation='Idle',previewStart=performance.now(),lastPreview=0,lastStageDraw=0,kickSoundPending=false,keeperImpactPending=false;
function renderMotionPreview(now){
 if(!artReady)return;let time=(now-previewStart)/1000;if(previewAnimation==='Kick')time%=1.6;
 world.characters.preview($('previewFront'),false,previewYaw,previewAnimation,time);
 world.characters.preview($('previewBack'),true,previewYaw+Math.PI,previewAnimation,time);
}
$('rotate3D').onclick=()=>{previewYaw+=Math.PI/4;renderMotionPreview(performance.now());};
document.querySelectorAll('[data-motion]').forEach(b=>b.onclick=()=>{previewAnimation=b.dataset.motion;previewStart=performance.now();document.querySelectorAll('[data-motion]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));renderMotionPreview(performance.now());});
let rivalIndex=0,rivalMotion='ready',rivalYaw=0,rivalStart=performance.now(),lastRivalPreview=0;
function showRivals(){overlay='rivals';rivalStart=performance.now();drawRivals();syncPanels();$('rivalsClose').focus({preventScroll:true});}
function drawRivals(){
 if(!artReady)return;const list=world.characters.rivalInfo,info=list[rivalIndex];
 $('rivalName').textContent=info.name;$('rivalLabel').textContent=info.label;$('rivalDescription').textContent=info.description;
 $('rivalChoices').innerHTML=list.map((v,i)=>`<button type="button" data-rival="${i}" aria-pressed="${i===rivalIndex}" style="--rival-accent:${v.accent}"><span>${String(i+1).padStart(2,'0')}</span><strong>${v.name}</strong></button>`).join('');
 const options=rivalIndex===3?[['ready','LISTO'],['block','BLOQUEO'],['left','IZQUIERDA'],['right','DERECHA'],['low','BAJA']]:[['ready','LISTO'],['shuffle','LATERAL'],['beaten','SUPERADO']];
 if(!options.some(v=>v[0]===rivalMotion))rivalMotion='ready';
 $('rivalMotions').innerHTML=options.map(([id,name])=>`<button type="button" data-rival-motion="${id}" aria-pressed="${id===rivalMotion}">${name}</button>`).join('');
 $('rivalChoices').querySelectorAll('[data-rival]').forEach(b=>b.onclick=()=>{rivalIndex=Number(b.dataset.rival);rivalMotion='ready';rivalYaw=0;rivalStart=performance.now();drawRivals();});
 $('rivalMotions').querySelectorAll('[data-rival-motion]').forEach(b=>b.onclick=()=>{rivalMotion=b.dataset.rivalMotion;rivalStart=performance.now();drawRivals();});renderRivalPreview(performance.now());
}
function renderRivalPreview(now){if(artReady)world.characters.opponents.preview($('rivalCanvas'),rivalIndex,rivalMotion,(now-rivalStart)/1000,rivalYaw);}
$('rivalsBtn').onclick=showRivals;$('rivalsDone').onclick=closeOverlay;$('rotateRival').onclick=()=>{rivalYaw+=Math.PI/4;renderRivalPreview(performance.now());};
$('rivalsModal').addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();e.stopPropagation();closeOverlay();}if(e.key==='Tab'){const els=[...$('rivalsModal').querySelectorAll('button:not(:disabled)')],first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
function record(){const points=Math.floor(game.score);newRecord=points>progress.best;if(newRecord)progress.best=points;dirty=true;save();}
function showResults(){
 $('overEyebrow').textContent=newRecord?'NUEVO RÉCORD LOCAL':'SE TERMINÓ ESTA HISTORIA';$('overTitle').textContent=newRecord?'DE OTRO POTRERO.':'BUEN PARTIDO.';$('overReason').textContent=game.reason;$('finalScore').textContent=fmt(game.score);$('recordLine').textContent='RÉCORD LOCAL: '+fmt(progress.best);$('finalGoals').textContent=game.goals;$('finalMeters').textContent=fmt(game.distance);$('finalCoins').textContent=fmt(game.coins);syncPanels();
}
function goMenu(){record();game.mode='menu';game.entities=[];game.shot=null;game.distance=0;game.level=1;game.goalAt=270;game.time=0;game.x=0;game.lane=1;game.invulnerable=0;game.shield=false;game.magnet=0;game.feverTime=0;game.dribble=0;overlay=null;world.particles=[];lastMode='';setHidden('toast',true);toastTime=0;syncPanels();}
function processEvents(){
 const events=game.events.splice(0);
 for(const e of events){
  if(e.type==='toast'){toast(e.text,e.kind);continue;}
  if(e.type==='kick'){kickSoundPending=true;keeperImpactPending=true;continue;}
  if(e.type==='start'){kickSoundPending=false;keeperImpactPending=false;}
  sound.play(e.type);
  if(e.type==='coin'){progress.bank+=e.value;dirty=true;if(e.bonus)world.burst(e.x,0,['#ffe7a0'],7);}
  if(e.type==='skill'){world.burst(e.x,0,['#d0ff73','#fcf5cf'],23);}
  if(e.type==='protected'){world.burst(game.x,0,['#a4eaff','#def7ff'],28);}
  if(e.type==='hit'){world.shake=.75;$('flash').classList.add('hit');flashTime=.18;navigator.vibrate?.(40);}
  if(e.type==='goal'){
   game.shot.displayPoints=fmt(e.points);progress.bank+=e.bank;progress.totalGoals++;dirty=true;world.burst(0,-16,['#d0ff73','#fff0b4','#cfb2ff'],85);world.burst(-3,-15,['#c9ff5f','#ffd58a'],40);world.shake=.25;
  }
  if(e.type==='mission'){progress.bank+=e.bank;dirty=true;toast('DESAFÍO COMPLETO · +500 puntos / +20 fichas','good');}
  if(e.type==='segment'){toast(`TRAMO ${game.level} · sube el nivel`,'info');}
  if(e.type==='gameover'){record();showResults();}
 }
}
function updateHUD(){
 $('score').textContent=fmt(game.score);$('comboBadge').textContent='×'+game.multiplier;$('comboLabel').textContent=game.combo>0?`${game.combo} JUGADAS SEGUIDAS`:'ARMÁ TU RACHA';
 $('lives').querySelectorAll('span').forEach((el,i)=>el.classList.toggle('lost',i>=game.lives));$('lives').setAttribute('aria-label',game.lives+' pelotas restantes');
 $('coins').textContent=game.coins;$('goals').textContent=game.goals;$('level').textContent=String(game.level).padStart(2,'0');$('zone').textContent=world.theme.name;
 const progressInSegment=PotreroCore.CLAMP((game.distance-(game.segmentStart||0))/(game.goalAt-(game.segmentStart||0)),0,1);
 $('routeFill').style.width=(progressInSegment*100)+'%';$('meters').textContent=Math.max(0,Math.ceil(game.goalAt-game.distance))+' m AL ARCO';
 let cd=game.feverTime>0?1.35:2.50,ready=game.cooldown<=0;$('cooldownFill').style.width=((1-Math.min(1,game.cooldown/cd))*100)+'%';$('dribbleLabel').textContent=ready?'REGATE':game.cooldown.toFixed(1)+' s';$('dribbleBtn').classList.toggle('cooling',!ready);$('touchAction').classList.toggle('cooling',!ready);$('touchAction').innerHTML=ready?'REGATE <span>↗</span>':game.cooldown.toFixed(1)+' s <span>↻</span>';
 const fever=game.feverTime>0?game.feverTime/7*100:game.fever;$('feverFill').style.width=fever+'%';$('feverText').textContent=game.feverTime>0?game.feverTime.toFixed(1)+' s':Math.floor(fever)+'%';$('feverSub').textContent=game.feverTime>0?'PUNTOS ×2 · NO SOS INVENCIBLE':'JUGÁ BIEN PARA CARGARLO';document.body.classList.toggle('fever',game.feverTime>0);
 const tags=(game.shield?'<span>◇ ESCUDO · 1 CHOQUE</span>':'')+(game.magnet>0?`<span>∩ IMÁN · ${Math.ceil(game.magnet)} s</span>`:'');if($('powerTags').innerHTML!==tags)$('powerTags').innerHTML=tags;
 const mission=game.missions.find(m=>!m.done);$('missionTitle').textContent=mission?mission.title:'¡Todos completados!';$('missionProgress').textContent=mission?`${Math.min(game[mission.id],mission.goal)} / ${mission.goal}`:'+1500 PUNTOS · +60 FICHAS';
 setHidden('tutorialHint',game.mode!=='run'||game.runTime>13||game.runTime<2||game.level>1);
 if(game.mode==='aim'||game.mode==='power'){$('shotClock').style.width=(Math.max(0,1-game.modeTime/(game.mode==='aim'?5.5:4))*100)+'%';$('powerNeedle').style.left=(Math.min(1,game.power||0)*100)+'%';$('shootBtn').disabled=game.modeTime<(game.mode==='aim'?.3:.25);}
 if(lastTheme!==world.theme.name){lastTheme=world.theme.name;document.documentElement.style.setProperty('--sky',world.theme.sky);}
}
$('playBtn').onclick=()=>showCloset('play');$('retryBtn').onclick=start;$('menuBtn').onclick=goMenu;$('howBtn').onclick=openHow;$('howOkay').onclick=closeOverlay;$('closetBtn').onclick=()=>showCloset('edit');$('pauseHowBtn').onclick=openHow;
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeOverlay);
$('pauseBtn').onclick=()=>{game.pause();syncPanels();};$('resumeBtn').onclick=()=>{sound.init();game.resume();syncPanels();};$('quitBtn').onclick=goMenu;
$('soundBtn').onclick=()=>{sound.toggle();menuStats();};$('fullBtn').onclick=()=>{if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>{});}else document.documentElement.requestFullscreen?.().catch(()=>toast('El navegador no permite pantalla completa.'));};
$('reloadBtn').onclick=()=>location.reload();$('shootBtn').onclick=()=>game.action();$('dribbleBtn').onclick=()=>{sound.init();game.action();};$('touchAction').onclick=()=>{sound.init();game.action();};
function bindMove(id,dir){$(id).addEventListener('pointerdown',e=>{e.preventDefault();sound.init();game.move(dir);});}
bindMove('leftBtn',-1);bindMove('rightBtn',1);
window.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
 if(e.code==='Escape'||e.code==='KeyP'){
  e.preventDefault();if(overlay){closeOverlay();return;}if(game.mode==='pause')game.resume();else game.pause();syncPanels();return;
 }
 if(overlay||game.mode==='pause')return;
 if(['ArrowLeft','KeyA','ArrowRight','KeyD','Space','Enter'].includes(e.code))e.preventDefault();
 if(e.code==='Enter'&&!e.repeat&&['menu','over'].includes(game.mode)){if(game.mode==='menu')showCloset('play');else start();return;}
 if(['ArrowLeft','KeyA'].includes(e.code))game.move(-1);if(['ArrowRight','KeyD'].includes(e.code))game.move(1);
 if(e.code==='Space'&&!e.repeat){sound.init();game.action();}
});
let pointer=null;
$('gameCanvas').addEventListener('pointerdown',e=>{if(game.mode!=='run'&&game.mode!=='aim'&&game.mode!=='power')return;pointer={x:e.clientX,y:e.clientY,id:e.pointerId};$('gameCanvas').setPointerCapture(e.pointerId);sound.init();});
$('gameCanvas').addEventListener('pointerup',e=>{if(!pointer)return;let dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dx)>24&&Math.abs(dx)>Math.abs(dy))game.move(dx>0?1:-1);else if(Math.abs(dy)<25)game.action();});
$('gameCanvas').addEventListener('pointercancel',()=>pointer=null);
window.addEventListener('resize',()=>renderer.resize());window.addEventListener('orientationchange',()=>setTimeout(()=>renderer.resize(),180));
document.addEventListener('visibilitychange',()=>{if(document.hidden){game.pause();save();syncPanels();}});window.addEventListener('blur',()=>{game.pause();syncPanels();});window.addEventListener('pagehide',save);
$('gameCanvas').addEventListener('webglcontextlost',e=>{e.preventDefault();save();showError('La pantalla 3D perdió la conexión con la placa gráfica. Tus fichas guardadas siguen intactas. Recargá para volver a jugar.');});
let previous=performance.now(),frames=0,lastUITime=0;
function loop(now){
 let dt=Math.min(.05,Math.max(0,(now-previous)/1000));previous=now;
 game.update(dt);processEvents();
 if(kickSoundPending&&game.mode==='flight'&&game.modeTime>=.30){sound.play('kick');kickSoundPending=false;}
 if(keeperImpactPending&&game.mode==='flight'&&game.modeTime>=.748){keeperImpactPending=false;if(game.shot?.outcome==='save'){sound.tone(115,.15,'triangle',.32,0,48);sound.tone(650,.07,'sine',.08);}}
 if(game.mode!==lastMode){lastMode=game.mode;syncPanels();}
 if(toastTime>0){toastTime-=dt;if(toastTime<=0)setHidden('toast',true);}
 if(flashTime>0){flashTime-=dt;if(flashTime<=0)$('flash').classList.remove('hit');}
 if(game.mode==='run'){stepTime+=dt;if(stepTime>.42){stepTime=0;sound.play('step');}}
 if(!['closet','rivals'].includes(overlay)||now-lastStageDraw>180){world.draw(game,game.mode==='pause'?0:dt,progress.selected);lastStageDraw=now;}
 if(overlay==='closet'&&artReady&&now-lastPreview>50){renderMotionPreview(now);lastPreview=now;}
 if(overlay==='rivals'&&artReady&&now-lastRivalPreview>50){renderRivalPreview(now);lastRivalPreview=now;}
 if(now-lastUITime>45){updateHUD();lastUITime=now;}
 if(dirty&&now-lastSave>1200){save();lastSave=now;}
 frames++;requestAnimationFrame(loop);
}
menuStats();syncPanels();requestAnimationFrame(loop);
window.Potrero={version:'6.0.0',player:()=>({...progress.player}),snapshot:()=>game.snapshot()};
if(new URLSearchParams(location.search).get('test')==='1')Object.assign(window.Potrero,{game,world,renderer,progress,start,goMenu,showCloset,showRivals,liveIdentity,step(seconds){for(let t=0;t<seconds;t+=.02)game.update(.02);processEvents();lastMode='';syncPanels();updateHUD();return game.snapshot();}});
})();
