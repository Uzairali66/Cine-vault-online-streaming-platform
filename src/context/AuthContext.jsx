import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ID } from 'appwrite';
import { account } from '../appwrite';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check for an active Appwrite session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await account.get();
        setUser({
          $id: session.$id,
          name: session.name,
          email: session.email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=dc2626&color=fff`,
        });
        setIsPremium(session.prefs?.isPremium === true);
        setIsAdmin(session.prefs?.isAdmin === true || session.email === 'admin@cinevault.com');
      } catch {
        // No active session — user is not logged in
        setUser(null);
        setIsPremium(false);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // ─── REFRESH USER SESSION ─────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const session = await account.get();
      setUser({
        $id: session.$id,
        name: session.name,
        email: session.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=dc2626&color=fff`,
      });
      setIsPremium(session.prefs?.isPremium === true);
      setIsAdmin(session.prefs?.isAdmin === true || session.email === 'admin@cinevault.com');
      return session;
    } catch (e) {
      console.error('Failed to refresh user session:', e);
      throw e;
    }
  }, []);

  // ─── LOGIN ───────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    // Appwrite uses email + password to create a session
    await account.createEmailPasswordSession(email, password);
    const session = await account.get();
    const userData = {
      $id: session.$id,
      name: session.name,
      email: session.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=dc2626&color=fff`,
    };
    setUser(userData);
    setIsPremium(session.prefs?.isPremium === true);
    setIsAdmin(session.prefs?.isAdmin === true || session.email === 'admin@cinevault.com');
    return userData;
  }, []);

  // ─── SIGNUP ──────────────────────────────────────────────────
  const signup = useCallback(async ({ name, email, password }) => {
    // 1. Create the account in Appwrite
    await account.create(ID.unique(), email, password, name);

    // 2. Auto-login after signup (create session)
    await account.createEmailPasswordSession(email, password);

    // 3. Premium status is ONLY granted by the Stripe webhook after payment.
    //    Never set isPremium: true here — that would allow bypassing payment.

    // 4. Fetch the session user
    const session = await account.get();
    const userData = {
      $id: session.$id,
      name: session.name,
      email: session.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=dc2626&color=fff`,
    };
    setUser(userData);
    setIsPremium(session.prefs?.isPremium === true);
    setIsAdmin(session.prefs?.isAdmin === true || session.email === 'admin@cinevault.com');
    return userData;
  }, []);

  // ─── LOGOUT ──────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // Session may already be invalid — clear local state anyway
    }
    setUser(null);
    setIsPremium(false);
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isPremium, isAdmin, isLoading, login, logout, signup, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;