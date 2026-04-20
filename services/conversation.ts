import api from './api';
import { ConversationSession, Message, Correction, ConversationSummary } from '../types';

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

  async transcribeAudio(audioUri: string): Promise<string> {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    } as any);

    const response = await api.post('/conversation/audio/transcribe/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.text;
  },
};
