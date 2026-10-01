import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  captain: {
    id: 2,
    name: 'Virat Kumar (Captain)',
    email: 'captain@cricketconnect.com',
    role: 'captain',
    isDemo: true
  },
  ground_owner: {
    id: 1,
    name: 'Rajesh Sharma (Owner)',
    email: 'owner@cricketconnect.com',
    role: 'ground_owner',
    isDemo: true
  },
  player: {
    id: 3,
    name: 'Rohit Verma (Player)',
    email: 'player@cricketconnect.com',
    role: 'player',
    isDemo: true
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cricketconnect_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cricketconnect_token') || null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cricketconnect_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cricketconnect_user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data.success) {
        const userData = { ...res.data.data.user, isDemo: false };
        setUser(userData);
        setToken(res.data.data.token);
        localStorage.setItem('cricketconnect_token', res.data.data.token);
        localStorage.setItem('cricketconnect_user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error?.message || err.message || 'Login failed' 
      };
    }
  };

  const register = async (data) => {
    try {
      const res = await apiClient.post('/auth/register', data);
      if (res.data.success) {
        const userData = { ...res.data.data.user, isDemo: false };
        setUser(userData);
        setToken(res.data.data.token);
        localStorage.setItem('cricketconnect_token', res.data.data.token);
        localStorage.setItem('cricketconnect_user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error?.message || err.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cricketconnect_token');
    localStorage.removeItem('cricketconnect_user');
  };

  const switchDemoRole = (role) => {
    const targetUser = DEMO_USERS[role];
    if (targetUser) {
      const demoData = { ...targetUser, isDemo: true };
      setUser(demoData);
      setToken(`demo_token_${role}`);
      localStorage.setItem('cricketconnect_token', `demo_token_${role}`);
      localStorage.setItem('cricketconnect_user', JSON.stringify(demoData));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
