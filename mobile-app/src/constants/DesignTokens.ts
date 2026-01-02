import { Platform } from 'react-native';

/**
 * 2025 Modern Design Tokens
 * Focus: Glassmorphism 2.0, Bento Grids, and Premium Dark Mode
 */

export const DesignTokens = {
    colors: {
        // Brand Colors
        primary: '#0A84FF', // Electric Blue
        primaryLight: '#409CFF',
        secondary: '#5E5CE6', // Royal Indigo
        accent: '#30D158', // Spring Green (Nutrition/Success)
        accentOrange: '#FF9F0A', // Warning/Focus

        // Backgrounds (Dark Mode First)
        background: '#010101', // Pure Black
        surface: '#1C1C1E', // iOS Secondary Black
        surfaceElevated: '#2C2C2E', // Tertiary Black

        // Functional
        error: '#FF453A',
        success: '#32D74B',
        warning: '#FF9F0A',

        // Text
        textPrimary: '#FFFFFF',
        textSecondary: '#8E8E93',
        textTertiary: '#48484A',

        // Glassmorphism
        glassBackground: 'rgba(255, 255, 255, 0.08)',
        glassBorder: 'rgba(255, 255, 255, 0.15)',
        glassBlur: 20,
    },

    shadows: {
        soft: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                },
                android: {
                    elevation: 5,
                },
                web: {
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                }
            })
        } as any,
        premium: {
            ...Platform.select({
                ios: {
                    shadowColor: '#0084FF',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 24,
                },
                android: {
                    elevation: 10,
                },
                web: {
                    boxShadow: '0px 8px 24px rgba(10, 132, 255, 0.15)',
                }
            })
        } as any
    },

    borderRadius: {
        small: 8,
        medium: 16,
        large: 24,
        xl: 32,
        full: 9999,
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    }
}
