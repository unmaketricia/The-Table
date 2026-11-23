'use client';
import {authClient} from './auth';
export const APP_BASE='/table/app';
export async function buyerFetch(path:string,init:RequestInit={}){
 const client=authClient();if(!client)throw new Error('Sign in first');
 const {data}=await client.auth.getSession();if(!data.session)throw new Error('Sign in first');
 const headers=new Headers(init.headers);headers.set('Authorization','Bearer '+data.session.access_token);
 return fetch(APP_BASE+path,{...init,headers,cache:'no-store'});
}
