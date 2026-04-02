import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, logout as logoutAction } from '../store/slices/authSlice';
import { authAPI } from '../services/api/auth';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only check auth status if we have a token but no user
    const token = localStorage.getItem('token');
    if (token && !user && !loading) {
      checkAuthStatus();
    } else if (!token) {
      dispatch(setLoading(false));
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch(setLoading(true));
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        dispatch(setUser(response.data.user));
      }
    } catch (error) {
      // User not authenticated - clear everything
      dispatch(logoutAction());
    } finally {
      dispatch(setLoading(false));
    }
  };

  const login = async (credentials) => {
    try {
      dispatch(setLoading(true));
      const response = await authAPI.login(credentials);
      if (response.success) {
        dispatch(setUser(response.data.user));
        toast.success('Login successful!');
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const register = async (userData) => {
    try {
      dispatch(setLoading(true));
      const response = await authAPI.register(userData);
      if (response.success) {
        dispatch(setUser(response.data.user));
        toast.success('Registration successful!');
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      dispatch(logoutAction());
      toast.success('Logged out successfully');
    } catch (error) {
      // Still clear user state even if API call fails
      dispatch(logoutAction());
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus,
    isAuthenticated,
  };
};