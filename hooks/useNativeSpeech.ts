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
  // ネイティブモジュール未リビルド時は graceful degrade
}

export type NativeSpeechStatus = 'idle' | 'preparing' | 'listening' | 'recognized' | 'error';

interface UseNativeSpeechOptions {
  lang?: string;
  interimResults?: boolean;
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface UseNativeSpeechReturn {
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

  // コールバックは常に最新版を参照（stale closure 対策）
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  /**
   * ユーザーが明示的に stop() を呼んだかどうかのフラグ。
   * 無音自動停止（iOS の silence detection）との区別に使う。
   *   true  → ユーザーがボタンを押して停止 → onResult を呼ぶ
   *   false → 無音タイムアウト等による自動停止 → 送信しない
   */
  const manualStopRef = useRef(false);
  /**
   * isFinal: true で確定したテキストを保持。
   * end イベント時に参照する（state は非同期なので ref で持つ）。
   */
  const finalTranscriptRef = useRef('');

  // ── 認識結果 ──
  useSpeechRecognitionEvent('result', (event: any) => {
    const best = event.results?.[0]?.transcript ?? '';
    if (event.isFinal) {
      finalTranscriptRef.current = best;
      setTranscript(best);
      setInterimTranscript('');
      // continuous: true のため、ここでは onResult を呼ばない
      // → ユーザーが stop() を押したときに end イベント経由で呼ぶ
    } else {
      setInterimTranscript(best);
    }
  });

  // ── 認識開始 ──
  useSpeechRecognitionEvent('start', () => {
    setStatus('listening');
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  });

  // ── 認識終了 ──
  useSpeechRecognitionEvent('end', () => {
    const text = finalTranscriptRef.current;
    finalTranscriptRef.current = '';
    setInterimTranscript('');

    if (manualStopRef.current && text.trim()) {
      // ユーザーが明示的に停止 → 結果を返す
      manualStopRef.current = false;
      setStatus('recognized');
      onResultRef.current?.(text);
    } else {
      // 無音自動停止 / 結果なし → 送信せず idle へ
      manualStopRef.current = false;
      setStatus('idle');
    }
  });

  // ── エラー ──
  useSpeechRecognitionEvent('error', (event: any) => {
    const msg = event.error ?? 'unknown error';
    manualStopRef.current = false;
    finalTranscriptRef.current = '';
    setInterimTranscript('');
    if (msg === 'no-speech') {
      setStatus('idle');
    } else {
      setStatus('error');
      onErrorRef.current?.(msg);
    }
  });

  const start = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) {
      onErrorRef.current?.('module_not_available');
      return;
    }
    try {
      manualStopRef.current = false;
      finalTranscriptRef.current = '';
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
        continuous: true,       // 無音でも自動停止しない
        iosTaskHint: 'unspecified',
      });
    } catch (e: any) {
      setStatus('error');
      onErrorRef.current?.(e?.message ?? 'start failed');
    }
  }, [lang, interimResults]);

  const stop = useCallback(() => {
    manualStopRef.current = true;   // ユーザーによる明示的停止としてマーク
    ExpoSpeechRecognitionModule?.stop();
  }, []);

  const cancel = useCallback(() => {
    manualStopRef.current = false;
    finalTranscriptRef.current = '';
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
