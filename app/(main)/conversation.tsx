import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, Animated, Pressable, Linking, Modal
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { conversationService } from '../../services/conversation';
import { useConversationStore } from '../../store/conversationStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { sendAchievementNotification } from '../../services/notifications';
import { AvatarDisplay } from '../../components/AvatarDisplay';
import { MessageBubble } from '../../components/MessageBubble';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, AVATARS, TOPICS, DAILY_TOPICS } from '../../constants/theme';
import { Message, Correction, TranslationResult, CoachingTip } from '../../types';

type Mode = 'setup' | 'loading' | 'chat' | 'ending' | 'summary';

// ── インラインコーチングカードコンポーネント ──
function CoachingCard({ coaching, onDismiss }: { coaching: CoachingTip; onDismiss: () => void }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <View style={coachingStyles.card}>
      <View style={coachingStyles.header}>
        <View style={coachingStyles.titleRow}>
          <Ionicons name="bulb" size={14} color={Colors.warning} />
          <Text style={coachingStyles.title}>💬 この場面で使えるフレーズ</Text>
        </View>
        <TouchableOpacity onPress={() => { setOpen(false); onDismiss(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={15} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
      {coaching.tip_ja ? <Text style={coachingStyles.tip}>{coaching.tip_ja}</Text> : null}
      {coaching.useful_phrases?.map((p, i) => (
        <View key={i} style={coachingStyles.phraseRow}>
          <Text style={coachingStyles.phraseEn}>"{p.english}"</Text>
          <Text style={coachingStyles.phraseJa}>{p.japanese}</Text>
        </View>
      ))}
    </View>
  );
}

const coachingStyles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: 4,
    backgroundColor: Colors.warning + '12',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    padding: Spacing.sm,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.warning,
  },
  tip: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  phraseRow: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 2,
  },
  phraseEn: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  phraseJa: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});

/** 1セッションあたりの最大ユーザーターン数 */
const MAX_TURNS = 10;

