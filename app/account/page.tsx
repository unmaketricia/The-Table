'use client';
import '../login/login.css';
import './account.css';
import {useEffect,useState} from 'react';
import {authClient} from '@/commercial/auth';
import {APP_BASE,buyerFetch} from '@/commercial/api';
type Account={paid:boolean;owner:boolean;members:{userId:string}[]};
export default function Account(){
 const [account,A]=useState<Account|null>(null),[message,M]=useState('Checking your account…'),[email,E]=useState(''),[invite,I]=useState(''),[busy,B]=useState(false);
 useEffect(()=>{let active=true;async function refresh(){try{
 const client=authClient();const {data}=client?await client.auth.getSession():{data:{session:null}};if(!data.session){window.location.replace(APP_BASE+'/login');return}
 const token=new URLSearchParams(location.search).get('invite');
 if(token){const r=await buyerFetch('/api/household',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'accept',token})});const d=await r.json();if(!r.ok)throw Error(d.error);history.replaceState(null,'',APP_BASE+'/account');}
 const r=await buyerFetch('/api/account'),d=await r.json();if(!r.ok)throw Error(d.error);if(active){A(d);M(d.paid?'Your private Table is ready.':'No confirmed purchase is linked to this email yet. If you just paid, use the same checkout email; this page updates automatically as payment is verified.')}
 }catch(e){if(active)M(e instanceof Error?e.message:'Could not load your account')}}void refresh();const timer=setInterval(refresh,5000);return()=>{active=false;clearInterval(timer)}},[]);
 async function manage(action:string,userId?:string){B(true);try{const r=await buyerFetch('/api/household',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,email,userId})});const d=await r.json();if(!r.ok)throw Error(d.error);if(d.token){I(location.origin+APP_BASE+'/account?invite='+encodeURIComponent(d.token));E('');M('Copy this invitation link and share it with the invited person. It expires in seven days.')}else M('Household updated.')}catch(e){M(e instanceof Error?e.message:'Could not update household')}finally{B(false)}}
 return <div className="table-shell"><main className="login-page account-page">
  <a className="login-brand" href={APP_BASE}>The Table</a>
  <h1>Your account</h1>
  <p className="account-status" role="status">{message}</p>
  {account?.paid?<>
   <section className="account-section" aria-labelledby="open-table-heading">
    <h2 id="open-table-heading">Open The Table</h2>
    <p>Plan your meals, update your grocery list, and keep your household in sync.</p>
    <a className="primary account-continue" href={APP_BASE}>Go to my Table →</a>
   </section>
   <section className="account-section" aria-labelledby="install-table-heading">
    <h2 id="install-table-heading">Add The Table to your phone</h2>
    <p>Open your Table first, then follow the steps for your phone.</p>
    <div className="phone-instructions"><h3>iPhone · Safari</h3><ol><li>Tap the Share button.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol></div>
    <div className="phone-instructions"><h3>Android · Chrome</h3><ol><li>Tap the three-dot menu.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Follow the steps to confirm.</li></ol></div>
    <p className="account-note">Your menus and groceries stay saved to your household account.</p>
   </section>
   {account.owner&&<section className="account-section" aria-labelledby="household-heading">
    <h2 id="household-heading">Your household</h2>
    <p>Add up to three members to your household.</p>
    <form onSubmit={e=>{e.preventDefault();void manage('invite')}}>
     <label>Invite by email<input type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={e=>E(e.target.value)} required disabled={busy}/></label>
     <button className="account-secondary" type="submit" disabled={busy}>{busy?'Please wait…':'Create invitation link'}</button>
    </form>
    {invite&&<div className="account-invitation"><label>Invitation link<input readOnly value={invite} onFocus={e=>e.target.select()}/></label><p>Copy this link and share it with the person you invited. It expires in seven days.</p><button type="button" className="account-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(invite);M('Invitation link copied.')}catch{M('Select the invitation link above to copy it.')}}}>Copy invitation link</button></div>}
    {account.members.length>0&&<ul className="household-members">{account.members.map((m,index)=><li key={m.userId}><span>Household member {index+1}</span><button type="button" className="account-secondary" disabled={busy} onClick={()=>void manage('remove',m.userId)}>Remove</button></li>)}</ul>}
   </section>}
  </>:account&&<section className="account-section"><h2>Get The Table</h2><p>One purchase gives your household access to The Table.</p><a className="primary account-continue" href="/table#purchase">Buy The Table — $12 one time</a></section>}
  <footer className="account-footer"><a href="/studio/contact">Contact support</a><button type="button" className="signout-secondary" onClick={async()=>{await authClient()?.auth.signOut();location.href=APP_BASE+'/login'}}>Sign out</button></footer>
 </main></div>
}
