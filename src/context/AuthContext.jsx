import { createContext, useContext, useState } from 'react';
import { apiClient } from '../lib/apiClient';

const AuthContext = createContext(undefined);

function loadStoredUser() {
  const raw = localStorage.getItem('adminUser');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  async function login(identifier, password) {
    const { data } = await apiClient.post('/api/v1/auth/login', {
      identifier,
      password,
    });

    if (data.user.role !== 'admin') {
      throw new Error('This account does not have admin access.');
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('adminUser');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
