import {getMenuMealSlots,defaultSettings,defaultMealSlots,defaultTableDisplay,tableAreas,type Settings,type TableArea} from './settings.ts';
export const SETTINGS_ID='table-household-settings';
const hex=(value:unknown)=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
const text=(value:unknown,max:number)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
export function validateSettings(value:unknown):Settings{
 if(!value||typeof value!=='object')throw Error('Invalid customization settings.');
 const s=value as Settings,d=s.tableDisplay,slots=s.mealSlots;
 if(!text(s.name,80)||!text(s.todayLabel,60)||!Array.isArray(s.menuProfiles)||s.menuProfiles.length<1||s.menuProfiles.length>12||s.menuProfiles[0].id!=='main'||s.menuProfiles.some(p=>!text(p.id,100)||!text(p.name,80))||new Set(s.menuProfiles.map(p=>p.id)).size!==s.menuProfiles.length)throw Error('Enter a household name and valid menu names.');
 if(!Array.isArray(slots)||slots.length<1||slots.length>8||slots.some(p=>!text(p.id,100)||!text(p.name,40))||new Set(slots.map(p=>p.id)).size!==slots.length)throw Error('Keep between one and eight uniquely named meal times.');
 for(const profile of s.menuProfiles){const a=profile.mealSlots;if(profile.id!=='main'&&a!==undefined&&(!Array.isArray(a)||a.length<1||a.length>8||a.some(p=>!text(p.id,100)||!text(p.name,40))||new Set(a.map(p=>p.id)).size!==a.length))throw Error('Keep between one and eight uniquely named meal times in each menu.');}
 if(!d||!hex(d.accent)||!hex(d.surface)||!['comfortable','compact'].includes(d.density))throw Error('Choose valid theme colors and spacing.');
 for(const [key,max] of [['homeSections',5],['pins',3]] as const){const a=d[key];if(!Array.isArray(a)||a.length>max||new Set(a).size!==a.length||a.some(x=>!tableAreas.includes(x as TableArea)))throw Error('Choose valid Home sections and up to three shortcuts.');}
 if(!Number.isInteger(s.weekStart)||s.weekStart<0||s.weekStart>6||!['USD','PHP'].includes(s.currency))throw Error('Invalid regional settings.');
 try{new Intl.DateTimeFormat('en-US',{timeZone:s.timezone}).format()}catch{throw Error('Choose a valid time zone.');}
 return {name:s.name.trim(),children:[],menuProfiles:s.menuProfiles.map(p=>({id:p.id,name:p.name.trim(),...(p.id==='main'?{}:{mealSlots:(p.mealSlots||slots).map(slot=>({id:slot.id,name:slot.name.trim()}))})})),mealSlots:slots.map(p=>({id:p.id,name:p.name.trim()})),todayLabel:s.todayLabel.trim(),currency:s.currency,weekStart:s.weekStart,timezone:s.timezone,tableDisplay:{accent:d.accent,surface:d.surface,density:d.density,homeSections:[...d.homeSections],pins:[...d.pins]}};
}
export function readSettings(entry?:{settings?:unknown}):Settings{
 try{return validateSettings(entry?.settings)}catch{return {...defaultSettings,mealSlots:defaultMealSlots.map(s=>({...s})),menuProfiles:[{id:'main',name:'Main Menu'}],tableDisplay:{...defaultTableDisplay,homeSections:[...defaultTableDisplay.homeSections],pins:[...defaultTableDisplay.pins]}};}
}

// Remove only planned meals belonging to deleted menu profiles or meal times.
export function mealsRemovedBySettings<T extends {kind:string;favoriteTemplate?:unknown;profileId?:unknown;slotId?:unknown}>(entries:T[],previous:Settings,next:Settings):T[]{
 const removedMenus=new Set(previous.menuProfiles.filter(p=>p.id!=='main'&&!next.menuProfiles.some(n=>n.id===p.id)).map(p=>p.id));
 const removedSlots=new Map(previous.menuProfiles.map(p=>[p.id,new Set(getMenuMealSlots(previous,p.id).filter(s=>!getMenuMealSlots(next,p.id).some(n=>n.id===s.id)).map(s=>s.id))]));
 return entries.filter(e=>e.kind==='meal'&&!e.favoriteTemplate&&(removedMenus.has(String(e.profileId||'main'))||removedSlots.get(String(e.profileId||'main'))?.has(String(e.slotId||'dinner'))));
}
