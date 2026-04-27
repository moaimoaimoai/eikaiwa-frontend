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

  // is_unnatural_only: 黄色系、それ以外: 赤系
  const isUnnaturalOnly = correction?.is_unnatural_only === true;
  const accentColor = isUnnaturalOnly ? '#F59E0B' : Colors.error;

  const mistakeTypeColors: Record<string, string> = {
    grammar:     Colors.grammar,
    vocabulary:  Colors.vocabulary,
    preposition: '#8B5CF6',
    collocation: '#D97706',
    unnatural:   '#F59E0B',
    word_order:  '#06B6D4',
    article:     '#EC4899',
    pronunciation: Colors.pronunciation,
    spelling:    Colors.spelling,
    other:       Colors.other,
  };

  const mistakeTypeLabels: Record<string, string> = {
    grammar:     '文法',
    vocabulary:  '語彙',
    preposition: '前置詞',
    collocation: '語の組み合わせ',
    unnatural:   '不自然な表現',
    word_order:  '語順',
    article:     '冠詞',
    pronunciation: '発音',
    spelling:    'スペル',
    other:       'その他',
  };

  const typeColor = correction
    ? (mistakeTypeColors[correction.mistake_type] ?? Colors.error)
    : Colors.error;

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
              <Ionicons
                name={isUnnaturalOnly ? 'alert-circle-outline' : 'alert-circle'}
                size={14}
                color={isUnnaturalOnly ? Colors.warning : Colors.error}
              />
              <Text style={[styles.mistakeIndicatorText, isUnnaturalOnly && { color: Colors.warning }]}>
                {isUnnaturalOnly ? '不自然な表現あり' : 'ミスあり'}
              </Text>
            </View>
          )}
        </View>

        {/* Correction card */}
        {correction && showCorrection && (
          <View style={[
            styles.correctionCard,
            { borderLeftColor: typeColor, backgroundColor: typeColor + '10' },
          ]}>
            {/* Header */}
            <View style={styles.correctionHeader}>
              <View style={styles.correctionHeaderLeft}>
                {/* ミス種別バッジ */}
                <View style={[styles.correctionBadge, { backgroundColor: typeColor + '25' }]}>
                  <Ionicons
                    name={isUnnaturalOnly ? 'swap-horizontal' : 'construct'}
                    size={11}
                    color={typeColor}
                  />
                  <Text style={[styles.correctionBadgeText, { color: typeColor }]}>
                    {mistakeTypeLabels[correction.mistake_type] ?? 'その他'}
                  </Text>
                </View>
                {/* 「不自然」か「誤り」かのラベル */}
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: isUnnaturalOnly ? '#F59E0B20' : '#EF444420' }
                ]}>
                  <Text style={[
                    styles.severityText,
                    { color: isUnnaturalOnly ? '#F59E0B' : '#EF4444' }
                  ]}>
                    {isUnnaturalOnly ? '💬 不自然' : '🔴 誤り'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCorrection(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Original → Corrected */}
            <View style={styles.compareBlock}>
              <View style={styles.compareRow}>
                <View style={[styles.compareIcon, { backgroundColor: '#EF444420' }]}>
                  <Text style={{ fontSize: 11 }}>✗</Text>
                </View>
                <Text style={styles.originalText}>{correction.original}</Text>
              </View>
              <View style={styles.compareArrow}>
                <Ionicons name="arrow-down" size={14} color={Colors.textMuted} />
              </View>
              <View style={styles.compareRow}>
                <View style={[styles.compareIcon, { backgroundColor: '#22C55E20' }]}>
                  <Text style={{ fontSize: 11 }}>✓</Text>
                </View>
                <Text style={styles.correctedText}>{correction.corrected}</Text>
              </View>
            </View>

            {/* Explanation */}
            {correction.explanation ? (
              <View style={styles.explanationBlock}>
                <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.explanationText}>{correction.explanation}</Text>
              </View>
            ) : null}

            {/* Advice */}
            {correction.advice_ja ? (
              <View style={styles.adviceRow}>
                <Ionicons name="bulb" size={13} color={Colors.warning} />
                <Text style={styles.adviceText}>{correction.advice_ja}</Text>
              </View>
            ) : null}

            {/* Level-up（より上級の表現） */}
            {correction.level_up ? (
              <View style={styles.levelUpRow}>
                <View style={styles.levelUpHeader}>
                  <Ionicons name="rocket" size={12} color='#A78BFA' />
                  <Text style={styles.levelUpLabel}>レベルアップ表現</Text>
                </View>
                <Text style={styles.levelUpText}>"{correction.level_up}"</Text>
              </View>
            ) : null}

            {/* Useful Phrases */}
            {correction.useful_phrases && correction.useful_phrases.length > 0 && (
              <View style={styles.phrasesSection}>
                <TouchableOpacity
                  style={styles.phrasesToggle}
                  onPress={() => setShowPhrases(v => !v)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubbles" size={13} color={Colors.info} />
                  <Text style={styles.phrasesToggleText}>
                    関連フレーズ {correction.useful_phrases.length}個
                  </Text>
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
    marginVertical: 3,
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  userContainer: { flexDirection: 'row-reverse' },
  aiContainer: { flexDirection: 'row', alignItems: 'flex-end' },
  avatarSmall: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  bubbleWrapper: { maxWidth: '80%', gap: 5 },
  userBubbleWrapper: { alignItems: 'flex-end' },
  aiBubbleWrapper:  { alignItems: 'flex-start' },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    gap: 3,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  messageText: { fontSize: FontSize.md, lineHeight: 22 },
  userText: { color: Colors.textOnPrimary, fontWeight: FontWeight.medium },
  aiText:   { color: Colors.textPrimary },

  mistakeIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
  },
  mistakeIndicatorText: { fontSize: FontSize.xs, color: Colors.error },

  /* Correction card */
  correctionCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    gap: 8,
  },
  correctionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  correctionHeaderLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1,
  },
  correctionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  correctionBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  severityBadge: {
    borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3,
  },
  severityText: { fontSize: 10, fontWeight: FontWeight.bold },

  /* Compare block */
  compareBlock: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.sm,
    padding: 10,
    gap: 4,
  },
  compareRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  compareIcon: {
    width: 20, height: 20, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  compareArrow: { paddingLeft: 4 },
  originalText: {
    color: Colors.error, fontSize: FontSize.sm,
    textDecorationLine: 'line-through', flex: 1,
  },
  correctedText: {
    color: Colors.success, fontSize: FontSize.sm,
    fontWeight: FontWeight.bold, flex: 1,
  },

  /* Explanation */
  explanationBlock: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 5,
  },
  explanationText: {
    flex: 1, color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18,
  },

  /* Advice */
  adviceRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.sm, padding: 8,
  },
  adviceText: {
    flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18,
  },

  /* Level-up */
  levelUpRow: {
    backgroundColor: '#A78BFA18',
    borderRadius: BorderRadius.sm,
    padding: 8, gap: 4,
    borderWidth: 1, borderColor: '#A78BFA30',
  },
  levelUpHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  levelUpLabel: {
    fontSize: 10, fontWeight: FontWeight.bold, color: '#A78BFA',
  },
  levelUpText: {
    fontSize: FontSize.sm, color: '#C4B5FD', fontWeight: FontWeight.semibold,
  },

  /* Useful phrases */
  phrasesSection: { marginTop: 2 },
  phrasesToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.info + '15',
    borderRadius: BorderRadius.sm, paddingHorizontal: 10, paddingVertical: 7,
  },
  phrasesToggleText: {
    flex: 1, fontSize: FontSize.xs, color: Colors.info, fontWeight: FontWeight.semibold,
  },
  phrasesList: { marginTop: 4, gap: 5 },
  phraseItem: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10, paddingVertical: 7, gap: 2,
  },
  phraseEnglish: {
    fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium,
  },
  phraseJapanese: { fontSize: FontSize.xs, color: Colors.textMuted },
});
