export interface User {
  id: number;
  email: string;
  username: string;
  display_name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  total_conversations: number;
  total_minutes: number;
  streak_days: number;
  created_at: string;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at?: string;
  monthly_sessions_used: number;
  is_premium: boolean;
  monthly_limit: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Phrase {
  id: number;
  english: string;
  japanese: string;
  pronunciation_hint: string;
  example_context: string;
  level: string;
  category_name: string;
  audio_url?: string;
  is_practiced: boolean;
}

export interface Word {
  id: number;
  word: string;
  definition: string;
  definition_ja: string;
  part_of_speech: string;
  example_sentence: string;
  example_sentence_ja: string;
  level: string;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  corrected_content?: string;
  has_mistake: boolean;
  created_at: string;
}

export interface UsefulPhrase {
  english: string;
  japanese: string;
}

export interface Correction {
  has_mistake: boolean;
  original: string;
  corrected: string;
  explanation: string;
  mistake_type: 'grammar' | 'vocabulary' | 'preposition' | 'collocation' | 'unnatural' | 'word_order' | 'article' | 'pronunciation' | 'spelling' | 'other';
  /** true = 文法的には正しいが不自然・ネイティブらしくない表現 */
  is_unnatural_only?: boolean;
  advice_ja?: string;
  /** より上級・洗練された表現の提案 */
  level_up?: string;
  useful_phrases?: UsefulPhrase[];
}

export interface TranslationResult {
  english: string;
  pronunciation_hint: string;
  alternatives: Array<{ english: string; note: string }>;
  context_note: string;
}

export interface CoachingTip {
  tip_ja: string;
  useful_phrases: UsefulPhrase[];
}

export interface ConversationSession {
  id: number;
  topic: string;
  avatar_name: string;
  avatar_accent: string;
  is_active: boolean;
  duration_minutes: number;
  message_count: number;
  mistake_count: number;
  created_at: string;
  messages: Message[];
}

export interface Mistake {
  id: number;
  original_text: string;
  corrected_text: string;
  explanation: string;
  mistake_type: 'grammar' | 'vocabulary' | 'pronunciation' | 'spelling' | 'other';
  context: string;
  is_mastered: boolean;
  quiz_count: number;
  correct_count: number;
  accuracy_rate: number;
  session_topic?: string;
  session_date?: string;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  question_detail?: string;
  correct_answer: string;
  options: string[];
  explanation?: string;
  pronunciation_hint?: string;
  mistake_type?: string;
  context?: string;
}

export interface SummaryPhrase {
  english: string;
  japanese: string;
  context_ja: string;
}

export interface ConversationSummary {
  summary_ja: string;
  strong_points_ja: string[];
  improvement_areas_ja: string[];
  overall_score: number;
  fluency_score: number;
  accuracy_score: number;
  vocabulary_score: number;
  encouragement_ja: string;
  useful_phrases?: SummaryPhrase[];
}

export interface SavedPhrase {
  id: number;
  english: string;
  japanese: string;
  context_ja: string;
  source: 'coaching' | 'summary' | 'correction';
  session_topic: string;
  is_mastered: boolean;
  created_at: string;
}

export interface TrendData {
  overview: {
    total_sessions: number;
    total_minutes: number;
    streak_days: number;
    total_mistakes: number;
    mastered_mistakes: number;
  };
  daily_activity: Array<{
    date: string;
    session_count: number;
    minutes: number;
    mistakes: number;
  }>;
  weekly_progress: Array<{
    week: number;
    sessions: number;
    minutes: number;
    mistakes: number;
    mastered: number;
  }>;
  mistake_distribution: Record<string, {
    label: string;
    count: number;
    percentage: number;
  }>;
  topic_distribution: Array<{ topic: string; count: number }>;
  suggestions: Array<{
    type: string;
    title: string;
    body: string;
  }>;
}
