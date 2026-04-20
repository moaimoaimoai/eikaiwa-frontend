import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, FontSize, FontWeight } from '../constants/theme';
import { AVATARS } from '../constants/theme';

interface AvatarDisplayProps {
  name: string;
  accent: string;
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  name, accent, isSpeaking = false, size = 'md'
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const avatar = AVATARS.find(a => a.name === name) || AVATARS[0];

  useEffect(() => {
    if (isSpeaking) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSpeaking]);

  const dimensions = {
    sm: { container: 56, emoji: 28, ring: 64 },
    md: { container: 80, emoji: 40, ring: 90 },
    lg: { container: 120, emoji: 60, ring: 134 },
  }[size];

  return (
    <View style={styles.wrapper}>
      {/* Speaking ring */}
      {isSpeaking && (
        <Animated.View
          style={[
            styles.speakingRing,
            {
              width: dimensions.ring,
              height: dimensions.ring,
              borderRadius: dimensions.ring / 2,
              borderColor: avatar.color,
              transform: [{ scale: pulseAnim }],
            }
          ]}
        />
      )}

      {/* Avatar circle */}
      <LinearGradient
        colors={[avatar.color, avatar.color + '99']}
        style={[styles.avatarContainer, { width: dimensions.container, height: dimensions.container, borderRadius: dimensions.container / 2 }]}
      >
        <Text style={{ fontSize: dimensions.emoji }}>{avatar.emoji}</Text>
      </LinearGradient>

      {/* Name badge */}
      {size !== 'sm' && (
        <View style={styles.nameBadge}>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.accentText}>{accent} English</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakingRing: {
    position: 'absolute',
    top: -7,
    borderWidth: 2,
    opacity: 0.6,
  },
  nameBadge: {
    alignItems: 'center',
  },
  nameText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  accentText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
});
