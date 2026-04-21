import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import { Message, Correction } from '../types';

interface MessageBubbleProps {
  message: Message;
  correction?: Correction | null;
  avatarEmoji?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message, correction, avatarEmoji = '👩‍🏫'
}) => {
  const isUser = message.role === 'user';
  const [showCorrection, setShowCorrection] = useState(!!correction);
  const [showPhrases, setShowPhrases] = useState(false);

  const mistakeTypeColors: Record<string, string> = {
    grammar: Colors.grammar,
    vocabulary: Colors.vocabulary,
    pronunciation: Colors.pronunciation,
    spelling: Colors.spelling,
    other: Colors.other,
  };

  const mistakeTypeLabels: Record<string, string> = {
    grammar: '文法',
    vocabulary: '語彙',
    pronunciation: '発音',
    spelling: 'スペル',
    other: 'その他',
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {!isUser && (
        <View style={styles.avatarSmall}>
          <Text style={{ fontSize: 20 }}>{avatarEmoji}</Text>
        </View>
      )}

      <View style={[styles.bubbleWrapper, isUser ? styles.userBubbleWrapper : styles.aiBubbleWrapper]}>
        {/* Main bubble */}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {message.content}
          </Text>
          {message.has_mistake && (
            <View style={styles.mistakeIndicator}>
              <Ionicons name="alert-circle" size={14} color={Colors.error} />
              <Text style={styles.mistakeIndicatorText}>ミスあり</Text>
            </View>
          )}
        </View>

        {/* Correction card */}
        {correction && showCorrection && (
          <View style={[styles.correctionCard, { borderLeftColor: mistakeTypeColors[correction.mistake_type] || Colors.error }]}>
            {/* Header */}
            <View style={styles.correctionHeader}>
              <View style={[styles.correctionBadge, { backgroundColor: (mistakeTypeColors[correction.mistake_type] || Colors.error) + '25' }]}>
                <Ionicons name="construct" size={11} color={mistakeTypeColors[correction.mistake_type] || Colors.error} />
                <Text style={[styles.correctionBadgeText, { color: mistakeTypeColors[correction.mistake_type] || Colors.error }]}>
                  {mistakeTypeLabels[correction.mistake_type] || 'その他'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCorrection(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Original → Corrected */}
            <View style={styles.correctionRow}>
              <Text style={styles.correctionLabel}>❌</Text>
              <Text style={styles.originalText}>{correction.original}</Text>
            </View>
            <View style={styles.correctionRow}>
              <Text style={styles.correctionLabel}>✅</Text>
              <Text style={styles.correctedText}>{correction.corrected}</Text>
            </View>

            {/* Explanation */}
            {correction.explanation ? (
              <Text style={styles.explanationText}>{correction.explanation}</Text>
            ) : null}

            {/* ── Advice ── */}
            {correction.advice_ja ? (
              <View style={styles.adviceRow}>
                <Ionicons name="bulb" size={13} color={Colors.warning} />
                <Text style={styles.adviceText}>{correction.advice_ja}</Text>
              </View>
            ) : null}

            {/* ── Useful Phrases ── */}
            {correction.useful_phrases && correction.useful_phrases.length > 0 && (
              <View style={styles.phrasesSection}>
                <TouchableOpacity
                  style={styles.phrasesToggle}
                  onPress={() => setShowPhrases(v => !v)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubbles" size={13} color={Colors.info} />
                  <Text style={styles.phrasesToggleText}>便利フレーズ {correction.useful_phrases.length}個</Text>
                  <Ionicons
                    name={showPhrases ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={Colors.info}
                  />
                </TouchableOpacity>

                {showPhrases && (
                  <View style={styles.phrasesList}>
                    {correction.useful_phrases.map((phrase, i) => (
                      <View key={i} style={styles.phraseItem}>
                        <Text style={styles.phraseEnglish}>"{phrase.english}"</Text>
                        <Text style={styles.phraseJapanese}>{phrase.japanese}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  userContainer: {
    flexDirection: 'row-reverse',
  },
  aiContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubbleWrapper: {
    maxWidth: '82%',
    gap: 6,
  },
  userBubbleWrapper: { alignItems: 'flex-end' },
  aiBubbleWrapper: { alignItems: 'flex-start' },
  bubble: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 4,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.backgroundCard,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  userText: {
    color: Colors.textOnPrimary,
  },
  aiText: {
    color: Colors.textPrimary,
  },
  mistakeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  mistakeIndicatorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
  },

  /* Correction card */
  correctionCard: {
    backgroundColor: 'rgba(239,68,68,0.07)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    gap: 7,
  },
  correctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  correctionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  correctionBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  correctionLabel: {
    fontSize: 14,
  },
  originalText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textDecorationLine: 'line-through',
    flex: 1,
  },
  correctedText: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  explanationText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },

  /* Advice */
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.sm,
    padding: 8,
    marginTop: 2,
  },
  adviceText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  /* Useful phrases */
  phrasesSection: {
    marginTop: 2,
  },
  phrasesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.info + '15',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  phrasesToggleText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.info,
    fontWeight: FontWeight.semibold,
  },
  phrasesList: {
    marginTop: 4,
    gap: 5,
  },
  phraseItem: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 2,
  },
  phraseEnglish: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  phraseJapanese: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
