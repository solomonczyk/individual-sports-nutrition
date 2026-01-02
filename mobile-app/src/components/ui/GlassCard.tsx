import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { DesignTokens } from '../../constants/DesignTokens';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 20 }) => {
    return (
        <View style={[styles.card, style]}>
            {/* Note: React Native default View doesn't support blur. 
          In a real Expo app we'd use 'expo-blur', but we can simulate with high-alpha surface colors */}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: DesignTokens.colors.glassBackground,
        borderRadius: DesignTokens.borderRadius.large,
        borderWidth: 1,
        borderColor: DesignTokens.colors.glassBorder,
        padding: DesignTokens.spacing.md,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 16,
            },
            android: {
                elevation: 8,
            },
            web: {
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }
        })
    },
});
