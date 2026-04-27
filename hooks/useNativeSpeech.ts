import { useRef, useState, useCallback } from 'react';

// expo-speech-recognition はネイティブビルドが必要なため、
// 未リビルドの場合に備えて動的インポートでモジュールの存在チェックを行う
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = (_: string, __: any) => {};

try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  // ネイティブモジュール未リビルド時は何もしない（フォールバックで graceful degrade）
}

export type NativeSpeechStatus = 'idle' | 'preparing' | 'listening' | 'recognized' | 'error';

interface UseNativeSpeechOptions {
  lang?: string;
  /** 認識中のテキストを随時更新するか（true=リアルタイム表示） */
  interimResults?: boolean;
  /** 最終的な認識結果が確定したときのコールバック */
  onResult?: (text: string) => void;
  /** エラー発生時のコールバック */
  onError?: (error: string) => void;
}

interface UseNativeSpeechReturn {
  status: NativeSpeechStatus;
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
}

export function useNativeSpeech({
  lang = 'en-US',
  interimResults = true,
  onResult,
  onError,
}: UseNativeSpeechOptions = {}): UseNativeSpeechReturn {
  const [status, setStatus] = useState<NativeSpeechStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  // コールバックは常に最新のものを参照するよう ref で保持（stale closure 対策）
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // ── 音声認識結果 ──
  useSpeechRecognitionEvent('result', (event) => {
    const best = event.results?.[0]?.transcript ?? '';
    if (event.isFinal) {
      setTranscript(best);
      setInterimTranscript('');
      setStatus('recognized');
      onResultRef.current?.(best);
    } else {
      setInterimTranscript(best);
    }
  });

  // ── 認識開始 ──
  useSpeechRecognitionEvent('start', () => {
    setStatus('listening');
    setTranscript('');
    setInterimTranscript('');
  });

  // ── 認識終了（自動停止・無音タイムアウト等） ──
  useSpeechRecognitionEvent('end', () => {
    setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
    setInterimTranscript('');
  });

  // ── エラー ──
  useSpeechRecognitionEvent('error', (event) => {
    const msg = event.error ?? 'unknown error';
    // no-speech はユーザーが話さなかっただけなので静かに idle へ
    if (msg === 'no-speech') {
      setStatus('idle');
    } else {
      setStatus('error');
      onErrorRef.current?.(msg);
    }
    setInterimTranscript('');
  });

  const start = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) {
      onErrorRef.current?.('module_not_available');
      return;
    }
    try {
      setStatus('preparing');
      setTranscript('');
      setInterimTranscript('');

      const permitted = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permitted.granted) {
        setStatus('error');
        onErrorRef.current?.('permission_denied');
        return;
      }

      await ExpoSpeechRecognitionModule.start({
        lang,
        interimResults,
        iosTaskHint: 'unspecified',
        audioSessionOptions: {
          category: 'PlayAndRecord',
          categoryOptions: ['DefaultToSpeaker', 'AllowBluetooth'],
          mode: 'Measurement',
        },
      });
    } catch (e: any) {
      setStatus('error');
      onErrorRef.current?.(e?.message ?? 'start failed');
    }
  }, [lang, interimResults]);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule?.stop();
  }, []);

  const cancel = useCallback(() => {
    ExpoSpeechRecognitionModule?.abort();
    setStatus('idle');
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    status,
    transcript,
    interimTranscript,
    isListening: status === 'listening' || status === 'preparing',
    start,
    stop,
    cancel,
  };
}
