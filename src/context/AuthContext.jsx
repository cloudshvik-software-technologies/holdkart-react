import { createContext, useContext, useState, useEffect, useCallback } from 'react';
  import { getStorage, setStorage, removeStorage } from '../utils/storage.js';
  import { STORAGE_KEYS } from '../services/api.js';

  const AuthContext = createContext(null);

  export const AuthProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const stored = getStorage(STORAGE_KEYS.CUSTOMER);
      if (stored) { try { setCustomer(JSON.parse(stored)); } catch {} }
      setIsLoading(false);

      const handleExpiry = () => logout();
      window.addEventListener('auth:session-expired', handleExpiry);
      return () => window.removeEventListener('auth:session-expired', handleExpiry);
    }, []);

    const loginCustomer = useCallback((data) => {
      setStorage(STORAGE_KEYS.TOKEN, data.token);
      setStorage(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      setStorage(STORAGE_KEYS.CUSTOMER, JSON.stringify(data.customer));
      setCustomer(data.customer);
    }, []);

    const logout = useCallback(() => {
      removeStorage(STORAGE_KEYS.TOKEN);
      removeStorage(STORAGE_KEYS.REFRESH_TOKEN);
      removeStorage(STORAGE_KEYS.CUSTOMER);
      setCustomer(null);
    }, []);

    const updateCustomer = useCallback((data) => {
      const updated = { ...customer, ...data };
      setStorage(STORAGE_KEYS.CUSTOMER, JSON.stringify(updated));
      setCustomer(updated);
    }, [customer]);

    return (
      <AuthContext.Provider value={{ customer, isAuthenticated: !!customer, isLoading, loginCustomer, logout, updateCustomer }}>
        {children}
      </AuthContext.Provider>
    );
  };

  export const useAuth = () => useContext(AuthContext);
  