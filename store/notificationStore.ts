/**
 * notificationStore.ts
 * 通知設定を Zustand + AsyncStorage で永続化するストア
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelDailyReminder,
  scheduleStreakWarning,
  cancelStreakWarning,
  scheduleWeeklyReport,
  cancelWeeklyReport,
  scheduleDailyTopicNotification,
  cancelDailyTopicNotification,
} from '../services/notifications';
import { getTodayTopic } from '../constants/theme';

const STORAGE_KEY = '@notification_settings';

interface NotificationState {
  // パーミッション
  permissionGranted: boolean;

  // 学習リマインダー
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;

  // ストリーク警告（毎日23:00）
  streakWarningEnabled: boolean;

  // 週次レポート（毎週日曜 20:00）
  weeklyReportEnabled: boolean;

  // 達成バッジ通知
  achievementEnabled: boolean;

  // 今日のトピック通知（毎朝）
  dailyTopicEnabled: boolean;
  dailyTopicHour: number;
  dailyTopicMinute: number;

  // アクション
  loadSettings: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  setReminderEnabled: (enabled: boolean) => Promise<void>;
  setReminderTime: (hour: number, minute: number) => Promise<void>;
  setStreakWarningEnabled: (enabled: boolean) => Promise<void>;
  setWeeklyReportEnabled: (enabled: boolean) => Promise<void>;
  setAchievementEnabled: (enabled: boolean) => void;
  setDailyTopicEnabled: (enabled: boolean) => Promise<void>;
  setDailyTopicTime: (hour: number, minute: number) => Promise<void>;
}

type PersistedSettings = {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  streakWarningEnabled: boolean;
  weeklyReportEnabled: boolean;
  achievementEnabled: boolean;
  dailyTopicEnabled: boolean;
  dailyTopicHour: number;
  dailyTopicMinute: number;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  permissionGranted: false,
  reminderEnabled: false,
  reminderHour: 18,
  reminderMinute: 0,
  streakWarningEnabled: false,
  weeklyReportEnabled: false,
  achievementEnabled: true,
  dailyTopicEnabled: false,
  dailyTopicHour: 8,
  dailyTopicMinute: 0,

  /** AsyncStorage から設定を読み込む */
  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: PersistedSettings = JSON.parse(raw);
        set({
          reminderEnabled: saved.reminderEnabled ?? false,
          reminderHour: saved.reminderHour ?? 18,
          reminderMinute: saved.reminderMinute ?? 0,
          streakWarningEnabled: saved.streakWarningEnabled ?? false,
          weeklyReportEnabled: saved.weeklyReportEnabled ?? false,
          achievementEnabled: saved.achievementEnabled ?? true,
          dailyTopicEnabled: saved.dailyTopicEnabled ?? false,
          dailyTopicHour: saved.dailyTopicHour ?? 8,
          dailyTopicMinute: saved.dailyTopicMinute ?? 0,
        });
      }
    } catch (e) {
      console.warn('通知設定の読み込みに失敗しました:', e);
    }
  },

  /** 設定を AsyncStorage に保存する（内部ヘルパー） */
  // ← 関数外で定義した方がスッキリするが、storeの慣習に合わせインライン

  /** 通知パーミッションをリクエストする */
  requestPermission: async () => {
    const granted = await requestNotificationPermission();
    set({ permissionGranted: granted });
    return granted;
  },

  /** リマインダーのON/OFFを切り替える */
  setReminderEnabled: async (enabled) => {
    const { reminderHour, reminderMinute } = get();
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleDailyReminder(reminderHour, reminderMinute);
    } else {
      await cancelDailyReminder();
    }
    set({ reminderEnabled: enabled });
    await saveSettings({ ...get(), reminderEnabled: enabled });
  },

  /** リマインダーの時刻を変更する */
  setReminderTime: async (hour, minute) => {
    set({ reminderHour: hour, reminderMinute: minute });
    const { reminderEnabled } = get();
    if (reminderEnabled) {
      await scheduleDailyReminder(hour, minute);
    }
    await saveSettings({ ...get(), reminderHour: hour, reminderMinute: minute });
  },

  /** ストリーク警告のON/OFFを切り替える */
  setStreakWarningEnabled: async (enabled) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleStreakWarning();
    } else {
      await cancelStreakWarning();
    }
    set({ streakWarningEnabled: enabled });
    await saveSettings({ ...get(), streakWarningEnabled: enabled });
  },

  /** 週次レポートのON/OFFを切り替える */
  setWeeklyReportEnabled: async (enabled) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleWeeklyReport();
    } else {
      await cancelWeeklyReport();
    }
    set({ weeklyReportEnabled: enabled });
    await saveSettings({ ...get(), weeklyReportEnabled: enabled });
  },

  /** 達成バッジ通知のON/OFFを切り替える（ローカルのみ） */
  setAchievementEnabled: (enabled) => {
    set({ achievementEnabled: enabled });
    saveSettings({ ...get(), achievementEnabled: enabled });
  },

  /** 今日のトピック通知のON/OFFを切り替える */
  setDailyTopicEnabled: async (enabled) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      const topic = getTodayTopic();
      const { dailyTopicHour, dailyTopicMinute } = get();
      await scheduleDailyTopicNotification(topic.label, topic.icon, dailyTopicHour, dailyTopicMinute);
    } else {
      await cancelDailyTopicNotification();
    }
    set({ dailyTopicEnabled: enabled });
    await saveSettings({ ...get(), dailyTopicEnabled: enabled });
  },

  /** 今日のトピック通知の時刻を変更する */
  setDailyTopicTime: async (hour, minute) => {
    set({ dailyTopicHour: hour, dailyTopicMinute: minute });
    const { dailyTopicEnabled } = get();
    if (dailyTopicEnabled) {
      const topic = getTodayTopic();
      await scheduleDailyTopicNotification(topic.label, topic.icon, hour, minute);
    }
    await saveSettings({ ...get(), dailyTopicHour: hour, dailyTopicMinute: minute });
  },
}));

/** 設定を AsyncStorage に保存するヘルパー */
async function saveSettings(state: NotificationState) {
  const toSave: PersistedSettings = {
    reminderEnabled: state.reminderEnabled,
    reminderHour: state.reminderHour,
    reminderMinute: state.reminderMinute,
    streakWarningEnabled: state.streakWarningEnabled,
    weeklyReportEnabled: state.weeklyReportEnabled,
    achievementEnabled: state.achievementEnabled,
    dailyTopicEnabled: state.dailyTopicEnabled,
    dailyTopicHour: state.dailyTopicHour,
    dailyTopicMinute: state.dailyTopicMinute,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
}
