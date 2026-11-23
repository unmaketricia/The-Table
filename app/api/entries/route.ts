import {getMenuMealSlots} from '@/commercial/settings';
import {mealConflict} from '@/lib/meal-person';
import {buyerIdentity,buyerRpc,buyerFailure,BuyerError} from '@/commercial/server';
import {InventoryError,planInventoryChange,type Entry} from '@/lib/inventory';
import {SETTINGS_ID,readSettings,validateSettings,mealsRemovedBySettings} from '@/commercial/settings-validation';
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
   const deleted=mealsRemovedBySettings(snapshot.entries as Entry[],readSettings(stored),settings);
   if(deleted.length>200)throw new BuyerError('More than 200 planned meals use this menu or meal time. Remove some meals before trying again.');
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
  if(action==='save'){const settings=readSettings(stored);for(const item of items)if(item.kind==='meal'&&!item.favoriteTemplate&&!settings.menuProfiles.some(p=>p.id===(item.profileId||'main')))throw new BuyerError('This menu was removed. Refresh and choose another menu.',409);}
  let plan;try{plan=planInventoryChange(snapshot.entries,items,action as 'save'|'delete')}catch(e){if(e instanceof InventoryError)throw new BuyerError(e.message,409);throw e}
  if(action==='save'){const settings=readSettings(stored);for(const item of items){if(item.kind!=='meal'||item.favoriteTemplate)continue;if(item.child!==undefined&&(typeof item.child!=='string'||item.child.length>80))throw new BuyerError('Enter a name of up to 80 characters.');if(!getMenuMealSlots(settings,String(item.profileId||'main')).some(s=>s.id===(item.slotId||'dinner')))throw new BuyerError('This mealtime was removed. Refresh and choose another.',409);if(mealConflict(plan.entries,item))throw new BuyerError('A meal is already planned for this person, date, and mealtime.',409);}}
  await buyerRpc(token,'table_apply',{p_household:account.householdId,p_revision:snapshot.revision,p_changed:plan.changed,p_deleted:plan.deleted.map(e=>e.id)});
  return Response.json({ok:true,entries:plan.entries,revision:Number(snapshot.revision)+1},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return buyerFailure(e)}
}
