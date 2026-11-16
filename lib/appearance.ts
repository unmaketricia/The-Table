export const palettes=[
 {name:'Original',accent:'#000000',surface:'#FFFFFF'},
 {name:'Navy',accent:'#2F4156',surface:'#F5EFEB'},
 {name:'Sage',accent:'#3D604B',surface:'#EBF0E8'},
 {name:'Warm Sand',accent:'#725121',surface:'#F8F1E2'},
 {name:'Terracotta',accent:'#894B39',surface:'#F6EBE5'},
 {name:'Rose',accent:'#865A70',surface:'#F5EBF0'},
] as const;

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
