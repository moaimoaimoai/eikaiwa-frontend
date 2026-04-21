import api from './api';
import { Phrase, Word, QuizQuestion } from '../types';

export const phrasesService = {
  async getWarmupPhrases(level?: string, category?: string): Promise<Phrase[]> {
    const params: Record<string, string> = {};
    if (level) params.level = level;
    if (category) params.category = category;
    const response = await api.get('/phrases/warmup/', { params });
    return response.data.results || response.data;
  },

  async getCategories() {
    const response = await api.get('/phrases/categories/');
    return response.data.results || response.data;
  },

  async getPhrases(level?: string, category?: string): Promise<Phrase[]> {
    const params: Record<string, string> = {};
    if (level) params.level = level;
    if (category) params.category = category;
    const response = await api.get('/phrases/list/', { params });
    return response.data.results || response.data;
  },

  async getWords(level?: string): Promise<Word[]> {
    const params: Record<string, string> = {};
    if (level) params.level = level;
    const response = await api.get('/phrases/words/', { params });
    return response.data.results || response.data;
  },

  async markPhrasePracticed(phraseId: number) {
    const response = await api.post(`/phrases/${phraseId}/practiced/`);
    return response.data;
  },

  async getPhrasesQuiz(count = 5): Promise<QuizQuestion[]> {
    const response = await api.get('/phrases/quiz/phrases/', { params: { count } });
    return response.data.questions;
  },

  async getWordsQuiz(count = 5): Promise<QuizQuestion[]> {
    const response = await api.get('/phrases/quiz/words/', { params: { count } });
    return response.data.questions;
  },

  /** AIが毎回生成するウォームアップフレーズ（重複防止・1日上限付き） */
  async getAIWarmupPhrases(level?: string): Promise<AIWarmupResult> {
    const params: Record<string, string> = {};
    if (level) params.level = level;
    try {
      const response = await api.get('/phrases/ai-warmup/', { params });
      return {
        phrases: response.data.phrases || [],
        remaining_today: response.data.remaining_today ?? null,
        used_today: response.data.used_today ?? null,
        daily_limit: response.data.daily_limit ?? 5,
        limit_reached: false,
      };
    } catch (e: any) {
      // 429: 1日の上限に達した場合も、今日生成済みのフレーズを返す
      if (e?.response?.status === 429) {
        return {
          phrases: e.response.data.phrases || [],
          remaining_today: 0,
          used_today: e.response.data.daily_limit ?? 5,
          daily_limit: e.response.data.daily_limit ?? 5,
          limit_reached: true,
        };
      }
      throw e;
    }
  },
};

/** AIが生成するフレーズの型（DBのPhraseとは別） */
export interface AIPhrase {
  english: string;
  japanese: string;
  pronunciation_hint: string;
  example_context: string;
  category_label: string;
  hash: string;
}

/** AI生成API のレスポンス型 */
export interface AIWarmupResult {
  phrases: AIPhrase[];
  remaining_today: number | null;  // 本日の残り生成回数（nullは未取得）
  used_today: number | null;        // 本日の使用回数
  daily_limit: number;              // 1日の上限
  limit_reached: boolean;           // 上限到達フラグ
}
