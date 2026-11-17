'use client';
import '../login/login.css';
import './account.css';
import {useEffect,useState} from 'react';
import {AccountSecurity} from '@/components/account-security';
import {authClient} from '@/commercial/auth';
import {APP_BASE,buyerFetch} from '@/commercial/api';
type Account={paid:boolean;owner:boolean;members:{userId:string}[]};
export default function Account(){
 const [account,A]=useState<Account|null>(null),[message,M]=useState('Checking your account…'),[email,E]=useState(''),[busy,B]=useState(false),[notice,N]=useState('');
 useEffect(()=>{let active=true;async function refresh(){try{
 const client=authClient();const {data}=client?await client.auth.getSession():{data:{session:null}};if(!data.session){window.location.replace(APP_BASE+'/login');return}
 const token=new URLSearchParams(location.search).get('invite')||localStorage.getItem('table-pending-invite');
 if(token){const r=await buyerFetch('/api/household',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'accept',token})});const d=await r.json();if(!r.ok)throw Error(d.error);localStorage.removeItem('table-pending-invite');history.replaceState(null,'',APP_BASE+'/account');}
 const r=await buyerFetch('/api/account'),d=await r.json();if(!r.ok)throw Error(d.error);if(active){A(d);M(d.paid?'':'No confirmed purchase is linked to this email yet. If you just paid, use the same checkout email; this page updates automatically as payment is verified.')}
 }catch(e){if(active)M(e instanceof Error?e.message:'Could not load your account')}}void refresh();const timer=setInterval(refresh,5000);return()=>{active=false;clearInterval(timer)}},[]);
 async function manage(action:string,userId?:string){B(true);try{const r=await buyerFetch('/api/household',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,email,userId})});const d=await r.json();if(!r.ok)throw Error(d.error);if(d.emailSent){E('');N('Invitation email sent to '+email+'. The link expires in seven days.')}else N('Household updated.')}catch(e){N(e instanceof Error?e.message:'Could not update household')}finally{B(false)}}
 return <div className="table-shell"><main className="login-page account-page">
  <a className="login-brand" href={APP_BASE}>The Table</a>
  <h1>{account?.paid?'Your Table is ready.':'Your account'}</h1>
  {message&&<p className="account-status" role="status">{message}</p>}
  {account?.paid?<>
   <section className="account-start" aria-label="Open and install The Table">
    <a className="primary account-continue" href={APP_BASE}>Open The Table</a>
    <details className="install-details">
     <summary>Add The Table to your phone<span aria-hidden="true">⌄</span></summary>
     <div className="install-instructions">
      <p>Open your Table first, then follow the steps for your phone.</p>
      <div className="phone-instructions"><h3>iPhone · Safari</h3><ol><li>Tap the Share button.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong>.</li></ol></div>
      <div className="phone-instructions"><h3>Android · Chrome</h3><ol><li>Tap the three-dot menu.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Follow the steps to confirm.</li></ol></div>
      <p className="account-note">Your menus and groceries stay saved to your household account.</p>
     </div>
    </details>
   </section>
   {account.owner&&<section className="account-section" aria-labelledby="household-heading">
    <h2 id="household-heading">Your household</h2>
    <p>Add three more members to your household.</p>
    <form onSubmit={e=>{e.preventDefault();void manage('invite')}}>
     <label><span className="sr-only">Email Address</span><input type="email" autoComplete="email" placeholder="Email Address" value={email} onChange={e=>E(e.target.value)} required disabled={busy}/></label>
     <button className="account-secondary" type="submit" disabled={busy}>{busy?'Please wait…':'Send Invitation Link'}</button><p className="account-note">We’ll email a private invitation link to this address.</p>
    </form>
    {notice&&<p className="invitation-notice" role="status">{notice}</p>}
    {account.members.length>0&&<ul className="household-members">{account.members.map((m,index)=><li key={m.userId}><span>Household member {index+1}</span><button type="button" className="account-secondary" disabled={busy} onClick={()=>void manage('remove',m.userId)}>Remove</button></li>)}</ul>}
   </section>}
  </>:account&&<section className="account-section"><h2>Get The Table</h2><p>One purchase gives your household access to The Table.</p><a className="primary account-continue" href="/table#purchase">Buy The Table — $12 one time</a></section>}
  <AccountSecurity/>
  <footer className="account-footer"><a href="/studio/contact">Contact support</a><button type="button" className="signout-secondary" onClick={async()=>{await authClient()?.auth.signOut();location.href=APP_BASE+'/login'}}>Sign out</button></footer>
 </main></div>
}
