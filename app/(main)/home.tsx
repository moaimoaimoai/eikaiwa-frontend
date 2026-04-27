import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth';
import { AppBackground } from '../../components/ui/AppBackground';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius,
  TOPICS, getTodayTopic, DailyTopic,
} from '../../constants/theme';

interface StatsData {
  total_conversations: number;
  total_minutes: number;
  mastered_count: number;
  mistake_count: number;
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // パルスアニメーション（CTAボタン）
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse1Opacity = useRef(new Animated.Value(0.5)).current;
  const pulse2Opacity = useRef(new Animated.Value(0.3)).current;

  // フェードイン
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse1, { toValue: 1.45, duration: 1700, useNativeDriver: true }),
          Animated.timing(pulse1Opacity, { toValue: 0, duration: 1700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse1, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulse1Opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(850),
        Animated.parallel([
          Animated.timing(pulse2, { toValue: 1.45, duration: 1700, useNativeDriver: true }),
          Animated.timing(pulse2Opacity, { toValue: 0, duration: 1700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse2, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulse2Opacity, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop1.start();
    loop2.start();
    return () => { loop1.stop(); loop2.stop(); };
  }, []);

  const todayTopic: DailyTopic = getTodayTopic();

  const loadStats = async () => {
    try {
      const data = await authService.getStats();
      setStats(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning ☀️';
    if (h < 18) return 'Good Afternoon 🌤';
    return 'Good Evening 🌙';
  };

  const levelLabel = user?.level === 'beginner' ? 'Beginner'
    : user?.level === 'intermediate' ? 'Intermediate' : 'Advanced';
  const levelEmoji = user?.level === 'beginner' ? '🌱'
    : user?.level === 'intermediate' ? '🌿' : '🌳';
  const streakDays = user?.streak_days ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── 全画面背景 ── */}
      <AppBackground variant="default" withPhoto />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryLight} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════
            ヘッダー — カードなし・ダイレクト
        ══════════════════════════════════ */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* トップ行: 挨拶 + アバターボタン */}
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.userName}>
                {user?.display_name || user?.username || 'ユーザー'}
                <Text style={styles.userNameSuffix}>さん</Text>
              </Text>
              <View style={styles.levelPill}>
                <Text style={styles.levelEmoji}>{levelEmoji}</Text>
                <Text style={styles.levelText}>{levelLabel}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => router.push('/(main)/settings')}
              accessibilityLabel="設定を開く"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={['rgba(124,58,237,0.55)', 'rgba(91,33,182,0.35)']}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person" size={20} color="rgba(255,255,255,0.92)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ストリーク（カードなし） */}
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <View style={styles.streakFlameWrap}>
                <Ionicons name="flame" size={20} color="#FB923C" />
              </View>
              <View>
                <Text style={styles.streakDays}>{streakDays}日連続</Text>
                <Text style={styles.streakSub}>
                  {streakDays > 0 ? '継続は力なり ✨' : '今日から始めよう！'}
                </Text>
              </View>
            </View>
            <View style={styles.streakDots}>
              {[...Array(7)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < (streakDays % 7 || (streakDays > 0 ? 7 : 0))
                      ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ══════════════════════════════════
            Stats カード (3列)
        ══════════════════════════════════ */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          {[
            {
              label: '会話回数',
              value: stats?.total_conversations ?? user?.total_conversations ?? 0,
              icon: 'chatbubbles' as const,
              color: '#A78BFA',
              glow: ['rgba(167,139,250,0.18)', 'rgba(167,139,250,0.04)'] as const,
            },
            {
              label: '練習時間',
              value: stats?.total_minutes ?? user?.total_minutes ?? 0,
              icon: 'time' as const,
              color: '#38BDF8',
              glow: ['rgba(56,189,248,0.18)', 'rgba(56,189,248,0.04)'] as const,
              unit: '分',
            },
            {
              label: '修正済み',
              value: stats?.mastered_count ?? 0,
              icon: 'checkmark-circle' as const,
              color: '#34D399',
              glow: ['rgba(52,211,153,0.18)', 'rgba(52,211,153,0.04)'] as const,
              unit: '語',
            },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <LinearGradient colors={s.glow} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={[styles.statIconWrap, { backgroundColor: s.color + '22' }]}>
                <Ionicons name={s.icon} size={16} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              <View style={[styles.statBar, { backgroundColor: s.color }]} />
            </View>
          ))}
        </Animated.View>

        {/* ══════════════════════════════════
            会話を始める — メイン CTA
        ══════════════════════════════════ */}
        <View style={styles.startSection}>
          <TouchableOpacity
            onPress={() => router.push('/(main)/conversation')}
            activeOpacity={0.87}
            accessibilityLabel="会話を始める"
            accessibilityRole="button"
          >
            <View style={styles.startShadow}>
              <LinearGradient
                colors={['#6D28D9', '#7C3AED', '#5B21B6']}
                style={styles.startButton}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                {/* トップグロス */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
                  style={styles.startGloss}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                />
                <View style={styles.startInner}>
                  {/* パルスリング + マイク */}
                  <View style={styles.micContainer}>
                    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse2 }], opacity: pulse2Opacity }]} />
                    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse1 }], opacity: pulse1Opacity }]} />
                    <View style={styles.micCircle}>
                      <Ionicons name="mic" size={28} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.startText}>
                    <Text style={styles.startTitle}>会話を始める</Text>
                    <Text style={styles.startSub}>アバター・トピックを選んで話す</Text>
                  </View>
                  <View style={styles.startArrow}>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
                  </View>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════
            今日のおすすめトピック
        ══════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.todayBadge}>
              <Ionicons name="sparkles" size={9} color="#fff" />
              <Text style={styles.todayBadgeText}>TODAY</Text>
            </View>
            <Text style={styles.sectionTitle}>今日のおすすめ</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.87}
            onPress={() => router.push({
              pathname: '/(main)/conversation',
              params: { topic: todayTopic.parentTopic, dailyTopic: todayTopic.id },
            })}
            accessibilityLabel={`今日のトピック: ${todayTopic.label}で話す`}
            accessibilityRole="button"
          >
            <View style={[styles.todayCardWrap, { shadowColor: todayTopic.color }]}>
              <LinearGradient
                colors={[todayTopic.color, todayTopic.color + 'BB']}
                style={styles.todayCard}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
                  style={styles.todayGloss}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                />
                <Text style={styles.todayBgEmoji}>{todayTopic.icon}</Text>

                <View style={styles.todayCardTop}>
                  <View style={styles.todayIconBox}>
                    <Text style={{ fontSize: 34 }}>{todayTopic.icon}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.todayLabel}>{todayTopic.label}</Text>
                    <Text style={styles.todayHint}>{todayTopic.hint}</Text>
                  </View>
                </View>

                <View style={styles.todayCardBottom}>
                  <View style={styles.todayChip}>
                    <Ionicons name="radio" size={10} color="#fff" />
                    <Text style={styles.todayChipText}>デイリーピック</Text>
                  </View>
                  <View style={styles.todayStartBtn}>
                    <Text style={styles.todayStartText}>このトピックで話す</Text>
                    <Ionicons name="arrow-forward" size={13} color="#fff" />
                  </View>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════
            OR 区切り
        ══════════════════════════════════ */}
        <View style={styles.orDivider}>
          <View style={styles.orLine} />
          <View style={styles.orBadge}>
            <Text style={styles.orText}>または</Text>
          </View>
          <View style={styles.orLine} />
        </View>

        {/* ══════════════════════════════════
            トピックグリッド
        ══════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(124,58,237,0.22)' }]}>
              <Ionicons name="apps" size={14} color={Colors.primaryLight} />
            </View>
            <Text style={styles.sectionTitle}>トピックを選んで練習</Text>
          </View>
          <View style={styles.topicsGrid}>
            {TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.topicCard}
                onPress={() => router.push({ pathname: '/(main)/conversation', params: { topic: topic.id } })}
                activeOpacity={0.78}
              >
                <LinearGradient
                  colors={[topic.color + '22', topic.color + '08']}
                  style={styles.topicGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.topicIconWrap, { backgroundColor: topic.color + '2E' }]}>
                    <Text style={{ fontSize: 26 }}>{topic.icon}</Text>
                  </View>
                  <Text style={styles.topicLabel}>{topic.label}</Text>
                </LinearGradient>
                <View style={[styles.topicAccent, { backgroundColor: topic.color }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════
            学習メニュー
        ══════════════════════════════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(56,189,248,0.22)' }]}>
              <Ionicons name="grid" size={14} color="#38BDF8" />
            </View>
            <Text style={styles.sectionTitle}>学習メニュー</Text>
          </View>
          <View style={styles.menuList}>
            {[
              { title: 'ウォームアップ', desc: '今日のフレーズ10選', icon: 'book' as const,      color: '#38BDF8', glow: ['rgba(56,189,248,0.14)','rgba(56,189,248,0.04)'] as const, route: '/(main)/warmup'      },
              { title: '単語クイズ',     desc: 'ミスを復習しよう',   icon: 'library' as const,   color: '#F59E0B', glow: ['rgba(245,158,11,0.14)','rgba(245,158,11,0.04)'] as const, route: '/(main)/vocabulary'  },
              { title: '傾向分析',       desc: '弱点を把握しよう',   icon: 'bar-chart' as const,  color: '#34D399', glow: ['rgba(52,211,153,0.14)','rgba(52,211,153,0.04)'] as const, route: '/(main)/analysis'    },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.78}
              >
                <LinearGradient colors={item.glow} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <View style={[styles.menuAccentBar, { backgroundColor: item.color }]} />
                <View style={[styles.menuIconWrap, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.menuTextBlock}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDesc}>{item.desc}</Text>
                </View>
                <View style={[styles.menuChevron, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name="chevron-forward" size={15} color={item.color + 'CC'} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════
            ミス復習バナー
        ══════════════════════════════════ */}
        {stats && stats.mistake_count > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(main)/vocabulary')}
            activeOpacity={0.87}
            style={styles.mistakesWrap}
            accessibilityLabel={`${Math.max(0, stats.mistake_count - stats.mastered_count)}個のミスを復習する`}
            accessibilityRole="button"
          >
            <View style={styles.mistakesCard}>
              <LinearGradient
                colors={['rgba(245,158,11,0.14)', 'rgba(245,158,11,0.04)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <View style={styles.mistakesAccentBar} />
              <View style={styles.mistakesIconWrap}>
                <Ionicons name="warning" size={20} color={Colors.warning} />
              </View>
              <View style={styles.mistakesTextBlock}>
                <Text style={styles.mistakesTitle}>
                  {Math.max(0, stats.mistake_count - stats.mastered_count)}個のミスを復習しよう
                </Text>
                <Text style={styles.mistakesDesc}>単語帳でクイズに挑戦！</Text>
              </View>
              <View style={styles.mistakesBadge}>
                <Text style={styles.mistakesBadgeNum}>{stats.mastered_count}</Text>
                <View style={styles.mistakesBadgeDivider} />
                <Text style={styles.mistakesBadgeTotal}>{stats.mistake_count}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 140 },

  /* ── ヘッダー (カードなし・ダイレクト) ── */
  header: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.lg,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { gap: 6, flex: 1, paddingRight: 12 },
  greeting: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.52)',
    fontWeight: FontWeight.bold,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  userName: {
    fontSize: 38,
    fontWeight: FontWeight.extrabold,
    color: '#fff',
    letterSpacing: -1.4,
    lineHeight: 44,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  userNameSuffix: {
    fontSize: 24,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.68)',
  },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,58,237,0.28)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)',
  },
  levelEmoji: { fontSize: 12 },
  levelText: {
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  avatarButton: {
    width: 50, height: 50, borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(167,139,250,0.55)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* ストリーク (カードなし：仕切り線のみ) */
  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.09)',
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  streakFlameWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(251,146,60,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  streakDays: { fontSize: FontSize.md, color: '#fff', fontWeight: FontWeight.bold, letterSpacing: -0.3 },
  streakSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  streakDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotActive: { backgroundColor: '#FB923C' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.13)' },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginTop: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: 18, paddingHorizontal: 8,
    alignItems: 'center', gap: 7,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,8,28,0.68)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    position: 'relative',
  },
  statIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.8,
  },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  statBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2, opacity: 0.65,
  },

  /* ── CTA ── */
  startSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  startShadow: {
    borderRadius: BorderRadius.xl,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 26,
    elevation: 18,
  },
  startButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.32)',
  },
  startGloss: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  startInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 24, paddingHorizontal: 22, gap: 18,
  },
  micContainer: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  micCircle: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  startText: { flex: 1, gap: 5 },
  startTitle: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold,
    color: '#fff', letterSpacing: -0.6,
  },
  startSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', lineHeight: 18 },
  startArrow: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* ── Section ── */
  section: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, letterSpacing: -0.2,
  },
  todayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 7,
    paddingHorizontal: 9, paddingVertical: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 4,
  },
  todayBadgeText: { fontSize: 9, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: 1.4 },

  /* 今日のトピックカード */
  todayCardWrap: {
    borderRadius: BorderRadius.xl,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 12,
  },
  todayCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
    minHeight: 155,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  todayGloss: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  todayBgEmoji: {
    position: 'absolute', right: -8, top: -8,
    fontSize: 115, opacity: 0.11,
  },
  todayCardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  todayIconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  todayLabel: {
    fontSize: FontSize.xl, fontWeight: FontWeight.extrabold,
    color: '#fff', letterSpacing: -0.4, lineHeight: 26,
  },
  todayHint: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.78)', lineHeight: 18 },
  todayCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  todayChipText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.semibold },
  todayStartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  todayStartText: { fontSize: FontSize.sm, color: '#fff', fontWeight: FontWeight.bold },

  /* OR 区切り */
  orDivider: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginTop: Spacing.lg, gap: Spacing.md,
  },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  orBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  orText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },

  /* トピックグリッド */
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  topicCard: {
    width: '30.8%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    position: 'relative',
  },
  topicGradient: { alignItems: 'center', gap: 8, paddingVertical: 18, paddingHorizontal: 4 },
  topicIconWrap: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  topicLabel: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    fontWeight: FontWeight.semibold, textAlign: 'center',
  },
  topicAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.65 },

  /* 学習メニュー */
  menuList: { gap: 10 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 17,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  menuAccentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  menuIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 7,
  },
  menuTextBlock: { flex: 1 },
  menuTitle: {
    fontSize: FontSize.md, fontWeight: FontWeight.semibold,
    color: Colors.textPrimary, letterSpacing: -0.2,
  },
  menuDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  menuChevron: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  /* ミス復習バナー */
  mistakesWrap: { marginHorizontal: Spacing.md, marginTop: Spacing.md },
  mistakesCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 17,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.28)',
    overflow: 'hidden',
    position: 'relative',
  },
  mistakesAccentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    backgroundColor: Colors.warning,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  mistakesIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 7,
  },
  mistakesTextBlock: { flex: 1 },
  mistakesTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  mistakesDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  mistakesBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.16)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.32)',
  },
  mistakesBadgeNum: { fontSize: FontSize.sm, color: Colors.warning, fontWeight: FontWeight.extrabold },
  mistakesBadgeDivider: { width: 1, height: 12, backgroundColor: 'rgba(245,158,11,0.38)' },
  mistakesBadgeTotal: { fontSize: FontSize.sm, color: 'rgba(245,158,11,0.68)', fontWeight: FontWeight.semibold },
});
