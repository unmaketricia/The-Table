'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {authClient} from '@/commercial/auth';
import {APP_BASE,buyerFetch} from '@/commercial/api';
export default function BuyerGate({children}:{children:ReactNode}){
 const [status,S]=useState('Checking your access…'),[paid,P]=useState(false);
 useEffect(()=>{let active=true;let timer:ReturnType<typeof setInterval>|undefined;
 async function check(){
  try{
   const client=authClient();if(!client){S('Sign-in is unavailable. Please try again.');return}
   const {data}=await client.auth.getSession();if(!data.session){window.location.replace(APP_BASE+'/login');return}
   const r=await buyerFetch('/api/account');const account=await r.json();
   if(!r.ok)throw new Error(account.error);
   if(active){P(account.paid);S(account.paid?'':'Your account is ready. Purchase The Table to open your private household.')}
  }catch(e){if(active){P(false);S(e instanceof Error?e.message:'Unable to check access.')}}
 }
 void check();timer=setInterval(check,5000);return()=>{active=false;if(timer)clearInterval(timer)}
 },[]);
 if(!paid)return <main className="table-shell" style={{padding:'3rem',maxWidth:'42rem',margin:'auto'}}><h1>The Table</h1><p role="status">{status}</p><p><a href={APP_BASE+'/account'}>Your account</a> · <a href="/table#purchase">Purchase access</a></p></main>;
 return <><div style={{textAlign:'right',padding:'0.5rem 1.5rem'}}><a href={APP_BASE+'/account'}>Your account & household</a></div>{children}</>;
}
