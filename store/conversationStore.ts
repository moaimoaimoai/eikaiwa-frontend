import { create } from 'zustand';
import { Message, Correction, ConversationSummary } from '../types';

interface ConversationState {
  sessionId: number | null;
  messages: Message[];
  corrections: Correction[];
  isLoading: boolean;
  summary: ConversationSummary | null;
  topic: string;
  avatarName: string;
  avatarAccent: string;

  setSession: (id: number) => void;
  addMessage: (message: Message) => void;
  addCorrection: (correction: Correction) => void;
  setLoading: (loading: boolean) => void;
  setSummary: (summary: ConversationSummary) => void;
  resetSession: () => void;
  setTopic: (topic: string) => void;
  setAvatar: (name: string, accent: string) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  sessionId: null,
  messages: [],
  corrections: [],
  isLoading: false,
  summary: null,
  topic: 'free',
  avatarName: 'Emma',
  avatarAccent: 'American',

  setSession: (id) => set({ sessionId: id }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  addCorrection: (correction) => set((state) => ({ corrections: [...state.corrections, correction] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setSummary: (summary) => set({ summary }),

  resetSession: () => set({
    sessionId: null,
    messages: [],
    corrections: [],
    isLoading: false,
    summary: null,
  }),

  setTopic: (topic) => set({ topic }),
  setAvatar: (name, accent) => set({ avatarName: name, avatarAccent: accent }),
}));
