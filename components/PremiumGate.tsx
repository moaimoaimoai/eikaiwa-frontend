/**
 * PremiumGate — 無料ユーザーにプレミアム専用画面をブロックするコンポーネント
 * 使い方: 画面全体を <PremiumGate>...</PremiumGate> で囲むだけ
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  /** ロック対象の機能名（例: "単語帳"） */
  featureName: string;
  featureIcon: keyof typeof Ionicons.glyphMap;
  featureDescription: string;
}

export function PremiumGate({ children, featureName, featureIcon, featureDescription }: Props) {
  const user = useAuthStore((s) => s.user);

  // プレミアムユーザーはそのまま通す
  if (user?.is_premium) {
    return <>{children}</>;
  }

  const sessionUsed = user?.monthly_sessions_used ?? 0;
  const sessionLimit = user?.monthly_limit ?? 3;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* 背景グラデーション */}
      <LinearGradient
        colors={['#0F0C29', '#302B63', '#24243E']}
        style={styles.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.container}>
        {/* ロックアイコン */}
        <View style={styles.lockCircle}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.lockGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={featureIcon} size={36} color="#fff" />
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={14} color="#fff" />
            </View>
          </LinearGradient>
        </View>

        {/* タイトル */}
        <Text style={styles.featureName}>{featureName}</Text>
        <Text style={styles.subtitle}>プレミアム限定機能</Text>

        {/* 説明 */}
        <View style={styles.descCard}>
          <Text style={styles.descText}>{featureDescription}</Text>
        </View>

        {/* 現在の使用状況 */}
        <View style={styles.usageCard}>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>今月の無料会話</Text>
            <Text style={styles.usageCount}>{sessionUsed} / {sessionLimit} 回</Text>
          </View>
          <View style={styles.usageBar}>
            <View
              style={[
                styles.usageBarFill,
                {
                  width: `${Math.min((sessionUsed / sessionLimit) * 100, 100)}%`,
                  backgroundColor: sessionUsed >= sessionLimit ? Colors.error : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.usageNote}>
            無料プランは月{sessionLimit}回のAI会話のみ利用できます
          </Text>
        </View>

        {/* プレミアム特典リスト */}
        <View style={styles.benefitsList}>
          {[
            { icon: 'chatbubbles', text: 'AI会話 月100回' },
            { icon: 'library', text: '単語帳・フレーズ帳' },
            { icon: 'bar-chart', text: '学習傾向分析' },
            { icon: 'book', text: 'フレーズ学習・クイズ' },
          ].map((item, i) => (
            <View key={i} style={styles.benefitItem}>
              <Ionicons name={item.icon as any} size={16} color={Colors.primary} />
              <Text style={styles.benefitText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* アップグレードボタン */}
        <TouchableOpacity
          style={styles.upgradeBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/(main)/settings')}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.upgradeBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="star" size={20} color="#FFD700" />
            <View>
              <Text style={styles.upgradeBtnTitle}>プレミアムにアップグレード</Text>
              <Text style={styles.upgradeBtnPrice}>月額 ¥980（税込）</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          いつでもキャンセル可能 · App内課金で安全に決済
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },

  lockCircle: {
    marginBottom: Spacing.sm,
  },
  lockGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F0C29',
  },

  featureName: {
    fontSize: FontSize.xxxl ?? 28,
    fontWeight: FontWeight.extrabold,
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: '#A78BFA',
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -Spacing.sm,
  },

  descCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'stretch',
  },
  descText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    textAlign: 'center',
  },

  usageCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'stretch',
    gap: Spacing.xs,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  usageCount: { fontSize: FontSize.sm, color: '#fff', fontWeight: FontWeight.bold },
  usageBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageBarFill: { height: '100%', borderRadius: 3 },
  usageNote: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  benefitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(79,70,229,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.4)',
  },
  benefitText: {
    fontSize: FontSize.xs,
    color: '#C4B5FD',
    fontWeight: FontWeight.medium,
  },

  upgradeBtn: {
    alignSelf: 'stretch',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  upgradeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  upgradeBtnTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
  upgradeBtnPrice: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  footerNote: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});
