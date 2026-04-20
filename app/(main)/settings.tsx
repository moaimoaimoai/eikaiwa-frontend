import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';

const LEVEL_OPTIONS = [
  { id: 'beginner', label: '初級', emoji: '🌱', desc: 'これから英語を始める方' },
  { id: 'intermediate', label: '中級', emoji: '🌿', desc: '日常会話ができる方' },
  { id: 'advanced', label: '上級', emoji: '🌳', desc: 'ビジネスレベルの方' },
];

export default function SettingsScreen() {
  const { user, updateUser, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [selectedLevel, setSelectedLevel] = useState(user?.level ?? 'beginner');
  const [isEditingName, setIsEditingName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const levelEmoji =
    user?.level === 'beginner' ? '🌱' : user?.level === 'intermediate' ? '🌿' : '🌳';

  /* ---------- ハンドラ ---------- */

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください');
      return;
    }
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        display_name: displayName.trim(),
        level: selectedLevel as any,
      });
      updateUser(updated);
      setIsEditingName(false);
      Alert.alert('保存完了', 'プロフィールを更新しました ✅');
    } catch {
      Alert.alert('エラー', '保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch {
              Alert.alert('エラー', 'ログアウトに失敗しました');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  /* ---------- UI ---------- */

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* ─── ヘッダー ─── */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{levelEmoji}</Text>
            </View>
            <Text style={styles.headerName}>{user?.display_name || user?.username}</Text>
            <Text style={styles.headerEmail}>{user?.email}</Text>
          </View>

          {/* バッジ */}
          <View style={styles.badgeRow}>
            {[
              { icon: 'flame' as const,         color: '#FB923C', value: `${user?.streak_days ?? 0}日連続` },
              { icon: 'chatbubbles' as const,    color: '#818CF8', value: `${user?.total_conversations ?? 0}回` },
              { icon: 'time' as const,           color: '#FDBA74', value: `${user?.total_minutes ?? 0}分` },
            ].map((b, i) => (
              <View key={i} style={styles.badge}>
                <Ionicons name={b.icon} size={14} color={b.color} />
                <Text style={styles.badgeText}>{b.value}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ─── プロフィール編集 ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プロフィール</Text>
          <View style={styles.card}>
            {/* 表示名 */}
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>表示名</Text>
                {isEditingName ? (
                  <TextInput
                    style={styles.nameInput}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoFocus
                    placeholderTextColor={Colors.textMuted}
                    placeholder="名前を入力"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveProfile}
                  />
                ) : (
                  <Text style={styles.rowValue}>{user?.display_name || '未設定'}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (isEditingName) {
                    handleSaveProfile();
                  } else {
                    setIsEditingName(true);
                  }
                }}
                style={styles.editButton}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Text style={styles.editButtonText}>
                    {isEditingName ? '保存' : '編集'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* メールアドレス */}
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>メールアドレス</Text>
                <Text style={styles.rowValue}>{user?.email}</Text>
              </View>
              <Ionicons name="lock-closed" size={16} color={Colors.textMuted} />
            </View>

            <View style={styles.divider} />

            {/* ユーザーID */}
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="at-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>ユーザーID</Text>
                <Text style={styles.rowValue}>@{user?.username}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── レベル設定 ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>英語レベル</Text>
          <View style={styles.levelGrid}>
            {LEVEL_OPTIONS.map((opt) => {
              const active = selectedLevel === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.levelCard, active && styles.levelCardActive]}
                  onPress={() => setSelectedLevel(opt.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.levelEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.levelLabel, active && styles.levelLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.levelDesc}>{opt.desc}</Text>
                  {active && (
                    <View style={styles.levelCheck}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedLevel !== user?.level && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>レベルを保存する</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── サブスクリプション ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プラン</Text>
          {user?.is_premium ? (
            <View style={styles.premiumCard}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.premiumGradient} start={{x:0,y:0}} end={{x:1,y:1}}>
                <View style={styles.premiumTop}>
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={14} color={Colors.gold} />
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                  </View>
                  <Text style={styles.premiumExpiry}>
                    {user.subscription_expires_at
                      ? `${new Date(user.subscription_expires_at).toLocaleDateString('ja-JP')} まで有効`
                      : '有効'}
                  </Text>
                </View>
                <View style={styles.premiumUsageRow}>
                  <Text style={styles.premiumUsageLabel}>今月の使用量</Text>
                  <Text style={styles.premiumUsageCount}>{user.monthly_sessions_used} / {user.monthly_limit} 回</Text>
                </View>
                <View style={styles.premiumProgressBar}>
                  <View style={[styles.premiumProgressFill, {
                    width: `${Math.min((user.monthly_sessions_used / user.monthly_limit) * 100, 100)}%`
                  }]} />
                </View>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.card}>
              {/* 無料プラン使用量 */}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.textMuted + '20' }]}>
                  <Ionicons name="chatbubbles-outline" size={20} color={Colors.textMuted} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowLabel}>今月の会話</Text>
                  <Text style={styles.rowValue}>
                    {user?.monthly_sessions_used ?? 0} / {user?.monthly_limit ?? 3} 回
                  </Text>
                  <View style={styles.usageBar}>
                    <View style={[styles.usageBarFill, {
                      width: `${Math.min(((user?.monthly_sessions_used ?? 0) / (user?.monthly_limit ?? 3)) * 100, 100)}%`,
                      backgroundColor: (user?.monthly_sessions_used ?? 0) >= (user?.monthly_limit ?? 3)
                        ? Colors.error : Colors.primary,
                    }]} />
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
              {/* プレミアムCTA */}
              <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.85}>
                <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.upgradeGradient} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Ionicons name="star" size={18} color={Colors.gold} />
                  <View style={styles.upgradeTextWrap}>
                    <Text style={styles.upgradeTitle}>プレミアムにアップグレード</Text>
                    <Text style={styles.upgradeDesc}>月$10 · 100回/月 · 全機能使い放題</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── アカウント ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={styles.card}>
            {/* 登録日 */}
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>登録日</Text>
                <Text style={styles.rowValue}>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('ja-JP')
                    : '—'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* ログアウト */}
            <TouchableOpacity
              style={styles.row}
              onPress={handleLogout}
              activeOpacity={0.8}
              disabled={loggingOut}
            >
              <View style={[styles.rowIcon, { backgroundColor: Colors.error + '20' }]}>
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              </View>
              <View style={styles.rowBody}>
                {loggingOut ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Text style={[styles.rowLabel, { color: Colors.error, fontWeight: FontWeight.semibold }]}>
                    ログアウト
                  </Text>
                )}
              </View>
              {!loggingOut && (
                <Ionicons name="chevron-forward" size={20} color={Colors.error} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>英会話AI v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 120 },

  /* Header */
  header: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  headerCenter: { alignItems: 'center', gap: Spacing.xs },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarEmoji: { fontSize: 40 },
  headerName: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: '#fff' },
  headerEmail: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  badgeRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: { fontSize: FontSize.sm, color: '#fff', fontWeight: FontWeight.medium },

  /* Sections */
  section: { padding: Spacing.md, gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: Spacing.xs,
  },

  /* Card rows */
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    minHeight: 60,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  rowValue: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md },

  /* Name input */
  nameInput: {
    fontSize: FontSize.md, color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    borderBottomWidth: 1, borderBottomColor: Colors.primary,
    paddingVertical: 2,
  },
  editButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.sm,
  },
  editButtonText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  /* Level */
  levelGrid: { flexDirection: 'row', gap: Spacing.sm },
  levelCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  levelCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  levelEmoji: { fontSize: 28 },
  levelLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  levelLabelActive: { color: Colors.primary },
  levelDesc: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  levelCheck: { position: 'absolute', top: 6, right: 6 },

  /* Save button */
  saveButton: { marginTop: Spacing.xs, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  saveButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },

  /* Premium card */
  premiumCard: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  premiumGradient: { padding: Spacing.lg, gap: Spacing.md },
  premiumTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  premiumBadgeText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  premiumExpiry: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  premiumUsageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  premiumUsageLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  premiumUsageCount: { fontSize: FontSize.sm, color: '#fff', fontWeight: FontWeight.bold },
  premiumProgressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  premiumProgressFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 3 },

  /* Usage bar (free plan) */
  usageBar: { height: 4, backgroundColor: Colors.backgroundInput, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: 2 },

  /* Upgrade button */
  upgradeButton: { borderRadius: 0, overflow: 'hidden' },
  upgradeGradient: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  upgradeTextWrap: { flex: 1 },
  upgradeTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
  upgradeDesc: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  /* Footer */
  footer: { alignItems: 'center', marginTop: Spacing.xl },
  footerText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
