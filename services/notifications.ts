/**
 * notifications.ts
 * 通知のスケジュール・キャンセルを一元管理するサービス
 *
 * ⚠️ expo-notifications はネイティブモジュールが必要なため
 *    Expo Go や未ビルド環境では動作しない。
 *    クラッシュを防ぐため遅延 require + try-catch でガードしている。
 */

import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

/** expo-notifications を安全に取得する。未リンク時は null を返す */
function getNotifications(): NotificationsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-notifications') as NotificationsModule;
    return mod;
  } catch {
    return null;
  }
}

/** 通知ハンドラを初期化する（アプリ起動時に一度呼ぶ）*/
export function initNotificationHandler(): void {
  const N = getNotifications();
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// 通知ID定数
export const NOTIFICATION_IDS = {
  DAILY_REMINDER: 'daily-reminder',
  STREAK_WARNING: 'streak-warning',
  WEEKLY_REPORT: 'weekly-report',
} as const;

// 学習リマインダーのメッセージ候補（ランダムで選ぶ）
const REMINDER_MESSAGES = [
  { title: '🤖 AIアバターが待っています！', body: '今日も英語を話しましょう。たった5分でOK！' },
  { title: '✨ 英語の時間ですよ！', body: 'AIアバターと一緒に楽しく練習しましょう' },
  { title: '🌟 今日の学習を始めましょう', body: '連続学習を続けて、英語力をアップしよう！' },
  { title: '💬 会話しましょう！', body: 'AIアバターがあなたを待っています。今すぐ話そう' },
  { title: '🎯 目標に近づく時間！', body: '今日の英会話練習でスキルアップしましょう' },
];

const STREAK_WARNING_MESSAGES = [
  { title: '🔥 ストリークが消えそう！', body: '今日まだ会話していません。連続記録を守ろう！' },
  { title: '⚠️ 連続学習が途切れそうです', body: 'あと少し！今日の英会話を忘れずに' },
];

const WEEKLY_REPORT_MESSAGES = [
  { title: '📊 今週の学習レポート', body: 'アプリを開いて今週の成果を確認しましょう！' },
  { title: '🏆 週次レポートが届きました', body: '今週も頑張りました！成長を振り返ろう' },
];

/** 通知パーミッションをリクエストする */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const N = getNotifications();
  if (!N) return false;

  const { status: existingStatus } = await N.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

/** 通知パーミッションの現在の状態を確認する */
export async function checkNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const N = getNotifications();
  if (!N) return false;
  const { status } = await N.getPermissionsAsync();
  return status === 'granted';
}

/** ランダムなメッセージを取得 */
function randomMessage(messages: typeof REMINDER_MESSAGES) {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * 毎日のリマインダー通知をスケジュールする
 * @param hour   時 (0-23)
 * @param minute 分 (0-59)
 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  const N = getNotifications();
  if (!N) return;

  await cancelDailyReminder();
  const msg = randomMessage(REMINDER_MESSAGES);

  await N.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.DAILY_REMINDER,
    content: { title: msg.title, body: msg.body, sound: true, data: { type: 'daily_reminder' } },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/** 毎日のリマインダーをキャンセルする */
export async function cancelDailyReminder(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(NOTIFICATION_IDS.DAILY_REMINDER).catch(() => {});
}

/** ストリーク警告通知をスケジュールする（毎日23:00）*/
export async function scheduleStreakWarning(): Promise<void> {
  const N = getNotifications();
  if (!N) return;

  await cancelStreakWarning();
  const msg = randomMessage(STREAK_WARNING_MESSAGES);

  await N.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.STREAK_WARNING,
    content: { title: msg.title, body: msg.body, sound: true, data: { type: 'streak_warning' } },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour: 23,
      minute: 0,
    },
  });
}

/** ストリーク警告通知をキャンセルする */
export async function cancelStreakWarning(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(NOTIFICATION_IDS.STREAK_WARNING).catch(() => {});
}

/** 週次レポート通知をスケジュールする（毎週日曜 20:00）*/
export async function scheduleWeeklyReport(): Promise<void> {
  const N = getNotifications();
  if (!N) return;

  await cancelWeeklyReport();
  const msg = randomMessage(WEEKLY_REPORT_MESSAGES);

  await N.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.WEEKLY_REPORT,
    content: { title: msg.title, body: msg.body, sound: true, data: { type: 'weekly_report' } },
    trigger: {
      type: N.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 20,
      minute: 0,
    },
  });
}

/** 週次レポート通知をキャンセルする */
export async function cancelWeeklyReport(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(NOTIFICATION_IDS.WEEKLY_REPORT).catch(() => {});
}

/**
 * 達成バッジ通知を即時送信する（会話回数の節目で呼ぶ）
 * @param totalConversations 合計会話回数
 */
export async function sendAchievementNotification(totalConversations: number): Promise<void> {
  const N = getNotifications();
  if (!N) return;

  const milestones: Record<number, { title: string; body: string }> = {
    1:   { title: '🎉 最初の一歩！', body: '初めての会話を完了！英語学習の旅が始まりました' },
    5:   { title: '🌟 5回達成！', body: 'もうビギナーじゃない！調子が出てきましたね' },
    10:  { title: '🔥 10回達成！', body: 'すごい！会話10回突破。英語力が着実についています' },
    30:  { title: '💪 30回達成！', body: 'もう中級者の仲間入り！この調子で続けよう' },
    50:  { title: '🏆 50回達成！', body: '半分の50回！あなたの英語はどんどん上手くなっています' },
    100: { title: '👑 100回達成！！', body: '伝説の100回！英語マスターへの道を歩んでいます' },
  };

  const milestone = milestones[totalConversations];
  if (!milestone) return;

  await N.scheduleNotificationAsync({
    content: {
      title: milestone.title,
      body: milestone.body,
      sound: true,
      data: { type: 'achievement', count: totalConversations },
    },
    trigger: null,
  });
}

/** すべての通知をキャンセルする */
export async function cancelAllNotifications(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
}
