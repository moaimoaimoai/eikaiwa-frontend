import api from './api';
import { Mistake, QuizQuestion } from '../types';

export const mistakesService = {
  async getMistakes(type?: string, mastered?: boolean): Promise<Mistake[]> {
    const params: Record<string, any> = {};
    if (type) params.type = type;
    if (mastered !== undefined) params.mastered = mastered;
    const response = await api.get('/mistakes/', { params });
    return response.data.results || response.data;
  },

  async markMastered(id: number) {
    const response = await api.post(`/mistakes/${id}/mastered/`);
    return response.data;
  },

  async getMistakesQuiz(count = 5, type?: string): Promise<QuizQuestion[]> {
    const params: Record<string, any> = { count };
    if (type) params.type = type;
    const response = await api.get('/mistakes/quiz/', { params });
    return response.data.questions;
  },

  async submitQuizAnswer(mistakeId: number, isCorrect: boolean) {
    const response = await api.post('/mistakes/quiz/submit/', {
      mistake_id: mistakeId,
      is_correct: isCorrect,
    });
    return response.data;
  },

  async getSummary() {
    const response = await api.get('/mistakes/summary/');
    return response.data;
  },
};
