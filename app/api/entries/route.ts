import {currentUser,sameOrigin} from '../../../lib/auth';
import {database} from '../../../db/raw';

type Entry={id:string;kind:string;[key:string]:unknown};

export async function GET(){
  try{
    const user=await currentUser();
    if(!user)return Response.json({error:'Sign in to continue.'},{status:401});
    const r=await database().prepare('SELECT id,kind,data FROM entries WHERE user_id=?').bind(user.id).all<{id:string;kind:string;data:string}>();
    return Response.json({entries:r.results.map(row=>({id:row.id,kind:row.kind,...JSON.parse(row.data)}))},{headers:{'Cache-Control':'no-store'}});
  }catch(error){console.error(error);return Response.json({error:'Unable to load entries.'},{status:503});}
}

export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  try{
    const user=await currentUser();
    if(!user)return Response.json({error:'Sign in to continue.'},{status:401});
    const body=await request.json() as {action?:string;items?:Entry[]};
    const {action='save',items}=body;
    if(!Array.isArray(items)||items.length>200||!['save','delete'].includes(action))return Response.json({error:'Invalid entries.'},{status:400});
    const db=database();
    const statements=[];
    for(const item of items){
      if(typeof item.id!=='string'||item.id.length>100||!['meal','breakfast','grocery'].includes(item.kind))return Response.json({error:'Invalid entry.'},{status:400});
      const {id,kind,...data}=item;
      if(JSON.stringify(data).length>10000)return Response.json({error:'Entry too long.'},{status:400});
      statements.push(action==='delete'
        ?db.prepare('DELETE FROM entries WHERE id=? AND kind=? AND user_id=?').bind(id,kind,user.id)
        :db.prepare('INSERT INTO entries (id,kind,data,user_id) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data WHERE entries.kind=excluded.kind AND entries.user_id=excluded.user_id').bind(id,kind,JSON.stringify(data),user.id));
    }
    if(statements.length)await db.batch(statements);
    return Response.json({ok:true});
  }catch(error){console.error(error);return Response.json({error:'Unable to save entries.'},{status:503});}
}
