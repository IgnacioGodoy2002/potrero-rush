/* Shared, independently testable jersey validation. */
(function(root){'use strict';
function name(value){
 const text=typeof value==='string'?value.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleUpperCase('es-AR'):'';
 if(!text)return {ok:false,value:'',error:'Escribí un nombre para salir a la cancha.'};
 if(Array.from(text).length>12)return {ok:false,value:text,error:'El nombre puede tener hasta 12 caracteres.'};
 if(!/^[\p{L}\p{N} '\u2019.-]+$/u.test(text)||!/[\p{L}\p{N}]/u.test(text))return {ok:false,value:text,error:'Usá letras, números, espacios, punto, apóstrofo o guion.'};
 return {ok:true,value:text,error:''};
}
function number(value){const raw=String(value??'').trim();const n=Number(raw);return /^\d{1,2}$/.test(raw)&&Number.isInteger(n)&&n>=1&&n<=99?{ok:true,value:n,error:''}:{ok:false,value:null,error:'Elegí un número del 1 al 99.'};}
function player(value){const n=name(value?.name),d=number(value?.number);return value?.confirmed===true&&n.ok&&d.ok?{name:n.value,number:d.value,confirmed:true}:{name:'',number:10,confirmed:false};}
function validate(n,d){const N=name(n),D=number(d);return {ok:N.ok&&D.ok,name:N.value,number:D.value,error:!N.ok?N.error:D.error,nameError:N.error,numberError:D.error};}
const api={name,number,player,validate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PotreroProfile=api;
})(typeof window!=='undefined'?window:globalThis);
