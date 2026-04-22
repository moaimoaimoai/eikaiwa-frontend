import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { Card } from '../../components/ui/Card';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius,
  TOPICS, getTodayTopic, DailyTopic,
} from '../../constants/theme';


export default function HomeScreen() {
  const { user, updateUser } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 今日のトピック
  const todayTopic: DailyTopic = getTodayTopic();


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

        {/* ── 今日のトピック ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>TODAY</Text>
            </View>
            <Text style={styles.sectionTitle}>今日のトピック</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push({ pathname: '/(main)/conversation', params: { topic: todayTopic.parentTopic, dailyTopic: todayTopic.id } })}
          >
            <LinearGradient
              colors={[todayTopic.color + 'DD', todayTopic.color + '99']}
              style={styles.todayTopicCard}
              start={{x:0,y:0}} end={{x:1,y:1}}
            >
              {/* 背景装飾 */}
              <View style={styles.todayTopicBg}>
                <Text style={styles.todayTopicBgEmoji}>{todayTopic.icon}</Text>
              </View>

              <View style={styles.todayTopicContent}>
                <View style={styles.todayTopicIconWrap}>
                  <Text style={styles.todayTopicEmoji}>{todayTopic.icon}</Text>
                </View>
                <View style={styles.todayTopicTexts}>
                  <Text style={styles.todayTopicLabel}>{todayTopic.label}</Text>
                  <Text style={styles.todayTopicHint}>{todayTopic.hint}</Text>
                </View>
              </View>

              <View style={styles.todayTopicFooter}>
                <View style={styles.todayTopicChip}>
                  <Ionicons name="sparkles" size={11} color="#fff" />
                  <Text style={styles.todayTopicChipText}>今日のおすすめ</Text>
                </View>
                <View style={styles.todayTopicStartBtn}>
                  <Text style={styles.todayTopicStartText}>このトピックで話す</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── OR 区切り ── */}
        <View style={styles.orDivider}>
          <View style={styles.orLine} />
          <View style={styles.orBadge}>
            <Text style={styles.orText}>または</Text>
          </View>
          <View style={styles.orLine} />
        </View>

        {/* ── 会話を始める（トピック自由） ── */}
        <View style={styles.startSection}>
          <TouchableOpacity onPress={() => router.push('/(main)/conversation')} activeOpacity={0.9}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED', '#9333EA']}
              style={styles.startButton}
              start={{x:0,y:0}} end={{x:1,y:1}}
            >
              <View style={styles.startButtonGloss} />
              <View style={styles.startButtonInner}>
                <View style={styles.startButtonLeft}>
                  <View style={styles.startMicRing}>
                    <View style={styles.startMicCore}>
                      <Ionicons name="mic" size={28} color="#fff" />
                    </View>
                  </View>
                </View>
                <View style={styles.startButtonCenter}>
                  <Text style={styles.startButtonTitle}>会話を始める</Text>
                  <Text style={styles.startButtonSub}>トピック・アバターを自由に選んで話す</Text>
                </View>
                <View style={styles.startButtonArrow}>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

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

  /* Section */
  section: { padding: Spacing.md, gap: Spacing.md, marginTop: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  /* TODAY badge */
  todayBadge: {
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  todayBadgeText: { fontSize: 9, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: 1 },

  /* 今日のトピックカード */
  todayTopicCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'space-between',
  },
  todayTopicBg: {
    position: 'absolute', right: -12, top: -12,
    opacity: 0.15,
  },
  todayTopicBgEmoji: { fontSize: 100 },
  todayTopicContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  todayTopicIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  todayTopicEmoji: { fontSize: 34 },
  todayTopicTexts: { flex: 1, gap: 6 },
  todayTopicLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff', lineHeight: 26 },
  todayTopicHint: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  todayTopicFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  todayTopicChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  todayTopicChipText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.semibold },
  todayTopicStartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  todayTopicStartText: { fontSize: FontSize.sm, color: '#fff', fontWeight: FontWeight.bold },

  /* OR 区切り */
  orDivider: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginTop: Spacing.md,
  },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  orText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },

  /* 会話を始めるボタン */
  startSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.sm, gap: Spacing.sm },
  startButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  startButtonGloss: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  startButtonInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  startButtonLeft: {},
  startMicRing: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  startMicCore: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  startButtonCenter: { flex: 1, gap: 4 },
  startButtonTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: '#fff' },
  startButtonSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)' },
  startButtonArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* クイックスタート */
  quickStartRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickStartEmoji: { fontSize: 18 },
  quickStartText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },

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
