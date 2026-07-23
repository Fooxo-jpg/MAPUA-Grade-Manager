import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

// Small inline notice used inside Data Manager when Supabase env vars
// haven't been set up yet — informational only, never blocks the app.
export function SupabaseNotConfiguredNotice() {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 8,
      background: 'color-mix(in srgb, var(--c-danger) 6%, transparent)', color: 'var(--c-danger)', fontSize: 12.5,
    }}>
      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        Cloud save isn't configured yet. Copy <code>.env.example</code> to <code>.env</code>, fill in{' '}
        <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> from your Supabase project's
        Settings → API page, then restart the dev server.
      </span>
    </div>
  );
}

// Compact login/signup form, meant to be embedded inside a card (e.g. Data
// Manager's "Cloud Save" section) rather than shown as a full-page gate —
// signing in is entirely optional, the app works fine locally without it.
export default function AuthForm({ onSignedIn }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!email || !password) {
      setError('Enter both an email and a password.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.session) {
          onSignedIn(data.session);
        } else {
          setNotice('Check your email to confirm your account, then log in.');
          setMode('login');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onSignedIn(data.session);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 340 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, color: 'var(--c-text-faint)' }}>
        Email
        <div style={{ position: 'relative' }}>
          <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-placeholder)' }} />
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email"
            className="gt-input"
            style={{ padding: '9px 10px 9px 32px', fontSize: 13.5 }}
          />
        </div>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, color: 'var(--c-text-faint)' }}>
        Password
        <div style={{ position: 'relative' }}>
          <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-placeholder)' }} />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="gt-input"
            style={{ padding: '9px 10px 9px 32px', fontSize: 13.5 }}
          />
        </div>
      </label>

      {error && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--c-danger)', fontSize: 12.5 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}
      {notice && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--c-forest)', fontSize: 12.5 }}>
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          type="submit" disabled={busy}
          className="gt-mono gt-btn gt-btn-primary"
          style={{ opacity: busy ? 0.7 : 1 }}
        >
          {mode === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
          {busy ? 'Please wait…' : (mode === 'login' ? 'Log In' : 'Sign Up')}
        </button>

        <span style={{ fontSize: 12.5, color: 'var(--c-text-faint)' }}>
          {mode === 'login' ? (
            <>No account?{' '}
              <a href="#" onClick={e => { e.preventDefault(); setMode('signup'); setError(''); }} style={{ color: 'var(--c-accent-dark)', fontWeight: 600 }}>Sign up</a>
            </>
          ) : (
            <>Have an account?{' '}
              <a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }} style={{ color: 'var(--c-accent-dark)', fontWeight: 600 }}>Log in</a>
            </>
          )}
        </span>
      </div>
    </form>
  );
}
