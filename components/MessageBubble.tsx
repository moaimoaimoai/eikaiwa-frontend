import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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

  const mistakeTypeColors: Record<string, string> = {
    grammar: Colors.grammar,
    vocabulary: Colors.vocabulary,
    pronunciation: Colors.pronunciation,
    spelling: Colors.spelling,
    other: Colors.other,
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
            <View style={styles.correctionHeader}>
              <View style={styles.correctionBadge}>
                <Text style={styles.correctionBadgeText}>
                  {correction.mistake_type === 'grammar' ? '文法' :
                   correction.mistake_type === 'vocabulary' ? '語彙' :
                   correction.mistake_type === 'pronunciation' ? '発音' : 'その他'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCorrection(false)}>
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.correctionRow}>
              <Text style={styles.correctionLabel}>❌</Text>
              <Text style={styles.originalText}>{correction.original}</Text>
            </View>
            <View style={styles.correctionRow}>
              <Text style={styles.correctionLabel}>✅</Text>
              <Text style={styles.correctedText}>{correction.corrected}</Text>
            </View>
            {correction.explanation && (
              <Text style={styles.explanationText}>{correction.explanation}</Text>
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
    maxWidth: '78%',
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
  correctionCard: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    gap: 6,
  },
  correctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  correctionBadge: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  correctionBadgeText: {
    color: Colors.error,
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
    marginTop: 2,
  },
});
