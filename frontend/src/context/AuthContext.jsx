import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { getMockUserByCredentials } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('primepharm_token') || null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // If browser is currently in mock mode, clear it and force a clean reload to API mode
    if (localStorage.getItem('primepharm_auth_mode') === 'mock') {
      localStorage.removeItem('primepharm_token');
      localStorage.removeItem('primepharm_user');
      localStorage.removeItem('primepharm_pharmacy_id');
      localStorage.removeItem('primepharm_auth_mode');
      window.location.reload();
      return;
    }

    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // If user profile is already populated in state, do not fetch again (e.g. on fresh login)
      if (user) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setPharmacy(res.data.pharmacy);
        localStorage.setItem('primepharm_pharmacy_id', res.data.user.pharmacy_id || '');
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        logout(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: userData, pharmacy: pharmacyData } = res.data;

      setToken(access_token);
      setUser(userData);
      setPharmacy(pharmacyData);

      localStorage.setItem('primepharm_token', access_token);
      localStorage.setItem('primepharm_pharmacy_id', userData.pharmacy_id || '');
      localStorage.setItem('primepharm_user', JSON.stringify(userData));
      localStorage.removeItem('primepharm_auth_mode');

      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'An error occurred during login.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (regData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', regData);
      const { access_token, user: userData, pharmacy: pharmacyData } = res.data;
      
      setToken(access_token);
      setUser(userData);
      setPharmacy(pharmacyData);

      localStorage.setItem('primepharm_token', access_token);
      localStorage.setItem('primepharm_pharmacy_id', userData.pharmacy_id || '');
      localStorage.setItem('primepharm_user', JSON.stringify(userData));

      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "An error occurred during registration." };
    } finally {
      setLoading(false);
    }
  };

  const logout = (fast = false) => {
    if (fast) {
      setToken(null);
      setUser(null);
      setPharmacy(null);
      localStorage.removeItem('primepharm_token');
      localStorage.removeItem('primepharm_pharmacy_id');
      localStorage.removeItem('primepharm_user');
      localStorage.removeItem('primepharm_auth_mode');
      return;
    }

    setIsLoggingOut(true);

    if (token) {
      api.post('/auth/logout').catch((err) => {
        console.warn("Logout request failed on server:", err);
      });
    }

    // Smooth UX: Show a beautiful logout spinner before clearing state and routing
    setTimeout(() => {
      setToken(null);
      setUser(null);
      setPharmacy(null);

      localStorage.removeItem('primepharm_token');
      localStorage.removeItem('primepharm_pharmacy_id');
      localStorage.removeItem('primepharm_user');
      localStorage.removeItem('primepharm_auth_mode');
      
      setIsLoggingOut(false);
    }, 800);
  };

  return (
    <AuthContext.Provider value={{ user, pharmacy, token, loading, login, register, logout, isLoggingOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
