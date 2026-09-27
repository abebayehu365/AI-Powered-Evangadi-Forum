import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth/auth.service.js';

/**
 * Authentication Context providing user state, auth methods, premium status, and PIN lock.
 */
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPinLocked, setIsPinLocked] = useState(false);
  const navigate = useNavigate();

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    const token = authService.getStoredToken();
    if (!token) return null;
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  }, []);

  // Initialize user state from localStorage on mount and check PIN lock
  useEffect(() => {
    const token = authService.getStoredToken();
    const storedUser = authService.getStoredUser();

    if (token && storedUser) {
      setUser(storedUser);

      // If user has PIN lock enabled, check if session is already unlocked
      if (storedUser.security_pin_enabled && storedUser.is_premium) {
        const unlocked = sessionStorage.getItem('pin_unlocked') === 'true';
        if (!unlocked) {
          setIsPinLocked(true);
        }
      }

      // Fetch fresh data in background
      refreshUser().then(fresh => {
        if (fresh?.security_pin_enabled && fresh?.is_premium) {
          const unlocked = sessionStorage.getItem('pin_unlocked') === 'true';
          if (!unlocked) {
            setIsPinLocked(true);
          }
        }
      });
    }

    setLoading(false);
  }, [refreshUser]);

  /**
   * Unlock current session with PIN
   */
  const unlockPin = () => {
    sessionStorage.setItem('pin_unlocked', 'true');
    setIsPinLocked(false);
  };

  /**
   * Manually lock session with PIN
   */
  const lockPin = () => {
    sessionStorage.removeItem('pin_unlocked');
    setIsPinLocked(true);
  };

  /**
   * Registers a new user.
   */
  const register = async userData => {
    setLoading(true);
    try {
      const { user } = await authService.register(userData);
      return { success: true, user };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticates a user and updates session state.
   */
  const login = async credentials => {
    setLoading(true);
    try {
      const { user } = await authService.login(credentials);
      setUser(user);

      if (user.security_pin_enabled && user.is_premium) {
        const unlocked = sessionStorage.getItem('pin_unlocked') === 'true';
        if (!unlocked) {
          setIsPinLocked(true);
        }
      }

      return { success: true, user };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs out user.
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    sessionStorage.removeItem('pin_unlocked');
    setIsPinLocked(false);
    navigate('/auth');
  };

  const isPremium = Boolean(user?.is_premium);
  const isSuperAdmin = user?.role === 'admin';
  const isCoAdmin = user?.role === 'co-admin' || user?.role === 'moderator';
  const isAdmin = isSuperAdmin || isCoAdmin;

  const value = {
    user,
    setUser,
    loading,
    register,
    login,
    logout,
    refreshUser,
    isPremium,
    isAdmin,
    isSuperAdmin,
    isCoAdmin,
    isPinLocked,
    unlockPin,
    lockPin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
