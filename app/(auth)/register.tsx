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

const LEVELS = [
  { id: 'beginner', label: '初級', desc: '基本的な会話', emoji: '🌱' },
  { id: 'intermediate', label: '中級', desc: '日常的な会話', emoji: '🌿' },
  { id: 'advanced', label: '上級', desc: 'ビジネス・学術', emoji: '🌳' },
];

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [level, setLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !username || !password || !passwordConfirm) {
      Alert.alert('エラー', '必須項目を入力してください');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        username: username.trim(),
        display_name: displayName.trim() || username.trim(),
        password,
        password_confirm: passwordConfirm,
        level,
      });
      await login(email.trim(), password);
      router.replace('/(main)/home');
    } catch (e: any) {
      const msg = e?.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : '登録に失敗しました';
      Alert.alert('登録エラー', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E1B4B']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>新規登録</Text>
          </View>

          <View style={styles.form}>
            {/* Level selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>現在の英語レベル</Text>
              <View style={styles.levelGrid}>
                {LEVELS.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={[styles.levelCard, level === l.id && styles.levelCardActive]}
                    onPress={() => setLevel(l.id)}
                  >
                    <Text style={styles.levelEmoji}>{l.emoji}</Text>
                    <Text style={[styles.levelLabel, level === l.id && styles.levelLabelActive]}>{l.label}</Text>
                    <Text style={styles.levelDesc}>{l.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form fields */}
            {[
              { label: 'メールアドレス *', value: email, setter: setEmail, icon: 'mail-outline', placeholder: 'your@email.com', keyboard: 'email-address', cap: 'none' },
              { label: 'ユーザー名 *', value: username, setter: setUsername, icon: 'person-outline', placeholder: 'tanaka_hiro', keyboard: 'default', cap: 'none' },
              { label: '表示名', value: displayName, setter: setDisplayName, icon: 'happy-outline', placeholder: '田中ひろ', keyboard: 'default', cap: 'words' },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name={field.icon as any} size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={field.value}
                    onChangeText={field.setter}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={field.keyboard as any}
                    autoCapitalize={field.cap as any}
                  />
                </View>
              </View>
            ))}

            {[
              { label: 'パスワード *（8文字以上）', value: password, setter: setPassword },
              { label: 'パスワード確認 *', value: passwordConfirm, setter: setPasswordConfirm },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={field.value}
                    onChangeText={field.setter}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry
                  />
                </View>
              </View>
            ))}

            <Button
              title="アカウントを作成"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>
                すでにアカウントをお持ちの方は <Text style={styles.loginLinkBold}>ログイン</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.xl, gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.lg },
  backButton: { padding: Spacing.xs },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  form: { gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  levelGrid: { flexDirection: 'row', gap: Spacing.sm },
  levelCard: {
    flex: 1, borderRadius: BorderRadius.md, padding: Spacing.sm,
    backgroundColor: Colors.backgroundCard, alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  levelCardActive: { borderColor: Colors.primary, backgroundColor: 'rgba(79,70,229,0.15)' },
  levelEmoji: { fontSize: 24 },
  levelLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  levelLabelActive: { color: Colors.primary },
  levelDesc: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  inputGroup: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, height: 50, color: Colors.textPrimary, fontSize: FontSize.md },
  submitButton: { marginTop: Spacing.sm },
  loginLink: { textAlign: 'center', color: Colors.textSecondary, fontSize: FontSize.sm },
  loginLinkBold: { color: Colors.primary, fontWeight: FontWeight.bold },
});
