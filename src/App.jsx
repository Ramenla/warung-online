import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Storefront from './pages/Storefront';
import Admin from './pages/Admin';
import Login from './pages/Login';

const ProtectedRoute = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-xl">Loading...</div>;

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}