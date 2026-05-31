'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm p-8">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-lg shadow-violet-200">
            <Zap size={17} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[18px] font-black tracking-tight bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">
            FinTrack
          </span>
        </div>

        <h1 className="text-[20px] font-black text-gray-900 mb-1">Welcome back</h1>
        <p className="text-[13px] text-gray-400 mb-6">Sign in to your account</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 rounded-xl bg-gray-50 border border-gray-200 text-[13px] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-[12px] text-red-600 font-medium">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-violet-200 disabled:opacity-60 mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
