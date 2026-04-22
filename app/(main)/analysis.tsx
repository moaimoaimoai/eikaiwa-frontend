import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  RefreshControl, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { TrendData } from '../../types';
import { PremiumGate } from '../../components/PremiumGate';

const { width } = Dimensions.get('window');

const TOPIC_LABELS: Record<string, string> = {
  free: 'フリー', daily_life: '日常生活', travel: '旅行',
  business: 'ビジネス', culture: '文化', hobby: '趣味',
};

const SUGGESTION_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  grammar:     { icon: 'construct',   color: Colors.grammar },
  vocabulary:  { icon: 'book',        color: Colors.vocabulary },
  review:      { icon: 'refresh',     color: Colors.warning },
  streak:      { icon: 'flame',       color: Colors.secondary },
  encouragement: { icon: 'star',      color: Colors.success },
};

export default function AnalysisScreen() {
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState(14);

  const loadData = async () => {
    try {
      const response = await api.get('/analysis/trends/', { params: { days: period } });
      setData(response.data);
    } catch {}
  };

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [period]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return (
    <PremiumGate
      featureName="傾向分析"
      featureIcon="bar-chart"
      featureDescription="週ごとの学習進捗・ミスの傾向・AIコーチからのアドバイスで弱点を可視化。継続的な改善をサポートします。"
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    </PremiumGate>
  );

  const overview = data?.overview;
  const dailyActivity = data?.daily_activity || [];
  const weeklyProgress = data?.weekly_progress || [];
  const distribution = data?.mistake_distribution || {};
  const suggestions = data?.suggestions || [];
  const topicDist = data?.topic_distribution || [];

  const maxMinutes = Math.max(...dailyActivity.map(d => d.minutes), 1);

  return (
    <PremiumGate
      featureName="傾向分析"
      featureIcon="bar-chart"
      featureDescription="週ごとの学習進捗・ミスの傾向・AIコーチからのアドバイスで弱点を可視化。継続的な改善をサポートします。"
    >
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── グラデーションヘッダー ── */}
      <LinearGradient colors={['#059669', '#4F46E5']} style={styles.header} start={{x:0,y:0}} end={{x:1,y:1}}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="analytics" size={22} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>学習分析</Text>
        </View>
        {/* 期間セレクタ */}
        <View style={styles.periodSelector}>
          {[7, 14, 30].map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}日</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Overview stats ── */}
        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.overviewCard} start={{x:0,y:0}} end={{x:1,y:1}}>
          <View style={styles.overviewGrid}>
            {[
              { label: '総会話',   value: overview?.total_sessions ?? 0,                                                  icon: 'chatbubbles' as const,     color: '#818CF8' },
              { label: '練習時間', value: `${overview?.total_minutes ?? 0}分`,                                            icon: 'time' as const,            color: '#FDBA74' },
              { label: '連続日数', value: `${overview?.streak_days ?? 0}日`,                                              icon: 'flame' as const,           color: '#FB923C' },
              { label: 'マスター', value: `${overview?.mastered_mistakes ?? 0}/${overview?.total_mistakes ?? 0}`,         icon: 'checkmark-circle' as const, color: '#86EFAC' },
            ].map((stat, i) => (
              <View key={i} style={styles.overviewStat}>
                <View style={[styles.overviewIconWrap, { backgroundColor: stat.color + '30' }]}>
                  <Ionicons name={stat.icon} size={18} color={stat.color} />
                </View>
                <Text style={styles.overviewValue}>{stat.value}</Text>
                <Text style={styles.overviewLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── 日別学習チャート ── */}
        <Card style={styles.chartCard} variant="glass">
          <View style={styles.chartTitleRow}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.chartTitle}>日別学習時間（分）</Text>
          </View>
          <View style={styles.barChart}>
            {dailyActivity.slice(-14).map((day, i) => {
              const barH = Math.max((day.minutes / maxMinutes) * 100, day.minutes > 0 ? 8 : 2);
              const date = new Date(day.date);
              const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
              return (
                <View key={i} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <LinearGradient
                      colors={day.minutes > 0 ? [Colors.primary, Colors.gradientEnd] : [Colors.backgroundInput, Colors.backgroundInput]}
                      style={[styles.bar, { height: barH }]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{i % 3 === 0 ? dayLabel : ''}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── 週別進捗 ── */}
        {weeklyProgress.length > 0 && (
          <Card style={styles.chartCard} variant="glass">
            <View style={styles.chartTitleRow}>
              <Ionicons name="trending-up" size={16} color={Colors.success} />
              <Text style={styles.chartTitle}>週別進捗</Text>
            </View>
            <View style={styles.weeklyGrid}>
              {weeklyProgress.map((week, i) => (
                <View key={i} style={styles.weekCard}>
                  <Text style={styles.weekLabel}>{i === weeklyProgress.length - 1 ? '今週' : `${weeklyProgress.length - i}週前`}</Text>
                  <Text style={styles.weekSessions}>{week.sessions}回</Text>
                  <Text style={styles.weekMinutes}>{week.minutes}分</Text>
                  <View style={styles.weekMasteredRow}>
                    <Ionicons name="checkmark-circle" size={10} color={Colors.success} />
                    <Text style={styles.weekMasteredText}>{week.mastered}/{week.mistakes}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ── ミスの種類 ── */}
        {Object.keys(distribution).length > 0 && (
          <Card style={styles.chartCard} variant="glass">
            <View style={styles.chartTitleRow}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.chartTitle}>ミスの種類</Text>
            </View>
            <View style={styles.distributionList}>
              {Object.entries(distribution).map(([type, info]) => (
                <View key={type} style={styles.distributionRow}>
                  <View style={styles.distributionLeft}>
                    <View style={[styles.distributionDot, { backgroundColor: (Colors as any)[type] || Colors.other }]} />
                    <Text style={styles.distributionLabel}>{info.label}</Text>
                  </View>
                  <View style={styles.distributionBarWrapper}>
                    <View style={[styles.distributionBar, {
                      width: `${info.percentage}%`,
                      backgroundColor: (Colors as any)[type] || Colors.other
                    }]} />
                  </View>
                  <Text style={styles.distributionCount}>{info.count}回</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ── 練習トピック ── */}
        {topicDist.length > 0 && (
          <Card style={styles.chartCard} variant="glass">
            <View style={styles.chartTitleRow}>
              <Ionicons name="chatbubbles" size={16} color={Colors.info} />
              <Text style={styles.chartTitle}>練習トピック</Text>
            </View>
            <View style={styles.topicPills}>
              {topicDist.map((t, i) => (
                <View key={i} style={styles.topicPill}>
                  <Text style={styles.topicPillText}>{TOPIC_LABELS[t.topic] || t.topic}</Text>
                  <Text style={styles.topicPillCount}>{t.count}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ── 学習アドバイス ── */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="bulb" size={16} color={Colors.warning} />
              <Text style={styles.chartTitle}>学習アドバイス</Text>
            </View>
            {suggestions.map((s, i) => {
              const si = SUGGESTION_ICONS[s.type] ?? SUGGESTION_ICONS.encouragement;
              return (
                <View key={i} style={[styles.suggestionCard, { borderLeftColor: si.color }]}>
                  <View style={[styles.suggestionIconWrap, { backgroundColor: si.color + '20' }]}>
                    <Ionicons name={si.icon} size={18} color={si.color} />
                  </View>
                  <View style={styles.suggestionBody}>
                    <Text style={styles.suggestionTitle}>{s.title}</Text>
                    <Text style={styles.suggestionText}>{s.body}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Empty state ── */}
        {!overview?.total_sessions && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="leaf" size={40} color={Colors.success} />
            </View>
            <Text style={styles.emptyTitle}>まだデータがありません</Text>
            <Text style={styles.emptyDesc}>会話セッションを始めると、ここに分析データが表示されます</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#fff' },
  periodSelector: { flexDirection: 'row', gap: Spacing.sm },
  periodBtn: { paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  periodBtnActive: { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.5)' },
  periodText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', fontWeight: FontWeight.medium },
  periodTextActive: { color: '#fff', fontWeight: FontWeight.semibold },

  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.md },

  /* Overview */
  overviewCard: { borderRadius: BorderRadius.xl, padding: Spacing.lg },
  overviewGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  overviewStat: { alignItems: 'center', gap: 6 },
  overviewIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  overviewValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff' },
  overviewLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },

  /* Charts */
  chartCard: { gap: Spacing.md },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chartTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barWrapper: { flex: 1, justifyContent: 'flex-end', width: '80%' },
  bar: { width: '100%', borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 9, color: Colors.textMuted },

  /* Weekly */
  weeklyGrid: { flexDirection: 'row', gap: Spacing.sm },
  weekCard: { flex: 1, backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 4 },
  weekLabel: { fontSize: 10, color: Colors.textMuted },
  weekSessions: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  weekMinutes: { fontSize: FontSize.xs, color: Colors.textSecondary },
  weekMasteredRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  weekMasteredText: { fontSize: 10, color: Colors.success },

  /* Distribution */
  distributionList: { gap: Spacing.sm },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  distributionLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 60 },
  distributionDot: { width: 10, height: 10, borderRadius: 5 },
  distributionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  distributionBarWrapper: { flex: 1, height: 8, backgroundColor: Colors.backgroundInput, borderRadius: 4, overflow: 'hidden' },
  distributionBar: { height: '100%', borderRadius: 4 },
  distributionCount: { fontSize: FontSize.xs, color: Colors.textMuted, width: 36, textAlign: 'right' },

  /* Topics */
  topicPills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  topicPill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.full, paddingVertical: 6, paddingHorizontal: Spacing.md },
  topicPillText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  topicPillCount: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },

  /* Suggestions */
  suggestionsSection: { gap: Spacing.sm },
  suggestionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderLeftWidth: 4 },
  suggestionIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  suggestionBody: { flex: 1, gap: 4 },
  suggestionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  suggestionText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  /* Empty */
  emptyState: { alignItems: 'center', gap: Spacing.md, paddingTop: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.success + '20', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyDesc: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
