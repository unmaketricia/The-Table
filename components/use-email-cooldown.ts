'use client';
import {useCallback, useEffect, useState} from 'react';
import {cooldownSeconds, EMAIL_COOLDOWN_MS} from '@/lib/auth-email';
export function useEmailCooldown(key: string) {
  const [remaining, setRemaining] = useState(0);
  const [deadline, setDeadline] = useState({key, until:0});
  useEffect(() => {
    function sync() {
      let saved = 0;
      try { saved = Number(localStorage.getItem(key)) || 0; } catch {}
      setRemaining(cooldownSeconds(Math.max(saved, deadline.key === key ? deadline.until : 0)));
    }
    sync();
    const timer = setInterval(sync, 1000);
    window.addEventListener('storage', sync);
    return () => { clearInterval(timer); window.removeEventListener('storage', sync); };
  }, [key, deadline]);
  const start = useCallback(() => {
    const until = Date.now() + EMAIL_COOLDOWN_MS;
    try { localStorage.setItem(key, String(until)); } catch {}
    setDeadline({key, until});
    setRemaining(60);
  }, [key]);
  const blocked = useCallback(() => {
    let saved = 0;
    try { saved = Number(localStorage.getItem(key)) || 0; } catch {}
    return cooldownSeconds(Math.max(saved, deadline.key === key ? deadline.until : 0)) > 0;
  }, [key, deadline]);
  return {remaining, start, blocked};
}
