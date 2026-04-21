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
import { phrasesService, AIPhrase, AIWord } from '../../services/phrases';
import { conversationService } from '../../services/conversation';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Phrase } from '../../types';

const { width } = Dimensions.get('window');

type Tab = 'phrases' | 'words';

const TAB_CONFIG: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'phrases', label: 'フレーズ', icon: 'chatbubble-ellipses' },
  { id: 'words',   label: '単語',     icon: 'text' },
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

  // ─── フレーズ関連 ───
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [aiPhrases, setAIPhrases] = useState<AIPhrase[]>([]);
  const [displayPhrases, setDisplayPhrases] = useState<DisplayPhrase[]>([]);
  const [reviewedToday, setReviewedToday] = useState<DisplayPhrase[]>([]);
  const [aiLoading, setAILoading] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState(5);
  const [limitReached, setLimitReached] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showJapanese, setShowJapanese] = useState(false);
  const [flipMode, setFlipMode] = useState<'en-ja' | 'ja-en'>('en-ja');

  // ─── 単語関連 (AI生成) ───
  const [aiWords, setAIWords] = useState<AIWord[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [showWordDetail, setShowWordDetail] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [wordRemainingToday, setWordRemainingToday] = useState<number | null>(null);
  const [wordDailyLimit, setWordDailyLimit] = useState(5);
  const [wordLimitReached, setWordLimitReached] = useState(false);
  const [reviewedWordsToday, setReviewedWordsToday] = useState<AIWord[]>([]);

  // ─── 共通 ───
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [speakingHash, setSpeakingHash] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    const init = async () => {
      const dbPhrases = await loadPhrases();
      await loadAIPhrases(dbPhrases);
    };
    init();
    return () => { sound?.unloadAsync(); };
  }, []);

  const loadPhrases = async (): Promise<Phrase[]> => {
    try {
      const data = await phrasesService.getWarmupPhrases();
      setPhrases(data);
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  /** AI単語をロード（初回 or 再生成ボタン） */
  const loadAIWords = async () => {
    setWordLoading(true);
    try {
      const result = await phrasesService.getAIWords();
      if (result.remaining_today !== null) setWordRemainingToday(result.remaining_today);
      if (result.daily_limit) setWordDailyLimit(result.daily_limit);

      if (result.limit_reached) {
        setWordLimitReached(true);
        setWordRemainingToday(0);
        if (result.words.length > 0) {
          setAIWords(result.words);
          setWordIndex(0);
          setShowWordDetail(false);
        }
      } else {
        setWordLimitReached(false);
        setAIWords(result.words);
        setWordIndex(0);
        setShowWordDetail(false);
      }
    } catch (e: any) {
      console.error('AI単語生成エラー:', e);
    } finally {
      setWordLoading(false);
    }
  };

  const loadAIPhrases = async (dbPhraseFallback: Phrase[] = []) => {
    try {
      setAILoading(true);
      const result = await phrasesService.getAIWarmupPhrases();

      if (result.remaining_today !== null) setRemainingToday(result.remaining_today);
      if (result.daily_limit) setDailyLimit(result.daily_limit);

      if (result.limit_reached) {
        // 上限到達: 今日生成済みのフレーズがあれば表示、なければ DB フレーズ
        setLimitReached(true);
        setRemainingToday(0);
        if (result.phrases.length > 0) {
          setAIPhrases(result.phrases);
          setDisplayPhrases(result.phrases.map(aiToDisplay));
        } else if (dbPhraseFallback.length > 0) {
          setDisplayPhrases(dbPhraseFallback.map(dbToDisplay));
        }
      } else {
        setLimitReached(false);
        setAIPhrases(result.phrases);
        if (result.phrases.length > 0) {
          setDisplayPhrases(result.phrases.map(aiToDisplay));
          setCurrentIndex(0);
          setShowJapanese(false);
        }
      }
    } catch (e: any) {
      // 予期せぬエラー: DB フレーズにフォールバック
      if (dbPhraseFallback.length > 0) {
        setDisplayPhrases(dbPhraseFallback.map(dbToDisplay));
      }
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

  // ─── 以下はフレーズタブのロジック（変更なし） ───

  /** 単語カード: 次へ */
  const nextWord = () => {
    if (wordIndex < aiWords.length - 1) {
      const current = aiWords[wordIndex];
      setReviewedWordsToday(prev => {
        if (prev.some(w => w.hash === current.hash)) return prev;
        return [...prev, current];
      });
      setWordIndex(wordIndex + 1);
      setShowWordDetail(false);
    }
  };

  /** 単語カード: 前へ */
  const prevWord = () => {
    if (wordIndex > 0) {
      setWordIndex(wordIndex - 1);
      setShowWordDetail(false);
    }
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
                // 単語タブ初回: AI単語がまだなければロード
                if (tab.id === 'words' && aiWords.length === 0 && !wordLoading) {
                  loadAIWords();
                }
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
        ) : (
          // 単語タブ: AI生成ワードカード
          wordLoading && aiWords.length === 0 ? (
            <View style={styles.aiInitialLoading}>
              <View style={styles.aiInitialLoadingIcon}>
                <Ionicons name="sparkles" size={36} color="#06B6D4" />
              </View>
              <ActivityIndicator size="large" color={Colors.info} style={{ marginTop: Spacing.md }} />
              <Text style={styles.aiInitialLoadingTitle}>AI単語を生成中...</Text>
              <Text style={styles.aiInitialLoadingDesc}>あなたのレベルに合った単語を選んでいます</Text>
            </View>
          ) : (
            <WordsTab
              words={aiWords}
              currentIndex={wordIndex}
              showDetail={showWordDetail}
              speakingHash={speakingHash}
              wordLoading={wordLoading}
              wordRemainingToday={wordRemainingToday}
              wordDailyLimit={wordDailyLimit}
              wordLimitReached={wordLimitReached}
              reviewedWordsToday={reviewedWordsToday}
              onToggleDetail={() => setShowWordDetail(!showWordDetail)}
              onSpeak={async (word: AIWord) => {
                if (speakingHash === word.hash) return;
                setSpeakingHash(word.hash);
                try {
                  if (sound) await sound.unloadAsync();
                  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false, staysActiveInBackground: false });
                  const audioBase64 = await conversationService.synthesizeSpeech(word.word, 'nova');
                  const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: `data:audio/mp3;base64,${audioBase64}` },
                    { shouldPlay: true }
                  );
                  setSound(newSound);
                  newSound.setOnPlaybackStatusUpdate((s) => {
                    if (s.isLoaded && s.didJustFinish) setSpeakingHash(null);
                  });
                } catch { setSpeakingHash(null); }
              }}
              onNext={nextWord}
              onPrev={prevWord}
              onReloadWords={loadAIWords}
            />
          )
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
// WordsTab (AI生成単語カード)
// ─────────────────────────────────────────────
function WordsTab({
  words, currentIndex, showDetail, speakingHash,
  wordLoading, wordRemainingToday, wordDailyLimit, wordLimitReached,
  reviewedWordsToday, onToggleDetail, onSpeak, onNext, onPrev, onReloadWords,
}: any) {
  const current: AIWord | undefined = words[currentIndex];
  const isSpeaking = speakingHash === current?.hash;

  const remainingColor = wordRemainingToday === null
    ? Colors.textMuted
    : wordRemainingToday <= 1 ? Colors.error
    : wordRemainingToday <= 2 ? Colors.warning
    : Colors.info;

  if (!current && words.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconWrap, { backgroundColor: Colors.info + '20' }]}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>単語を取得できません</Text>
        <TouchableOpacity onPress={onReloadWords} style={[styles.aiRetryBtn, { marginTop: Spacing.sm }]}>
          <Text style={[styles.aiRetryText, { color: Colors.info }]}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!current) return null;

  const posColor = (pos: string) => {
    if (pos.includes('動詞')) return Colors.secondary;
    if (pos.includes('形容詞')) return Colors.success;
    if (pos.includes('副詞')) return Colors.pronunciation;
    if (pos.includes('熟語') || pos.includes('イディオム')) return Colors.gold;
    return Colors.info;
  };
  const posC = posColor(current.part_of_speech || '');

  return (
    <View style={styles.phraseTab}>
      {/* プログレス */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#06B6D4', '#4F46E5']}
            style={[styles.progressFill, { width: `${((currentIndex + 1) / words.length) * 100}%` }]}
            start={{x:0,y:0}} end={{x:1,y:0}}
          />
        </View>
        <View style={styles.progressRight}>
          <View style={styles.aiCardBadge}>
            <Ionicons name="sparkles" size={10} color="#06B6D4" />
            <Text style={[styles.aiCardBadgeText, { color: '#06B6D4' }]}>AI</Text>
          </View>
          <Text style={styles.progressText}>{currentIndex + 1} / {words.length}</Text>
        </View>
      </View>

      {/* 単語カード */}
      <LinearGradient
        colors={['#0C1F2E', '#112233']}
        style={styles.phraseCard}
        start={{x:0,y:0}} end={{x:1,y:1}}
      >
        {/* 品詞バッジ */}
        <View style={[styles.phraseCardBadge, { backgroundColor: posC + '30' }]}>
          <Ionicons name="pricetag" size={12} color={posC} />
          <Text style={[styles.phraseCardBadgeText, { color: posC }]}>{current.part_of_speech}</Text>
        </View>

        {/* 単語メイン */}
        <Text style={styles.phraseEnglish}>{current.word}</Text>

        {/* 読み */}
        {current.reading ? (
          <View style={styles.hintRow}>
            <Ionicons name="volume-medium" size={14} color={Colors.textSecondary} />
            <Text style={styles.pronunciationHint}>{current.reading}</Text>
          </View>
        ) : null}

        {/* 意味を表示ボタン */}
        <TouchableOpacity onPress={onToggleDetail} style={styles.translateButton} activeOpacity={0.8}>
          {showDetail ? (
            <View style={{ gap: Spacing.sm }}>
              <Text style={[styles.phraseJapanese, { textAlign: 'left', fontSize: FontSize.lg }]}>
                {current.definition_ja}
              </Text>
              {current.example_sentence ? (
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' }}>
                    {current.example_sentence}
                  </Text>
                  <Text style={{ fontSize: FontSize.sm, color: Colors.textMuted }}>
                    {current.example_sentence_ja}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.translateHintRow}>
              <Ionicons name="eye-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.translateHint}>タップして意味・例文を表示</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 覚え方のコツ */}
        {showDetail && current.memory_hook ? (
          <View style={styles.exampleRow}>
            <Ionicons name="bulb" size={14} color={Colors.gold} />
            <Text style={[styles.exampleContext, { color: Colors.warningLight }]}>{current.memory_hook}</Text>
          </View>
        ) : null}

        {/* 発音ボタン */}
        <TouchableOpacity
          style={[styles.speakButton, isSpeaking && styles.speakButtonActive, { backgroundColor: isSpeaking ? '#0891B2' : Colors.info }]}
          onPress={() => onSpeak(current)}
          activeOpacity={0.85}
        >
          <Ionicons name={isSpeaking ? 'volume-high' : 'volume-medium-outline'} size={22} color="#fff" />
          <Text style={styles.speakButtonText}>{isSpeaking ? '再生中...' : '発音を聞く'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* 前へ/次へ */}
      <View style={styles.navButtons}>
        <Button title="← 前へ" onPress={onPrev} variant="outline" disabled={currentIndex === 0} style={styles.navBtn} />
        {currentIndex < words.length - 1 ? (
          <Button title="次へ →" onPress={onNext} style={styles.navBtn} />
        ) : (
          <TouchableOpacity
            onPress={!wordLimitReached && !wordLoading ? onReloadWords : undefined}
            disabled={wordLimitReached || wordLoading}
            style={[styles.nextSetBtn, (wordLimitReached || wordLoading) && styles.nextSetBtnDisabled]}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={wordLimitReached || wordLoading ? ['#334155', '#334155'] : ['#06B6D4', '#4F46E5']}
              style={styles.nextSetBtnGradient}
              start={{x:0,y:0}} end={{x:1,y:0}}
            >
              <Ionicons
                name={wordLoading ? 'hourglass-outline' : wordLimitReached ? 'ban-outline' : 'sparkles'}
                size={16}
                color={(wordLimitReached || wordLoading) ? Colors.textMuted : '#fff'}
              />
              <Text style={[styles.nextSetBtnText, (wordLimitReached || wordLoading) && { color: Colors.textMuted }]}>
                {wordLoading ? '生成中...' : wordLimitReached ? '本日は終了' : '次の単語を生成'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* 残り回数 + 再生成 */}
      <View style={[styles.aiSectionHeader, { marginTop: Spacing.md }]}>
        <View style={styles.aiSectionTitleRow}>
          <View style={[styles.aiSparkWrap, { backgroundColor: Colors.info + '20' }]}>
            <Ionicons name="sparkles" size={15} color={Colors.info} />
          </View>
          <Text style={styles.aiSectionTitle}>AI単語カード</Text>
        </View>
        <View style={styles.aiHeaderRight}>
          {wordRemainingToday !== null && (
            <View style={[styles.remainingBadge, { backgroundColor: remainingColor + '20', borderColor: remainingColor + '50' }]}>
              <Ionicons name="refresh-circle" size={12} color={remainingColor} />
              <Text style={[styles.remainingText, { color: remainingColor }]}>残り{wordRemainingToday}回</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={onReloadWords}
            disabled={wordLoading || wordLimitReached}
            style={[styles.aiReloadBtn, { borderColor: Colors.info + '40', backgroundColor: Colors.info + '15' },
              (wordLoading || wordLimitReached) && styles.aiReloadBtnDisabled]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={wordLoading ? 'hourglass-outline' : wordLimitReached ? 'ban-outline' : 'refresh'}
              size={14}
              color={(wordLoading || wordLimitReached) ? Colors.textMuted : Colors.info}
            />
            <Text style={[styles.aiReloadText, { color: Colors.info },
              (wordLoading || wordLimitReached) && { color: Colors.textMuted }]}>
              {wordLoading ? '生成中...' : wordLimitReached ? '本日上限' : 'もう一度生成'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 上限到達バナー */}
      {wordLimitReached && (
        <View style={styles.limitBanner}>
          <Ionicons name="moon" size={16} color={Colors.warning} />
          <Text style={styles.limitBannerText}>
            本日の生成上限（{wordDailyLimit}回）に達しました。明日また挑戦してください！
          </Text>
        </View>
      )}

      {/* 今日確認した単語 */}
      {reviewedWordsToday.length > 0 && (
        <View style={[styles.reviewedSection, { marginTop: Spacing.lg }]}>
          <View style={styles.reviewedHeader}>
            <View style={[styles.reviewedIconWrap, { backgroundColor: Colors.info + '20' }]}>
              <Ionicons name="checkmark-done" size={15} color={Colors.info} />
            </View>
            <Text style={styles.reviewedTitle}>今日確認した単語</Text>
            <View style={[styles.reviewedCountBadge, { backgroundColor: Colors.info }]}>
              <Text style={styles.reviewedCountText}>{reviewedWordsToday.length}</Text>
            </View>
          </View>
          <View style={styles.reviewedList}>
            {reviewedWordsToday.map((w: AIWord, idx: number) => (
              <View key={w.hash ?? idx} style={styles.reviewedItem}>
                <View style={styles.reviewedTexts}>
                  <Text style={styles.reviewedEnglish}>{w.word}</Text>
                  <Text style={styles.reviewedJapanese}>{w.definition_ja}</Text>
                </View>
                <View style={[styles.reviewedCheck, { backgroundColor: Colors.info + '20' }]}>
                  <Ionicons name="checkmark" size={14} color={Colors.info} />
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

});
