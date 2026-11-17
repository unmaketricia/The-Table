'use client';
import './login.css';
import {APP_BASE} from '@/commercial/api';
import {useEffect, useRef, useState} from 'react';
import {authClient, loginProviders} from '@/commercial/auth';
import {cleanEmail, emailCooldownKey, validEmail} from '@/lib/auth-email';
import {useEmailCooldown} from '@/components/use-email-cooldown';
import type {Session} from '@supabase/supabase-js';
type Mode = 'login'|'register'|'forgot'|'reset';
export default function Login() {
  const [mode, M] = useState<Mode>('login'), [email, E] = useState(''), [password, P] = useState(''), [confirmation, C] = useState('');
  const [busy, B] = useState(false), [message, N] = useState(''), [session, S] = useState<Session|null>(null), [ready, R] = useState(false), [available, A] = useState(false);
  const locked = useRef(false);
  const signupCooldown = useEmailCooldown(emailCooldownKey('signup', email));
  const resetCooldown = useEmailCooldown(emailCooldownKey('reset', email));
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const pendingInvite=query.get('invite');
    if(pendingInvite&&/^[a-f0-9]{64}$/.test(pendingInvite)) {
      try {localStorage.setItem('table-pending-invite',pendingInvite);} catch {}
      window.location.replace(APP_BASE+'/invite?token='+encodeURIComponent(pendingInvite));
      return;
    }
    const callback = new URLSearchParams(window.location.hash.slice(1));
    const emailChangeFlow = query.get('emailChange') === '1' || callback.get('type') === 'email_change';
    if (query.get('setup') === '1') M('register');
    if (callback.get('type') === 'recovery') M('reset');
    if (query.get('emailChanged') === '1') N('Your email address was changed. Sign in with your new email address.');
    const callbackError = callback.get('error_description') || query.get('error_description');
    if (callbackError) N('This verification link could not be used. Request a new email below and use the newest link.');
    const client = authClient(); if (!client) { R(true); return; }
    A(true); let active = true;
    const {data} = client.auth.onAuthStateChange((event, next) => {
      if (!active) return; S(next); if (event === 'PASSWORD_RECOVERY') M('reset');
    });
    void (async () => {
      try {
        const {data, error} = await client.auth.getSession();
        if (!active) return;
        if (error) throw error;
        S(data.session);
        if (!data.session && callback.get('type') === 'recovery') { M('forgot'); N('This password reset link has expired. Request a new reset email.'); }
        if (emailChangeFlow) {
          if (data.session) {
            const {data:userData, error:userError} = await client.auth.getUser();
            if (userError) throw userError;
            if (userData.user?.new_email) {
              N('One address has been confirmed. Check the other inbox to finish changing your email address.');
            } else {
              const {error:signoutError} = await client.auth.signOut();
              if (signoutError) throw signoutError;
              if (!active) return;
              S(null); M('login');
              try { if (userData.user) localStorage.removeItem('table-email-change:'+userData.user.id); } catch {}
              N('Your email address was changed. Sign in with your new email address.');
            }
          } else N('Confirm the change in both inboxes, then sign in with your new email address.');
          window.history.replaceState(null, '', APP_BASE+'/login');
        }
      } catch { if (active) N('Your session could not be restored. Please sign in again or request a new verification email.'); }
      finally { if (active) R(true); }
    })();
    const expire = () => { void client.auth.getSession().then(({data}) => { if (active) S(data.session); }); };
    window.addEventListener('focus', expire); const timer = setInterval(expire, 60000);
    return () => { active = false; data.subscription.unsubscribe(); window.removeEventListener('focus', expire); clearInterval(timer); };
  }, []);
  useEffect(() => {
    // Wait for callback handling so password recovery and completed email changes
    // finish before a restored or newly signed-in session leaves this page.
    if (ready && session && mode !== 'reset' && !busy) {
      window.location.replace(APP_BASE+'/account');
    }
  }, [ready, session, mode, busy]);
  function change(next: Mode) { M(next); P(''); C(''); N(''); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); const client = authClient(); if (!client || locked.current) return;
    if ((mode === 'register' || mode === 'reset') && password !== confirmation) { N('Passwords don’t match.'); return; }
    if (mode !== 'reset' && !validEmail(email)) { N('Enter a valid email address.'); return; }
    if ((mode === 'register' && signupCooldown.blocked()) || (mode === 'forgot' && resetCooldown.blocked())) return;
    locked.current = true; B(true); N('');
    try {
      if (mode === 'login') {
        const {error} = await client.auth.signInWithPassword({email:cleanEmail(email), password});
        if (error) throw error; P('');
      }
      if (mode === 'register') {
        signupCooldown.start();
        const {error} = await client.auth.signUp({email:cleanEmail(email), password, options:{emailRedirectTo:window.location.origin+APP_BASE+'/login'}});
        if (error) throw error; P(''); C(''); N('Check your email to confirm your account, then sign in. You can resend verification after 60 seconds.');
      }
      if (mode === 'forgot') {
        resetCooldown.start();
        const {error} = await client.auth.resetPasswordForEmail(cleanEmail(email), {redirectTo:window.location.origin+APP_BASE+'/login'});
        if (error) throw error; N('If an account exists for this email, you’ll receive a password reset link.');
      }
      if (mode === 'reset') {
        const {error} = await client.auth.updateUser({password}); if (error) throw error;
        P(''); C(''); const {error:signoutError} = await client.auth.signOut();
        if (signoutError) { N('Password updated. Please sign out and sign in with your new password.'); return; }
        S(null); M('login'); N('Password updated. Sign in with your new password.');
      }
    } catch (error) {
      N((error as {code?:string}).code === 'email_not_confirmed' ? 'Confirm your email before signing in. You can resend the verification email below.' : error instanceof Error ? error.message : 'Could not complete this request. Please try again.');
    } finally { locked.current = false; B(false); }
  }
  async function resendVerification() {
    const client = authClient(); if (!client || locked.current || signupCooldown.blocked()) return;
    if (!validEmail(email)) { N('Enter your email address above, then resend verification.'); return; }
    locked.current = true; B(true); signupCooldown.start();
    try {
      const {error} = await client.auth.resend({type:'signup', email:cleanEmail(email), options:{emailRedirectTo:window.location.origin+APP_BASE+'/login'}});
      if (error) throw error; N('If this address has a pending signup, a new verification email will arrive shortly. Use the newest link.');
    } catch (error) { N(error instanceof Error ? error.message : 'Could not resend verification. Please try again.'); }
    finally { locked.current = false; B(false); }
  }
  async function social(provider: 'google'|'facebook') {
    const client = authClient(); if (!client || locked.current) return;
    locked.current = true; B(true);
    const {error} = await client.auth.signInWithOAuth({provider, options:{redirectTo:window.location.origin+APP_BASE+'/login'}});
    if (error) { N(error.message); B(false); locked.current = false; }
  }
  const wait = mode === 'forgot' ? resetCooldown.remaining : mode === 'register' ? signupCooldown.remaining : 0;
  return <div className="table-shell"><main className="login-page">
    <a className="login-brand" href={APP_BASE}>The Table</a>
    {!ready||(session&&mode!=='reset') ? <div className="loading-rows" role="status" aria-label={ready?'Opening your account':'Checking your session'}><span/><span/></div> : <>
      <h1>{mode==='register'?'Create your account':mode==='forgot'?'Reset your password':mode==='reset'?'Choose a new password':'Welcome back'}</h1>
      {!available&&<p className="auth-notice" role="status">Sign-in is unavailable. Please try again shortly.</p>}
      <>
        <form onSubmit={event=>void submit(event)}>
          {mode!=='reset'&&<label>Email address<input type="email" autoComplete="email" required value={email} onChange={event=>E(event.target.value)} disabled={busy}/></label>}
          {mode!=='forgot'&&<label>Password<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='login'?undefined:12} required value={password} onChange={event=>P(event.target.value)} disabled={busy}/></label>}
          {(mode==='register'||mode==='reset')&&<label>Confirm password<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={event=>C(event.target.value)} disabled={busy}/></label>}
          {mode==='login'&&<p className="settings-note">You’ll stay signed in on this browser until you sign out. Sign out when using a shared device.</p>}
          <button type="submit" className="primary" disabled={busy||!available||wait>0}>{busy?'Please wait…':wait>0?`Try again in ${wait}s`:mode==='register'?'Create account':mode==='forgot'?'Send reset link':mode==='reset'?'Update password':'Sign in'}</button>
        </form>
        {(mode==='login'||mode==='register')&&<div className="verification-resend"><p>Need another verification email?</p><button type="button" disabled={busy||!available||signupCooldown.remaining>0} onClick={()=>void resendVerification()}>{signupCooldown.remaining>0?`Resend in ${signupCooldown.remaining}s`:'Resend verification email'}</button></div>}
        {mode==='login'&&<><div className="auth-links"><button type="button" disabled={busy} onClick={()=>change('forgot')}>Forgot password?</button><button type="button" disabled={busy} onClick={()=>change('register')}>Create account</button></div>{(['google','facebook'] as const).filter(provider=>loginProviders[provider]).map(provider=><button className="social-login" key={provider} disabled={busy||!available} onClick={()=>void social(provider)}>Continue with {provider==='google'?'Google':'Facebook'}</button>)}</>}
        {mode!=='login'&&<button type="button" disabled={busy} onClick={()=>change('login')}>Back to sign in</button>}
      </>
      {message&&<p className="auth-message" role="status">{message}</p>}
    </>}
  </main></div>;
}
