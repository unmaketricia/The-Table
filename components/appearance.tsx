'use client';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {authClient} from '@/commercial/auth';
import {APP_BASE,buyerFetch} from '@/commercial/api';
import {HouseholdContext} from '@/commercial/context';
import {SETTINGS_ID,readSettings,validateSettings} from '@/commercial/settings-validation';
import {accessibleAccent,configureSettings,contrastInk,defaultMealSlots,defaultSettings,defaultTableDisplay,getTableDisplay,palettes,tableAreas,tableLabels,type Settings,type TableArea} from '@/commercial/settings';

export function Appearance({children}:{children:ReactNode}){
 const welcomeRoute=usePathname().endsWith('/welcome');
 const [settings,S]=useState<Settings>(defaultSettings),[draft,D]=useState<Settings>(defaultSettings),[open,O]=useState(false),[ready,R]=useState(false),[busy,B]=useState(false),[error,E]=useState(''),[paid,P]=useState(false);
 const current=useRef(settings),version=useRef(0),editing=useRef(false),locked=useRef(false);current.current=settings;editing.current=open;
 const display=getTableDisplay(settings),preview=getTableDisplay(open?draft:settings);
 useEffect(()=>{const client=authClient();let active=true;let deferred:ReturnType<typeof setTimeout>|undefined;
  async function load(){if(editing.current||locked.current)return;try{
   const {data}=client?await client.auth.getSession():{data:{session:null}};
   if(!data.session){if(active){P(false);R(true)}return;}
   const ar=await buyerFetch('/api/account');if(!ar.ok)throw Error('Could not load customization.');const account=await ar.json();if(!active)return;P(!!account.paid);if(!account.paid){R(true);return;}
   const r=await buyerFetch('/api/entries');if(!r.ok)throw Error('Could not load customization.');const result=await r.json();const entry=result.entries.find((e:{id:string})=>e.id===SETTINGS_ID);
   const next=readSettings(entry);
   if(!entry){next.timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;try{const stored=JSON.parse(localStorage.getItem('the-table-appearance')||'null');if(stored&&/^#[0-9a-f]{6}$/i.test(stored.accent)&&/^#[0-9a-f]{6}$/i.test(stored.surface))next.tableDisplay={...defaultTableDisplay,accent:stored.accent,surface:stored.surface,density:stored.compact?'compact':'comfortable'};}catch{}}
   if(active&&!editing.current&&!locked.current){version.current=entry?.version||0;configureSettings(next);S(next);R(true);E('');}
  }catch(e){if(active)E(e instanceof Error?e.message:'Could not load customization.')}}
  void load();const {data}=client?.auth.onAuthStateChange(()=>{clearTimeout(deferred);deferred=setTimeout(()=>void load(),0)})||{data:null};
  const timer=setInterval(()=>{if(document.visibilityState==='visible')void load()},15000);window.addEventListener('focus',load);
  return()=>{active=false;clearTimeout(deferred);clearInterval(timer);window.removeEventListener('focus',load);data?.subscription.unsubscribe()};
 },[]);
 useEffect(()=>{if(!open)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!locked.current)O(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[open]);
 function openCustomize(){D(structuredClone(current.current));E('');O(true)}
 async function save(next:Settings){if(locked.current)return false;locked.current=true;B(true);E('');try{
  const clean=validateSettings(next);
  if(paid){const r=await buyerFetch('/api/entries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'settings',settings:clean,expectedVersion:version.current})});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save customization.');version.current=d.settingsVersion;}
  const d=getTableDisplay(clean);try{localStorage.setItem('the-table-appearance',JSON.stringify({accent:d.accent,surface:d.surface,compact:d.density==='compact'}));}catch{}configureSettings(clean);S(clean);current.current=clean;return true;
 }catch(e){E(e instanceof Error?e.message:'Could not save customization.');return false}finally{locked.current=false;B(false)}}
 async function addMenu(name:string){const s=current.current;if(!name.trim()||s.menuProfiles.length>=12)return null;const id=crypto.randomUUID(),d=getTableDisplay(s);const next={...s,menuProfiles:[...s.menuProfiles,{id,name:name.trim()}],tableDisplay:{...d,homeSections:d.homeSections.includes('additional')?d.homeSections:[...d.homeSections,'additional' as TableArea]}};return await save(next)?id:null;}
 async function removeMenu(id:string){const s=current.current;if(id==='main'||!s.menuProfiles.some(p=>p.id===id))return false;return save({...s,menuProfiles:s.menuProfiles.filter(p=>p.id!==id)})}
 async function choosePalette(accent:string,surface:string){const s=current.current;return save({...s,tableDisplay:{...getTableDisplay(s),accent,surface}})}
 function changeDisplay(change:Partial<typeof display>){D(s=>({...s,tableDisplay:{...getTableDisplay(s),...change}}))}
 function toggle(area:TableArea,key:'homeSections'|'pins'){const values=preview[key],next=values.includes(area)?values.filter(x=>x!==area):[...values,area];if(key==='pins'&&next.length>3)return;changeDisplay({[key]:next})}
 const accent=preview.accent,surface=preview.surface,ink=contrastInk(accent),title=accessibleAccent(accent);
 const style={'--table-accent':accent,'--table-accent-ink':ink,'--table-title':title,'--table-surface':surface,'--brand-blue':accent,'--brand-ivory':ink,'--brand-soft':surface,'--brand-focus':title,'--brand-title':title,'--brand-ink':'#29332f','--brand-muted':'#666b64','--brand-border':'#dedfd8','--ink':'#29332f','--muted':'#666b64','--line':'#dedfd8'} as CSSProperties;
 return <HouseholdContext.Provider value={{workspace:{settings},ready,demo:false,openAccount:openCustomize,addMenu,removeMenu,choosePalette}}><div className={'table-shell density-'+preview.density} style={style}>
  {!welcomeRoute&&<div className="appearance-toolbar"><button type="button" onClick={openCustomize}>Customize</button><a href={APP_BASE+'/account'}>Your Account</a></div>}
  {children}
  {error&&!open&&<p className="customization-error" role="alert">{error} <button type="button" onClick={()=>location.reload()}>Retry</button></p>}
  {open&&<div className="overlay"><section className="dialog customization-dialog" role="dialog" aria-modal="true" aria-labelledby="customize-title">
   <div className="dialog-top"><h2 id="customize-title">Customize your Table</h2><button type="button" disabled={busy} onClick={()=>O(false)}>Cancel</button></div>
   <section><h3>Colors</h3><div className="palette-grid">{palettes.map(p=><button className="palette-option" type="button" key={p.name} aria-pressed={preview.accent===p.accent&&preview.surface===p.surface} onClick={()=>changeDisplay({accent:p.accent,surface:p.surface})}><span className="palette-swatch" style={{background:p.accent}} aria-hidden="true"/>{p.name}</button>)}</div><label className="custom-color">Custom main color<input type="color" value={preview.accent} onChange={e=>changeDisplay({accent:e.target.value})}/></label><label>Spacing<select value={preview.density} onChange={e=>changeDisplay({density:e.target.value as 'comfortable'|'compact'})}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label></section>
   {paid&&<>
    <section><h3>Home &amp; navigation</h3><div className="setting-columns"><fieldset><legend>Show on Home</legend>{tableAreas.map(area=><label key={area}><input type="checkbox" checked={preview.homeSections.includes(area)} onChange={()=>toggle(area,'homeSections')}/>{tableLabels[area]}</label>)}</fieldset><fieldset><legend>Bottom shortcuts · up to 3</legend>{tableAreas.map(area=><label key={area}><input type="checkbox" disabled={!preview.pins.includes(area)&&preview.pins.length>=3} checked={preview.pins.includes(area)} onChange={()=>toggle(area,'pins')}/>{tableLabels[area]}</label>)}</fieldset></div><p className="settings-note">All sections remain available in More.</p></section>
    <section><h3>Menus</h3><label>Household name<input maxLength={80} value={draft.name} onChange={e=>D({...draft,name:e.target.value})}/></label><label>Today’s menu heading<input maxLength={60} value={draft.todayLabel} onChange={e=>D({...draft,todayLabel:e.target.value})}/></label>{draft.menuProfiles.map(profile=><label key={profile.id}>{profile.id==='main'?'Main menu name':'Custom menu name'}<input maxLength={80} value={profile.name} onChange={e=>D({...draft,menuProfiles:draft.menuProfiles.map(p=>p.id===profile.id?{...p,name:e.target.value}:p)})}/></label>)}</section>
    <section><h3>Meal times</h3><p className="settings-note">Rename, remove, or add meal times. Keep at least one, with up to eight in total.</p>{(draft.mealSlots||defaultMealSlots).map(slot=><div className="setting-row" key={slot.id}><input aria-label={'Meal time: '+slot.name} maxLength={40} value={slot.name} onChange={e=>D({...draft,mealSlots:draft.mealSlots!.map(s=>s.id===slot.id?{...s,name:e.target.value}:s)})}/><button type="button" disabled={draft.mealSlots!.length<=1} onClick={()=>{if(confirm('Remove '+slot.name+'? Saving will delete its planned meals from every menu and return linked portions to Inventory.'))D({...draft,mealSlots:draft.mealSlots!.filter(s=>s.id!==slot.id)})}}>Remove</button></div>)}<button type="button" disabled={draft.mealSlots!.length>=8} onClick={()=>D({...draft,mealSlots:[...draft.mealSlots!,{id:crypto.randomUUID(),name:'New meal time'}]})}>Add meal time</button></section>
   </>}
   {error&&<p role="alert">{error}</p>}
   <div className="customization-actions"><button type="button" disabled={busy} onClick={()=>O(false)}>Cancel</button><button className="primary" type="button" disabled={busy} onClick={async()=>{if(await save(draft))O(false)}}>{busy?'Saving…':'Save changes'}</button></div>
  </section></div>}
 </div></HouseholdContext.Provider>;
}
