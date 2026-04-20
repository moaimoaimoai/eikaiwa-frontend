import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { phrasesService } from '../../services/phrases';
import { conversationService } from '../../services/conversation';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Phrase, QuizQuestion } from '../../types';

const { width } = Dimensions.get('window');

type Tab = 'phrases' | 'words' | 'quiz';

const TAB_CONFIG: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'phrases', label: 'フレーズ', icon: 'chatbubble-ellipses' },
  { id: 'words',   label: '単語',     icon: 'text' },
  { id: 'quiz',    label: 'クイズ',   icon: 'help-circle' },
];

export default function WarmupScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('phrases');
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showJapanese, setShowJapanese] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizType, setQuizType] = useState<'phrases' | 'words'>('phrases');
  /** フレーズの表示方向: en→ja（英語を見て日本語を当てる）or ja→en（日本語を見て英語を当てる） */
  const [flipMode, setFlipMode] = useState<'en-ja' | 'ja-en'>('en-ja');

  useEffect(() => {
    loadPhrases();
    return () => { sound?.unloadAsync(); };
  }, []);

  const loadPhrases = async () => {
    try {
      setLoading(true);
      const data = await phrasesService.getWarmupPhrases();
      setPhrases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadQuiz = async (type: 'phrases' | 'words') => {
    setLoading(true);
    try {
      const questions = type === 'phrases'
        ? await phrasesService.getPhrasesQuiz()
        : await phrasesService.getWordsQuiz();
      setQuizQuestions(questions);
      setQuizIndex(0);
      setQuizScore(0);
      setQuizDone(false);
      setSelectedAnswer(null);
      setQuizType(type);
    } catch {}
    setLoading(false);
  };

  const speakPhrase = async (phrase: Phrase) => {
    if (speakingId === phrase.id) return;
    setSpeakingId(phrase.id);
    try {
      if (sound) { await sound.unloadAsync(); }
      const audioBase64 = await conversationService.synthesizeSpeech(phrase.english);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audioBase64}` },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setSpeakingId(null);
      });
    } catch { setSpeakingId(null); }
  };

  const nextPhrase = () => {
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowJapanese(false);
      phrasesService.markPhrasePracticed(phrases[currentIndex].id).catch(() => {});
    }
  };

  const prevPhrase = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowJapanese(false);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    const correct = quizQuestions[quizIndex]?.correct_answer === answer;
    if (correct) setQuizScore(s => s + 1);
    setTimeout(() => {
      if (quizIndex < quizQuestions.length - 1) {
        setQuizIndex(i => i + 1);
        setSelectedAnswer(null);
      } else {
        setQuizDone(true);
      }
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── グラデーションヘッダー ── */}
      <LinearGradient colors={['#0891B2', '#4F46E5']} style={styles.header} start={{x:0,y:0}} end={{x:1,y:1}}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="book" size={22} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>学習</Text>
        </View>
        {/* タブ */}
        <View style={styles.tabs}>
          {TAB_CONFIG.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id === 'quiz') loadQuiz('phrases');
              }}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 80 }} />
        ) : activeTab === 'phrases' ? (
          <PhrasesTab
            phrases={phrases}
            currentIndex={currentIndex}
            showJapanese={showJapanese}
            speakingId={speakingId}
            flipMode={flipMode}
            onFlipMode={() => {
              setFlipMode(m => m === 'en-ja' ? 'ja-en' : 'en-ja');
              setShowJapanese(false);
            }}
            onToggleJapanese={() => setShowJapanese(!showJapanese)}
            onSpeak={speakPhrase}
            onNext={nextPhrase}
            onPrev={prevPhrase}
          />
        ) : activeTab === 'words' ? (
          <AllPhrasesTab phrases={phrases} onSpeak={speakPhrase} speakingId={speakingId} />
        ) : (
          <QuizTab
            questions={quizQuestions}
            currentIndex={quizIndex}
            selectedAnswer={selectedAnswer}
            score={quizScore}
            isDone={quizDone}
            onAnswer={handleQuizAnswer}
            onRestart={() => loadQuiz(quizType)}
            onSwitchType={(t: 'phrases' | 'words') => loadQuiz(t)}
            quizType={quizType}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PhrasesTab({ phrases, currentIndex, showJapanese, speakingId, flipMode, onFlipMode, onToggleJapanese, onSpeak, onNext, onPrev }: any) {
  const current = phrases[currentIndex];
  const isJaFirst = flipMode === 'ja-en';

  if (!current) return (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={56} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>フレーズを読み込み中...</Text>
    </View>
  );

  // メインテキスト（常に表示）とサブテキスト（タップで表示）の切り替え
  const mainText     = isJaFirst ? current.japanese : current.english;
  const subText      = isJaFirst ? current.english  : current.japanese;
  const revealLabel  = isJaFirst ? 'タップして英語を表示' : 'タップして日本語を表示';

  return (
    <View style={styles.phraseTab}>
      {/* モード切替ボタン */}
      <View style={styles.flipRow}>
        <TouchableOpacity
          style={[styles.flipChip, !isJaFirst && styles.flipChipActive]}
          onPress={() => isJaFirst && onFlipMode()}
        >
          <Text style={[styles.flipChipText, !isJaFirst && styles.flipChipTextActive]}>英→日</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.flipChip, isJaFirst && styles.flipChipActive]}
          onPress={() => !isJaFirst && onFlipMode()}
        >
          <Text style={[styles.flipChipText, isJaFirst && styles.flipChipTextActive]}>日→英</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#0891B2', '#4F46E5']}
            style={[styles.progressFill, { width: `${((currentIndex + 1) / phrases.length) * 100}%` }]}
            start={{x:0,y:0}} end={{x:1,y:0}}
          />
        </View>
        <Text style={styles.progressText}>{currentIndex + 1} / {phrases.length}</Text>
      </View>

      {/* カード */}
      <LinearGradient colors={['#1E293B', '#2D3748']} style={styles.phraseCard} start={{x:0,y:0}} end={{x:1,y:1}}>
        <View style={styles.phraseCardBadge}>
          <Ionicons name="pricetag" size={12} color={Colors.primaryLight} />
          <Text style={styles.phraseCardBadgeText}>{current.category_name}</Text>
        </View>

        {/* メインテキスト（常に表示） */}
        <Text style={isJaFirst ? styles.phraseJaMain : styles.phraseEnglish}>{mainText}</Text>

        {/* 発音ヒント（英語が主表示のときのみ） */}
        {!isJaFirst && current.pronunciation_hint && (
          <View style={styles.hintRow}>
            <Ionicons name="volume-medium" size={14} color={Colors.textSecondary} />
            <Text style={styles.pronunciationHint}>{current.pronunciation_hint}</Text>
          </View>
        )}

        {/* サブテキスト（タップで表示） */}
        <TouchableOpacity onPress={onToggleJapanese} style={styles.translateButton} activeOpacity={0.8}>
          {showJapanese ? (
            <Text style={isJaFirst ? styles.phraseEnglish : styles.phraseJapanese}>{subText}</Text>
          ) : (
            <View style={styles.translateHintRow}>
              <Ionicons name="eye-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.translateHint}>{revealLabel}</Text>
            </View>
          )}
        </TouchableOpacity>

        {current.example_context && (
          <View style={styles.exampleRow}>
            <Ionicons name="bulb" size={14} color={Colors.warning} />
            <Text style={styles.exampleContext}>{current.example_context}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.speakButton, speakingId === current.id && styles.speakButtonActive]}
          onPress={() => onSpeak(current)}
          activeOpacity={0.85}
        >
          <Ionicons name={speakingId === current.id ? 'volume-high' : 'volume-medium-outline'} size={22} color="#fff" />
          <Text style={styles.speakButtonText}>
            {speakingId === current.id ? '再生中...' : '発音を聞く'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.navButtons}>
        <Button title="← 前へ" onPress={onPrev} variant="outline" disabled={currentIndex === 0} style={styles.navBtn} />
        <Button title="次へ →" onPress={onNext} disabled={currentIndex === phrases.length - 1} style={styles.navBtn} />
      </View>
    </View>
  );
}

function AllPhrasesTab({ phrases, onSpeak, speakingId }: any) {
  return (
    <View style={styles.allPhrasesTab}>
      {phrases.map((phrase: Phrase) => (
        <Card key={phrase.id} style={styles.phraseListCard}>
          <View style={styles.phraseListRow}>
            <View style={styles.phraseListText}>
              <Text style={styles.phraseListEnglish}>{phrase.english}</Text>
              <Text style={styles.phraseListJapanese}>{phrase.japanese}</Text>
              {phrase.pronunciation_hint && (
                <View style={styles.hintRow}>
                  <Ionicons name="volume-medium" size={12} color={Colors.textMuted} />
                  <Text style={styles.phraseListHint}>{phrase.pronunciation_hint}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => onSpeak(phrase)} style={styles.listSpeakBtn}>
              <Ionicons
                name={speakingId === phrase.id ? 'volume-high' : 'volume-medium-outline'}
                size={22}
                color={speakingId === phrase.id ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </View>
  );
}

function QuizTab({ questions, currentIndex, selectedAnswer, score, isDone, onAnswer, onRestart, onSwitchType, quizType }: any) {
  if (!questions?.length) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="help-circle" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>クイズを準備中...</Text>
        <View style={styles.quizTypeSwitch}>
          <Button title="フレーズクイズ" onPress={() => onSwitchType('phrases')} variant={quizType === 'phrases' ? 'primary' : 'outline'} size="sm" />
          <Button title="単語クイズ" onPress={() => onSwitchType('words')} variant={quizType === 'words' ? 'primary' : 'outline'} size="sm" />
        </View>
      </View>
    );
  }

  if (isDone) {
    const percentage = Math.round((score / questions.length) * 100);
    const resultIcon = percentage >= 80 ? 'trophy' : percentage >= 60 ? 'happy' : 'fitness';
    const resultColor = percentage >= 80 ? Colors.gold : percentage >= 60 ? Colors.success : Colors.secondary;
    return (
      <View style={styles.quizResult}>
        <View style={[styles.resultIconWrap, { backgroundColor: resultColor + '20' }]}>
          <Ionicons name={resultIcon as any} size={48} color={resultColor} />
        </View>
        <Text style={styles.quizResultTitle}>クイズ完了！</Text>
        <Text style={styles.quizResultScore}>{score} / {questions.length} 正解</Text>
        <Text style={[styles.quizResultPercent, { color: resultColor }]}>{percentage}%</Text>
        <Text style={styles.quizResultMsg}>
          {percentage >= 80 ? '素晴らしい！完璧です ✨' : percentage >= 60 ? 'よく頑張りました！' : 'もう一度練習しましょう 💪'}
        </Text>
        <Button title="もう一度" onPress={onRestart} style={styles.quizRestartBtn} />
        <View style={styles.quizTypeSwitch}>
          <Button title="フレーズ" onPress={() => onSwitchType('phrases')} variant={quizType === 'phrases' ? 'primary' : 'outline'} size="sm" />
          <Button title="単語" onPress={() => onSwitchType('words')} variant={quizType === 'words' ? 'primary' : 'outline'} size="sm" />
        </View>
      </View>
    );
  }

  const q = questions[currentIndex];
  if (!q) return null;

  return (
    <View style={styles.quizTab}>
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#0891B2', '#4F46E5']}
            style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]}
            start={{x:0,y:0}} end={{x:1,y:0}}
          />
        </View>
        <Text style={styles.progressText}>問題 {currentIndex + 1}/{questions.length}　スコア: {score}</Text>
      </View>

      <Card style={styles.questionCard} variant="glass">
        <Text style={styles.questionText}>{q.question}</Text>
        {q.question_detail && <Text style={styles.questionDetail}>{q.question_detail}</Text>}
      </Card>

      <View style={styles.optionsLabel}>
        <Ionicons name="help-circle-outline" size={16} color={Colors.textMuted} />
        <Text style={styles.optionsLabelText}>日本語の意味は？</Text>
      </View>
      <View style={styles.options}>
        {q.options.map((option: string, i: number) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === q.correct_answer;
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
              onPress={() => onAnswer(option)}
              disabled={!!selectedAnswer}
              activeOpacity={0.8}
            >
              <View style={[styles.optionLabelWrap, selectedAnswer && isCorrect && { backgroundColor: Colors.success + '30' }, selectedAnswer && isSelected && !isCorrect && { backgroundColor: Colors.error + '30' }]}>
                <Text style={styles.optionLabelText}>{['A', 'B', 'C', 'D'][i]}</Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
              {selectedAnswer && isCorrect && <Ionicons name="checkmark-circle" size={20} color={Colors.success} />}
              {selectedAnswer && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color={Colors.error} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#fff' },

  /* Tabs */
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: BorderRadius.lg, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', fontWeight: FontWeight.medium },
  tabTextActive: { color: '#fff', fontWeight: FontWeight.semibold },

  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100 },

  /* Empty */
  emptyState: { alignItems: 'center', gap: Spacing.md, paddingTop: 60 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  /* Phrases */
  phraseTab: { gap: Spacing.md },
  flipRow: { flexDirection: 'row', gap: Spacing.sm, alignSelf: 'center' },
  flipChip: {
    paddingVertical: 6, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  flipChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  flipChipText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  flipChipTextActive: { color: '#fff' },
  phraseJaMain: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, lineHeight: 36 },
  progressRow: { gap: Spacing.xs },
  progressBar: { height: 6, backgroundColor: Colors.backgroundCard, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  phraseCard: { borderRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.md },
  phraseCardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: 'rgba(79,70,229,0.3)',
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  phraseCardBadgeText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  phraseEnglish: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, lineHeight: 36 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pronunciationHint: { fontSize: FontSize.sm, color: Colors.textSecondary },
  translateButton: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.md, padding: Spacing.md, minHeight: 56, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  phraseJapanese: { fontSize: FontSize.xl, color: Colors.textPrimary, textAlign: 'center' },
  translateHintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  translateHint: { fontSize: FontSize.sm, color: Colors.textMuted },
  exampleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  exampleContext: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  speakButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, justifyContent: 'center',
  },
  speakButtonActive: { backgroundColor: Colors.primaryDark },
  speakButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  navButtons: { flexDirection: 'row', gap: Spacing.md },
  navBtn: { flex: 1 },

  /* All phrases */
  allPhrasesTab: { gap: Spacing.sm },
  phraseListCard: {},
  phraseListRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  phraseListText: { flex: 1, gap: 4 },
  phraseListEnglish: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  phraseListJapanese: { fontSize: FontSize.sm, color: Colors.textSecondary },
  phraseListHint: { fontSize: FontSize.xs, color: Colors.textMuted },
  listSpeakBtn: { padding: Spacing.sm },

  /* Quiz */
  quizTab: { gap: Spacing.md },
  questionCard: {},
  questionText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  questionDetail: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  optionsLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionsLabelText: { fontSize: FontSize.sm, color: Colors.textMuted },
  options: { gap: Spacing.sm },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1.5 },
  optionLabelWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.backgroundInput, alignItems: 'center', justifyContent: 'center' },
  optionLabelText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  optionText: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  quizTypeSwitch: { flexDirection: 'row', gap: Spacing.sm },
  quizResult: { alignItems: 'center', gap: Spacing.md, paddingTop: 40 },
  resultIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  quizResultTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  quizResultScore: { fontSize: FontSize.xl, color: Colors.textSecondary },
  quizResultPercent: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold },
  quizResultMsg: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  quizRestartBtn: { width: 200 },
});
