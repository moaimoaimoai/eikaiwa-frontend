import api from './api';
import { SavedPhrase } from '../types';

export interface SavedPhrasesResponse {
  results: SavedPhrase[];
  count: number;
}

export async function fetchSavedPhrases(params?: {
  source?: 'coaching' | 'summary' | 'correction';
  mastered?: boolean;
}): Promise<SavedPhrasesResponse> {
  const query: Record<string, string> = {};
  if (params?.source) query.source = params.source;
  if (params?.mastered !== undefined) query.mastered = String(params.mastered);
  const response = await api.get('/phrases/saved/', { params: query });
  return response.data;
}

export async function deleteSavedPhrase(phraseId: number): Promise<void> {
  await api.delete(`/phrases/saved/${phraseId}/delete/`);
}

export async function toggleSavedPhraseMastered(
  phraseId: number
): Promise<{ is_mastered: boolean }> {
  const response = await api.post(`/phrases/saved/${phraseId}/mastered/`);
  return response.data;
}

export async function bulkCreateSavedPhrases(params: {
  phrases: Array<{ english: string; japanese: string; context_ja?: string }>;
  session_id?: number;
  source?: 'coaching' | 'summary' | 'correction';
  session_topic?: string;
}): Promise<{ created: number }> {
  const response = await api.post('/phrases/saved/bulk/', params);
  return response.data;
}
