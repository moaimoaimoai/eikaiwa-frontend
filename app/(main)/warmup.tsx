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
import { phrasesService, AIPhrase } from '../../services/phrases';
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

/** カードに表示する統一フレーズ型（DB・AI両対応） */
export interface DisplayPhrase {
  id?: number;
  hash?: string;
  english: string;
  japanese: string;
  pronunciation_hint?: string;
  example_context?: string;
  category_name?: string;
  isAI: boolean;
}

function dbToDisplay(p: Phrase): DisplayPhrase {
  return {
    id: p.id,
    english: p.english,
    japanese: p.japanese,
    pronunciation_hint: p.pronunciation_hint,
    example_context: p.example_context,
    category_name: p.category_name,
    isAI: false,
  };
}

function aiToDisplay(p: AIPhrase): DisplayPhrase {
  return {
    hash: p.hash,
    english: p.english,
    japanese: p.japanese,
    pronunciation_hint: p.pronunciation_hint,
    example_context: p.example_context,
    category_name: p.category_label,
    isAI: true,
  };
}

export default function WarmupScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('phrases');

  // DB フレーズ
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  // AI フレーズ（現在のバッチ）
  const [aiPhrases, setAIPhrases] = useState<AIPhrase[]>([]);
  // カードに表示するフレーズ（DB or AI を統一して管理）
  const [displayPhrases, setDisplayPhrases] = useState<DisplayPhrase[]>([]);
  // 今日確認したフレーズ（カードを次へ進めたもの）
  const [reviewedToday, setReviewedToday] = useState<DisplayPhrase[]>([]);

  const [loading, setLoading] = useState(false); // クイズロード用
  const [aiLoading, setAILoading] = useState(false);

  // AI 生成残り回数
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [limitReached, setLimitReached] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showJapanese, setShowJapanese] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [speakingHash, setSpeakingHash] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizType, setQuizType] = useState<'phrases' | 'words'>('phrases');
  const [flipMode, setFlipMode] = useState<'en-ja' | 'ja-en'>('en-ja');

  useEffect(() => {
    // DB フレーズ（クイズ用）を先にロードし、その後 AI フレーズをロード
    // AI ロード中はローディング画面を表示するため、最初は aiLoading=true にしておく
    const init = async () => {
      await loadPhrases();   // DB フレーズを取得（クイズ・フォールバック用）
      await loadAIPhrases(); // AI フレーズを取得してカードに反映
    };
    init();
    return () => { sound?.unloadAsync(); };
  }, []);

  const loadPhrases = async () => {
    try {
      const data = await phrasesService.getWarmupPhrases();
      setPhrases(data);
      // DB フレーズは displayPhrases に入れない（AI フレーズが優先）
      // ただし AI が失敗したときのフォールバックとして phrases に保持
    } catch (e) {
      console.error(e);
    }
  };

  const loadAIPhrases = async () => {
    try {
      setAILoading(true);
      const result = await phrasesService.getAIWarmupPhrases();
      setAIPhrases(result.phrases);

      if (result.remaining_today !== null) setRemainingToday(result.remaining_today);
      if (result.daily_limit) setDailyLimit(result.daily_limit);
      setLimitReached(false);

      // AI フレーズをカードに反映
      if (result.phrases.length > 0) {
        setDisplayPhrases(result.phrases.map(aiToDisplay));
        setCurrentIndex(0);
        setShowJapanese(false);
      }
    } catch (e: any) {
      const responseData = e?.response?.data;
      if (e?.response?.status === 429) {
        // 1日上限に達した → DB フレーズにフォールバック
        setLimitReached(true);
        setRemainingToday(0);
      }
      // エラー時は DB フレーズをカードに表示
      setPhrases(prev => {
        if (prev.length > 0) setDisplayPhrases(prev.map(dbToDisplay));
        return prev;
      });
      console.error('AI phrases error:', JSON.stringify(responseData));
    } finally {
      setAILoading(false);
    }
  };

  const speakAIPhrase = async (phrase: AIPhrase) => {
    if (speakingHash === phrase.hash) return;
    setSpeakingHash(phrase.hash);
    try {
      if (sound) { await sound.unloadAsync(); }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false, staysActiveInBackground: false });
      const audioBase64 = await conversationService.synthesizeSpeech(phrase.english, 'nova');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audioBase64}` },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setSpeakingHash(null);
      });
    } catch { setSpeakingHash(null); }
  };

  const speakDisplayPhrase = async (phrase: DisplayPhrase) => {
    if (phrase.isAI && phrase.hash) {
      const ai = aiPhrases.find(p => p.hash === phrase.hash);
      if (ai) { await speakAIPhrase(ai); return; }
    }
    if (!phrase.isAI && phrase.id) {
      const db = phrases.find(p => p.id === phrase.id);
      if (db) { await speakPhrase(db); return; }
    }
    // フォールバック: テキストで直接再生
    setSpeakingHash(phrase.hash ?? null);
    try {
      if (sound) await sound.unloadAsync();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false, staysActiveInBackground: false });
      const audioBase64 = await conversationService.synthesizeSpeech(phrase.english, 'nova');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audioBase64}` },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setSpeakingHash(null);
      });
    } catch { setSpeakingHash(null); }
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

  /** 現在のカードを「確認済み」として記録し、次へ進む */
  const nextPhrase = () => {
    if (currentIndex < displayPhrases.length - 1) {
      const current = displayPhrases[currentIndex];
      // 確認済みリストに追加（重複なし）
      setReviewedToday(prev => {
        const key = current.hash ?? current.id?.toString() ?? current.english;
        if (prev.some(p => (p.hash ?? p.id?.toString() ?? p.english) === key)) return prev;
        return [...prev, current];
      });
      setCurrentIndex(currentIndex + 1);
      setShowJapanese(false);
      // DB フレーズなら practiced を記録
      if (!current.isAI && current.id) {
        phrasesService.markPhrasePracticed(current.id).catch(() => {});
      }
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
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
        {/* AI生成中（初回のみフルスクリーンローダーを表示） */}
        {activeTab === 'phrases' && aiLoading && displayPhrases.length === 0 ? (
          <View style={styles.aiInitialLoading}>
            <View style={styles.aiInitialLoadingIcon}>
              <Ionicons name="sparkles" size={36} color="#F59E0B" />
            </View>
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.md }} />
            <Text style={styles.aiInitialLoadingTitle}>AIフレーズを生成中...</Text>
            <Text style={styles.aiInitialLoadingDesc}>あなただけの今日のフレーズを準備しています</Text>
          </View>
        ) : activeTab === 'phrases' ? (
          <PhrasesTab
            displayPhrases={displayPhrases}
            currentIndex={currentIndex}
            showJapanese={showJapanese}
            speakingId={speakingId}
            speakingHash={speakingHash}
            flipMode={flipMode}
            onFlipMode={() => {
              setFlipMode(m => m === 'en-ja' ? 'ja-en' : 'en-ja');
              setShowJapanese(false);
            }}
            onToggleJapanese={() => setShowJapanese(!showJapanese)}
            onSpeak={speakDisplayPhrase}
            onNext={nextPhrase}
            onPrev={prevPhrase}
            aiPhrases={aiPhrases}
            aiLoading={aiLoading}
            remainingToday={remainingToday}
            dailyLimit={dailyLimit}
            limitReached={limitReached}
            onReloadAI={loadAIPhrases}
            reviewedToday={reviewedToday}
            onSpeakAI={speakAIPhrase}
          />
        ) : activeTab === 'words' ? (
          phrases.length === 0
            ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 80 }} />
            : <AllPhrasesTab phrases={phrases} onSpeak={speakPhrase} speakingId={speakingId} />
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

