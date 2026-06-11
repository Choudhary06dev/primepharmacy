import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { getMockUserByCredentials } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('primepharm_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (localStorage.getItem('primepharm_auth_mode') === 'mock') {
        const storedUser = JSON.parse(localStorage.getItem('primepharm_user') || 'null');
        setUser(storedUser);
        
        let ph = null;
        if (storedUser && storedUser.pharmacy_id !== null && storedUser.pharmacy_id !== undefined) {
          const mockPharms = JSON.parse(localStorage.getItem('primepharm_mock_pharmacies') || '[]');
          ph = mockPharms.find((p) => p.id === Number(storedUser.pharmacy_id));
        }
        setPharmacy(ph || { id: 1, name: 'Local Demo Pharmacy', status: 'Active' });
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
        logout();
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
      const mockUser = getMockUserByCredentials(email, password);

      if (mockUser) {
        const mockToken = `mock-${mockUser.id}-${Date.now()}`;

        setToken(mockToken);
        setUser(mockUser);

        let ph = null;
        if (mockUser.pharmacy_id !== null && mockUser.pharmacy_id !== undefined) {
          const mockPharms = JSON.parse(localStorage.getItem('primepharm_mock_pharmacies') || '[]');
          ph = mockPharms.find((p) => p.id === Number(mockUser.pharmacy_id));
        }
        const activePh = ph || { id: 1, name: 'Local Demo Pharmacy', status: 'Active' };
        setPharmacy(activePh);

        localStorage.setItem('primepharm_token', mockToken);
        localStorage.setItem('primepharm_pharmacy_id', mockUser.pharmacy_id || '');
        localStorage.setItem('primepharm_user', JSON.stringify(mockUser));
        localStorage.setItem('primepharm_auth_mode', 'mock');

        return {
          message: 'Login successful.',
          user: mockUser,
          pharmacy: activePh,
          access_token: mockToken,
          token_type: 'Bearer',
        };
      }

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

  const logout = async () => {
    if (token) {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.warn("Logout request failed on server:", err);
      }
    }
    
    setToken(null);
    setUser(null);
    setPharmacy(null);

    localStorage.removeItem('primepharm_token');
    localStorage.removeItem('primepharm_pharmacy_id');
    localStorage.removeItem('primepharm_user');
    localStorage.removeItem('primepharm_auth_mode');
  };

  return (
    <AuthContext.Provider value={{ user, pharmacy, token, loading, login, register, logout }}>
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
