import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planInventoryChange,type Entry} from '../lib/inventory.ts';
const stock:Entry={id:'chicken',kind:'inventory',meat:'Chicken',cut:'Thigh',stock:3,stockVersion:1};
const meal:Entry={id:'monday',kind:'meal',date:'2026-11-16',inventoryId:'chicken',inventoryQuantity:1};
const amount=(entries:Entry[])=>entries.find(e=>e.id==='chicken')?.stock;
test('save deducts stock and a repeated save is idempotent',()=>{
 const saved=planInventoryChange([stock],[meal],'save');assert.equal(amount(saved.entries),2);
 assert.equal(amount(planInventoryChange(saved.entries,[meal],'save').entries),2);
});
test('editing amount applies only the difference; deleting restores stock',()=>{
 const saved=planInventoryChange([stock],[meal],'save').entries;
 const edited=planInventoryChange(saved,[{...meal,inventoryQuantity:2}],'save').entries;
 assert.equal(amount(edited),1);assert.equal(amount(planInventoryChange(edited,[meal],'delete').entries),3);
});
test('switching cuts returns the old stock and deducts the new stock',()=>{
 const other={...stock,id:'pork',meat:'Pork',cut:'Belly',stock:2};
 const saved=planInventoryChange([stock,other],[meal],'save').entries;
 const next=planInventoryChange(saved,[{...meal,inventoryId:'pork',inventoryQuantity:1}],'save').entries;
 assert.equal(amount(next),3);assert.equal(next.find(e=>e.id==='pork')?.stock,1);
});
test('overbooking is rejected against the latest saved stock',()=>{
 const saved=planInventoryChange([stock],[{...meal,inventoryQuantity:3}],'save').entries;
 assert.throws(()=>planInventoryChange(saved,[{...meal,id:'tuesday'}],'save'),/Not enough/);
});
test('date changes and favorites do not consume additional stock',()=>{
 const saved=planInventoryChange([stock],[meal],'save').entries;
 assert.equal(amount(planInventoryChange(saved,[{...meal,date:'2026-11-17'}],'save').entries),2);
 assert.equal(amount(planInventoryChange(saved,[{...meal,id:'favorite',favoriteTemplate:true}],'save').entries),2);
});
test('cancelled inventory link restores stock and linked inventory cannot be deleted',()=>{
 const saved=planInventoryChange([stock],[meal],'save').entries;
 assert.throws(()=>planInventoryChange(saved,[stock],'delete'),/used by a meal/);
 assert.equal(amount(planInventoryChange(saved,[{...meal,inventoryId:'',inventoryQuantity:undefined}],'save').entries),3);
});
test('invalid quantities and stale stock edits are rejected',()=>{
 for(const value of [-1,NaN,0,0.5,0.0001])assert.throws(()=>planInventoryChange([stock],[{...meal,inventoryQuantity:value}],'save'));
 const saved=planInventoryChange([stock],[meal],'save').entries;
 assert.throws(()=>planInventoryChange(saved,[{...stock,stock:10}],'save'),/stock has changed/);
});
