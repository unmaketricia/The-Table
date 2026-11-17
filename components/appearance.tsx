'use client';
import {useEffect,useState,type CSSProperties,type ReactNode} from 'react';
import {tableLogoSvg} from '@/lib/table-logo';
import {palettes,contrastInk,accessibleAccent} from '@/lib/appearance';
type Preferences={accent:string;surface:string;compact:boolean};
const initial:Preferences={accent:'#2F4156',surface:'#F5EFEB',compact:false};
export function Appearance({children}:{children:ReactNode}){
 const [settings,S]=useState(initial),[open,O]=useState(false),[ready,R]=useState(false),[error,E]=useState('');
 useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem('the-table-appearance')||'null');if(stored&&/^#[0-9a-f]{6}$/i.test(stored.accent)&&/^#[0-9a-f]{6}$/i.test(stored.surface)&&typeof stored.compact==='boolean')S(stored)}catch{E('Appearance settings could not be loaded.')}R(true)},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem('the-table-appearance',JSON.stringify(settings))}catch{E('This browser cannot save appearance settings.')}},[settings,ready]);
 useEffect(()=>{if(!open)return;function close(event:KeyboardEvent){if(event.key==='Escape')O(false)}window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[open]);
 const ink=contrastInk(settings.accent),title=accessibleAccent(settings.accent);
 useEffect(()=>{const icons=document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');const previous=Array.from(icons,icon=>[icon,icon.href] as const);const url='data:image/svg+xml,'+encodeURIComponent(tableLogoSvg(settings.accent,ink));icons.forEach(icon=>{icon.href=url});return()=>previous.forEach(([icon,href])=>{icon.href=href})},[settings.accent,ink]);
 const style={'--brand-blue':settings.accent,'--brand-ivory':ink,'--brand-soft':settings.surface,'--brand-teal':settings.accent,'--brand-beige':settings.surface,'--brand-focus':title,'--brand-title':title,'--brand-border':'#d7e0e6','--brand-ink':'#2f4156','--brand-muted':'#435b6a'} as CSSProperties;
 return <div className={'table-shell'+(settings.compact?' density-compact':'')} style={style}><div className="appearance-toolbar"><button type="button" onClick={()=>O(true)}>Customize</button></div>{children}{open&&<div className="overlay"><section className="dialog appearance-dialog" role="dialog" aria-modal="true" aria-labelledby="appearance-title"><div className="dialog-top"><h2 id="appearance-title">Make it yours</h2><button type="button" autoFocus onClick={()=>O(false)}>Done</button></div><h3>Colors</h3><div className="palette-grid">{palettes.map(p=><button type="button" key={p.name} aria-pressed={settings.accent===p.accent&&settings.surface===p.surface} onClick={()=>S({...settings,accent:p.accent,surface:p.surface})}><span className="palette-swatch" style={{background:p.accent}} aria-hidden="true"/>{p.name}</button>)}</div><label>Spacing<select value={settings.compact?'compact':'comfortable'} onChange={event=>S({...settings,compact:event.target.value==='compact'})}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><p>Appearance is saved in this browser.</p>{error&&<p role="status">{error}</p>}</section></div>}</div>
}
