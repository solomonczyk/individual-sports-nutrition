import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import { DesignTokens } from '../../constants/DesignTokens';

interface ModernButtonProps {
    title: string;
    onPress: () => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'outline';
}

export const ModernButton: React.FC<ModernButtonProps> = ({
    title,
    onPress,
    style,
    textStyle,
    loading,
    disabled,
    variant = 'primary'
}) => {
    const isOutline = variant === 'outline';

    return (
        <TouchableOpacity
            style={[
                styles.button,
                isOutline ? styles.outlineButton : styles.primaryButton,
                disabled && styles.disabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={isOutline ? DesignTokens.colors.primary : "#fff"} />
            ) : (
                <Text style={[
                    styles.text,
                    isOutline ? styles.outlineText : styles.primaryText,
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: DesignTokens.borderRadius.medium,
        paddingVertical: DesignTokens.spacing.md,
        paddingHorizontal: DesignTokens.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: DesignTokens.colors.primary,
        ...DesignTokens.shadows.soft,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: DesignTokens.colors.primary,
    },
    disabled: {
        backgroundColor: DesignTokens.colors.surfaceElevated,
        borderColor: DesignTokens.colors.surfaceElevated,
        opacity: 0.5,
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    primaryText: {
        color: '#FFFFFF',
    },
    outlineText: {
        color: DesignTokens.colors.primary,
    },
});
