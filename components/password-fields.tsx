'use client';
import {useId,useState} from 'react';
type Props={mode:'login'|'create';password:string;confirmation:string;onPassword:(value:string)=>void;onConfirmation:(value:string)=>void;disabled?:boolean;label?:string;maxLength?:number};
export function PasswordFields({mode,password,confirmation,onPassword,onConfirmation,disabled=false,label='Password',maxLength}:Props){
 const id=useId(),[show,S]=useState(false),[showConfirmation,SC]=useState(false),[editing,F]=useState<string|null>(null),[passwordDone,PD]=useState(false),[confirmationDone,CD]=useState(false);
 const create=mode==='create',enough=password.length>=12,matched=!!confirmation&&password===confirmation;
 const passwordError=create&&password.length>0&&passwordDone&&!editing&&!enough;
 const confirmationError=create&&confirmation.length>0&&confirmationDone&&!editing&&!matched;
 return <div className="password-fields">
  <div className="password-field" onFocus={()=>F('password')} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)){F(null);PD(true)}}}>
   <label htmlFor={id+'-password'}>{label}</label>
   <div className="password-control" data-invalid={passwordError||undefined}>
    <input id={id+'-password'} type={show?'text':'password'} autoComplete={create?'new-password':'current-password'} autoCapitalize="none" spellCheck={false} minLength={create?12:undefined} maxLength={maxLength} required value={password} onChange={event=>onPassword(event.target.value)} disabled={disabled} aria-invalid={passwordError||undefined} aria-describedby={create?id+'-password-help':undefined}/>
    <button type="button" className="password-visibility" aria-controls={id+'-password'} aria-label={show?'Hide password':'Show password'} aria-pressed={show} disabled={disabled} onClick={()=>S(!show)}>{show?'Hide':'Show'}</button>
   </div>
   {create&&<div className="password-feedback">
    <div className="password-length-track" role="progressbar" aria-label="Password minimum length" aria-valuemin={0} aria-valuemax={12} aria-valuenow={Math.min(password.length,12)} aria-valuetext={enough?'Minimum length met':password.length+' of 12 characters'}>
     <span style={{width:Math.min(password.length/12,1)*100+'%'}}/>
    </div>
    <div className="password-feedback-line"><span id={id+'-password-help'} className={passwordError?'field-error':undefined}>{enough?'✓ Minimum length met':'Use at least 12 characters.'}</span><span className="password-count" aria-hidden="true">{Math.min(password.length,12)}/12</span></div>
   </div>}
  </div>
  {create&&<div className="password-field" onFocus={()=>F('confirmation')} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)){F(null);CD(true)}}}>
   <label htmlFor={id+'-confirmation'}>Confirm password</label>
   <div className="password-control" data-invalid={confirmationError||undefined}>
    <input id={id+'-confirmation'} type={showConfirmation?'text':'password'} autoComplete="new-password" autoCapitalize="none" spellCheck={false} minLength={12} maxLength={maxLength} required value={confirmation} onChange={event=>onConfirmation(event.target.value)} disabled={disabled} aria-invalid={confirmationError||undefined} aria-describedby={id+'-confirmation-help'}/>
    <button type="button" className="password-visibility" aria-controls={id+'-confirmation'} aria-label={showConfirmation?'Hide confirmation password':'Show confirmation password'} aria-pressed={showConfirmation} disabled={disabled} onClick={()=>SC(!showConfirmation)}>{showConfirmation?'Hide':'Show'}</button>
   </div>
   <div id={id+'-confirmation-help'} className={'password-match'+(confirmationError?' field-error':'')} aria-live="polite">{matched?'✓ Passwords match':confirmationError?'Passwords don’t match yet.':''}</div>
  </div>}
 </div>;
}
