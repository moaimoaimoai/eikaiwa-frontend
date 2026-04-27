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

  /** AIが毎回生成する単語カード（重複防止・1日上限付き） */
  async getAIWords(level?: string, force = false): Promise<AIWordResult> {
    const params: Record<string, string> = {};
    if (level) params.level = level;
    if (force) params.force = 'true';
    try {
      const response = await api.get('/phrases/ai-words/', { params });
      return {
        words: response.data.words || [],
        remaining_today: response.data.remaining_today ?? null,
        used_today: response.data.used_today ?? null,
        daily_limit: response.data.daily_limit ?? 5,
        limit_reached: false,
      };
    } catch (e: any) {
      if (e?.response?.status === 429) {
        return {
          words: e.response.data.words || [],
          remaining_today: 0,
          used_today: e.response.data.daily_limit ?? 5,
          daily_limit: e.response.data.daily_limit ?? 5,
          limit_reached: true,
        };
      }
      throw e;
    }
  },

  /** AIが毎回生成するウォームアップフレーズ（重複防止・1日上限付き） */
  async getAIWarmupPhrases(level?: string, force = false): Promise<AIWarmupResult> {
    const params: Record<string, string> = {};
    if (level) params.level = level;
    if (force) params.force = 'true';
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
  remaining_today: number | null;
  used_today: number | null;
  daily_limit: number;
  limit_reached: boolean;
}

/** AIが生成する単語カードの型 */
export interface AIWord {
  word: string;
  reading: string;
  definition_ja: string;
  part_of_speech: string;
  example_sentence: string;
  example_sentence_ja: string;
  memory_hook: string;
  hash: string;
}

/** AI単語生成API のレスポンス型 */
export interface AIWordResult {
  words: AIWord[];
  remaining_today: number | null;
  used_today: number | null;
  daily_limit: number;
  limit_reached: boolean;
}
