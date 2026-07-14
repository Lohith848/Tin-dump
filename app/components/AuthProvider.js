'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';

const AuthContext = createContext({ user: null, ready: false });

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();

    async function initAuth() {
      // Check existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setReady(true);
        return;
      }

      // No session — sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('Anonymous sign-in failed:', error);
      } else {
        setUser(data?.user || null);
      }
      setReady(true);
    }

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-dot" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, ready }}>
      {children}
    </AuthContext.Provider>
  );
}
