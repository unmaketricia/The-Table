import {createHash, randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {database} from '../db/raw';

const COOKIE = 'the_table_session';
const SESSION_DAYS = 30;
const scrypt = (password:string,salt:Buffer) => scryptSync(password,salt,64);

export function hashPassword(password:string){
  const salt=randomBytes(16);
  return `scrypt:${salt.toString('hex')}:${scrypt(password,salt).toString('hex')}`;
}

export function verifyPassword(password:string,encoded:string){
  const [algorithm,saltHex,hashHex]=encoded.split(':');
  if(algorithm!=='scrypt'||!saltHex||!hashHex)return false;
  const expected=Buffer.from(hashHex,'hex');
  const actual=scrypt(password,Buffer.from(saltHex,'hex'));
  return expected.length===actual.length&&timingSafeEqual(expected,actual);
}

const digest=(token:string)=>createHash('sha256').update(token).digest('hex');

export async function createSession(userId:string){
  const token=randomBytes(32).toString('base64url');
  const expiresAt=new Date(Date.now()+SESSION_DAYS*24*60*60*1000).toISOString();
  await database().prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(digest(token),userId,expiresAt).run();
  const jar=await cookies();
  jar.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',expires:new Date(expiresAt)});
}

export async function currentUser(){
  const token=(await cookies()).get(COOKIE)?.value;
  if(!token)return null;
  const row=await database().prepare('SELECT users.id,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at > ?').bind(digest(token),new Date().toISOString()).first<{id:string;email:string}>();
  return row??null;
}

export async function deleteSession(){
  const jar=await cookies();
  const token=jar.get(COOKIE)?.value;
  if(token)await database().prepare('DELETE FROM sessions WHERE token_hash=?').bind(digest(token)).run();
  jar.delete(COOKIE);
}

export function sameOrigin(request:Request){
  const origin=request.headers.get('origin');
  if(!origin)return true;
  try{return new URL(origin).host===new URL(request.url).host;}catch{return false;}
}
