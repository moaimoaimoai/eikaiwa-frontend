import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(main)/home');
    } catch (e: any) {
      Alert.alert('ログイン失敗', 'メールアドレスまたはパスワードが正しくありません');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E1B4B']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo area */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🎙️</Text>
            </View>
            <Text style={styles.appName}>英会話AI</Text>
            <Text style={styles.tagline}>AIと話して、英語力をアップ</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>ログイン</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="ログイン"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />

            <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLinkText}>
                アカウントをお持ちでない方は{' '}
                <Text style={styles.registerLinkBold}>新規登録</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features hint */}
          <View style={styles.featuresHint}>
            {['🎯 AIアバターと自然な英会話', '✏️ リアルタイム文法修正', '📊 弱点分析・傾向把握'].map((feat, i) => (
              <Text key={i} style={styles.featureText}>{feat}</Text>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  header: { alignItems: 'center', gap: Spacing.sm },
  logoContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(79,70,229,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(79,70,229,0.5)',
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary },
  form: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: Spacing.lg,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    height: 50,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  eyeButton: { padding: Spacing.xs },
  loginButton: { marginTop: Spacing.sm },
  registerLink: { alignItems: 'center' },
  registerLinkText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  registerLinkBold: { color: Colors.primary, fontWeight: FontWeight.bold },
  featuresHint: { gap: Spacing.sm, alignItems: 'center' },
  featureText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
