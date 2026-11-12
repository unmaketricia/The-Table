export type Entry={id:string;kind:string;[key:string]:unknown};
export const inventoryUnits=['packs','kg','g','pieces','portions'];
export class InventoryError extends Error{}
const rounded=(n:number)=>Math.round(n*1000)/1000;
function quantity(value:unknown,positive=false){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1000000||(positive&&value===0)||Math.abs(value-rounded(value))>0.0000001)throw new InventoryError('Enter a valid quantity with up to 3 decimal places.');
 return value;
}
function allocation(e:Entry|undefined){
 if(!e||e.kind!=='meal'||e.favoriteTemplate||!e.inventoryId)return null;
 if(typeof e.inventoryId!=='string'||typeof e.date!=='string'||!e.date)throw new InventoryError('Choose a date for this inventory meal.');
 return {id:e.inventoryId,amount:quantity(e.inventoryQuantity,true)};
}
// Compare persisted allocations to the requested state, so retries and date swaps
// do not deduct stock twice. The caller holds the database transaction lock.
export function planInventoryChange(current:Entry[],items:Entry[],action:'save'|'delete'){
 const original=new Map(current.map(e=>[e.id,e]));
 const next=new Map(current.map(e=>[e.id,{...e}]));
 const ids=new Set<string>();
 const deltas=new Map<string,number>();
 for(const input of items){
  if(ids.has(input.id))throw new InventoryError('An entry was submitted twice.');
  ids.add(input.id);
  const old=original.get(input.id);
  if(old&&old.kind!==input.kind)throw new InventoryError('This entry has changed. Refresh and try again.');
  if(action==='delete'){next.delete(input.id);continue;}
  const item={...input};
  if(item.kind==='inventory'){
   if(typeof item.cut!=='string'||!item.cut.trim()||typeof item.meat!=='string'||!item.meat.trim())throw new InventoryError('Choose a protein and enter a variant / cut.');
   if(!inventoryUnits.includes(String(item.unit)))throw new InventoryError('Choose a unit for the quantity.');
   quantity(item.stock);
   if(old&&(item.stockVersion??0)!==(old.stockVersion??0))throw new InventoryError('This stock has changed. Close the editor and reopen it to see the latest quantity.');
   if(old&&item.unit!==old.unit&&current.some(e=>allocation(e)?.id===item.id))throw new InventoryError('This unit is used by a planned meal. Add a separate inventory item for a different unit.');
   item.cut=item.cut.trim();item.stockVersion=Number(old?.stockVersion??0)+1;
  }
  if(item.kind==='meal'&&item.favoriteTemplate){delete item.inventoryId;delete item.inventoryQuantity;}
  next.set(item.id,item);
 }
 for(const id of ids){
  const before=allocation(original.get(id)),after=allocation(next.get(id));
  if(before)deltas.set(before.id,(deltas.get(before.id)??0)+before.amount);
  if(after)deltas.set(after.id,(deltas.get(after.id)??0)-after.amount);
 }
 for(const [id,delta] of deltas){
  if(Math.abs(delta)<0.0000001)continue;
  const stock=next.get(id);
  if(!stock||stock.kind!=='inventory')throw new InventoryError('The selected inventory item is no longer available.');
  const remaining=rounded(quantity(stock.stock)+delta);
  if(remaining<0)throw new InventoryError(`Not enough ${stock.cut} in inventory. Reduce the quantity or choose another item.`);
  stock.stock=quantity(remaining);stock.stockVersion=Number(stock.stockVersion??0)+1;
 }
 for(const e of next.values()){
  const used=allocation(e);
  if(!used)continue;
  const stock=next.get(used.id);
  if(!stock||stock.kind!=='inventory')throw new InventoryError('This inventory item is used by a meal. Remove it from the meal before deleting it.');
  if(ids.has(e.id)&&action==='save'){e.meat=stock.meat;e.cut=stock.cut;e.available=true;}
 }
 const changed=[...next.values()].filter(e=>JSON.stringify(e)!==JSON.stringify(original.get(e.id)));
 return {entries:[...next.values()],changed,deleted:current.filter(e=>!next.has(e.id))};
}
