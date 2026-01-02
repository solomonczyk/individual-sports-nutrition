import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { DesignTokens } from '../../constants/DesignTokens';
import { Ionicons } from '@expo/vector-icons';

interface ModernInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const ModernInput: React.FC<ModernInputProps> = ({
    label,
    error,
    containerStyle,
    icon,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputWrapper,
                error ? styles.inputError : null,
                props.multiline ? styles.multilineWrapper : null
            ]}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={DesignTokens.colors.textSecondary}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        props.multiline ? styles.multilineInput : null,
                        icon ? styles.inputWithIcon : null
                    ]}
                    placeholderTextColor={DesignTokens.colors.textTertiary}
                    selectionColor={DesignTokens.colors.primary}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: DesignTokens.spacing.md,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: DesignTokens.colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        backgroundColor: DesignTokens.colors.surface,
        borderRadius: DesignTokens.borderRadius.medium,
        borderWidth: 1,
        borderColor: DesignTokens.colors.glassBorder,
        paddingHorizontal: 16,
        height: 56,
        justifyContent: 'center',
    },
    multilineWrapper: {
        height: 'auto',
        minHeight: 100,
        paddingVertical: 12,
        alignItems: 'flex-start',
    },
    input: {
        color: DesignTokens.colors.textPrimary,
        fontSize: 16,
        flex: 1,
    },
    icon: {
        marginRight: 12,
    },
    inputWithIcon: {
        // Additional styling if needed
    },
    multilineInput: {
        textAlignVertical: 'top',
        height: '100%',
        width: '100%',
    },
    inputError: {
        borderColor: DesignTokens.colors.error,
    },
    errorText: {
        color: DesignTokens.colors.error,
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
});
