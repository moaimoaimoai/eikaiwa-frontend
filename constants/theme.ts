export const Colors = {
  // Primary palette - Deep Navy + Vibrant Coral
  primary: '#4F46E5',       // Indigo - main brand color
  primaryLight: '#818CF8',  // Light indigo
  primaryDark: '#3730A3',   // Dark indigo
  secondary: '#F97316',     // Orange - accent
  secondaryLight: '#FDBA74',

  // Semantic
  success: '#22C55E',
  successLight: '#86EFAC',
  error: '#EF4444',
  errorLight: '#FCA5A5',
  warning: '#F59E0B',
  warningLight: '#FCD34D',
  info: '#06B6D4',

  // Backgrounds
  background: '#0F172A',    // Dark navy
  backgroundSecondary: '#1E293B',
  backgroundCard: '#1E293B',
  backgroundInput: '#334155',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',

  // Borders
  border: '#334155',
  borderLight: '#475569',

  // Special
  gold: '#F59E0B',
  gradientStart: '#4F46E5',
  gradientEnd: '#7C3AED',
  gradientAccent: ['#4F46E5', '#7C3AED'] as const,

  // Mistake types
  grammar: '#EF4444',
  vocabulary: '#F97316',
  pronunciation: '#8B5CF6',
  spelling: '#06B6D4',
  other: '#64748B',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const AVATARS = [
  {
    id: 'emma',
    name: 'Emma',
    accent: 'American',
    description: 'NYC出身のフレンドリーな先生',
    emoji: '👩‍🏫',
    voice: 'nova',
    color: '#4F46E5',
  },
  {
    id: 'james',
    name: 'James',
    accent: 'British',
    description: 'ロンドン出身のビジネスプロ',
    emoji: '👨‍💼',
    voice: 'onyx',
    color: '#0891B2',
  },
  {
    id: 'lily',
    name: 'Lily',
    accent: 'Australian',
    description: 'シドニー出身の旅行好き',
    emoji: '🌺',
    voice: 'shimmer',
    color: '#059669',
  },
];

export const TOPICS = [
  { id: 'free', label: 'フリー会話', icon: '💬', color: '#4F46E5' },
  { id: 'daily_life', label: '日常生活', icon: '🏠', color: '#0891B2' },
  { id: 'travel', label: '旅行', icon: '✈️', color: '#059669' },
  { id: 'business', label: 'ビジネス', icon: '💼', color: '#D97706' },
  { id: 'culture', label: '文化', icon: '🎭', color: '#7C3AED' },
  { id: 'hobby', label: '趣味', icon: '🎨', color: '#DB2777' },
];
