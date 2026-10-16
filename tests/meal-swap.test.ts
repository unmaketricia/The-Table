import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mealDateSwap} from '../lib/meal-swap.ts';
const a={id:'a',kind:'meal',date:'2026-10-12',dish:'Adobo',meat:'Chicken',cut:'Thigh',available:true,notes:'For lunch'};
const b={id:'b',kind:'meal',date:'2026-10-13',dish:'Sinigang',meat:'Fish',cut:'Salmon',available:false,notes:'No salt'};
test('swaps dates while preserving every dish detail and the originals',()=>{
 const entries=[a,b];const moved=mealDateSwap(entries,a.date,b.date);
 assert.deepEqual(moved,[{...a,date:b.date},{...b,date:a.date}]);assert.deepEqual(entries,[a,b]);
 assert.deepEqual(mealDateSwap(moved,b.date,a.date),entries);
});
test('moving to an empty day needs no synthetic meal record',()=>assert.deepEqual(mealDateSwap([a],a.date,'2026-10-14'),[{...a,date:'2026-10-14'}]));
test('favorites and breakfast entries on the same dates remain unchanged',()=>{
 const favorite={...a,id:'favorite',favoriteTemplate:true};const breakfast={...a,id:'breakfast',kind:'breakfast'};
 assert.deepEqual(mealDateSwap([a,b,favorite,breakfast],a.date,b.date),[{...a,date:b.date},{...b,date:a.date}]);
});
test('preserves additional records for either day instead of overwriting them',()=>{
 const extra={...a,id:'older-empty',dish:'',meat:'',notes:''};
 assert.deepEqual(mealDateSwap([a,extra,b],a.date,b.date),[{...a,date:b.date},{...extra,date:b.date},{...b,date:a.date}]);
});
test('same date and missing source are no-ops',()=>{
 assert.deepEqual(mealDateSwap([a,b],a.date,a.date),[]);
 assert.deepEqual(mealDateSwap([a,b],'2026-10-14',b.date),[]);
});
