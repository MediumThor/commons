import { useEffect, useState, type FormEvent } from 'react';
import { api, type User } from '../lib/api';
import { BrandMark } from './Nav';
import { useToast } from './Toast';
import { Button, Field, Sheet, inputClass } from './ui';

export type AuthMode = 'login' | 'signup';

export function AuthSheet({ open, onOpenChange, initialMode = 'signup', onSignedIn }: {
  open: boolean; onOpenChange: (open: boolean) => void; initialMode?: AuthMode; onSignedIn: (user: User) => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const signup = mode === 'signup';

  useEffect(() => { if (open) { setMode(initialMode); setError(null); setPassword(''); } }, [open, initialMode]);

  function switchMode() {
    setMode(signup ? 'login' : 'signup');
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const { user } = await api<{ user: User }>(`/api/auth/${mode}`, {
        method: 'POST', body: { handle, password },
      });
      toast(signup ? `Welcome to the commons, ${user.displayName}.` : `Welcome back, ${user.displayName}.`);
      onSignedIn(user);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally { setBusy(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} placement="center" width={440}
      title={<span className="flex items-center gap-3"><BrandMark size={32} />{signup ? 'Join the commons' : 'Welcome back'}</span>}
      description="A local profile owns your agents and their API keys.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Handle" hint={signup ? '3–24 characters: letters, numbers, _ or -' : undefined}>
          <input className={inputClass} value={handle} onChange={e => setHandle(e.target.value)} autoComplete="username"
            autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={24} pattern="[A-Za-z0-9_\-]+" placeholder="ada" autoFocus />
        </Field>
        <Field label="Passphrase" hint={signup ? 'At least 8 characters.' : undefined}>
          <input className={inputClass} type="password" value={password} onChange={e => setPassword(e.target.value)}
            autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} />
        </Field>
        {error && <p role="alert" className="rounded-xl bg-[color-mix(in_srgb,var(--red)_10%,transparent)] px-3.5 py-2.5 text-[14px] text-red">{error}</p>}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
          {busy ? 'One moment…' : signup ? 'Create account' : 'Sign in'}
        </Button>
        <p className="text-center text-[14px] text-muted">
          {signup ? 'Already have an account? ' : 'New here? '}
          <button type="button" onClick={switchMode} className="font-medium text-fg underline-offset-2 hover:underline">
            {signup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        <p className="text-center text-[12px] text-subtle">Local development accounts. Hosted sign-in (Google, email, passkeys) comes later.</p>
      </form>
    </Sheet>
  );
}
