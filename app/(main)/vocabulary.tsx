import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mistakesService } from '../../services/mistakes';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Mistake, QuizQuestion } from '../../types';

type Tab = 'list' | 'quiz';

const MISTAKE_TYPE_INFO: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  grammar:      { label: '文法',   color: Colors.grammar,      icon: 'construct' },
  vocabulary:   { label: '語彙',   color: Colors.vocabulary,   icon: 'book' },
  pronunciation:{ label: '発音',   color: Colors.pronunciation, icon: 'volume-high' },
  spelling:     { label: 'スペル', color: Colors.spelling,      icon: 'pencil' },
  other:        { label: 'その他', color: Colors.other,         icon: 'ellipsis-horizontal-circle' },
};

export default function VocabularyScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [showMastered, setShowMastered] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [m, s] = await Promise.all([
        mistakesService.getMistakes(),
        mistakesService.getSummary(),
      ]);
      setMistakes(m);
      setSummary(s);
    } catch {}
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadQuiz = async () => {
    setQuizLoading(true);
    try {
      const type = filter !== 'all' ? filter : undefined;
      const qs = await mistakesService.getMistakesQuiz(5, type);
      if (!qs?.length) {
        Alert.alert('クイズがありません', 'まず会話セッションでミスを集めましょう！');
        return;
      }
      setQuestions(qs);
      setQuizIndex(0);
      setScore(0);
      setQuizDone(false);
      setSelectedAnswer(null);
    } catch {}
    setQuizLoading(false);
  };

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer) return;
    const q = questions[quizIndex];
    const isCorrect = answer === q.correct_answer;
    setSelectedAnswer(answer);
    if (isCorrect) setScore(s => s + 1);
    await mistakesService.submitQuizAnswer(q.id, isCorrect).catch(() => {});
    setTimeout(() => {
      if (quizIndex < questions.length - 1) {
        setQuizIndex(i => i + 1);
        setSelectedAnswer(null);
      } else {
        setQuizDone(true);
        loadData();
      }
    }, 1200);
  };

  const toggleMastered = async (id: number) => {
    try {
      const result = await mistakesService.markMastered(id);
      setMistakes(prev => prev.map(m => m.id === id ? { ...m, is_mastered: result.is_mastered } : m));
    } catch {}
  };

  const filteredMistakes = mistakes.filter(m => {
    if (!showMastered && m.is_mastered) return false;
    if (filter !== 'all' && m.mistake_type !== filter) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── グラデーションヘッダー ── */}
      <LinearGradient colors={['#D97706', '#7C3AED']} style={styles.header} start={{x:0,y:0}} end={{x:1,y:1}}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="library" size={22} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>単語帳</Text>
        </View>
        <View style={styles.tabs}>
          {([
            { id: 'list', label: 'ミス一覧', icon: 'list' },
            { id: 'quiz', label: 'クイズ',   icon: 'help-circle' },
          ] as const).map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => { setActiveTab(tab.id); if (tab.id === 'quiz') loadQuiz(); }}
            >
              <Ionicons name={tab.icon} size={15} color={activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 80 }} />
      ) : activeTab === 'list' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Summary stats */}
          {summary && (
            <View style={styles.summaryCards}>
              {[
                { value: summary.total,                    label: '合計',      icon: 'albums' as const,         color: Colors.primary },
                { value: summary.mastered,                 label: 'マスター済', icon: 'checkmark-circle' as const, color: Colors.success },
                { value: summary.total - summary.mastered, label: '練習中',    icon: 'refresh-circle' as const,  color: Colors.warning },
              ].map((s, i) => (
                <Card key={i} style={styles.summaryCard} variant="glass">
                  <View style={[styles.summaryIconWrap, { backgroundColor: s.color + '20' }]}>
                    <Ionicons name={s.icon} size={18} color={s.color} />
                  </View>
                  <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </Card>
              ))}
            </View>
          )}

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <View style={styles.filters}>
              <TouchableOpacity
                style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
                onPress={() => setFilter('all')}
              >
                <Ionicons name="apps" size={12} color={filter === 'all' ? Colors.primary : Colors.textMuted} />
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>すべて</Text>
              </TouchableOpacity>
              {Object.entries(MISTAKE_TYPE_INFO).map(([key, info]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterChip, filter === key && styles.filterChipActive]}
                  onPress={() => setFilter(key)}
                >
                  <Ionicons name={info.icon} size={12} color={filter === key ? Colors.primary : Colors.textMuted} />
                  <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{info.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.filterChip, showMastered && styles.filterChipSuccess]}
                onPress={() => setShowMastered(!showMastered)}
              >
                <Ionicons name="checkmark-circle" size={12} color={showMastered ? Colors.success : Colors.textMuted} />
                <Text style={[styles.filterText, showMastered && styles.filterTextSuccess]}>マスター済み</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {filteredMistakes.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="book-outline" size={40} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>ミスがありません</Text>
              <Text style={styles.emptyDesc}>会話セッションを始めると、ミスが自動的に記録されます</Text>
            </View>
          ) : (
            filteredMistakes.map(mistake => {
              const typeInfo = MISTAKE_TYPE_INFO[mistake.mistake_type] || MISTAKE_TYPE_INFO.other;
              const isExpanded = expandedId === mistake.id;
              return (
                <TouchableOpacity
                  key={mistake.id}
                  style={[styles.mistakeCard, mistake.is_mastered && styles.mistakeCardMastered]}
                  onPress={() => setExpandedId(isExpanded ? null : mistake.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.mistakeHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
                      <Ionicons name={typeInfo.icon} size={13} color={typeInfo.color} />
                      <Text style={[styles.typeLabel, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                    </View>
                    <View style={styles.mistakeActions}>
                      {mistake.quiz_count > 0 && (
                        <Text style={styles.accuracyText}>{mistake.accuracy_rate}%</Text>
                      )}
                      <TouchableOpacity onPress={() => toggleMastered(mistake.id)} style={styles.masterBtn}>
                        <Ionicons
                          name={mistake.is_mastered ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={22}
                          color={mistake.is_mastered ? Colors.success : Colors.textMuted}
                        />
                      </TouchableOpacity>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                    </View>
                  </View>

                  <View style={styles.mistakeTexts}>
                    <View style={styles.mistakeRow}>
                      <View style={styles.mistakeIconBadge}>
                        <Ionicons name="close" size={12} color={Colors.error} />
                      </View>
                      <Text style={styles.originalText}>{mistake.original_text}</Text>
                    </View>
                    <View style={styles.mistakeRow}>
                      <View style={[styles.mistakeIconBadge, { backgroundColor: Colors.success + '20' }]}>
                        <Ionicons name="checkmark" size={12} color={Colors.success} />
                      </View>
                      <Text style={styles.correctedText}>{mistake.corrected_text}</Text>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {mistake.explanation && (
                        <View style={styles.explanationRow}>
                          <Ionicons name="bulb" size={14} color={Colors.warning} />
                          <Text style={styles.explanationText}>{mistake.explanation}</Text>
                        </View>
                      )}
                      {mistake.context && (
                        <Text style={styles.contextText}>
                          <Text style={styles.contextLabel}>文脈: </Text>
                          {mistake.context}
                        </Text>
                      )}
                      <Text style={styles.statsText}>
                        クイズ {mistake.quiz_count}回 / 正解 {mistake.correct_count}回
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {quizLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 80 }} />
          ) : questions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="help-circle-outline" size={40} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>クイズがありません</Text>
              <Text style={styles.emptyDesc}>まず会話でミスを集めてから挑戦しましょう！</Text>
            </View>
          ) : quizDone ? (
            <View style={styles.quizResult}>
              <View style={[styles.resultIconWrap, {
                backgroundColor: score / questions.length >= 0.8 ? Colors.gold + '20' : Colors.warning + '20'
              }]}>
                <Ionicons
                  name={score / questions.length >= 0.8 ? 'trophy' : score / questions.length >= 0.6 ? 'happy' : 'fitness'}
                  size={48}
                  color={score / questions.length >= 0.8 ? Colors.gold : Colors.warning}
                />
              </View>
              <Text style={styles.quizResultTitle}>クイズ完了！</Text>
              <Text style={styles.quizResultScore}>{score} / {questions.length} 正解</Text>
              <Text style={[styles.quizResultPercent, { color: score / questions.length >= 0.8 ? Colors.success : Colors.warning }]}>
                {Math.round(score / questions.length * 100)}%
              </Text>
              <Button title="もう一度" onPress={loadQuiz} style={{ width: 200 }} />
            </View>
          ) : (
            <View style={styles.quizContainer}>
              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#D97706', '#7C3AED']}
                    style={[styles.progressFill, { width: `${((quizIndex + 1) / questions.length) * 100}%` }]}
                    start={{x:0,y:0}} end={{x:1,y:0}}
                  />
                </View>
                <Text style={styles.progressText}>問題 {quizIndex + 1}/{questions.length}　スコア: {score}</Text>
              </View>

              <Card style={styles.questionCard} variant="glass">
                <View style={styles.questionLabelRow}>
                  <Ionicons name="create-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.questionLabel}>次の英文を正しく直すと？</Text>
                </View>
                <Text style={styles.questionText}>{questions[quizIndex]?.question}</Text>
                {questions[quizIndex]?.context && (
                  <Text style={styles.questionContext}>「{questions[quizIndex].context}」より</Text>
                )}
              </Card>

              <View style={styles.options}>
                {questions[quizIndex]?.options.map((opt: string, i: number) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrect = opt === questions[quizIndex].correct_answer;
                  let bgColor = Colors.backgroundCard;
                  let borderColor = Colors.border;
                  if (selectedAnswer) {
                    if (isCorrect) { bgColor = Colors.success + '20'; borderColor = Colors.success; }
                    else if (isSelected) { bgColor = Colors.error + '20'; borderColor = Colors.error; }
                  }
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
                      onPress={() => handleAnswer(opt)}
                      disabled={!!selectedAnswer}
                      activeOpacity={0.8}
                    >
                      <View style={styles.optionLabelWrap}>
                        <Text style={styles.optionLabelText}>{['A', 'B', 'C', 'D'][i]}</Text>
                      </View>
                      <Text style={styles.optionText}>{opt}</Text>
                      {selectedAnswer && isCorrect && <Ionicons name="checkmark-circle" size={20} color={Colors.success} />}
                      {selectedAnswer && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color={Colors.error} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedAnswer && questions[quizIndex]?.explanation && (
                <Card style={styles.explanationCard}>
                  <View style={styles.explanationRow}>
                    <Ionicons name="bulb" size={16} color={Colors.warning} />
                    <Text style={styles.explanationCardText}>{questions[quizIndex].explanation}</Text>
                  </View>
                </Card>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#fff' },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: BorderRadius.lg, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', fontWeight: FontWeight.medium },
  tabTextActive: { color: '#fff', fontWeight: FontWeight.semibold },

  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.sm },

  /* Summary */
  summaryCards: { flexDirection: 'row', gap: Spacing.sm },
  summaryCard: { flex: 1, alignItems: 'center', gap: 4 },
  summaryIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  /* Filters */
  filtersScroll: { marginBottom: 4 },
  filters: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  filterChipSuccess: { backgroundColor: Colors.success + '20', borderColor: Colors.success },
  filterText: { fontSize: FontSize.xs, color: Colors.textMuted },
  filterTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  filterTextSuccess: { color: Colors.success, fontWeight: FontWeight.semibold },

  /* Empty */
  emptyState: { alignItems: 'center', gap: Spacing.md, paddingTop: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyDesc: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  /* Mistake cards */
  mistakeCard: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  mistakeCardMastered: { opacity: 0.55 },
  mistakeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  typeLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  mistakeActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  accuracyText: { fontSize: FontSize.xs, color: Colors.textMuted },
  masterBtn: { padding: 4 },
  mistakeTexts: { gap: 6 },
  mistakeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  mistakeIconBadge: { width: 20, height: 20, borderRadius: 6, backgroundColor: Colors.error + '20', alignItems: 'center', justifyContent: 'center' },
  originalText: { flex: 1, fontSize: FontSize.sm, color: Colors.error, textDecorationLine: 'line-through' },
  correctedText: { flex: 1, fontSize: FontSize.sm, color: Colors.success, fontWeight: FontWeight.semibold },
  expandedContent: { gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  explanationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  explanationText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  contextText: { fontSize: FontSize.sm, color: Colors.textMuted },
  contextLabel: { fontWeight: FontWeight.medium },
  statsText: { fontSize: FontSize.xs, color: Colors.textMuted },

  /* Quiz */
  quizContainer: { gap: Spacing.md },
  progressRow: { gap: Spacing.xs },
  progressBar: { height: 6, backgroundColor: Colors.backgroundCard, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  questionCard: {},
  questionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  questionLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  questionText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 28 },
  questionContext: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  options: { gap: Spacing.sm },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1.5 },
  optionLabelWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.backgroundInput, alignItems: 'center', justifyContent: 'center' },
  optionLabelText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  optionText: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  explanationCard: { marginTop: Spacing.sm },
  explanationCardText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  quizResult: { alignItems: 'center', gap: Spacing.md, paddingTop: 60 },
  resultIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  quizResultTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  quizResultScore: { fontSize: FontSize.xl, color: Colors.textSecondary },
  quizResultPercent: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold },
});