// ─────────────────────────────────────────────
// PhrasesTab
// ─────────────────────────────────────────────
function PhrasesTab({
  displayPhrases, currentIndex, showJapanese, speakingId, speakingHash,
  flipMode, onFlipMode, onToggleJapanese, onSpeak, onNext, onPrev,
  aiPhrases, aiLoading, remainingToday, dailyLimit, limitReached,
  onReloadAI, reviewedToday, onSpeakAI,
}: any) {
  const current: DisplayPhrase | undefined = displayPhrases[currentIndex];
  const isJaFirst = flipMode === 'ja-en';

  if (!current) return (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={56} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>フレーズを読み込み中...</Text>
    </View>
  );

  const mainText    = isJaFirst ? current.japanese : current.english;
  const subText     = isJaFirst ? current.english  : current.japanese;
  const revealLabel = isJaFirst ? 'タップして英語を表示' : 'タップして日本語を表示';
  const isSpeaking  = speakingHash === current.hash || speakingId === current.id;

  // 残り回数バッジの色
  const remainingColor = remainingToday === null
    ? Colors.textMuted
    : remainingToday <= 1 ? Colors.error
    : remainingToday <= 2 ? Colors.warning
    : Colors.success;

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
            colors={current.isAI ? ['#F59E0B', '#8B5CF6'] : ['#0891B2', '#4F46E5']}
            style={[styles.progressFill, { width: `${((currentIndex + 1) / displayPhrases.length) * 100}%` }]}
            start={{x:0,y:0}} end={{x:1,y:0}}
          />
        </View>
        <View style={styles.progressRight}>
          {current.isAI && (
            <View style={styles.aiCardBadge}>
              <Ionicons name="sparkles" size={10} color="#F59E0B" />
              <Text style={styles.aiCardBadgeText}>AI</Text>
            </View>
          )}
          <Text style={styles.progressText}>{currentIndex + 1} / {displayPhrases.length}</Text>
        </View>
      </View>

      {/* カード */}
      <LinearGradient
        colors={current.isAI ? ['#1C1A2E', '#2D1F3D'] : ['#1E293B', '#2D3748']}
        style={styles.phraseCard}
        start={{x:0,y:0}} end={{x:1,y:1}}
      >
        <View style={styles.phraseCardBadge}>
          <Ionicons
            name={current.isAI ? 'sparkles' : 'pricetag'}
            size={12}
            color={current.isAI ? '#F59E0B' : Colors.primaryLight}
          />
          <Text style={[styles.phraseCardBadgeText, current.isAI && { color: '#F59E0B' }]}>
            {current.category_name || 'フレーズ'}
          </Text>
        </View>

        <Text style={isJaFirst ? styles.phraseJaMain : styles.phraseEnglish}>{mainText}</Text>

        {!isJaFirst && current.pronunciation_hint && (
          <View style={styles.hintRow}>
            <Ionicons name="volume-medium" size={14} color={Colors.textSecondary} />
            <Text style={styles.pronunciationHint}>{current.pronunciation_hint}</Text>
          </View>
        )}

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
          style={[styles.speakButton, isSpeaking && styles.speakButtonActive, current.isAI && styles.speakButtonAI]}
          onPress={() => onSpeak(current)}
          activeOpacity={0.85}
        >
          <Ionicons name={isSpeaking ? 'volume-high' : 'volume-medium-outline'} size={22} color="#fff" />
          <Text style={styles.speakButtonText}>
            {isSpeaking ? '再生中...' : '発音を聞く'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.navButtons}>
        <Button title="← 前へ" onPress={onPrev} variant="outline" disabled={currentIndex === 0} style={styles.navBtn} />
        {currentIndex < displayPhrases.length - 1 ? (
          <Button title="次へ →" onPress={onNext} style={styles.navBtn} />
        ) : (
          /* 最後のカード: 次のセットを生成するボタン */
          <TouchableOpacity
            onPress={!limitReached && !aiLoading ? onReloadAI : undefined}
            disabled={limitReached || aiLoading}
            style={[styles.nextSetBtn, (limitReached || aiLoading) && styles.nextSetBtnDisabled]}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={limitReached || aiLoading ? ['#334155', '#334155'] : ['#8B5CF6', '#4F46E5']}
              style={styles.nextSetBtnGradient}
              start={{x:0,y:0}} end={{x:1,y:0}}
            >
              <Ionicons
                name={aiLoading ? 'hourglass-outline' : limitReached ? 'ban-outline' : 'sparkles'}
                size={16}
                color={limitReached || aiLoading ? Colors.textMuted : '#fff'}
              />
              <Text style={[styles.nextSetBtnText, (limitReached || aiLoading) && { color: Colors.textMuted }]}>
                {aiLoading ? '生成中...' : limitReached ? '本日は終了' : '次のフレーズを確認'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* ── AI今日のフレーズ セクション ── */}
      <View style={styles.aiSection}>
        <View style={styles.aiSectionHeader}>
          <View style={styles.aiSectionTitleRow}>
            <View style={styles.aiSparkWrap}>
              <Ionicons name="sparkles" size={15} color="#F59E0B" />
            </View>
            <Text style={styles.aiSectionTitle}>AI今日のフレーズ</Text>
          </View>

          {/* 残り回数 + 再生成ボタン */}
          <View style={styles.aiHeaderRight}>
            {remainingToday !== null && (
              <View style={[styles.remainingBadge, { backgroundColor: remainingColor + '20', borderColor: remainingColor + '50' }]}>
                <Ionicons name="refresh-circle" size={12} color={remainingColor} />
                <Text style={[styles.remainingText, { color: remainingColor }]}>
                  残り{remainingToday}回
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={onReloadAI}
              disabled={aiLoading || limitReached}
              style={[styles.aiReloadBtn, (aiLoading || limitReached) && styles.aiReloadBtnDisabled]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={aiLoading ? 'hourglass-outline' : limitReached ? 'ban-outline' : 'refresh'}
                size={14}
                color={(aiLoading || limitReached) ? Colors.textMuted : Colors.primary}
              />
              <Text style={[styles.aiReloadText, (aiLoading || limitReached) && { color: Colors.textMuted }]}>
                {aiLoading ? '生成中...' : limitReached ? '本日上限' : 'もう一度生成'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 上限到達メッセージ */}
        {limitReached && (
          <View style={styles.limitBanner}>
            <Ionicons name="moon" size={16} color={Colors.warning} />
            <Text style={styles.limitBannerText}>
              本日の生成上限（{dailyLimit}回）に達しました。明日また挑戦してください！
            </Text>
          </View>
        )}

        {aiLoading ? (
          <View style={styles.aiLoadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.aiLoadingText}>AIがフレーズを生成しています...</Text>
          </View>
        ) : aiPhrases.length === 0 ? (
          <View style={styles.aiEmptyWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.aiEmptyText}>フレーズを取得できませんでした</Text>
            {!limitReached && (
              <TouchableOpacity onPress={onReloadAI} style={styles.aiRetryBtn}>
                <Text style={styles.aiRetryText}>再試行</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.aiPhrasesList}>
            {aiPhrases.map((phrase: AIPhrase, idx: number) => (
              <View key={phrase.hash} style={styles.aiPhraseCard}>
                <View style={styles.aiPhraseCardTop}>
                  <View style={styles.aiPhraseIndexBadge}>
                    <Text style={styles.aiPhraseIndexText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.aiCategoryBadge}>
                    <Ionicons name="pricetag-outline" size={10} color={Colors.primaryLight} />
                    <Text style={styles.aiCategoryText}>{phrase.category_label}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onSpeakAI(phrase)}
                    style={[styles.aiSpeakBtn, speakingHash === phrase.hash && styles.aiSpeakBtnActive]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={speakingHash === phrase.hash ? 'volume-high' : 'volume-medium-outline'}
                      size={18}
                      color={speakingHash === phrase.hash ? '#fff' : Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.aiPhraseEnglish}>{phrase.english}</Text>
                {phrase.pronunciation_hint ? (
                  <View style={styles.aiHintRow}>
                    <Ionicons name="musical-notes-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.aiHintText}>{phrase.pronunciation_hint}</Text>
                  </View>
                ) : null}
                <Text style={styles.aiPhraseJapanese}>{phrase.japanese}</Text>
                {phrase.example_context ? (
                  <View style={styles.aiExampleRow}>
                    <Ionicons name="bulb-outline" size={12} color={Colors.warning} />
                    <Text style={styles.aiExampleText}>{phrase.example_context}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── 今日確認したフレーズ ── */}
      {reviewedToday.length > 0 && (
        <View style={styles.reviewedSection}>
          <View style={styles.reviewedHeader}>
            <View style={styles.reviewedIconWrap}>
              <Ionicons name="checkmark-done" size={15} color={Colors.success} />
            </View>
            <Text style={styles.reviewedTitle}>今日確認したフレーズ</Text>
            <View style={styles.reviewedCountBadge}>
              <Text style={styles.reviewedCountText}>{reviewedToday.length}</Text>
            </View>
          </View>
          <View style={styles.reviewedList}>
            {reviewedToday.map((p: DisplayPhrase, idx: number) => (
              <View key={p.hash ?? p.id?.toString() ?? idx} style={styles.reviewedItem}>
                <View style={styles.reviewedItemLeft}>
                  {p.isAI && (
                    <View style={styles.reviewedAIBadge}>
                      <Ionicons name="sparkles" size={8} color="#F59E0B" />
                    </View>
                  )}
                  <View style={styles.reviewedTexts}>
                    <Text style={styles.reviewedEnglish}>{p.english}</Text>
                    <Text style={styles.reviewedJapanese}>{p.japanese}</Text>
                  </View>
                </View>
                <View style={[styles.reviewedCheck, { backgroundColor: Colors.success + '20' }]}>
                  <Ionicons name="checkmark" size={14} color={Colors.success} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// AllPhrasesTab (単語タブ)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// QuizTab
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
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

  /* Phrases Tab */
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

  progressRow: { gap: Spacing.xs },
  progressRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  progressBar: { height: 6, backgroundColor: Colors.backgroundCard, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: FontSize.xs, color: Colors.textMuted },
  aiCardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F59E0B20', borderRadius: BorderRadius.full,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: '#F59E0B40',
  },
  aiCardBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: '#F59E0B' },

  phraseJaMain: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, lineHeight: 36 },
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
  speakButtonAI: { backgroundColor: '#8B5CF6' },
  speakButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  navButtons: { flexDirection: 'row', gap: Spacing.md },
  navBtn: { flex: 1 },

  /* 次のフレーズを確認ボタン（最後のカード） */
  nextSetBtn: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  nextSetBtnDisabled: { opacity: 0.5 },
  nextSetBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 13, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  nextSetBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },

  /* AI初期ローディング画面 */
  aiInitialLoading: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: Spacing.md,
  },
  aiInitialLoadingIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#F59E0B15',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F59E0B30',
  },
  aiInitialLoadingTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, marginTop: Spacing.sm,
  },
  aiInitialLoadingDesc: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },

  /* AI Section */
  aiSection: { marginTop: Spacing.xl, gap: Spacing.md },
  aiSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiSparkWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#F59E0B20',
    alignItems: 'center', justifyContent: 'center',
  },
  aiSectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  aiNewBadge: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  aiNewBadgeText: { fontSize: 9, fontWeight: FontWeight.bold, color: '#fff', letterSpacing: 0.5 },

  /* 残り回数バッジ */
  remainingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  remainingText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  aiReloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  aiReloadBtnDisabled: { backgroundColor: Colors.backgroundCard, borderColor: Colors.border },
  aiReloadText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.primary },

  /* 上限バナー */
  limitBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  limitBannerText: { flex: 1, fontSize: FontSize.sm, color: Colors.warning, lineHeight: 20 },

  aiLoadingWrap: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  aiLoadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  aiEmptyWrap: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  aiEmptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
  aiRetryBtn: {
    backgroundColor: Colors.primary + '20', borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  aiRetryText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  aiPhrasesList: { gap: Spacing.sm },
  aiPhraseCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiPhraseCardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiPhraseIndexBadge: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: Colors.primary + '25',
    alignItems: 'center', justifyContent: 'center',
  },
  aiPhraseIndexText: { fontSize: 11, fontWeight: FontWeight.bold, color: Colors.primary },
  aiCategoryBadge: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#4F46E520', borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  aiCategoryText: { fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.semibold },
  aiSpeakBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  aiSpeakBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  aiPhraseEnglish: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, lineHeight: 26 },
  aiHintRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aiHintText: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  aiPhraseJapanese: { fontSize: FontSize.md, color: Colors.textSecondary },
  aiExampleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  aiExampleText: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 18 },

  /* 今日確認したフレーズ */
  reviewedSection: { marginTop: Spacing.xl, gap: Spacing.md },
  reviewedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewedIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.success + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewedTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  reviewedCountBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  reviewedCountText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },
  reviewedList: { gap: Spacing.sm },
  reviewedItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  reviewedItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewedAIBadge: {
    width: 18, height: 18, borderRadius: 5,
    backgroundColor: '#F59E0B20',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#F59E0B40',
  },
  reviewedTexts: { flex: 1, gap: 2 },
  reviewedEnglish: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  reviewedJapanese: { fontSize: FontSize.xs, color: Colors.textSecondary },
  reviewedCheck: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  /* All phrases tab */
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
