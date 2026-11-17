'use client';
import {useEffect, useRef, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {authClient} from '@/commercial/auth';
import {APP_BASE, buyerFetch} from '@/commercial/api';
import {cleanEmail, emailChangeComplete, emailCooldownKey, validEmail} from '@/lib/auth-email';
import {useEmailCooldown} from './use-email-cooldown';
type Pending = {original: string; requested: string};
export function AccountSecurity() {
  const [user, setUser] = useState<User|null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const locked = useRef(false);
  const changeCooldown = useEmailCooldown(emailCooldownKey('change', user?.id || ''));
  const resetCooldown = useEmailCooldown(emailCooldownKey('reset', user?.email || ''));
  useEffect(() => {
    const client = authClient(); if (!client) return;
    let active = true, ending = false;
    let deferred: ReturnType<typeof setTimeout> | undefined;
    async function refresh() {
      const {data, error} = await client!.auth.getUser();
      if (!active || error || !data.user || ending) return;
      const next = data.user;
      let pending: Pending|null = null;
      try { pending = JSON.parse(localStorage.getItem('table-email-change:'+next.id) || 'null'); } catch {}
      if (pending && emailChangeComplete(next.email || '', next.new_email, pending.original, pending.requested)) {
        ending = true;
        const {error: signoutError} = await client!.auth.signOut();
        if (signoutError) { ending = false; setMessage('Your email was changed. Please sign out and sign in with your new email address.'); return; }
        try { localStorage.removeItem('table-email-change:'+next.id); } catch {}
        window.location.replace(APP_BASE+'/login?emailChanged=1');
        return;
      }
      setUser(next);
    }
    void refresh();
    const {data} = client.auth.onAuthStateChange(() => { clearTimeout(deferred); deferred = setTimeout(() => void refresh(), 0); });
    window.addEventListener('focus', refresh);
    const timer = setInterval(() => { if (user?.new_email) void refresh(); }, 10000);
    return () => { active = false; clearTimeout(deferred); clearInterval(timer); window.removeEventListener('focus', refresh); data.subscription.unsubscribe(); };
  }, [user?.new_email]);
  async function changeEmail(event: React.FormEvent) {
    event.preventDefault(); const client = authClient();
    if (!client || !user || locked.current || changeCooldown.blocked()) return;
    const requested = cleanEmail(email);
    if (!validEmail(requested) || requested === cleanEmail(user.email || '')) { setMessage('Enter a different, valid email address.'); return; }
    locked.current = true; setBusy(true); setMessage('');
    try {
      // Claim a paid purchase against the verified original email before requesting a change.
      const claim = await buyerFetch('/api/account');
      if (!claim.ok) throw new Error('We could not check your account. Please try again before changing your email.');
      const {data, error} = await client.auth.updateUser({email: requested}, {emailRedirectTo: window.location.origin+APP_BASE+'/login'});
      if (error) throw error;
      try { localStorage.setItem('table-email-change:'+user.id, JSON.stringify({original:user.email, requested})); } catch {}
      setUser(data.user); setEmail(''); changeCooldown.start();
      setMessage('Check your current and new inboxes. Confirm the change in both emails. Your login email stays the same until verification is complete; then sign in with your new address.');
    } catch (error) { if ((error as {status?:number}).status === 429) changeCooldown.start(); setMessage(error instanceof Error ? error.message : 'Could not request an email change.'); }
    finally { locked.current = false; setBusy(false); }
  }
  async function resendChange() {
    const client = authClient(); if (!client || !user?.new_email || locked.current || changeCooldown.blocked()) return;
    locked.current = true; setBusy(true); changeCooldown.start();
    try {
      const {error} = await client.auth.resend({type:'email_change', email:user.new_email, options:{emailRedirectTo:window.location.origin+APP_BASE+'/login'}});
      if (error) throw error;
      setMessage('Verification requested again. Check both inboxes and use the newest emails.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not resend verification.'); }
    finally { locked.current = false; setBusy(false); }
  }
  async function resetPassword() {
    const client = authClient(); if (!client || !user?.email || locked.current || resetCooldown.blocked()) return;
    locked.current = true; setBusy(true); resetCooldown.start();
    try {
      const {error} = await client.auth.resetPasswordForEmail(user.email, {redirectTo:window.location.origin+APP_BASE+'/login'});
      if (error) throw error;
      setMessage('Check your inbox for a password reset link. After updating your password, sign in again.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not send a password reset email.'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <section className="account-section account-security" aria-labelledby="security-heading">
    <h2 id="security-heading">Email &amp; password</h2>
    {user ? <>
      <p>Login email: <strong>{user.email}</strong></p>
      {user.new_email ? <div className="pending-email"><p>Waiting for verification: <strong>{user.new_email}</strong></p><p>Confirm the change in both your current and new inboxes.</p><button type="button" className="account-secondary" disabled={busy||changeCooldown.remaining>0} onClick={()=>void resendChange()}>{changeCooldown.remaining>0?`Resend in ${changeCooldown.remaining}s`:'Resend email-change verification'}</button></div> : <form onSubmit={event=>void changeEmail(event)}>
        <label>New email address<input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} disabled={busy} placeholder="New email address"/></label>
        <p className="account-note">Before changing your email address, make sure you can access both your current and new inboxes. You’ll need to confirm the change from both. If you no longer have access to either inbox, contact <a href="mailto:tricia@un-make.com">tricia@un-make.com</a> for help.</p>
        <button type="submit" className="account-secondary" disabled={busy||changeCooldown.remaining>0}>{changeCooldown.remaining>0?`Try again in ${changeCooldown.remaining}s`:'Change email address'}</button>
      </form>}
      <div className="password-reset-action"><h3>Password</h3><p>Receive a link to choose a new password.</p><button type="button" className="account-secondary" disabled={busy||resetCooldown.remaining>0} onClick={()=>void resetPassword()}>{resetCooldown.remaining>0?`Send again in ${resetCooldown.remaining}s`:'Reset password'}</button></div>
    </> : <p>Loading your email settings…</p>}
    {message&&<p className="security-notice" role="status">{message}</p>}
  </section>;
}
