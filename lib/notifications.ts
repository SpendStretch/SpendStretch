import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { BillingCycle, Card } from './types';
import { formatCurrency } from './float';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('payment-reminders', {
      name: 'Payment Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0A84FF',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function schedulePaymentReminder(
  card: Card,
  cycle: BillingCycle,
  daysBefore: number
): Promise<string> {
  const dueDate = new Date(cycle.payment_due_date);
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);
  reminderDate.setHours(9, 0, 0, 0);

  const now = new Date();
  if (reminderDate <= now) {
    return '';
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SpendStretch',
      body: `Your ${card.card_name} payment of ${formatCurrency(cycle.statement_balance)} is due in ${daysBefore} ${daysBefore === 1 ? 'day' : 'days'}`,
      data: { card_id: card.id, cycle_id: cycle.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  return identifier;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}
