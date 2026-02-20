import { supabase } from '../supabaseClient';

export const handleSupabaseError = async (error) => {
  if (!error) return;

  const isAuthError =
    error?.message?.toLowerCase().includes('jwt') ||
    error?.code === '401' ||
    error?.status === 401;

  if (isAuthError) {
    console.error('Auth error detected, handling session expiration:', error);
    // Force sign out to clear stale token
    await supabase.auth.signOut();

    // Check current path
    const currentPath = window.location.pathname;

    if (currentPath.startsWith('/admin')) {
      alert('Sesi Anda telah habis, silakan login kembali.');
      window.location.href = '/login';
    } else {
      // Storefront or public pages
      window.location.reload();
    }
  }
};
