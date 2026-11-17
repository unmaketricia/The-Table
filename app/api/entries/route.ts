import {buyerIdentity,buyerRpc,buyerFailure,BuyerError} from '@/commercial/server';
import {InventoryError,planInventoryChange,type Entry} from '@/lib/inventory';
import {SETTINGS_ID,readSettings,validateSettings} from '@/commercial/settings-validation';
export async function GET(request:Request){
 try{const {token}=await buyerIdentity(request);const account=await buyerRpc(token,'table_account');if(!account.paid)throw new BuyerError('Purchase access required',403);
 return Response.json(await buyerRpc(token,'table_snapshot',{p_household:account.householdId}),{headers:{'Cache-Control':'no-store'}})}catch(e){return buyerFailure(e)}
}
export async function POST(request:Request){
 try{
  const {token}=await buyerIdentity(request),account=await buyerRpc(token,'table_account');if(!account.paid)throw new BuyerError('Purchase access required',403);
  const raw=await request.text();if(raw.length>1000000)throw new BuyerError('Request too large',413);
  let body;try{body=JSON.parse(raw)}catch{throw new BuyerError('Invalid request')}
  const snapshot=await buyerRpc(token,'table_snapshot',{p_household:account.householdId});
  const stored=snapshot.entries.find((e:Entry)=>e.id===SETTINGS_ID);
  if(body.action==='settings'){
   if(body.expectedVersion!==(stored?.version||0))throw new BuyerError('Customization changed in another window. Close Customize and reopen it before trying again.',409);
   let settings;try{settings=validateSettings(body.settings)}catch(e){throw new BuyerError(e instanceof Error?e.message:'Invalid customization')}
   const previous=readSettings(stored),removed=previous.mealSlots!.filter(s=>!settings.mealSlots!.some(n=>n.id===s.id)).map(s=>s.id);
   const deleted=snapshot.entries.filter((e:Entry)=>e.kind==='meal'&&!e.favoriteTemplate&&removed.includes(String(e.slotId||'dinner')));
   if(deleted.length>200)throw new BuyerError('Too many planned meals use this meal time. Remove those meals before removing the time.');
   const plan=planInventoryChange(snapshot.entries,deleted,'delete');
   const version=Number(stored?.version||0)+1;
   const entry={id:SETTINGS_ID,kind:'settings',settings,version};
   await buyerRpc(token,'table_apply',{p_household:account.householdId,p_revision:snapshot.revision,p_changed:[...plan.changed,entry],p_deleted:plan.deleted.map(e=>e.id)});
   return Response.json({ok:true,settingsVersion:version},{headers:{'Cache-Control':'no-store'}});
  }
  const {action,items}=body as {action:string;items:Entry[]};
  if(!['save','delete'].includes(action)||!Array.isArray(items)||items.length>200)throw new BuyerError('Invalid entries');
  for(const item of items)if(!item||typeof item.id!=='string'||!item.id||item.id===SETTINGS_ID||item.id.length>100||!['meal','breakfast','grocery','inventory'].includes(item.kind)||JSON.stringify(item).length>10000)throw new BuyerError('Invalid entry');
  if(body.revision!==undefined&&body.revision!==snapshot.revision)throw new BuyerError('Your household changed in another window. Refresh and try again.',409);
  let plan;try{plan=planInventoryChange(snapshot.entries,items,action as 'save'|'delete')}catch(e){if(e instanceof InventoryError)throw new BuyerError(e.message,409);throw e}
  await buyerRpc(token,'table_apply',{p_household:account.householdId,p_revision:snapshot.revision,p_changed:plan.changed,p_deleted:plan.deleted.map(e=>e.id)});
  return Response.json({ok:true,entries:plan.entries,revision:Number(snapshot.revision)+1},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return buyerFailure(e)}
}
