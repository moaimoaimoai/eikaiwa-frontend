import api, { BASE_URL } from './api';
import * as SecureStore from 'expo-secure-store';
import { ConversationSession, Message, Correction, ConversationSummary, TranslationResult, CoachingTip } from '../types';

export const conversationService = {
  async startSession(topic: string, avatarName: string, avatarAccent: string) {
    const response = await api.post('/conversation/start/', {
      topic,
      avatar_name: avatarName,
      avatar_accent: avatarAccent,
    });
    return response.data as { session_id: number; message: Message };
  },

  async sendMessage(sessionId: number, content: string, includeAudio = false) {
    const response = await api.post(`/conversation/${sessionId}/message/`, {
      content,
      include_audio: includeAudio,
    });
    return response.data as {
      user_message: Message;
      ai_message: Message;
      correction: Correction | null;
      coaching: CoachingTip | null;
      audio_base64: string | null;
    };
  },

  async endSession(sessionId: number) {
    const response = await api.post(`/conversation/${sessionId}/end/`);
    return response.data as { session: ConversationSession; summary: ConversationSummary };
  },

  async getSessions() {
    const response = await api.get('/conversation/sessions/');
    return response.data.results as ConversationSession[];
  },

  async getSession(sessionId: number) {
    const response = await api.get(`/conversation/${sessionId}/`);
    return response.data as ConversationSession;
  },

  async synthesizeSpeech(text: string, voice = 'nova'): Promise<string> {
    const response = await api.post('/conversation/audio/synthesize/', { text, voice });
    return response.data.audio_base64;
  },

  async translateToEnglish(japaneseText: string): Promise<TranslationResult> {
    const response = await api.post('/conversation/translate/', { text: japaneseText });
    return response.data as TranslationResult;
  },

  async transcribeAudio(audioUri: string, language: 'en' | 'ja' = 'en'): Promise<string> {
    // axios は React Native の FormData + multipart を正しく扱えない場合があるため
    // fetch を直接使用する。fetch は Content-Type+boundary を自動設定する。
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    } as any);
    if (language === 'ja') {
      formData.append('language', 'ja');
    }

    const token = await SecureStore.getItemAsync('access_token');
    const url = `${BASE_URL}/api/conversation/audio/transcribe/`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`transcribeAudio failed: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  },
};
