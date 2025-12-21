/**
 * Jest Setup for React Native Mobile App Testing
 * 
 * This file configures Jest for testing React Native components,
 * hooks, and utilities using Expo and native modules.
 */

// Setup global test environment
import { configure } from '@testing-library/react-native';

// Configure testing library with sensible defaults
configure({ testIDAttribute: 'testID' });

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useFocusEffect: jest.fn(),
  useRoute: jest.fn(),
  NavigationContainer: ({ children }: any) => children,
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: () => null,
  }),
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: () => null,
  }),
}));

// Mock React Navigation Stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: () => null,
  }),
}));

// Mock React Navigation Bottom Tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: () => null,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  Slot: () => null,
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(),
  },
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:3000',
      aiServiceUrl: 'http://localhost:8000',
    },
  },
}));

// Mock native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
      prompt: jest.fn(),
    },
    Share: {
      share: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(),
      canOpenURL: jest.fn(),
    },
    Dimensions: {
      get: jest.fn((dimension) => {
        const dimensions = {
          window: {
            width: 375,
            height: 812,
            scale: 2,
            fontScale: 1,
          },
          screen: {
            width: 375,
            height: 812,
            scale: 2,
            fontScale: 1,
          },
        };
        return dimensions[dimension] || dimensions.window;
      }),
      addEventListener: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn(({ ios, android, default: defaultVal }: any) => ios),
    },
    Vibration: {
      vibrate: jest.fn(),
    },
    Keyboard: {
      dismiss: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  };
});

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandler: jest.fn(),
  Swipeable: jest.fn(({ children }) => children),
  PanGestureHandler: jest.fn(({ children }) => children),
  TapGestureHandler: jest.fn(({ children }) => children),
  LongPressGestureHandler: jest.fn(({ children }) => children),
}));

// Setup Redux Mock Store
jest.mock('../src/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock API Service
jest.mock('../src/services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  createAuthHeader: jest.fn(),
}));

// Mock Authentication Service
jest.mock('../src/services/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  getToken: jest.fn(),
  setToken: jest.fn(),
  clearToken: jest.fn(),
}));

// Mock Storage Service
jest.mock('../src/services/storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock i18n
jest.mock('../src/i18n', () => ({
  i18n: {
    t: jest.fn((key) => key),
    language: 'en',
    changeLanguage: jest.fn(),
  },
}));

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Non-serializable values were found in the state') ||
        args[0].includes('Remote debugger is in use'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
global.testUtils = {
  createMockNavigator: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  createMockDispatch: () => jest.fn(),
  createMockSelector: (returnValue) => jest.fn(() => returnValue),
};

export {};
