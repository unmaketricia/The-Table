'use client';
import '../login/login.css';
import {PasswordFields} from '@/components/password-fields';
import {AuthSkeleton} from '@/components/auth-skeleton';
import {useEffect,useRef,useState} from 'react';
import {authClient} from '@/commercial/auth';
import {APP_BASE,buyerFetch} from '@/commercial/api';
export default function Invite(){
 const [email,E]=useState(''),[password,P]=useState(''),[confirmation,C]=useState(''),[token,T]=useState(''),[mode,M]=useState<'register'|'login'>('register'),[loading,L]=useState(true),[busy,B]=useState(false),[message,N]=useState(''),[other,O]=useState('');
 const locked=useRef(false);
 const [stage,ST]=useState('Joining your household…');
 async function accept(value:string){
  const response=await buyerFetch('/api/household',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'accept',token:value})});
  const result=await response.json();if(!response.ok)throw Error(result.error);
  try{localStorage.removeItem('table-pending-invite')}catch{}
  window.location.replace(APP_BASE);
 }
 useEffect(()=>{
  let active=true;
  const value=new URLSearchParams(location.search).get('token')||'';T(value);
  try{if(/^[a-f0-9]{64}$/.test(value))localStorage.setItem('table-pending-invite',value)}catch{}
  void(async()=>{try{
   const response=await fetch(APP_BASE+'/api/invitation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'preview',token:value}),cache:'no-store'});
   const result=await response.json();if(!active)return;if(!response.ok)throw Error(result.error);E(result.email);
   const client=authClient();if(!client)throw Error('Sign-in is unavailable. Please try again shortly.');
   const {data}=await client.auth.getUser();if(!active)return;
   if(data.user){
    if(data.user.email?.toLowerCase()===result.email.toLowerCase()&&data.user.email_confirmed_at){B(true);await accept(value);return;}
    O(data.user.email||'another account');
   }
  }catch(error){if(active)N(error instanceof Error?error.message:'Unable to open this invitation.');}finally{if(active){L(false);B(false)}}})();
  return()=>{active=false};
 },[]);
 async function submit(event:React.FormEvent){
  event.preventDefault();if(locked.current)return;
  const client=authClient();if(!client)return;
  if(mode==='register'&&password!==confirmation){N('Passwords don’t match.');return;}
  locked.current=true;B(true);N('');
  try{
   if(mode==='register'){
    ST('Creating your account…');
    const response=await fetch(APP_BASE+'/api/invitation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register',token,password,confirmation}),cache:'no-store'});
    const result=await response.json();
    if(!response.ok){if(result.accountExists)M('login');throw Error(result.error);}
   }
   ST('Signing you in…');
   const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;
   ST('Joining your household…');
   await accept(token);
  }catch(error){N(error instanceof Error?error.message:'Unable to join this household.');}
  finally{P('');C('');B(false);locked.current=false;}
 }
 async function switchAccount(){B(true);const {error}=await authClient()!.auth.signOut();B(false);if(error){N('Unable to sign out. Please try again.');return;}O('');N('');}
 return <div className="table-shell"><main className="login-page">
  <h1>{mode==='register'?'Join your household':'Sign in to join'}</h1>
  {loading?<AuthSkeleton heading={false} label="Checking your invitation"/>:email?<>
   {other?<><p>You’re signed in as <strong>{other}</strong>. This invitation is for <strong>{email}</strong>.</p><button type="button" className="primary" disabled={busy} onClick={()=>void switchAccount()}>Continue as {email}</button></>:<>
    <p>{mode==='register'?'Your email is ready. Choose a password to create your account and join the household.':'This email already has an account. Enter your existing password to join the household.'}</p>
    <form aria-busy={busy} onSubmit={event=>void submit(event)}>
     <label>Email address<input type="email" autoComplete="email" value={email} readOnly required/></label>
     <PasswordFields key={mode} mode={mode==='register'?'create':'login'} label={mode==='register'?'Set a password':'Password'} password={password} confirmation={confirmation} onPassword={P} onConfirmation={C} maxLength={128} disabled={busy}/>
     <button type="submit" className="primary" disabled={busy}>{busy?stage:mode==='register'?'Create account & join household':'Sign in & join household'}</button>
    </form>
    <div className="auth-links"><button type="button" disabled={busy} onClick={()=>{M(mode==='register'?'login':'register');P('');C('');N('')}}>{mode==='register'?'Already have an account? Sign in':'Create an account'}</button>{mode==='login'&&<a href={APP_BASE+'/login'}>Forgot password?</a>}</div>
   </>}
  </>:<p>Ask the household owner to send you a new invitation.</p>}
  <div className="auth-status" role="status" aria-live="polite">{message&&<p className="auth-message">{message}</p>}</div>
 </main></div>;
}
