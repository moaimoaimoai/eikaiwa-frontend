import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadow } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children, style, variant = 'default', padding = Spacing.md
}) => {
  const variantStyles: Record<string, ViewStyle> = {
    default: { backgroundColor: Colors.backgroundCard },
    elevated: { backgroundColor: Colors.backgroundCard, ...Shadow.md },
    outlined: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
    glass: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  };

  return (
    <View style={[styles.base, variantStyles[variant], { padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
