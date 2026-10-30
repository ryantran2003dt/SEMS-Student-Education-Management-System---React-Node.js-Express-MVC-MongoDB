import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('sems_user') || 'null'),
  token: localStorage.getItem('sems_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('sems_token', token);
      localStorage.setItem('sems_user', JSON.stringify(user));
      set({ token, user, isLoading: false });
      return user;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('sems_token');
    localStorage.removeItem('sems_user');
    set({ token: null, user: null, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('sems_token');
    if (!token) {
      set({ user: null, token: null });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data });
      localStorage.setItem('sems_user', JSON.stringify(res.data));
    } catch (err) {
      get().logout();
    }
  }
}));

export default useAuthStore;
