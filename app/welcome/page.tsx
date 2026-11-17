'use client';
import '../login/login.css';
import '../account/account.css';
import './welcome.css';
import {useEffect,useRef,useState} from 'react';
import {authClient} from '@/commercial/auth';
import {APP_BASE,buyerFetch} from '@/commercial/api';
import {useHousehold} from '@/commercial/context';
import {getTableDisplay,palettes} from '@/commercial/settings';
import {WELCOME_SEEN_KEY} from '@/commercial/onboarding';
export default function Welcome(){
 const {workspace,ready:themeReady,choosePalette}=useHousehold();
 const [ready,R]=useState(false),[busy,B]=useState(false),[message,M]=useState('');
 const marked=useRef(false),locked=useRef(false);
 const display=getTableDisplay(workspace.settings);
 async function markSeen(){
  const client=authClient();if(!client)throw Error('Please sign in again.');
  const {error}=await client.auth.updateUser({data:{[WELCOME_SEEN_KEY]:new Date().toISOString()}});
  if(error)throw error;marked.current=true;
 }
 useEffect(()=>{
  let active=true;
  void(async()=>{try{
   const client=authClient();const {data}=client?await client.auth.getSession():{data:{session:null}};
   if(!data.session){window.location.replace(APP_BASE+'/login');return}
   const r=await buyerFetch('/api/account');const account=await r.json();if(!r.ok)throw Error(account.error||'Could not load your Table.');
   if(!active)return;
   if(!account.paid){window.location.replace(APP_BASE+'/account?continue=1');return}
   if(account.welcomeSeen){window.location.replace(APP_BASE);return}
   R(true);
   // Remember that this introduction was shown, even if the user closes it.
   await markSeen();
  }catch(e){if(active){M(e instanceof Error?e.message:'Could not finish setup. Please try again.')}}})();
  return()=>{active=false};
 },[]);
 async function openTable(){
  if(locked.current)return;locked.current=true;B(true);M('');
  try{if(!marked.current)await markSeen();window.location.replace(APP_BASE)}
  catch(e){M(e instanceof Error?e.message:'Could not open your Table. Please try again.');locked.current=false;B(false)}
 }
 async function pick(accent:string,surface:string){
  if(locked.current||!themeReady)return;locked.current=true;B(true);M('');
  try{if(!await choosePalette(accent,surface))throw Error('Could not save this color. Please try again.');}
  catch(e){M(e instanceof Error?e.message:'Could not save this color.');}
  finally{locked.current=false;B(false)}
 }
 return <main className="login-page account-page welcome-page">
  {!ready?<><p role="status">{message||'Getting your Table ready…'}</p>{message&&<button type="button" onClick={()=>location.reload()}>Try again</button>}</>:<>
   <h1>Your Table is ready.</h1>
   <button type="button" className="primary account-continue" disabled={busy} onClick={()=>void openTable()}>Open The Table</button>
   <details className="install-details">
    <summary>Add The Table to your phone<span aria-hidden="true">⌄</span></summary>
    <div className="install-instructions">
     <p>Open your Table first, then follow the steps for your phone.</p>
     <div className="phone-instructions"><h3>iPhone · Safari</h3><ol><li>Tap the Share button.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol></div>
     <div className="phone-instructions"><h3>Android · Chrome</h3><ol><li>Tap the three-dot menu.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Follow the steps to confirm.</li></ol></div>
    </div>
   </details>
   <section className="welcome-colors" aria-labelledby="welcome-colors-title">
    <h2 id="welcome-colors-title">Choose your color</h2>
    <div className="welcome-swatches">{palettes.map(p=><button type="button" key={p.name} aria-label={p.name} aria-pressed={display.accent===p.accent&&display.surface===p.surface} disabled={busy||!themeReady} style={{background:p.accent}} onClick={()=>void pick(p.accent,p.surface)}/>)}</div>
   </section>
   {message&&<p role="alert">{message}</p>}
  </>}
 </main>;
}
