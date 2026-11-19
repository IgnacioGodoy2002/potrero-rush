'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');const ctx={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/profile.js'),'utf8'),ctx);const P=ctx.module.exports;let n=0;function test(label,fn){fn();n++;console.log('OK',label);}
test('No default name is generated',()=>{assert.equal(P.player(null).name,'');assert.equal(P.player({}).confirmed,false);});
for(const value of['',' ','       ','\t\n','\u200b','---','...',"'",'<script>','🙂','A💥B'])test('Rejected name '+JSON.stringify(value),()=>assert.equal(P.name(value).ok,false));
for(const value of['SURA','ÁGUILA','PEÑA','JOSÉ LUIS','D’ANGELO','ANA-MARÍA','RUSH 9','MAXIMILIANO1'])test('Accepted name '+value,()=>assert.equal(P.name(value).ok,true));
test('Names are normalized, uppercase and trimmed',()=>assert.equal(P.name('  peña  ').value,'PEÑA'));
test('Exactly twelve characters fit; thirteen do not',()=>{assert(P.name('ABCDEFGHIJKL').ok);assert(!P.name('ABCDEFGHIJKLM').ok);});
for(const value of['','0','00','100','-1','1.5','1e1','Infinity','NaN','abc'])test('Rejected number '+JSON.stringify(value),()=>assert(!P.number(value).ok));
for(const value of[1,7,10,23,99,'09'])test('Accepted number '+value,()=>assert(P.number(value).ok));
test('A persisted profile must be explicitly confirmed',()=>{assert(!P.player({name:'SURA',number:10}).confirmed);assert(P.player({name:'SURA',number:10,confirmed:true}).confirmed);});
test('Malformed saved profile returns to empty onboarding',()=>assert.equal(P.player({name:'OK',number:999,confirmed:true}).name,''));
test('Combined validation prevents starting with an empty name',()=>assert(!P.validate('',10).ok));
test('Combined validation prevents starting with invalid number',()=>assert(!P.validate('PEÑA',0).ok));
console.log('\n'+n+' profile tests passed.');
