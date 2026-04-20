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
};
