'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function CrownLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 17L5 7L9 11L12 5L15 11L19 7L21 17H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // Bikin supabase cuma sekali, dan aman di server (build)
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      } else {
        setError('Link reset tidak valid atau sudah kadaluarsa. Minta link baru.');
      }
    };
    checkSession();
  }, [supabase]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi tidak sama');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/login?reset=success');
  }

  return (
    <main className="min-h-dvh bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-5 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center">
            <CrownLogo className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Reset Password</h1>
          <p className="text-sm text-neutral-500 mt-1">Masukin password baru kamu</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-900/60 border border-white/10 p-6 rounded-2xl space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">Password Baru</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">Konfirmasi Password</label>
            <input
              type="password"
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !ready}
            className="w-full bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold py-3 rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </main>
  );
}