import { create } from 'zustand'
import axiosClient from '@/api/axiosClient'

export const useAuthStore = create((set) => ({
  user: null,
  isAuth: false,
  loading: true,

  setUser: (user) => set({ user, isAuth: true, loading: false }),
  clearUser: () => set({ user: null, isAuth: false, loading: false }),

  fetchMe: async () => {
    try {
      const { data } = await axiosClient.get('/api/users/me')
      set({ user: data.user, isAuth: true, loading: false })
    } catch {
      set({ user: null, isAuth: false, loading: false })
    }
  },
}))
