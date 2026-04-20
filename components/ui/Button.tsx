import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, iconRight,
  style, textStyle, fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: FontSize.sm },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: FontSize.md },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: FontSize.lg },
  };

  const currentSize = sizeStyles[size];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[fullWidth && styles.fullWidth, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isDisabled ? ['#6B7280', '#4B5563'] : ['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.content}>
              {icon && <View style={styles.iconLeft}>{icon}</View>}
              <Text style={[styles.primaryText, { fontSize: currentSize.fontSize }, textStyle]}>{title}</Text>
              {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, ViewStyle> = {
    secondary: { backgroundColor: Colors.secondary },
    outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: Colors.error },
  };

  const variantTextStyles: Record<string, TextStyle> = {
    secondary: { color: Colors.textOnPrimary },
    outline: { color: Colors.primary },
    ghost: { color: Colors.textSecondary },
    danger: { color: Colors.textOnPrimary },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant],
        { paddingVertical: currentSize.paddingVertical, paddingHorizontal: currentSize.paddingHorizontal },
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variantTextStyles[variant].color} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, { fontSize: currentSize.fontSize }, variantTextStyles[variant], textStyle]}>
            {title}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: Spacing.sm },
  iconRight: { marginLeft: Spacing.sm },
  text: {
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  primaryText: {
    fontWeight: FontWeight.semibold,
    color: Colors.textOnPrimary,
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
