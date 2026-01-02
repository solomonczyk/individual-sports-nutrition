import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { adviceService, AdviceResponse } from '../../src/services/advice-service'
import { Ionicons } from '@expo/vector-icons'
import { DesignTokens } from '../../src/constants/DesignTokens'
import { GlassCard } from '../../src/components/ui/GlassCard'
import { ModernButton } from '../../src/components/ui/ModernButton'

export default function AdviceScreen() {
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [advice, setAdvice] = useState<AdviceResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleAsk = async () => {
        if (!query.trim()) return

        setLoading(true)
        setError(null)
        try {
            const result = await adviceService.getPersonalizedAdvice(query)
            setAdvice(result)
        } catch (err) {
            setError('Failed to get advice. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <Ionicons name="sparkles" size={28} color={DesignTokens.colors.primary} />
                        <Text style={styles.title}>AI Advisor</Text>
                    </View>
                    <Text style={styles.subtitle}>2025 Intelligent Sport Nutrition</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {!advice && !loading && (
                        <View style={styles.emptyState}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="chatbubble-ellipses-outline" size={64} color={DesignTokens.colors.textTertiary} />
                            </View>
                            <Text style={styles.emptyTitle}>How can I help you today?</Text>
                            <Text style={styles.emptyDesc}>Ask about supplements, recovery, or meal timing based on your profile.</Text>
                        </View>
                    )}

                    {advice && (
                        <GlassCard style={styles.adviceCard}>
                            <View style={styles.adviceHeader}>
                                <View style={styles.aiBadge}>
                                    <Text style={styles.aiBadgeText}>AI INSIGHT</Text>
                                </View>
                            </View>
                            <Text style={styles.adviceText}>{advice.advice}</Text>

                            {advice.sources.length > 0 && (
                                <View style={styles.sourcesContainer}>
                                    <Text style={styles.sourcesTitle}>EVIDENCE BASE</Text>
                                    <View style={styles.sourcesGrid}>
                                        {advice.sources.map((source, index) => (
                                            <View key={index} style={styles.sourceChip}>
                                                <Ionicons name="document-text-outline" size={14} color={DesignTokens.colors.textSecondary} />
                                                <Text numberOfLines={1} style={styles.sourceItem}>{source}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </GlassCard>
                    )}

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color={DesignTokens.colors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask your nutritionist..."
                        placeholderTextColor={DesignTokens.colors.textTertiary}
                        value={query}
                        onChangeText={setQuery}
                        multiline
                    />
                    <ModernButton
                        title=""
                        onPress={handleAsk}
                        loading={loading}
                        disabled={!query.trim()}
                        style={styles.sendButton}
                        textStyle={{ display: 'none' }}
                    />
                    <View style={styles.sendIconOverlay} pointerEvents="none">
                        <Ionicons name="arrow-up" size={24} color="#000" />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },
    header: {
        padding: DesignTokens.spacing.lg,
        paddingBottom: DesignTokens.spacing.md,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DesignTokens.spacing.sm,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: DesignTokens.colors.textPrimary,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 14,
        color: DesignTokens.colors.textSecondary,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    content: {
        padding: DesignTokens.spacing.lg,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: DesignTokens.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.lg,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: DesignTokens.colors.textPrimary,
        marginBottom: DesignTokens.spacing.sm,
    },
    emptyDesc: {
        fontSize: 16,
        color: DesignTokens.colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: DesignTokens.spacing.xl,
        lineHeight: 24,
    },
    adviceCard: {
        marginBottom: 24,
    },
    adviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    aiBadge: {
        backgroundColor: `${DesignTokens.colors.primary}20`,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: `${DesignTokens.colors.primary}40`,
    },
    aiBadgeText: {
        color: DesignTokens.colors.primary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    adviceText: {
        fontSize: 18,
        lineHeight: 28,
        color: DesignTokens.colors.textPrimary,
        fontWeight: '400',
    },
    sourcesContainer: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: DesignTokens.colors.glassBorder,
    },
    sourcesTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: DesignTokens.colors.textSecondary,
        marginBottom: 12,
        letterSpacing: 1,
    },
    sourcesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sourceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: DesignTokens.colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
        maxWidth: '100%',
    },
    sourceItem: {
        fontSize: 12,
        color: DesignTokens.colors.textSecondary,
        flexShrink: 1,
    },
    inputArea: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        flexDirection: 'row',
        backgroundColor: DesignTokens.colors.surfaceElevated,
        borderRadius: 30,
        padding: 8,
        paddingLeft: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: DesignTokens.colors.glassBorder,
        ...DesignTokens.shadows.soft,
    },
    input: {
        flex: 1,
        color: DesignTokens.colors.textPrimary,
        fontSize: 16,
        paddingVertical: 10,
        maxHeight: 120,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        paddingVertical: 0,
        paddingHorizontal: 0,
        backgroundColor: DesignTokens.colors.textPrimary,
    },
    sendIconOverlay: {
        position: 'absolute',
        right: 18,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: `${DesignTokens.colors.error}15`,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${DesignTokens.colors.error}30`,
    },
    errorText: {
        color: DesignTokens.colors.error,
        fontSize: 14,
        fontWeight: '600',
    },
})
