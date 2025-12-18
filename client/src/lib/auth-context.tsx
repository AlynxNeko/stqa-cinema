import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Profile } from './supabase'; // Pastikan import api dari sini

// Definisi tipe User sederhana agar tidak error
interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  // Perbaikan tipe return di sini:
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek localStorage saat aplikasi dimuat
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setProfile(userData); 
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      
      // Simpan data user
      setUser(res.user);
      setProfile(res.user);
      localStorage.setItem('user', JSON.stringify(res.user));
      
      // Return user agar bisa dibaca di halaman Login
      return { user: res.user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const res = await api.post('/api/auth/register', { email, password, name });
      
      // Auto login setelah register
      setUser(res.user);
      setProfile(res.user);
      localStorage.setItem('user', JSON.stringify(res.user));
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  async function signOut() {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('user');
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}