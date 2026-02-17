import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Login Gagal: Email atau Password salah!');
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-yellow-300 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <h1 className="text-4xl font-black mb-6 uppercase text-center border-b-4 border-black pb-4">
          Admin Login
        </h1>

        {errorMsg && (
          <div className="bg-red-200 border-2 border-black p-3 mb-4 font-bold text-red-600 text-center animate-pulse">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-bold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-4 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0_0_black] transition-all"
              placeholder="admin@warung.com"
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-4 border-black font-bold focus:outline-none focus:shadow-[4px_4px_0_0_black] transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neo-purple text-white font-black py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none active:bg-purple-800 transition-all text-xl uppercase mt-4"
          >
            {loading ? 'Masuk...' : 'MASUK'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-bold text-gray-500">
          WARUNG ONLINE ADMIN SYSTEM
        </div>
      </div>
    </div>
  );
}
