import {database,entriesTransaction} from '@/lib/database';
import {InventoryError,planInventoryChange,type Entry} from '@/lib/inventory';
export async function GET(){try{const r=await database().prepare('SELECT id,kind,data FROM entries').all();return Response.json({entries:r.results.map(r=>({...JSON.parse(String(r.data)),id:r.id,kind:r.kind}))},{headers:{'Cache-Control':'no-store'}})}catch(e){console.error(e);return Response.json({error:'Unable to load'},{status:503})}}
export async function POST(request:Request){
 try{
  const {action,items}=await request.json() as {action:string;items:Entry[]};
  if(!['save','delete'].includes(action)||!Array.isArray(items)||items.length>200)return Response.json({error:'Invalid entries'},{status:400});
  for(const item of items){
   if(!item||typeof item.id!=='string'||!item.id||item.id.length>100||!['meal','breakfast','grocery','inventory'].includes(item.kind))return Response.json({error:'Invalid entry'},{status:400});
   if(JSON.stringify(item).length>10000)return Response.json({error:'Entry too long'},{status:400});
  }
  const entries=await entriesTransaction(async client=>{
   const rows=await client.query('SELECT id,kind,data FROM the_table.entries');
   const current=rows.rows.map(r=>({...JSON.parse(String(r.data)),id:r.id,kind:r.kind})) as Entry[];
   const plan=planInventoryChange(current,items,action as 'save'|'delete');
   for(const item of plan.deleted)await client.query('DELETE FROM the_table.entries WHERE id=$1 AND kind=$2',[item.id,item.kind]);
   for(const item of plan.changed){const {id,kind,...data}=item;await client.query('INSERT INTO the_table.entries (id,kind,data) VALUES ($1,$2,$3) ON CONFLICT(id) DO UPDATE SET data=excluded.data WHERE entries.kind=excluded.kind',[id,kind,JSON.stringify(data)]);}
   return plan.entries;
  });
  return Response.json({ok:true,entries});
 }catch(e){
  if(e instanceof InventoryError)return Response.json({error:e.message},{status:409});
  console.error(e);return Response.json({error:'Unable to save. Please try again.'},{status:503});
 }
}
