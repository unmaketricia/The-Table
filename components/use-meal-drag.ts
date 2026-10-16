'use client';
import {useEffect,useRef,useState,type ButtonHTMLAttributes} from 'react';

type Options={dates:string[];labels:Record<string,string>;disabled:boolean;onActiveChange:(active:boolean)=>void;onSwap:(from:string,to:string)=>Promise<boolean>};
type Session={date:string;target:string|null;pointerId:number;pointerType:string;startX:number;startY:number;x:number;y:number;active:boolean;element:HTMLElement;list:HTMLElement|null;timer:ReturnType<typeof setTimeout>|null};
export function useMealDrag(options:Options){
 const current=useRef(options);current.current=options;
 const session=useRef<Session|null>(null),suppressClickUntil=useRef(0),pending=useRef(false);
 const [floating,F]=useState<{date:string;x:number;y:number}|null>(null),[targetDate,T]=useState<string|null>(null),[announcement,A]=useState('');
 function target(s:Session){const row=document.elementFromPoint(s.x,s.y)?.closest<HTMLElement>('[data-meal-date]');const date=row?.dataset.mealDate;s.target=row&&s.list?.contains(row)&&date&&date!==s.date&&current.current.dates.includes(date)?date:null;T(s.target);}
 function activate(s:Session){if(session.current!==s||current.current.disabled||pending.current)return;s.active=true;current.current.onActiveChange(true);document.body.classList.add('meal-is-dragging');F({date:s.date,x:s.x,y:s.y});A(`Moving ${current.current.labels[s.date]||'meal'}. Drop onto another day to swap dates. Escape cancels.`);}
 async function persist(from:string,to:string){pending.current=true;try{const ok=await current.current.onSwap(from,to);A(ok?'Menu dates updated.':'Could not update dates. The menu is unchanged.');}catch{A('Could not update dates. The menu is unchanged.');}finally{pending.current=false;}}
 function finish(cancel:boolean){const s=session.current;if(!s)return;if(s.timer)clearTimeout(s.timer);session.current=null;if(s.element.hasPointerCapture(s.pointerId))s.element.releasePointerCapture(s.pointerId);F(null);T(null);document.body.classList.remove('meal-is-dragging');if(!s.active)return;suppressClickUntil.current=Date.now()+500;current.current.onActiveChange(false);if(cancel||!s.target||!current.current.dates.includes(s.date)||current.current.disabled){A('Move cancelled.');return;}void persist(s.date,s.target);}
 useEffect(()=>{
  function move(e:PointerEvent){const s=session.current;if(!s||e.pointerId!==s.pointerId)return;s.x=e.clientX;s.y=e.clientY;if(!s.active){if(Math.hypot(s.x-s.startX,s.y-s.startY)<=6)return;if(s.pointerType==='mouse')activate(s);else{finish(true);return;}}if(e.cancelable)e.preventDefault();F({date:s.date,x:s.x,y:s.y});target(s);}
  function up(e:PointerEvent){const s=session.current;if(!s||e.pointerId!==s.pointerId)return;s.x=e.clientX;s.y=e.clientY;if(s.active)target(s);finish(false);}
  function cancel(){finish(true)}
  function touchMove(e:TouchEvent){if(session.current?.active&&e.cancelable)e.preventDefault();}
  function key(e:KeyboardEvent){if(e.key==='Escape'&&session.current){e.preventDefault();cancel();}}
  window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);window.addEventListener('touchmove',touchMove,{passive:false});window.addEventListener('keydown',key);window.addEventListener('blur',cancel);
  return()=>{const s=session.current;if(s){if(s.timer)clearTimeout(s.timer);if(s.element.hasPointerCapture(s.pointerId))s.element.releasePointerCapture(s.pointerId);if(s.active)current.current.onActiveChange(false);}session.current=null;document.body.classList.remove('meal-is-dragging');window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);window.removeEventListener('touchmove',touchMove);window.removeEventListener('keydown',key);window.removeEventListener('blur',cancel);};
 },[]);
 useEffect(()=>{if(session.current&&(options.disabled||!options.dates.includes(session.current.date)))finish(true);},[options.disabled,options.dates.join('|')]);
 useEffect(()=>{if(!floating)return;let frame=0;function scroll(){const s=session.current;if(s?.active){const edge=70,bottom=window.innerHeight-100;const speed=s.y<edge?-Math.min(12,(edge-s.y)/3):s.y>bottom-edge?Math.min(12,(s.y-bottom+edge)/3):0;if(speed){window.scrollBy(0,speed);target(s);}}frame=requestAnimationFrame(scroll);}frame=requestAnimationFrame(scroll);return()=>cancelAnimationFrame(frame);},[floating?.date]);
 function handlers(date:string,draggable:boolean):ButtonHTMLAttributes<HTMLButtonElement>{return{
  title:draggable?'Hold and drag to swap dates. Alt + Up or Down swaps with the adjacent day.':'Drop a meal here, or tap to plan a meal.',
  onPointerDown:e=>{if(!draggable||current.current.disabled||session.current||pending.current||e.button!==0)return;const element=e.currentTarget;const s:Session={date,target:null,pointerId:e.pointerId,pointerType:e.pointerType,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false,element,list:element.closest<HTMLElement>('.week-list'),timer:null};session.current=s;element.setPointerCapture(e.pointerId);s.timer=setTimeout(()=>activate(s),350);},
  onClickCapture:e=>{if(Date.now()<suppressClickUntil.current){e.preventDefault();e.stopPropagation();}},
  onContextMenu:e=>{if(draggable)e.preventDefault()},
  onKeyDown:e=>{if(!draggable||current.current.disabled||pending.current||!e.altKey||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const i=current.current.dates.indexOf(date),to=current.current.dates[i+(e.key==='ArrowUp'?-1:1)];if(to)void persist(date,to);}
 };}
 return{handlers,floating,dragging:floating?.date??null,targetDate,announcement};
}
