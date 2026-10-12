'use client';
import {useEffect,useRef,useState,type ButtonHTMLAttributes} from 'react';
import {moveGrocery,placeGrocery} from '@/lib/grocery-order';

type Options={labels:Record<string,string>;onActiveChange:(active:boolean)=>void;order:string[];disabled:boolean;onSave:(order:string[])=>Promise<boolean>};
type Session={category:string;order:string[];original:string[];pointerId:number;pointerType:string;startX:number;startY:number;x:number;y:number;active:boolean;moved:boolean;element:HTMLElement;scroller:HTMLElement|null;timer:ReturnType<typeof setTimeout>|null};

export function useGroceryDrag(options:Options){
 const current=useRef(options);current.current=options;
 const session=useRef<Session|null>(null),suppressClickUntil=useRef(0);
 const [preview,setPreview]=useState<string[]|null>(null),[floating,setFloating]=useState<{category:string;x:number;y:number}|null>(null),[announcement,setAnnouncement]=useState('');
 function activate(s:Session){if(session.current!==s||current.current.disabled)return;s.active=true;current.current.onActiveChange(true);setPreview(s.order);setFloating({category:s.category,x:s.x,y:s.y});setAnnouncement(`Moving ${current.current.labels[s.category]??'item'}. Release to save, or press Escape to cancel.`);document.body.classList.add('grocery-is-dragging');}
 function release(s:Session){if(s.timer)clearTimeout(s.timer);if(s.element.hasPointerCapture(s.pointerId))s.element.releasePointerCapture(s.pointerId);session.current=null;current.current.onActiveChange(false);setFloating(null);document.body.classList.remove('grocery-is-dragging');}
 async function persist(order:string[]){setPreview(order);const ok=await current.current.onSave(order);setPreview(null);setAnnouncement(ok?'Grocery order saved.':'Order could not be saved. Your previous order is restored.');}
 function finish(cancel:boolean){const s=session.current;if(!s)return;release(s);if(!s.active)return;suppressClickUntil.current=Date.now()+400;if(cancel){setPreview(null);setAnnouncement('Move cancelled.');return;}if(JSON.stringify(s.order)===JSON.stringify(s.original)){setPreview(null);setAnnouncement('Order unchanged.');return;}void persist(s.order);}
 function hover(s:Session){const row=document.elementFromPoint(s.x,s.y)?.closest<HTMLElement>('[data-grocery-id]');const target=row?.dataset.groceryId;if(!row||!target||target===s.category||!s.scroller?.contains(row))return;const rect=row.getBoundingClientRect();const next=placeGrocery(s.order,s.category,target,s.y>rect.top+rect.height/2);if(JSON.stringify(next)!==JSON.stringify(s.order)){s.order=next;setPreview(next);setAnnouncement(`${current.current.labels[s.category]??'Item'}, position ${next.indexOf(s.category)+1} of ${next.length}.`);}}
 useEffect(()=>{
  function move(e:PointerEvent){const s=session.current;if(!s||e.pointerId!==s.pointerId)return;s.x=e.clientX;s.y=e.clientY;s.moved=s.moved||Math.hypot(s.x-s.startX,s.y-s.startY)>6;if(!s.active){if(Math.hypot(s.x-s.startX,s.y-s.startY)>6){if(s.pointerType==='mouse')activate(s);else{finish(true);return;}}else return;}if(e.cancelable)e.preventDefault();setFloating({category:s.category,x:s.x,y:s.y});hover(s);}
  function up(e:PointerEvent){const s=session.current;if(!s||e.pointerId!==s.pointerId)return;const r=s.scroller?.getBoundingClientRect();finish(!!r&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom));}
  function touchMove(e:TouchEvent){if(session.current?.active&&e.cancelable)e.preventDefault();}
  function cancel(){finish(true)}
  function key(e:KeyboardEvent){if(e.key==='Escape'&&session.current){e.preventDefault();cancel();}}
  window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',cancel);window.addEventListener('touchmove',touchMove,{passive:false});window.addEventListener('keydown',key);window.addEventListener('blur',cancel);
  return()=>{const s=session.current;if(s){if(s.timer)clearTimeout(s.timer);if(s.element.hasPointerCapture(s.pointerId))s.element.releasePointerCapture(s.pointerId);}session.current=null;document.body.classList.remove('grocery-is-dragging');window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);window.removeEventListener('touchmove',touchMove);window.removeEventListener('keydown',key);window.removeEventListener('blur',cancel);};
 },[]);
 useEffect(()=>{if(!floating?.category)return;
  let frame=0;
  function scroll(){const s=session.current;if(s?.active&&s.moved){const edge=70,bottom=window.innerHeight-110;const speed=s.y<edge?-Math.min(14,(edge-s.y)/3):s.y>bottom-edge?Math.min(14,(s.y-bottom+edge)/3):0;if(speed){window.scrollBy(0,speed);hover(s);}}frame=requestAnimationFrame(scroll);}
  frame=requestAnimationFrame(scroll);return()=>cancelAnimationFrame(frame);
 },[floating?.category]);
 function handlers(category:string):ButtonHTMLAttributes<HTMLButtonElement>{return {
  title:'Hold and drag to reorder. Alt + Up or Down also moves this item.',
  onPointerDown:e=>{if(current.current.disabled||session.current||e.button!==0)return;const element=e.currentTarget;const s:Session={category,order:[...current.current.order],original:[...current.current.order],pointerId:e.pointerId,pointerType:e.pointerType,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false,moved:false,element,scroller:element.closest<HTMLElement>('.grocery-list'),timer:null};session.current=s;element.setPointerCapture(e.pointerId);s.timer=setTimeout(()=>activate(s),350);},
  onClickCapture:e=>{if(Date.now()<suppressClickUntil.current){e.preventDefault();e.stopPropagation();}},
  onContextMenu:e=>e.preventDefault(),
  onKeyDown:e=>{if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')&&!current.current.disabled){e.preventDefault();const next=moveGrocery(current.current.order,category,e.key==='ArrowUp'?-1:1);if(JSON.stringify(next)!==JSON.stringify(current.current.order))void persist(next);}}
 };}
 return {order:preview??options.order,dragging:floating?.category??null,floating,announcement,handlers};
}
