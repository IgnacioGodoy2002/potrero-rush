'use strict';
const assert=require('node:assert/strict');
const {Game,LANES}=require('./potrero-core.cjs');
let tests=0;function test(name,fn){fn();tests++;console.log('OK',name);}
function make(seed=42){const g=new Game();g.newRun(seed);return g;}
function step(g,s){for(let t=0;t<s;t+=.01)g.update(.01);}
function isolated(g,type){g.entities=[{type,d:g.distance+1.2,lane:1,x:0,done:false}];g.nextRow=10000;g.invulnerable=0;}
function setupShot(g,p=.76,x=3.5,y=2.5){g.mode='power';g.modeTime=.5;g.power=p;g.fixedAim={x,y};g.keeperX=0;g.shoot();}
test('Nueva partida: tres vidas y récord de sesión limpio',()=>{let g=make();assert.equal(g.lives,3);assert.equal(g.level,1);assert.equal(g.mode,'run');assert.equal(g.score,0);assert(g.entities.length>0);});
test('Conos: el regate no evita una colisión',()=>{let g=make();isolated(g,'cone');g.action();step(g,.14);assert.equal(g.lives,2);});
test('Rival: un regate a tiempo suma puntos sin perder vida',()=>{let g=make();isolated(g,'defender');assert(g.action());step(g,.14);assert.equal(g.lives,3);assert.equal(g.dribbles,1);assert(g.score>=120);});
test('Rival: pasar sin regate resta vida',()=>{let g=make();isolated(g,'defender');step(g,.14);assert.equal(g.lives,2);});
test('Pulsación repetida: no reinicia ni cancela la recarga',()=>{let g=make();g.action();const left=g.cooldown;assert.equal(g.action(),false);assert.equal(g.cooldown,left);g.entities=[];g.nextRow=10000;step(g,2.6);assert(g.action());});
test('Escudo: absorbe solo una colisión',()=>{let g=make();g.shield=true;isolated(g,'cone');step(g,.14);assert.equal(g.lives,3);assert.equal(g.shield,false);step(g,1.3);isolated(g,'defender');step(g,.14);assert.equal(g.lives,2);});
test('Imán: recoge fichas de otro carril',()=>{let g=make();g.magnet=3;g.entities=[{type:'coin',d:5,x:2.8,lane:2}];g.nextRow=10000;step(g,.03);assert.equal(g.coins,1);});
test('Pausa: no mueve la pelota, reloj ni obstáculos',()=>{let g=make();g.pause();const before=JSON.stringify(g.snapshot());step(g,2);assert.equal(JSON.stringify(g.snapshot()),before);g.resume();step(g,.03);assert(g.distance>0);});
test('Los controles no permiten salir de los tres carriles',()=>{let g=make();for(let i=0;i<20;i++)g.move(-1);assert.equal(g.lane,0);for(let i=0;i<20;i++)g.move(1);assert.equal(g.lane,2);});
test('Generación: 10.000 filas dejan un carril libre, aun con defensores móviles',()=>{let g=make();for(let i=0;i<10000;i++){g.level=1+i%40;g.entities=[];g.makeRow(i*30);let obstacles=g.entities.filter(e=>['cone','defender'].includes(e.type));assert(obstacles.length>=1&&obstacles.length<=2);assert(obstacles.every(e=>e.lane!==g.safeLane&&e.toLane!==g.safeLane));assert(obstacles.every(e=>Number.isFinite(e.x)));}});
test('Mismo seed: mismo recorrido',()=>{let a=make(123),b=make(123);assert.equal(JSON.stringify(a.entities),JSON.stringify(b.entities));});
test('Remate justo y al ángulo: gol',()=>{let g=make();setupShot(g);assert.equal(g.shot.outcome,'goal');step(g,1.1);assert.equal(g.goals,1);assert.equal(g.lives,3);assert(g.score>=1000);});
test('Remate demasiado fuerte: afuera y una vida menos',()=>{let g=make();setupShot(g,.99);assert.equal(g.shot.outcome,'miss');step(g,1.1);assert.equal(g.lives,2);});
test('Remate demasiado débil: atajada',()=>{let g=make();setupShot(g,.25);assert.equal(g.shot.outcome,'save');});
test('Apuntar al arquero: atajada incluso con buena fuerza',()=>{let g=make();setupShot(g,.76,0,1.2);assert.equal(g.shot.outcome,'save');});
test('Atajada conserva punto de contacto con el arquero para la animación',()=>{let g=make();setupShot(g,.76,0,1.2);assert.equal(g.shot.outcome,'save');assert(Number.isFinite(g.shot.diveX));assert(g.shot.y<=2.18);});
test('No rematar dentro del tiempo: se pierde una vida',()=>{let g=make();g.mode='aim';g.modeTime=0;step(g,8.3);assert.equal(g.lives,2);});
test('El escudo no evita el costo de fallar un remate',()=>{let g=make();g.shield=true;setupShot(g,.99);step(g,1.1);assert.equal(g.lives,2);assert(g.shield);});
test('Cada tres goles se recupera una vida, nunca más de tres',()=>{let g=make();g.goals=2;g.lives=1;setupShot(g);step(g,1.1);assert.equal(g.lives,2);g.goals=5;g.lives=3;setupShot(g);step(g,1.1);assert.equal(g.lives,3);});
test('El tercer error termina la partida y no suma más puntos',()=>{let g=make();g.lives=1;isolated(g,'cone');step(g,.14);assert.equal(g.mode,'over');assert.equal(g.lives,0);let s=g.score;step(g,10);assert.equal(g.score,s);});
test('Reiniciar no conserva tiro, vidas, potenciadores ni puntaje',()=>{let g=make();setupShot(g,.99);step(g,1.1);g.shield=true;g.magnet=5;g.newRun(8);assert.equal(g.shot,null);assert.equal(g.fixedAim,null);assert.equal(g.lives,3);assert.equal(g.score,0);assert.equal(g.shield,false);assert.equal(g.magnet,0);});
test('Cien remates seguidos abren cien tramos nuevos sin un final programado',()=>{let g=make();for(let i=0;i<100;i++){g.distance=g.goalAt;setupShot(g);step(g,3.05);g.events=[];assert.equal(g.mode,'run');assert.equal(g.level,i+2);assert.equal(g.goals,i+1);assert(g.goalAt>g.distance);assert(g.entities.length<100);}assert(g.distance>30000);});
test('Sin tocar nada no se puede sobrevivir indefinidamente',()=>{for(let seed=0;seed<20;seed++){let g=make(seed);step(g,300);assert.equal(g.mode,'over');}});
test('Crack duplica puntaje pero no impide los errores',()=>{let g=make();g.addFever(100);assert.equal(g.multiplier,2);isolated(g,'cone');step(g,.14);assert.equal(g.lives,2);assert.equal(g.feverTime,0);});
test('Un desafío se acredita una sola vez',()=>{let g=make();g.coins=20;g.entities=[];g.nextRow=10000;step(g,.1);const n=g.events.filter(e=>e.type==='mission').length;assert.equal(n,1);step(g,1);assert.equal(g.events.filter(e=>e.type==='mission').length,1);});
test('Modo B: la velocidad y presión suben fuerte sin bloquear los tres carriles',()=>{let g=make();assert(g.speed>=14.5);g.level=7;assert(g.speed>=24);g.entities=[];g.nextRow=20;g.goalAt=10000;g.fill();const movers=g.entities.filter(e=>e.type==='defender'&&e.moving);assert(movers.length>0);assert(movers.every(e=>e.moveSpan<=10.2));});

console.log(`\n${tests} pruebas de juego aprobadas.`);
