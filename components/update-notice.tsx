'use client';
import {useEffect,useState} from 'react';
const key='table-update-seen:2026-11-23-custom-menus';
export function UpdateNotice(){
 const [visible,V]=useState(false);
 useEffect(()=>{try{V(localStorage.getItem(key)!=='1')}catch{V(true)}},[]);
 function dismiss(){try{localStorage.setItem(key,'1')}catch{}V(false)}
 if(!visible)return null;
 return <aside className="app-update-notice" role="status" aria-label="App update"><div><strong>The Table has been updated.</strong><p>Custom menus now have separate mealtimes, optional names for each meal, and Rename menu and Delete menu controls.</p><p>Save any changes first. In your browser, tap Refresh app below. If you use the app from your phone’s home screen, close it completely, then reopen it from its icon to load the latest version.</p></div><div className="actions"><button type="button" className="primary" onClick={()=>{dismiss();window.location.reload()}}>Refresh app</button><button type="button" onClick={dismiss}>Got it</button></div></aside>;
}
