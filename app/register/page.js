'use client';

import { useState } from 'react';
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

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-dvh bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-neutral-900/60 border border-white/10 p-8 rounded-2xl w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-white mb-2">Cek email kamu</h1>
          <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
            Link konfirmasi sudah dikirim ke{' '}
            <strong className="text-neutral-300 font-medium">{email}</strong>
            <br />Klik link itu untuk mengaktifkan akun.
          </p>
          <a
            href="/login"
            className="inline-block w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-neutral-950 font-semibold py-3 rounded-xl text-sm transition"
          >
            Kembali ke Login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-5 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-center">
            <CrownLogo className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Buat akun</h1>
          <p className="text-sm text-neutral-500 mt-1">Mulai ngobrol dengan Asyam AI</p>
        </div>

        <form
          onSubmit={handleRegister}
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
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-neutral-950 font-semibold py-3 rounded-xl text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>

          <p className="text-xs text-center text-neutral-500 pt-1">
            Sudah punya akun?{' '}
            <a href="/login" className="text-emerald-400 font-medium hover:text-emerald-300 transition">
              Masuk
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}