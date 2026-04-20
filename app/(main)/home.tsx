import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, TOPICS } from '../../constants/theme';


export default function HomeScreen() {
  const { user, updateUser } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await authService.getStats();
      setStats(data);
    } catch {}
  };

  useEffect(() => { loadStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'おはようございます';
    if (h < 18) return 'こんにちは';
    return 'こんばんは';
  };

  const levelEmoji = user?.level === 'beginner' ? '🌱' : user?.level === 'intermediate' ? '🌿' : '🌳';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── ヘッダー ── */}
        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header} start={{x:0,y:0}} end={{x:1,y:1}}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting()} 👋</Text>
              <Text style={styles.userName}>{user?.display_name || user?.username || 'ユーザー'}さん</Text>
            </View>
            <TouchableOpacity style={styles.avatarButton} onPress={() => router.push('/(main)/settings')}>
              <Text style={styles.avatarButtonText}>{levelEmoji}</Text>
            </TouchableOpacity>
          </View>

          {/* Streak */}
          <View style={styles.streakBanner}>
            <Ionicons name="flame" size={20} color="#FB923C" />
            <Text style={styles.streakText}>{user?.streak_days ?? 0}日連続学習中！</Text>
            {(user?.streak_days ?? 0) > 0 && (
              <Text style={styles.streakSub}>継続は力なり ✨</Text>
            )}
          </View>
        </LinearGradient>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {[
            { label: '会話回数', value: stats?.total_conversations ?? user?.total_conversations ?? 0, icon: 'chatbubbles' as const, color: Colors.primary },
            { label: '練習時間', value: `${stats?.total_minutes ?? user?.total_minutes ?? 0}分`, icon: 'time' as const, color: Colors.secondary },
            { label: '修正済み', value: stats?.mastered_count ?? 0, icon: 'checkmark-circle' as const, color: Colors.success },
          ].map((stat, i) => (
            <Card key={i} style={styles.statCard} variant="glass">
              <View style={[styles.statIconWrap, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        {/* ── 会話を始める ── */}
        <TouchableOpacity onPress={() => router.push('/(main)/conversation')} activeOpacity={0.9} style={styles.startButtonWrap}>
          <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.startButton} start={{x:0,y:0}} end={{x:1,y:0}}>
            <View style={styles.startButtonContent}>
              <View>
                <Text style={styles.startButtonTitle}>会話を始める</Text>
                <Text style={styles.startButtonSub}>AIアバターと英語で話そう</Text>
              </View>
              <View style={styles.startButtonIcon}>
                <Ionicons name="mic" size={32} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── トピック ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps" size={18} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>トピックを選んで練習</Text>
          </View>
          <View style={styles.topicsGrid}>
            {TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.topicCard, { borderColor: topic.color + '50' }]}
                onPress={() => router.push({ pathname: '/(main)/conversation', params: { topic: topic.id } })}
                activeOpacity={0.8}
              >
                <View style={[styles.topicIcon, { backgroundColor: topic.color + '25' }]}>
                  <Text style={styles.topicEmoji}>{topic.icon}</Text>
                </View>
                <Text style={styles.topicLabel}>{topic.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 学習メニュー ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid" size={18} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>学習メニュー</Text>
          </View>
          <View style={styles.quickLinks}>
            {[
              { title: 'ウォームアップ', desc: '今日のフレーズ10選', icon: 'book' as const, color: '#0891B2', route: '/(main)/warmup' },
              { title: '単語クイズ', desc: 'ミスを復習しよう', icon: 'library' as const, color: '#D97706', route: '/(main)/vocabulary' },
              { title: '傾向分析', desc: '弱点を把握しよう', icon: 'bar-chart' as const, color: '#059669', route: '/(main)/analysis' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickLink}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickLinkIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.quickLinkText}>
                  <Text style={styles.quickLinkTitle}>{item.title}</Text>
                  <Text style={styles.quickLinkDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── ミス復習バナー ── */}
        {stats && stats.mistake_count > 0 && (
          <TouchableOpacity onPress={() => router.push('/(main)/vocabulary')} activeOpacity={0.9} style={styles.mistakesBannerWrap}>
            <Card style={styles.mistakesBanner} variant="outlined">
              <View style={styles.mistakesBannerContent}>
                <View style={styles.mistakesIconWrap}>
                  <Ionicons name="document-text" size={26} color={Colors.warning} />
                </View>
                <View style={styles.mistakesText}>
                  <Text style={styles.mistakesTitle}>
                    {stats.mistake_count - stats.mastered_count}個のミスを復習しよう
                  </Text>
                  <Text style={styles.mistakesDesc}>単語帳でクイズに挑戦！</Text>
                </View>
                <View style={styles.mistakesBadge}>
                  <Text style={styles.mistakesBadgeText}>{stats.mastered_count}/{stats.mistake_count}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 130 },

  /* Header */
  header: { padding: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: '#fff', marginTop: 2 },
  avatarButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarButtonText: { fontSize: 24 },
  streakBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  streakText: { fontSize: FontSize.sm, color: '#fff', fontWeight: FontWeight.semibold, flex: 1 },
  streakSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },

  /* Stats */
  statsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginTop: Spacing.md,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: Spacing.md },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  /* Start button */
  startButtonWrap: { marginHorizontal: Spacing.md, marginTop: Spacing.md },
  startButton: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  startButtonContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl,
  },
  startButtonTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff' },
  startButtonSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  startButtonIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Sections */
  section: { padding: Spacing.md, gap: Spacing.md, marginTop: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  /* Topics */
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  topicCard: {
    width: '30%', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  topicIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  topicEmoji: { fontSize: 28 },
  topicLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium, textAlign: 'center' },

  /* Quick links */
  quickLinks: { gap: Spacing.sm },
  quickLink: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickLinkIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickLinkText: { flex: 1 },
  quickLinkTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  quickLinkDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  /* Mistakes banner */
  mistakesBannerWrap: { marginHorizontal: Spacing.md, marginTop: Spacing.sm },
  mistakesBanner: {},
  mistakesBannerContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mistakesIconWrap: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  mistakesText: { flex: 1 },
  mistakesTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  mistakesDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  mistakesBadge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  mistakesBadgeText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
});
