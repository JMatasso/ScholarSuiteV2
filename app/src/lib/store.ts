import { create } from "zustand";

interface SidebarStore {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
}));

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnread: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  clearUnread: () => set({ unreadCount: 0 }),
}));
