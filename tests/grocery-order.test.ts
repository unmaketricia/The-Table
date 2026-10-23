import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prioritizeGroceries,placeGrocery} from '../lib/grocery-order.ts';
test('pinned groceries come first, preserving manual order and old entries',()=>{
 const items=[{id:'a'},{id:'b',important:true},{id:'c',important:false},{id:'d',important:true}];
 assert.deepEqual(prioritizeGroceries(items).map(i=>i.id),['b','d','a','c']);
 assert.deepEqual(items.map(i=>i.id),['a','b','c','d']);
});
test('pin survives save/reload data and unpin returns to manual order',()=>{
 const items:Array<{id:string;position:number;important?:boolean}>=JSON.parse(JSON.stringify([{id:'a',position:0},{id:'b',position:1,important:true}]));
 assert.equal(prioritizeGroceries(items)[0].id,'b');
 items[1].important=false;
 assert.equal(prioritizeGroceries(items)[0].id,'a');
});
test('drag reorder keeps pinned items above unpinned groceries',()=>{
 const items=[{id:'a',important:true},{id:'b'},{id:'c'}];
 const order=placeGrocery(items.map(i=>i.id),'c','a',false);
 assert.deepEqual(prioritizeGroceries(order.map(id=>items.find(i=>i.id===id)!)).map(i=>i.id),['a','c','b']);
});
