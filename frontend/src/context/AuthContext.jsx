import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginRequest } from '../api/authApi';

const TOKEN_STORAGE_KEY = 'ims_auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchCurrentUser(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, isLoading, isAuthenticated: Boolean(token), login, logout }),
    [token, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
