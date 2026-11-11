import {randomUUID} from 'node:crypto';
import {database} from '../../../../db/raw';
import {createSession,hashPassword,sameOrigin} from '../../../../lib/auth';

export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  try{
    const body=await request.json() as {email?:unknown;password?:unknown};
    const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
    const password=typeof body.password==='string'?body.password:'';
    if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return Response.json({error:'Enter a valid email address.'},{status:400});
    if(password.length<8||password.length>128)return Response.json({error:'Use a password between 8 and 128 characters.'},{status:400});
    const db=database();
    if(await db.prepare('SELECT id FROM users WHERE email=?').bind(email).first())return Response.json({error:'An account with this email already exists.'},{status:409});
    const id=randomUUID();
    await db.batch([
      db.prepare('INSERT INTO users (id,email,password_hash) VALUES (?,?,?)').bind(id,email,hashPassword(password)),
      db.prepare('UPDATE entries SET user_id=? WHERE user_id IS NULL').bind(id),
    ]);
    await createSession(id);
    return Response.json({user:{id,email}},{status:201});
  }catch(error){
    if((error as {code?:string})?.code==='23505')return Response.json({error:'An account with this email already exists.'},{status:409});
    console.error(error);
    return Response.json({error:'Unable to create your account right now.'},{status:503});
  }
}
