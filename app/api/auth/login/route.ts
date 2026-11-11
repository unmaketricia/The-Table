import {verifyPassword,createSession,sameOrigin} from '../../../../lib/auth';
import {database} from '../../../../db/raw';

export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  try{
    const body=await request.json() as {email?:unknown;password?:unknown};
    const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
    const password=typeof body.password==='string'?body.password:'';
    if(!email||!password)return Response.json({error:'Enter your email and password.'},{status:400});
    const user=await database().prepare('SELECT id,email,password_hash FROM users WHERE email=?').bind(email).first<{id:string;email:string;password_hash:string}>();
    if(!user||!verifyPassword(password,user.password_hash))return Response.json({error:'Email or password is incorrect.'},{status:401});
    await createSession(user.id);
    return Response.json({user:{id:user.id,email:user.email}});
  }catch(error){console.error(error);return Response.json({error:'Unable to sign in right now.'},{status:503});}
}
