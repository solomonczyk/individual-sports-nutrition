import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationSettings {
  mealReminders: boolean;
  supplementReminders: boolean;
  progressUpdates: boolean;
  priceAlerts: boolean;
  newProducts: boolean;
}

interface NotificationState {
  settings: NotificationSettings;
  permissionGranted: boolean;
  setSettings: (settings: Partial<NotificationSettings>) => void;
  setPermissionGranted: (granted: boolean) => void;
  toggleSetting: (key: keyof NotificationSettings) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      settings: {
        mealReminders: true,
        supplementReminders: true,
        progressUpdates: true,
        priceAlerts: false,
        newProducts: false,
      },
      permissionGranted: false,
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setPermissionGranted: (granted) =>
        set({ permissionGranted: granted }),
      toggleSetting: (key) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: !state.settings[key],
          },
        })),
    }),
    {
      name: 'notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
