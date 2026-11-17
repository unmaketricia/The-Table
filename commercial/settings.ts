export const tableAreas=['weekly','additional','grocery','favorites','inventory'] as const;
export type TableArea=typeof tableAreas[number];
export const tableLabels:Record<TableArea,string>={weekly:'Weekly Menu',additional:'Custom Menu',grocery:'Grocery List',favorites:'Favorites',inventory:'Inventory'};
export const palettes=[
 {name:'Original',accent:'#000000',surface:'#FFFFFF'},
 {name:'Navy',accent:'#2F4156',surface:'#F5EFEB'},
 {name:'Sage',accent:'#3D604B',surface:'#EBF0E8'},
 {name:'Warm Sand',accent:'#725121',surface:'#F8F1E2'},
 {name:'Terracotta',accent:'#894B39',surface:'#F6EBE5'},
 {name:'Rose',accent:'#865A70',surface:'#F5EBF0'},
] as const;
export type TableDisplay={accent:string;surface:string;density:'comfortable'|'compact';homeSections:TableArea[];pins:TableArea[]};
export const defaultTableDisplay:TableDisplay={accent:'#2F4156',surface:'#F5EFEB',density:'comfortable',homeSections:['weekly','additional','grocery'],pins:['weekly','grocery','favorites']};
export const defaultMealSlots=[{id:'breakfast',name:'Breakfast'},{id:'lunch',name:'Lunch'},{id:'dinner',name:'Dinner'},{id:'snack',name:'Snack'}];
export type Settings={name:string;children:string[];menuProfiles:{id:string;name:string}[];mealSlots?:{id:string;name:string}[];todayLabel:string;currency:'USD'|'PHP';weekStart:number;timezone:string;tableDisplay?:TableDisplay};
export const defaultSettings:Settings={name:'My household',children:[],menuProfiles:[{id:'main',name:'Main Menu'}],mealSlots:defaultMealSlots,todayLabel:"Today's Menu",currency:'USD',weekStart:1,timezone:'America/New_York',tableDisplay:defaultTableDisplay};
export function getTableDisplay(settings:Settings):TableDisplay{
 const value=settings.tableDisplay;
 return value&&/^#[0-9a-f]{6}$/i.test(value.accent)&&['#FFFFFF','#F5EFEB','#C8D9E6',...palettes.map(p=>p.surface)].includes(value.surface)&&['comfortable','compact'].includes(value.density)&&Array.isArray(value.homeSections)&&Array.isArray(value.pins)?value:defaultTableDisplay;
}
export function contrastInk(hex:string){
 const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4);
 const luminance=channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
 if((luminance+0.05)/0.05<4.5)return '#FFFFFF';
 return (luminance+0.05)/0.073>=4.5?'#17232E':'#000000';
}
export function accessibleAccent(hex:string){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const luminance=(channels:number[])=>channels.map(value=>{const n=value/255;return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4}).reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
 if(1.05/(luminance(rgb)+0.05)>=4.5)return hex;
 let light=0,dark=1,safe=[0,0,0];
 for(let i=0;i<16;i++){
  const factor=(light+dark)/2,candidate=rgb.map(value=>value*factor);
  if(1.05/(luminance(candidate)+0.05)>=4.5){safe=candidate;light=factor}else dark=factor;
 }
 return '#'+safe.map(value=>Math.round(value).toString(16).padStart(2,'0')).join('').toUpperCase();
}
export let budgetSettings:Settings={...defaultSettings};
export function configureSettings(settings:Settings){budgetSettings={...settings};}
export function householdToday(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:budgetSettings.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