/** 残り何ターンで警告を出すか */
const WARN_AT_REMAINING = 3;

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ topic?: string; dailyTopic?: string }>();
  const { user, updateUser } = useAuthStore();
  const { achievementEnabled } = useNotificationStore();
  const {
    sessionId, messages, corrections, isLoading,
    setSession, addMessage, addCorrection, setLoading, setSummary, resetSession,
    topic, setTopic, avatarName, avatarAccent, setAvatar
  } = useConversationStore();

  const [mode, setMode] = useState<Mode>('setup');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentCorrection, setCurrentCorrection] = useState<Correction | null>(null);
  const [currentCoaching, setCurrentCoaching] = useState<CoachingTip | null>(null);
  const [summary, setSummaryLocal] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  /** ユーザーのターン数（送信回数） */
  const [userTurnCount, setUserTurnCount] = useState(0);

  /** 音声認識中・完了後にinputの上に表示するテキスト */
  const [transcribeStatus, setTranscribeStatus] = useState<'idle' | 'listening' | 'processing' | 'recognized'>('idle');
  /** 認識されたテキストを一時保持（即時表示用） */
  const [recognizedText, setRecognizedText] = useState('');

  /** マイク権限の状態 */
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  /**
   * 録音の3フェーズ管理
   *   idle      : ボタン未押下
   *   preparing : ボタン押下〜録音オブジェクト生成完了前（スピナー表示）
   *   recording : 実際に録音中（赤ボタン表示）
   *
   * ref で持つことで stopRecording の stale closure 問題を回避する。
   * isPreparing state は UI レンダリング専用。
   */
  const micPhaseRef = useRef<'idle' | 'preparing' | 'recording'>('idle');
  const [isPreparing, setIsPreparing] = useState(false); // スピナー表示用

  /** 録音開始タイムスタンプ（最短録音時間チェック用） */
  const recordingStartTimeRef = useRef<number | null>(null);
  /** 録音中の経過秒数（UIカウンター用） */
  const [recordingSec, setRecordingSec] = useState(0);
  const recordingTickRef = useRef<NodeJS.Timeout | null>(null);

  // ── 日本語ヘルプ機能の状態 ──
  const [showJpHelp, setShowJpHelp] = useState(false);
  const [jpInput, setJpInput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isJpRecording, setIsJpRecording] = useState(false);
  const jpRecordingRef = useRef<Audio.Recording | null>(null);
  const jpMicPhaseRef = useRef<'idle' | 'preparing' | 'recording'>('idle');
  const [isJpPreparing, setIsJpPreparing] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  // AI発言中の波形アニメーション用
  const speakingBar1 = useRef(new Animated.Value(0.3)).current;
  const speakingBar2 = useRef(new Animated.Value(0.7)).current;
  const speakingBar3 = useRef(new Animated.Value(0.5)).current;
  const speakingBar4 = useRef(new Animated.Value(0.8)).current;

  const suggestions = ["Tell me more!", "I see.", "That's interesting!", "Could you explain?", "I agree!"];

  // 今日のトピック情報（params.dailyTopic が渡された場合に取得）
  const dailyTopicBase = params.dailyTopic
    ? DAILY_TOPICS.find(t => t.id === params.dailyTopic) ?? null
    : null;
  // ユーザーが「外す」ボタンを押したら null にする
  const [dailyTopicActive, setDailyTopicActive] = useState(true);
  const dailyTopicInfo = dailyTopicActive ? dailyTopicBase : null;

  useEffect(() => {
    // params.topic がない場合は必ず 'free' にリセットする
    // （前回のデイリートピックや別トピックが残らないようにする）
    setTopic(params.topic || 'free');
    // マウント時にマイク権限を事前チェック
    checkMicPermission();
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      sound?.unloadAsync();
    };
  }, []);

  const checkMicPermission = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      if (status === 'granted') {
        setMicPermission('granted');
      } else if (status === 'denied') {
        setMicPermission('denied');
      } else {
        // undetermined → まだリクエストしていない
        setMicPermission('unknown');
      }
    } catch {
      setMicPermission('denied');
    }
  };

  useEffect(() => {
    if (mode === 'chat') {
      timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000);
    } else {
      timerRef.current && clearInterval(timerRef.current);
    }

    // ending中はスケルトンのパルスアニメーションを動かす
    if (mode === 'ending') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnim, { toValue: 1.1, duration: 700, useNativeDriver: true }),
          Animated.timing(recordingAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    }
  }, [mode]);

  // 録音中のパルスアニメーション
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnim, { toValue: 1.25, duration: 500, useNativeDriver: true }),
          Animated.timing(recordingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else {
      recordingAnim.setValue(1);
      pulseAnim.setValue(0);
    }
  }, [isRecording]);

  // AI発言中の波形アニメーション
  useEffect(() => {
    if (isSpeaking) {
      const makeBar = (anim: Animated.Value, duration: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.2, duration, useNativeDriver: true }),
          ])
        );
      const b1 = makeBar(speakingBar1, 350);
      const b2 = makeBar(speakingBar2, 280);
      const b3 = makeBar(speakingBar3, 420);
      const b4 = makeBar(speakingBar4, 310);
      b1.start(); b2.start(); b3.start(); b4.start();
      return () => { b1.stop(); b2.stop(); b3.stop(); b4.stop(); };
    } else {
      speakingBar1.setValue(0.3);
      speakingBar2.setValue(0.7);
      speakingBar3.setValue(0.5);
      speakingBar4.setValue(0.8);
    }
  }, [isSpeaking]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const remainingTurns = MAX_TURNS - userTurnCount;
  const isNearLimit = remainingTurns <= WARN_AT_REMAINING && remainingTurns > 0;
  const isAtLimit = remainingTurns <= 0;

  // ─── セッション開始 ───
  const startSession = async () => {
    resetSession();
    setUserTurnCount(0);
    setElapsedTime(0); // ← タイマーをリセット
    setTopic(topic);
    setMode('loading'); // ローディング画面へ
    try {
      const result = await conversationService.startSession(
        topic,
        avatarName,
        avatarAccent,
        dailyTopicInfo?.label,
        dailyTopicInfo?.hint,
      );

      // 月次上限エラー
      if ((result as any).error === 'monthly_limit_reached') {
        setMode('setup');
        Alert.alert(
          '今月の上限に達しました 😢',
          `今月の会話セッション上限（${(result as any).monthly_limit}回）をすべて使いました。\nプレミアムプランで月100セッション（1セッション最大10往復）に拡張できます。`,
          [{ text: 'OK' }]
        );
        return;
      }

      setSession(result.session_id);
      addMessage(result.message);
      await playAIResponse(result.message.content);
      setMode('chat');
    } catch (e: any) {
      setMode('setup');
      if (e?.response?.status === 402) {
        Alert.alert(
          '今月の上限に達しました 😢',
          'プレミアムプランにアップグレードすると月100セッション（1セッション最大10往復）まで会話できます。',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('エラー', '接続に失敗しました。バックエンドが起動しているか確認してください。');
      }
    }
  };

  // ─── メッセージ送信 ───
  const sendMessage = async (text?: string) => {
    const content = text || inputText.trim();
    if (!content || !sessionId || isLoading) return;

    // ターン上限チェック
    if (isAtLimit) {
      Alert.alert('会話が完了しました', '今回のセッションはここまでです。お疲れさまでした！', [
        { text: '結果を見る', onPress: () => endSession(true) }
      ]);
      return;
    }

    setInputText('');
    setLoading(true);
    setCurrentCorrection(null);
    setCurrentCoaching(null);
    const newCount = userTurnCount + 1;
    setUserTurnCount(newCount);

    try {
      const result = await conversationService.sendMessage(sessionId, content, true);
      addMessage(result.user_message);
      addMessage(result.ai_message);

      if (result.correction) {
        addCorrection(result.correction);
        setCurrentCorrection(result.correction);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      if (result.coaching) {
        setCurrentCoaching(result.coaching);
      }

      if (result.audio_base64) {
        await playBase64Audio(result.audio_base64);
      } else {
        await playAIResponse(result.ai_message.content);
      }

      scrollRef.current?.scrollToEnd({ animated: true });

      // 上限に達したら自動で終了を促す
      if (newCount >= MAX_TURNS) {
        setTimeout(() => {
          Alert.alert(
            '🎉 お疲れさまでした！',
            `${MAX_TURNS}回のやり取りが完了しました。\n会話を終了して結果を確認しましょう！`,
            [
              { text: 'あと少し続ける', style: 'cancel' },
              { text: '結果を見る', onPress: () => endSession(true) },
            ]
          );
        }, 1500);
      } else if (newCount === MAX_TURNS - WARN_AT_REMAINING + 1) {
        // 残り3回になったタイミングでハプティクス
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e: any) {
      if (e?.response?.data?.error === 'session_turn_limit_reached') {
        Alert.alert(
          'セッション終了',
          `このセッションの発言上限（${MAX_TURNS}回）に達しました。`,
          [{ text: '結果を見る', onPress: () => endSession(true) }]
        );
      } else {
        Alert.alert('エラー', 'メッセージの送信に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const playAIResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      // アバターのアクセントに合わせた声を使う（デフォルトはEmmaのnova）
      const voiceMap: Record<string, string> = {
        'American': 'nova',    // Emma
        'British': 'onyx',     // James
        'Australian': 'shimmer', // Lily
      };
      const voice = voiceMap[avatarAccent] ?? 'nova';
      const audioBase64 = await conversationService.synthesizeSpeech(text, voice);
      await playBase64Audio(audioBase64);
    } catch { setIsSpeaking(false); }
  };

  const playBase64Audio = async (base64: string) => {
    try {
      if (sound) await sound.unloadAsync();
      setIsSpeaking(true);
      // 消音モード(サイレントモード)でも再生できるよう設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64}` },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setIsSpeaking(false);
      });
    } catch { setIsSpeaking(false); }
  };

  // ─── 録音開始（長押し開始） ───
  const startRecording = async () => {
    console.log('[MIC] onPressIn fired', { isLoading, isSpeaking, isAtLimit, phase: micPhaseRef.current, micPermission });
    if (isLoading || isSpeaking || isAtLimit) { console.log('[MIC] EARLY RETURN: isLoading/isSpeaking/isAtLimit'); return; }
    // 既に別フェーズ中なら無視
    if (micPhaseRef.current !== 'idle') { console.log('[MIC] EARLY RETURN: phase not idle =', micPhaseRef.current); return; }

    // 既に拒否済みの場合は設定アプリへ誘導
    if (micPermission === 'denied') {
      Alert.alert(
        'マイクの権限が必要です',
        '設定アプリでマイクの使用を許可してください。テキスト入力でも会話できます。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    // ── Phase 1: preparing（スピナー表示）──
    micPhaseRef.current = 'preparing';
    setIsPreparing(true);
    console.log('[MIC] phase → preparing, setIsPreparing(true)');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const prepStart = Date.now();
    const MIN_PREP_MS = 300; // 最低 0.3 秒は準備中スピナーを見せる（短すぎる録音防止）

    try {
      // 1. 権限確認
      console.log('[MIC] calling requestPermissionsAsync...');
      const { granted, canAskAgain } = await Audio.requestPermissionsAsync();
      console.log('[MIC] permission result:', granted, '| phase now:', micPhaseRef.current);
      if (micPhaseRef.current !== 'preparing') { console.log('[MIC] CANCELLED after permission'); return; }

      if (!granted) {
        micPhaseRef.current = 'idle';
        setIsPreparing(false);
        setMicPermission('denied');
        if (!canAskAgain) {
          Alert.alert(
            'マイクの権限が必要です',
            '設定アプリでマイクの使用を許可してください。テキスト入力でも会話できます。',
            [
              { text: 'キャンセル', style: 'cancel' },
              { text: '設定を開く', onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert('権限が必要です', 'マイクの使用を許可してください。テキスト入力でも会話できます。');
        }
        return;
      }
      setMicPermission('granted');

      // 2. AudioMode 切替（実機で時間がかかるポイント）
      console.log('[MIC] calling setAudioModeAsync...');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      console.log('[MIC] setAudioModeAsync done | phase:', micPhaseRef.current);
      if (micPhaseRef.current !== 'preparing') { console.log('[MIC] CANCELLED after AudioMode'); return; }

      // 3. 最低表示時間に満たない場合だけ待機
      const elapsed = Date.now() - prepStart;
      console.log('[MIC] prep elapsed:', elapsed, 'ms, waiting:', Math.max(0, MIN_PREP_MS - elapsed), 'ms more');
      if (elapsed < MIN_PREP_MS) {
        await new Promise<void>(resolve => setTimeout(resolve, MIN_PREP_MS - elapsed));
      }
      if (micPhaseRef.current !== 'preparing') { console.log('[MIC] CANCELLED after timer wait'); return; }

      // 4. 録音オブジェクト生成
      console.log('[MIC] calling createAsync...');
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      console.log('[MIC] createAsync done | phase:', micPhaseRef.current);
      if (micPhaseRef.current !== 'preparing') {
        console.log('[MIC] CANCELLED after createAsync - discarding recording');
        rec.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
        return;
      }

      // ── Phase 2: recording ──
      console.log('[MIC] phase → recording');
      recordingRef.current = rec;
      setRecording(rec);
      micPhaseRef.current = 'recording';
      setIsPreparing(false);
      setIsRecording(true);
      setTranscribeStatus('listening');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // 録音開始時刻を記録し、1秒ごとにカウンターを更新
      recordingStartTimeRef.current = Date.now();
      setRecordingSec(0);
      recordingTickRef.current = setInterval(() => {
        setRecordingSec(s => s + 1);
      }, 1000);

    } catch (e: any) {
      micPhaseRef.current = 'idle';
      setIsPreparing(false);
      setIsRecording(false);
      setTranscribeStatus('idle');
      const isSimulator = e?.message?.includes('simulator') || e?.message?.includes('Simulator');
      if (isSimulator) {
        Alert.alert(
          'シミュレーターではマイクを使用できません',
          'テキスト入力で会話してください。実機ではマイクが利用できます。'
        );
      } else {
        Alert.alert('録音を開始できませんでした', 'テキスト入力でも会話できます。');
      }
    }
  };

  // ─── 録音停止の実処理（録音オブジェクトを直接受け取るバージョン） ───
  const stopRecordingWithRef = async (rec: Audio.Recording) => {
    console.log('[MIC] stopRecordingWithRef called');
    // タイマークリア
    if (recordingTickRef.current) { clearInterval(recordingTickRef.current); recordingTickRef.current = null; }
    recordingStartTimeRef.current = null;
    setRecordingSec(0);
    micPhaseRef.current = 'idle';
    setIsRecording(false);
    setIsPreparing(false);
    setTranscribeStatus('processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      console.log('[MIC] calling stopAndUnloadAsync...');
      await rec.stopAndUnloadAsync();
      console.log('[MIC] stopAndUnloadAsync done');
      const uri = rec.getURI();
      console.log('[MIC] uri:', uri ? 'exists' : 'NULL');
      recordingRef.current = null;
      setRecording(null);
      if (uri) {
        console.log('[MIC] calling transcribeAudio...');
        const transcribed = await conversationService.transcribeAudio(uri);
        console.log('[MIC] transcribed:', JSON.stringify(transcribed));
        if (transcribed) {
          setRecognizedText(transcribed);
          setTranscribeStatus('recognized');
          await sendMessage(transcribed);
        } else {
          console.log('[MIC] transcribed is empty/null - not sending');
        }
      }
    } catch (e: any) {
      console.log('[MIC] ERROR in stopRecordingWithRef:', e?.message ?? e);
      Alert.alert('エラー', '音声認識に失敗しました');
    }
    finally {
      setTranscribeStatus('idle');
      setRecognizedText('');
    }
  };

  // ─── 録音停止（長押し解放） ───
  const stopRecording = async () => {
    const phase = micPhaseRef.current;
    console.log('[MIC] onPressOut fired | phase:', phase);

    if (phase === 'preparing') {
      // 準備フェーズ中に指が離れた → startRecording の await チェックで検知させるだけ
      micPhaseRef.current = 'idle';
      setIsPreparing(false);
      return;
    }

    if (phase === 'recording') {
      const currentRecording = recordingRef.current;
      if (currentRecording) {
        await stopRecordingWithRef(currentRecording);
      } else {
        // 万が一 ref が null でも状態だけ戻す
        micPhaseRef.current = 'idle';
        setIsRecording(false);
        setTranscribeStatus('idle');
      }
      return;
    }

    // idle のまま onPressOut が来た場合は何もしない
  };

  /**
   * ─── トグル録音（タップ1回で開始、もう1回で停止・送信）───
   *
   * 長押し保持型だと onPressOut が JS イベントキューで遅延し、録音開始直後に
   * 即停止してしまう問題があるため、タップ式トグルに変更。
   *   1回目タップ → preparing → recording
   *   2回目タップ → 停止 → 文字起こし → 送信
   */
  /** 最短録音時間 (ms) — これより短いと無音・空文字になりやすい */
  const MIN_RECORDING_MS = 1500;

  const handleMicPress = async () => {
    const phase = micPhaseRef.current;
    console.log('[MIC] handleMicPress | phase:', phase);

    if (phase === 'idle') {
      await startRecording();
    } else if (phase === 'preparing') {
      // 準備中にタップ → キャンセル
      micPhaseRef.current = 'idle';
      setIsPreparing(false);
    } else if (phase === 'recording') {
      // 録音時間が短すぎる場合はガード（Whisperが空文字を返す）
      const elapsed = recordingStartTimeRef.current ? Date.now() - recordingStartTimeRef.current : MIN_RECORDING_MS;
      console.log('[MIC] recording elapsed:', elapsed, 'ms');
      if (elapsed < MIN_RECORDING_MS) {
        // まだ短すぎる → 何もしない（残り時間をフィードバック）
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        console.log('[MIC] too short, ignoring stop tap');
        return;
      }
      const currentRecording = recordingRef.current;
      if (currentRecording) {
        await stopRecordingWithRef(currentRecording);
      } else {
        micPhaseRef.current = 'idle';
        setIsRecording(false);
        setTranscribeStatus('idle');
      }
    }
  };

  // ─── 日本語ヘルプ: テキスト翻訳 ───
  const handleTranslate = async () => {
    const text = jpInput.trim();
    if (!text) return;
    setIsTranslating(true);
    setTranslationResult(null);
    try {
      const result = await conversationService.translateToEnglish(text);
      setTranslationResult(result);
    } catch {
      Alert.alert('エラー', '翻訳に失敗しました');
    } finally {
      setIsTranslating(false);
    }
  };

  // ─── 日本語ヘルプ: 音声録音開始 ───
  const startJpRecording = async () => {
    if (jpMicPhaseRef.current !== 'idle') return;
    jpMicPhaseRef.current = 'preparing';
    setIsJpPreparing(true);
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        jpMicPhaseRef.current = 'idle';
        setIsJpPreparing(false);
        Alert.alert('権限が必要です', 'マイクの使用を許可してください。');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      jpRecordingRef.current = rec;
      jpMicPhaseRef.current = 'recording';
      setIsJpPreparing(false);
      setIsJpRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      jpMicPhaseRef.current = 'idle';
      setIsJpPreparing(false);
      Alert.alert('エラー', '録音を開始できませんでした。');
    }
  };

  // ─── 日本語ヘルプ: 音声録音停止 → 文字起こし → 翻訳 ───
  const stopJpRecording = async () => {
    if (jpMicPhaseRef.current !== 'recording') return;
    const rec = jpRecordingRef.current;
    if (!rec) return;
    jpMicPhaseRef.current = 'idle';
    setIsJpRecording(false);
    setIsJpPreparing(false);
    setIsTranslating(true);
    setTranslationResult(null);
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      jpRecordingRef.current = null;
      if (uri) {
        const transcribed = await conversationService.transcribeAudio(uri, 'ja');
        if (transcribed) {
          setJpInput(transcribed);
          const result = await conversationService.translateToEnglish(transcribed);
          setTranslationResult(result);
        }
      }
    } catch {
      Alert.alert('エラー', '音声認識に失敗しました。テキストで入力してください。');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleJpMicPress = async () => {
    if (jpMicPhaseRef.current === 'idle') {
      await startJpRecording();
    } else if (jpMicPhaseRef.current === 'recording') {
      await stopJpRecording();
    }
  };

  // ─── 日本語ヘルプ: 英語でそのまま話す ───
  const useTranslationAsInput = (english: string) => {
    setInputText(english);
    setShowJpHelp(false);
    setTranslationResult(null);
    setJpInput('');
  };

  // ─── セッション終了 ───
  const endSession = async (auto = false) => {
    if (!sessionId) return;
    const doEnd = async () => {
      setMode('ending'); // ← ローディング画面へ即座に切り替え
      try {
        const result = await conversationService.endSession(sessionId);
        setSummaryLocal(result.summary);
        setSummary(result.summary);
        setMode('summary');

        // 達成バッジ通知（会話回数の節目で送信）
        if (achievementEnabled && user) {
          const newTotal = (user.total_conversations ?? 0) + 1;
          updateUser({ total_conversations: newTotal });
          await sendAchievementNotification(newTotal);
        }
      } catch {
        setMode('chat'); // 失敗したらチャット画面に戻す
        Alert.alert('エラー', '終了処理に失敗しました');
      }
    };

    if (auto) {
      await doEnd();
    } else {
      Alert.alert('会話を終了しますか？', '', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '終了', style: 'destructive', onPress: doEnd },
      ]);
    }
  };

  const avatarInfo = AVATARS.find(a => a.name === avatarName) || AVATARS[0];
  const messageCorrections: Record<number, Correction> = {};
  corrections.forEach(c => {
    const msg = messages.findLast(m => m.role === 'user' && m.has_mistake && m.content.includes(c.original));
    if (msg) messageCorrections[msg.id] = c;
  });

  // ============ LOADING SCREEN ============
  if (mode === 'loading') {
    const avatarInfo2 = AVATARS.find(a => a.name === avatarName) || AVATARS[0];
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <LinearGradient colors={['#0F172A', '#1E1B4B', '#0F172A']} style={styles.loadingScreen}>
          <Animated.View style={[styles.loadingAvatarWrap, { transform: [{ scale: recordingAnim }] }]}>
            <Text style={styles.loadingAvatarEmoji}>{avatarInfo2.emoji}</Text>
          </Animated.View>
          <Text style={styles.loadingTitle}>{avatarName} と接続中...</Text>
          <Text style={styles.loadingSubtitle}>AIが準備しています。少しお待ちください</Text>
          <View style={styles.loadingDots}>
            {[0, 1, 2].map(i => (
              <Animated.View key={i} style={[styles.loadingDot, {
                opacity: recordingAnim,
                transform: [{ scale: i === 1 ? recordingAnim : 1 }],
              }]} />
            ))}
          </View>
          <ActivityIndicator size="large" color={Colors.primaryLight} style={{ marginTop: Spacing.xl }} />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ============ ENDING SCREEN ============
  if (mode === 'ending') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <LinearGradient colors={['#0F172A', '#1E1B4B', '#0F172A']} style={styles.endingScreen}>
          {/* トロフィー */}
          <Animated.View style={[styles.endingIconWrap, { transform: [{ scale: recordingAnim }] }]}>
            <Ionicons name="trophy" size={44} color={Colors.gold} />
          </Animated.View>
          <Text style={styles.loadingTitle}>結果を集計中...</Text>
          <Text style={styles.loadingSubtitle}>会話の内容を分析しています</Text>

          {/* スコア項目スケルトン（2×2グリッド） */}
          <View style={styles.endingSkeletonGrid}>
            {[
              { label: '総合', color: Colors.primary },
              { label: '流暢さ', color: Colors.info },
              { label: '正確さ', color: Colors.success },
              { label: '語彙', color: Colors.secondary },
            ].map((item, i) => (
              <Animated.View
                key={i}
                style={[styles.endingSkeletonCard, {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.25, 0.65],
                  }),
                }]}
              >
                <View style={[styles.endingSkeletonIcon, { backgroundColor: item.color + '40' }]} />
                <View style={[styles.endingSkeletonScore, { backgroundColor: item.color + '30' }]} />
                <Text style={styles.endingSkeletonLabel}>{item.label}</Text>
              </Animated.View>
            ))}
          </View>

          <ActivityIndicator size="small" color={Colors.primaryLight} style={{ marginTop: Spacing.lg }} />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ============ SETUP SCREEN ============
  if (mode === 'setup') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.setupContent}>
          <Text style={styles.setupTitle}>会話の設定</Text>

          {/* 今日のトピックバナー */}
          {dailyTopicBase && (
            dailyTopicInfo ? (
              /* アクティブ状態: グラデーションカード＋右上に「外す」ボタン */
              <View style={styles.dailyTopicBanner}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={startSession}
                  style={styles.dailyTopicBannerTouchable}
                >
                  <LinearGradient
                    colors={[dailyTopicInfo.color + 'EE', dailyTopicInfo.color + 'AA']}
                    style={styles.dailyTopicBannerGrad}
                    start={{x:0,y:0}} end={{x:1,y:1}}
                  >
                    <View style={styles.dailyTopicBannerLeft}>
                      <View style={styles.dailyTopicBannerBadge}>
                        <Text style={styles.dailyTopicBannerBadgeText}>TODAY</Text>
                      </View>
                      <Text style={styles.dailyTopicBannerEmoji}>{dailyTopicInfo.icon}</Text>
                      <View style={styles.dailyTopicBannerTexts}>
                        <Text style={styles.dailyTopicBannerLabel}>{dailyTopicInfo.label}</Text>
                        <Text style={styles.dailyTopicBannerHint}>{dailyTopicInfo.hint}</Text>
                      </View>
                    </View>
                    <View style={styles.dailyTopicBannerArrow}>
                      <Ionicons name="flash" size={18} color="#fff" />
                      <Text style={styles.dailyTopicBannerArrowText}>今すぐ始める</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 「外す」ボタン：右上に絶対配置 */}
                <TouchableOpacity
                  style={styles.dailyTopicDismiss}
                  onPress={() => setDailyTopicActive(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={22} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
              </View>
            ) : (
              /* 解除済み状態: 薄いチップで再設定できる */
              <TouchableOpacity
                style={styles.dailyTopicRestoreRow}
                onPress={() => setDailyTopicActive(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.dailyTopicRestoreEmoji}>{dailyTopicBase.icon}</Text>
                <Text style={styles.dailyTopicRestoreText}>
                  今日のトピック「{dailyTopicBase.label}」に戻す
                </Text>
                <Ionicons name="refresh" size={14} color={Colors.primary} />
              </TouchableOpacity>
            )
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AIアバターを選ぶ</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((av) => (
                <TouchableOpacity
                  key={av.id}
                  style={[styles.avatarCard, avatarName === av.name && styles.avatarCardActive]}
                  onPress={() => setAvatar(av.name, av.accent)}
                >
                  <Text style={styles.avatarEmoji}>{av.emoji}</Text>
                  <Text style={[styles.avatarName, avatarName === av.name && { color: Colors.primary }]}>{av.name}</Text>
                  <Text style={styles.avatarAccent}>{av.accent}</Text>
                  <Text style={styles.avatarDesc}>{av.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>トピックを選ぶ</Text>
            <View style={styles.topicGrid}>
              {TOPICS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.topicChip, topic === t.id && { borderColor: t.color, backgroundColor: t.color + '20' }]}
                  onPress={() => setTopic(t.id)}
                >
                  <Text style={styles.topicChipIcon}>{t.icon}</Text>
                  <Text style={[styles.topicChipLabel, topic === t.id && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* セッション説明 */}
          <View style={styles.turnInfoCard}>
            <Ionicons name="information-circle" size={18} color={Colors.info} />
            <Text style={styles.turnInfoText}>
              1セッション最大{' '}
              <Text style={{ color: Colors.primary, fontWeight: FontWeight.bold }}>{MAX_TURNS}往復</Text>
              {' '}できます。月の上限は{' '}
              <Text style={{ color: Colors.primary, fontWeight: FontWeight.bold }}>100セッション</Text>
              （プレミアム）です
            </Text>
          </View>

          <Button
            title="会話を始める"
            onPress={startSession}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.startBtn}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============ SUMMARY SCREEN ============
  if (mode === 'summary' && summary) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.summaryContainer}>
          <ScrollView contentContainerStyle={styles.summaryContent}>
            <View style={styles.summaryHero}>
              <View style={styles.summaryTrophyWrap}>
                <Ionicons name="trophy" size={48} color={Colors.gold} />
              </View>
              <Text style={styles.summaryTitle}>会話完了！</Text>
              <Text style={styles.summaryTurns}>{userTurnCount}回のやり取りを達成</Text>
            </View>

            <View style={styles.scoreGrid}>
              {[
                { label: '総合', score: summary.overall_score, color: Colors.primary, icon: 'star' as const },
                { label: '流暢さ', score: summary.fluency_score, color: Colors.info, icon: 'chatbubbles' as const },
                { label: '正確さ', score: summary.accuracy_score, color: Colors.success, icon: 'checkmark-circle' as const },
                { label: '語彙', score: summary.vocabulary_score, color: Colors.secondary, icon: 'book' as const },
              ].map((s, i) => (
                <View key={i} style={styles.scoreCard}>
                  <Ionicons name={s.icon} size={20} color={s.color} />
                  <Text style={[styles.scoreValue, { color: s.color }]}>{s.score}</Text>
                  <Text style={styles.scoreLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.summarySection}>
              <View style={styles.summarySectionHeader}>
                <Ionicons name="document-text" size={16} color={Colors.primary} />
                <Text style={styles.summarySectionTitle}>会話の要約</Text>
              </View>
              <Text style={styles.summaryText}>{summary.summary_ja}</Text>
            </View>

            {summary.strong_points_ja?.length > 0 && (
              <View style={styles.summarySection}>
                <View style={styles.summarySectionHeader}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.summarySectionTitle}>良かった点</Text>
                </View>
                {summary.strong_points_ja.map((p: string, i: number) => (
                  <View key={i} style={styles.bulletRow}>
                    <Ionicons name="chevron-forward" size={14} color={Colors.success} />
                    <Text style={styles.bulletItem}>{p}</Text>
                  </View>
                ))}
              </View>
            )}

            {summary.improvement_areas_ja?.length > 0 && (
              <View style={styles.summarySection}>
                <View style={styles.summarySectionHeader}>
                  <Ionicons name="fitness" size={16} color={Colors.warning} />
                  <Text style={styles.summarySectionTitle}>改善点</Text>
                </View>
                {summary.improvement_areas_ja.map((p: string, i: number) => (
                  <View key={i} style={styles.bulletRow}>
                    <Ionicons name="chevron-forward" size={14} color={Colors.warning} />
                    <Text style={styles.bulletItem}>{p}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── 今日の便利フレーズ ── */}
            {summary.useful_phrases && summary.useful_phrases.length > 0 && (
              <View style={styles.summarySection}>
                <View style={styles.summarySectionHeader}>
                  <Ionicons name="chatbubbles" size={16} color={Colors.info} />
                  <Text style={styles.summarySectionTitle}>今日の会話から学べるフレーズ</Text>
                </View>
                {summary.useful_phrases.map((phrase, i) => (
                  <View key={i} style={styles.summaryPhraseCard}>
                    <View style={styles.summaryPhraseIndex}>
                      <Text style={styles.summaryPhraseIndexText}>{i + 1}</Text>
                    </View>
                    <View style={styles.summaryPhraseBody}>
                      <Text style={styles.summaryPhraseEnglish}>"{phrase.english}"</Text>
                      <Text style={styles.summaryPhraseJapanese}>{phrase.japanese}</Text>
                      {phrase.context_ja ? (
                        <Text style={styles.summaryPhraseContext}>📌 {phrase.context_ja}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.encouragementCard}>
              <Ionicons name="heart" size={18} color={Colors.primary} />
              <Text style={styles.encouragementText}>{summary.encouragement_ja}</Text>
            </View>

          </ScrollView>

          {/* ── 固定アクションボタン（ScrollViewの下・タブバーのすぐ上） ── */}
          <View style={styles.summaryFloatingActions}>
            <TouchableOpacity
              style={styles.summaryPrimaryBtn}
              onPress={() => { resetSession(); setMode('setup'); }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.gradientEnd]}
                style={styles.summaryPrimaryBtnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.summaryPrimaryBtnText}>もう一度会話</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.summarySecondaryBtn}
              onPress={() => router.push('/(main)/vocabulary')}
              activeOpacity={0.85}
            >
              <Ionicons name="library-outline" size={18} color={Colors.primaryLight} />
              <Text style={styles.summarySecondaryBtnText}>単語帳を見る</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ============ CHAT SCREEN ============
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

      {/* ─── 日本語ヘルプ モーダル ─── */}
      <Modal
        visible={showJpHelp}
        animationType="slide"
        transparent
        onRequestClose={() => setShowJpHelp(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.jpModalOverlay}
        >
          {/* 背景タップで閉じる */}
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowJpHelp(false)} activeOpacity={1} />
          <ScrollView
            style={styles.jpModalSheet}
            contentContainerStyle={styles.jpModalSheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ヘッダー */}
            <View style={styles.jpModalHeader}>
              <View style={styles.jpModalTitleRow}>
                <Text style={styles.jpModalFlag}>🇯🇵</Text>
                <Text style={styles.jpModalTitle}>英語でなんて言う？</Text>
              </View>
              <TouchableOpacity onPress={() => setShowJpHelp(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.jpModalSubtitle}>
              日本語で入力するか、マイクで話しかけてください
            </Text>

            {/* 日本語入力 */}
            <View style={styles.jpInputRow}>
              <TextInput
                style={styles.jpTextInput}
                value={jpInput}
                onChangeText={setJpInput}
                placeholder="例: 週末は何をしましたか？"
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={300}
              />
              {/* 日本語マイクボタン */}
              <TouchableOpacity
                style={[styles.jpMicButton, isJpRecording && styles.jpMicButtonRecording]}
                onPress={handleJpMicPress}
                activeOpacity={0.75}
              >
                {isJpPreparing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name={isJpRecording ? 'stop' : 'mic'} size={22} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {isJpRecording && (
              <View style={styles.jpRecordingBanner}>
                <View style={styles.jpRecDot} />
                <Text style={styles.jpRecordingText}>話してください...（もう一度タップで停止）</Text>
              </View>
            )}

            {/* 翻訳ボタン */}
            {!isJpRecording && (
              <TouchableOpacity
                style={[styles.jpTranslateBtn, (!jpInput.trim() || isTranslating) && styles.jpTranslateBtnDisabled]}
                onPress={handleTranslate}
                disabled={!jpInput.trim() || isTranslating}
                activeOpacity={0.8}
              >
                {isTranslating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="language" size={18} color="#fff" />
                    <Text style={styles.jpTranslateBtnText}>英語に翻訳する</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* 翻訳結果 */}
            {translationResult && (
              <View style={styles.jpResultCard}>
                {/* メイン英語 */}
                <View style={styles.jpResultMain}>
                  <Text style={styles.jpResultEnglish}>"{translationResult.english}"</Text>
                  {translationResult.pronunciation_hint ? (
                    <Text style={styles.jpResultPronunciation}>
                      🔊 {translationResult.pronunciation_hint}
                    </Text>
                  ) : null}
                  {translationResult.context_note ? (
                    <Text style={styles.jpResultContext}>{translationResult.context_note}</Text>
                  ) : null}
                </View>

                {/* 代替表現 */}
                {translationResult.alternatives && translationResult.alternatives.length > 0 && (
                  <View style={styles.jpAlternatives}>
                    <Text style={styles.jpAlternativesLabel}>他の言い方：</Text>
                    {translationResult.alternatives.map((alt, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.jpAlternativeItem}
                        onPress={() => useTranslationAsInput(alt.english)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.jpAlternativeLeft}>
                          <Text style={styles.jpAlternativeEnglish}>{alt.english}</Text>
                          <Text style={styles.jpAlternativeNote}>{alt.note}</Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={18} color={Colors.primaryLight} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* これで話すボタン */}
                <TouchableOpacity
                  style={styles.jpUseButton}
                  onPress={() => useTranslationAsInput(translationResult.english)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.gradientEnd]}
                    style={styles.jpUseButtonGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                    <Text style={styles.jpUseButtonText}>これで話す！</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>

        {/* ── ヘッダー ── */}
        <View style={styles.chatHeader}>
          <AvatarDisplay name={avatarName} accent={avatarAccent} isSpeaking={isSpeaking} size="sm" />
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{avatarName}</Text>
            <Text style={styles.chatHeaderStatus}>
              {isSpeaking ? '🔊 話し中...' : isLoading ? '✍️ 考え中...' : '• オンライン'}
            </Text>
          </View>
          <View style={styles.chatHeaderRight}>
            <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>

            {/* ターンカウンター */}
            <View style={[
              styles.turnCounter,
              isNearLimit && styles.turnCounterWarn,
              isAtLimit && styles.turnCounterDone,
            ]}>
              <Ionicons
                name="chatbubbles"
                size={12}
                color={isAtLimit ? Colors.error : isNearLimit ? Colors.warning : Colors.textMuted}
              />
              <Text style={[
                styles.turnCounterText,
                isNearLimit && { color: Colors.warning },
                isAtLimit && { color: Colors.error },
              ]}>
                {userTurnCount}/{MAX_TURNS}
              </Text>
            </View>

            <TouchableOpacity onPress={() => endSession(false)} style={styles.endButton}>
              <Text style={styles.endButtonText}>終了</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 残りターン警告バナー */}
        {isNearLimit && !isAtLimit && (
          <View style={styles.warnBanner}>
            <Ionicons name="time" size={14} color={Colors.warning} />
            <Text style={styles.warnBannerText}>残り {remainingTurns} 回のやり取りです</Text>
          </View>
        )}

        {/* ミス数バッジ */}
        {corrections.length > 0 && (
          <TouchableOpacity style={styles.mistakeBadge} onPress={() => router.push('/(main)/vocabulary')}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.mistakeBadgeText}>{corrections.length}個のミスを記録</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.error} />
          </TouchableOpacity>
        )}

        {/* ── メッセージ ＋ フローティングボタン ── */}
        <View style={styles.messagesContainer}>
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg: Message) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                correction={msg.has_mistake ? messageCorrections[msg.id] || currentCorrection : null}
                avatarEmoji={avatarInfo.emoji}
              />
            ))}
            {isLoading && (
              <View style={styles.typingIndicator}>
                <View style={styles.avatarSmall}>
                  <Text style={{ fontSize: 16 }}>{avatarInfo.emoji}</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>考え中...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* 🌐 英語でなんて言う？フローティングボタン */}
          <TouchableOpacity
            style={styles.jpHelpFab}
            onPress={() => { setShowJpHelp(true); setTranslationResult(null); setJpInput(''); }}
            activeOpacity={0.8}
          >
            <Ionicons name="language" size={15} color="#fff" />
            <Text style={styles.jpHelpFabText}>英語で{'\n'}なんて言う？</Text>
          </TouchableOpacity>
        </View>

        {/* ── コーチングカード（ミスなし時の便利フレーズ） ── */}
        {currentCoaching && (
          <CoachingCard coaching={currentCoaching} onDismiss={() => setCurrentCoaching(null)} />
        )}

        {/* クイック返答 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions} contentContainerStyle={styles.suggestionsContent}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => sendMessage(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── 入力エリア ── */}
        <View style={styles.inputArea}>

          {/* 音声認識ステータス表示 */}
          {transcribeStatus !== 'idle' && (
            <View style={[
              styles.transcribeStatus,
              transcribeStatus === 'recognized' && styles.transcribeStatusRecognized,
            ]}>
              {transcribeStatus === 'listening' ? (
                <>
                  <Animated.View style={[styles.recDot, { transform: [{ scale: recordingAnim }] }]} />
                  <Text style={styles.transcribeText}>話してください...</Text>
                  <Text style={styles.transcribeHint}>ボタンを離すと認識します</Text>
                </>
              ) : transcribeStatus === 'recognized' ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={[styles.transcribeText, styles.transcribeTextRecognized]} numberOfLines={2}>
                    {recognizedText}
                  </Text>
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 4 }} />
                </>
              ) : (
                <>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.transcribeText}>認識中...</Text>
                </>
              )}
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, inputText && styles.textInputActive]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="英語でメッセージを入力..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 長押しPush-to-Talk ボタン */}
          <View style={styles.voiceButtonContainer}>
            {micPermission === 'denied' ? (
              /* マイク権限なし → 設定誘導バナー */
              <TouchableOpacity style={styles.micDeniedBanner} onPress={() => Linking.openSettings()}>
                <Ionicons name="mic-off" size={16} color={Colors.textMuted} />
                <Text style={styles.micDeniedText}>マイク未許可 — テキスト入力で会話できます</Text>
                <Text style={styles.micDeniedLink}>設定を開く</Text>
              </TouchableOpacity>
            ) : isSpeaking ? (
              /* AI発言中 → 波形アニメーション付き待機ボタン */
              <View style={styles.speakingContainer}>
                <LinearGradient
                  colors={[Colors.info + 'CC', Colors.secondary + 'CC']}
                  style={styles.voiceButton}
                >
                  <View style={styles.waveformContainer}>
                    {[speakingBar1, speakingBar2, speakingBar3, speakingBar4].map((bar, i) => (
                      <Animated.View key={i} style={[styles.waveBar, { transform: [{ scaleY: bar }] }]} />
                    ))}
                  </View>
                </LinearGradient>
                <Text style={[styles.voiceButtonLabel, { color: Colors.info }]}>AIが話し中...</Text>
              </View>
            ) : (
              <>
                <Animated.View style={[
                  styles.voiceButtonGlow,
                  {
                    opacity: pulseAnim,
                    transform: [{ scale: recordingAnim }],
                    backgroundColor: isRecording ? Colors.error + '40' : Colors.primary + '30',
                  }
                ]} />
                <Pressable
                  onPress={handleMicPress}
                  disabled={isLoading || isAtLimit}
                  style={({ pressed }) => [styles.voiceButtonPressable]}
                >
                  <LinearGradient
                    colors={
                      isAtLimit ? [Colors.textMuted, Colors.textMuted] :
                      isRecording ? [Colors.error, '#DC2626'] :
                      isPreparing ? [Colors.primary + 'AA', Colors.gradientEnd + 'AA'] :
                      [Colors.primary, Colors.gradientEnd]
                    }
                    style={styles.voiceButton}
                  >
                    {isPreparing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name={isRecording ? 'stop' : 'mic'} size={30} color="#fff" />
                    )}
                  </LinearGradient>
                </Pressable>
                <Text style={[
                  styles.voiceButtonLabel,
                  isRecording && { color: Colors.error },
                  isPreparing && { color: Colors.primaryLight },
                ]}>
                  {isAtLimit
                    ? '上限に達しました'
                    : isRecording
                    ? (recordingSec < 2 ? `話し続けてください... ${recordingSec}s` : `タップで送信 (${recordingSec}s)`)
                    : isPreparing
                    ? '準備中...'
                    : 'タップして話す'}
                </Text>
              </>
            )}
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  /* Loading */
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  loadingAvatarWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(79,70,229,0.2)',
    borderWidth: 2, borderColor: Colors.primaryLight + '60',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  loadingAvatarEmoji: { fontSize: 60 },
  loadingTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center' },
  loadingSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  loadingDots: { flexDirection: 'row', gap: Spacing.sm },
  loadingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primaryLight },

  /* Ending */
  endingScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.sm,
  },
  endingIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.gold + '20',
    borderWidth: 2, borderColor: Colors.gold + '40',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  endingSkeletonGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.sm, marginTop: Spacing.lg,
    width: '100%',
  },
  endingSkeletonCard: {
    width: '47%',            // 2列グリッド
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center', gap: 6,
  },
  endingSkeletonIcon: {
    width: 24, height: 24, borderRadius: 12,
  },
  endingSkeletonScore: {
    width: 40, height: 22, borderRadius: 6,
  },
  endingSkeletonLabel: {
    fontSize: FontSize.xs, color: Colors.textMuted,
  },

  /* Setup */
  setupContent: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 100 },
  setupTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  section: { gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  /* 今日のトピックバナー（セットアップ画面） */
  dailyTopicBanner: {
    position: 'relative',   // 「外す」ボタンの絶対配置基準
  },
  dailyTopicBannerTouchable: {},
  dailyTopicBannerGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  dailyTopicBannerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dailyTopicBannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  dailyTopicBannerBadgeText: { fontSize: 9, fontWeight: FontWeight.extrabold, color: '#fff', letterSpacing: 1 },
  dailyTopicBannerEmoji: { fontSize: 26 },
  dailyTopicBannerTexts: { flex: 1, gap: 2 },
  dailyTopicBannerLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
  dailyTopicBannerHint: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.85)', lineHeight: 16 },
  dailyTopicBannerArrow: {
    flexDirection: 'column', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: BorderRadius.md,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  dailyTopicBannerArrowText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  /* 「外す」ボタン：バナー右上に絶対配置 */
  dailyTopicDismiss: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* 解除後の「戻す」行 */
  dailyTopicRestoreRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  dailyTopicRestoreEmoji: { fontSize: 18 },
  dailyTopicRestoreText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  avatarGrid: { flexDirection: 'row', gap: Spacing.sm },
  avatarCard: {
    flex: 1, alignItems: 'center', gap: 4, padding: Spacing.sm,
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  avatarCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(79,70,229,0.1)' },
  avatarEmoji: { fontSize: 32 },
  avatarName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  avatarAccent: { fontSize: FontSize.xs, color: Colors.textMuted },
  avatarDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  topicChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  topicChipIcon: { fontSize: 16 },
  topicChipLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  turnInfoCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.info + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.info + '30',
  },
  turnInfoText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  startBtn: { marginTop: Spacing.sm },

  /* Chat header */
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  chatHeaderStatus: { fontSize: FontSize.xs, color: Colors.success },
  chatHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  timer: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: 'monospace' },

  /* ターンカウンター */
  turnCounter: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  turnCounterWarn: { backgroundColor: Colors.warning + '20', borderColor: Colors.warning + '60' },
  turnCounterDone: { backgroundColor: Colors.error + '20', borderColor: Colors.error + '60' },
  turnCounterText: { fontSize: 11, color: Colors.textMuted, fontWeight: FontWeight.semibold },

  endButton: { backgroundColor: Colors.error + '20', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  endButtonText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  /* 警告バナー */
  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.warning + '40',
  },
  warnBannerText: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.medium },

  mistakeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.error + '15',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.error + '30',
  },
  mistakeBadgeText: { flex: 1, fontSize: FontSize.xs, color: Colors.error },

  messagesContainer: { flex: 1, position: 'relative' },
  messages: { flex: 1 },
  messagesContent: { paddingVertical: Spacing.md, paddingBottom: Spacing.xl },
  typingIndicator: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: Spacing.md, marginVertical: 6 },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md },
  typingText: { color: Colors.textMuted, fontSize: FontSize.sm },

  suggestions: { maxHeight: 44, marginBottom: 4 },
  suggestionsContent: { paddingHorizontal: Spacing.md, gap: 8, alignItems: 'center' },
  suggestionChip: {
    backgroundColor: 'rgba(79,70,229,0.15)', borderRadius: BorderRadius.full,
    paddingVertical: 6, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  suggestionText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: FontWeight.medium },

  /* 入力エリア */
  inputArea: {
    padding: Spacing.md, gap: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },

  /* 音声認識ステータス */
  transcribeStatus: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.error + '50',
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error },
  transcribeText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  transcribeTextRecognized: { color: Colors.textPrimary, fontStyle: 'italic' },
  transcribeStatusRecognized: { borderColor: Colors.success + '60', backgroundColor: Colors.success + '12' },
  transcribeHint: { fontSize: FontSize.xs, color: Colors.textMuted },

  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  textInput: {
    flex: 1, backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: 10, color: Colors.textPrimary,
    fontSize: FontSize.md, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.border,
  },
  textInputActive: { borderColor: Colors.primary + '80' },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: Colors.textMuted },

  /* AI発言中の波形ボタン */
  speakingContainer: { alignItems: 'center', gap: 6 },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
  },
  waveBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#fff',
  },

  /* マイク権限なしバナー */
  micDeniedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  micDeniedText: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted },
  micDeniedLink: { fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.semibold },

  /* 🌐 英語でなんて言う？フローティングボタン */
  jpHelpFab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.lg,
    paddingVertical: 9,
    paddingHorizontal: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 66,
  },
  jpHelpFabText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 14,
  },

  /* 日本語ヘルプ モーダル */
  jpModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  jpModalSheet: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  jpModalSheetContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  jpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jpModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  jpModalFlag: {
    fontSize: 26,
  },
  jpModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  jpModalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  jpInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  jpTextInput: {
    flex: 1,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    minHeight: 48,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jpMicButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jpMicButtonRecording: {
    backgroundColor: Colors.error,
  },
  jpRecordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  jpRecDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  jpRecordingText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    flex: 1,
  },
  jpTranslateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
  },
  jpTranslateBtnDisabled: {
    opacity: 0.45,
  },
  jpTranslateBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  jpResultCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  jpResultMain: {
    gap: 6,
  },
  jpResultEnglish: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    lineHeight: 28,
  },
  jpResultPronunciation: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  jpResultContext: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  jpAlternatives: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: 6,
  },
  jpAlternativesLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },
  jpAlternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  jpAlternativeLeft: {
    flex: 1,
    gap: 2,
  },
  jpAlternativeEnglish: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  jpAlternativeNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  jpUseButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: 4,
  },
  jpUseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
  },
  jpUseButtonText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  /* Push-to-Talk ボタン */
  voiceButtonContainer: { alignItems: 'center', gap: 6 },
  voiceButtonGlow: {
    position: 'absolute', top: -10,
    width: 84, height: 84, borderRadius: 42,
  },
  voiceButtonPressable: {},
  voiceButton: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  voiceButtonLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },

  /* Summary */
  summaryContent: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 100 },
  summaryHero: { alignItems: 'center', gap: Spacing.sm },
  summaryTrophyWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  summaryTurns: { fontSize: FontSize.sm, color: Colors.textSecondary },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  scoreCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: 4 },
  scoreValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold },
  scoreLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summarySection: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm },
  summarySectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summarySectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  summaryText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  bulletItem: { flex: 1, fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  /* 便利フレーズカード（サマリー） */
  summaryPhraseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.info + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.info + '25',
  },
  summaryPhraseIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  summaryPhraseIndexText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  summaryPhraseBody: {
    flex: 1,
    gap: 3,
  },
  summaryPhraseEnglish: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    lineHeight: 22,
  },
  summaryPhraseJapanese: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryPhraseContext: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },

  encouragementCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: 'rgba(79,70,229,0.1)', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.primary + '30' },
  encouragementText: { flex: 1, fontSize: FontSize.md, color: Colors.primaryLight, lineHeight: 24 },
  summaryContainer: { flex: 1 },
  summaryActions: { gap: Spacing.sm },

  /* サマリー 固定アクションバー（flex配置・absoluteなし） */
  summaryFloatingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryPrimaryBtn: {
    flex: 1,
    borderRadius: BorderRadius.lg,
  },
  summaryPrimaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  summaryPrimaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
  summarySecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary + '60',
    backgroundColor: Colors.primary + '10',
  },
  summarySecondaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryLight,
  },
});
