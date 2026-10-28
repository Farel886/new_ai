'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function CrownLogo({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${className} transition-transform duration-700 ease-out hover:rotate-[-6deg] hover:scale-105`}
    >
      <path
        d="M3 17L5 7L9 11L12 5L15 11L19 7L21 17H3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/chat');
    router.refresh();
  }

  return (
    <main className="min-h-dvh bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-5 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center">
            <CrownLogo className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Asyam AI</h1>
          <p className="text-sm text-neutral-500 mt-1">Masuk untuk melanjutkan</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-neutral-900/60 border border-white/10 p-6 rounded-2xl space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              placeholder="kamu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-neutral-950 font-semibold py-3 rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>

          <p className="text-xs text-center text-neutral-500 pt-1">
            Belum punya akun?{' '}
            <a href="/register" className="text-emerald-400 font-medium hover:text-emerald-300 transition">
              Daftar
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}