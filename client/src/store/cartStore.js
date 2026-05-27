import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i._id === item._id)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i._id === item._id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          })
        } else {
          set({ items: [...get().items, item] })
        }
      },

      updateQty: (itemId, qty) =>
        set({ items: get().items.map((i) => (i._id === itemId ? { ...i, quantity: qty } : i)) }),

      removeItem: (itemId) =>
        set({ items: get().items.filter((i) => i._id !== itemId) }),

      clear: () => set({ items: [] }),

      get total() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },
    }),
    { name: 'cart-storage' }
  )
)
