// services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Intake } from '@/contexts/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from './contexts/SettingsContext';

const NOTIFICATION_IDS_KEY = 'scheduled_notification_ids_v1';

export type NotificationPriority = 'default' | 'high' | 'max';
export type NotificationDestination = 'schedule' | 'medicine' | 'profile' | string;

export interface NotificationData {
  destination?: NotificationDestination;
  intakeId?: string;
  medicineId?: string;
  [key: string]: any;
}

export interface ScheduleNotificationParams {
  title: string;
  body: string;
  data?: NotificationData;
  triggerDate: Date;
  priority?: NotificationPriority;
  sound?: boolean | string;
  vibrate?: boolean;
  categoryIdentifier?: string;
}

// Настройка обработчика уведомлений по умолчанию
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private scheduledIds: Map<string, string> = new Map();

  async initialize() {
    await this.loadScheduledIds();
    await this.registerForPushNotificationsAsync();
    this.setupNotificationListeners();
  }

  async registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      console.warn('Push notifications work only on physical devices');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF5722',
        sound: 'default',
        enableVibrate: true,
      });
    }

    return finalStatus;
  }

  setupNotificationListeners() {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;
        this.handleNotificationResponse(data);
      }
    );
  }

  private handleNotificationResponse(data: NotificationData) {
    if (!data.destination) return;
    console.log('Navigate to:', data.destination, 'with data:', data);
  }

  async scheduleNotification(params: ScheduleNotificationParams): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return null;
      }

      const now = new Date();
      if (params.triggerDate <= now) {
        console.warn('Trigger date is in the past, skipping notification');
        return null;
      }

      // ИСПРАВЛЕНИЕ: правильный формат trigger для Date
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.body,
          data: params.data || {},
          sound: params.sound === false ? undefined : 
                 typeof params.sound === 'string' ? params.sound : 'default',
          priority: this.getPriority(params.priority),
          vibrate: params.vibrate !== false ? [0, 250, 250, 250] : undefined,
          categoryIdentifier: params.categoryIdentifier,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: params.triggerDate,
          channelId: Platform.OS === 'android' ? 'medication-reminders' : undefined,
        },
      });

      console.log('Notification scheduled:', notificationId, 'for', params.triggerDate);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  async scheduleIntakeNotification(
    intake: Intake,
    userName: string | undefined,
    t: any,
    language: string
  ): Promise<string | null> {
    try {
      const [year, month, day] = intake.intakeDay.split('-').map(Number);
      const [hours, minutes] = intake.intakeTime.split(':').map(Number);
      
      const triggerDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      // Уведомление за 5 минут до приёма
      const notificationDate = new Date(triggerDate.getTime());

      // Формируем дозировку
      let dosageText = '';
      if (intake.dosage?.amount && intake.dosage?.unit) {
        dosageText = `${intake.dosage.amount} ${intake.dosage.unit}`;
      }
      if (intake.form?.quantity && intake.form?.form) {
        const formText = this.formatUnit(
          t.medicine.units,
          String(intake.form.quantity),
          language,
          intake.form.form
        );
        dosageText = dosageText 
          ? `${intake.form.quantity} ${formText} - ${dosageText}`
          : `${intake.form.quantity} ${formText}`;
      }

      const title = userName 
        ? t.notifications.intakeReminder.titleWithName.replace('{name}', userName)
        : t.notifications.intakeReminder.title;

      const body = t.notifications.intakeReminder.body
        .replace('{medicine}', intake.medicineName)
        .replace('{dosage}', dosageText || t.notifications.intakeReminder.noDosage);

      const notificationId = await this.scheduleNotification({
        title,
        body,
        triggerDate: notificationDate,
        priority: 'max',
        sound: 'default',
        data: {
          destination: 'schedule',
          intakeId: intake.id,
          medicineId: intake.medicineIds?.[0],
        },
        categoryIdentifier: 'INTAKE_REMINDER',
      });

      if (notificationId) {
        this.scheduledIds.set(intake.id, notificationId);
        await this.saveScheduledIds();
      }

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule intake notification:', error);
      return null;
    }
  }

  async scheduleMultipleIntakeNotifications(
    intakes: Intake[],
    userName: string | undefined,
    t: any,
    language: string
  ): Promise<void> {
    const activeIntakes = intakes.filter(i => i.status === 'active');
    
    for (const intake of activeIntakes) {
      await this.scheduleIntakeNotification(intake, userName, t, language);
    }
  }

  async cancelIntakeNotification(intakeId: string): Promise<void> {
    const notificationId = this.scheduledIds.get(intakeId);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.scheduledIds.delete(intakeId);
      await this.saveScheduledIds();
      console.log('Cancelled notification for intake:', intakeId);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledIds.clear();
    await this.saveScheduledIds();
    console.log('All notifications cancelled');
  }

  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  cleanup() {
    // ИСПРАВЛЕНИЕ: правильный метод удаления подписок
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  private getPriority(priority?: NotificationPriority): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'max':
        return Notifications.AndroidNotificationPriority.MAX;
      case 'high':
        return Notifications.AndroidNotificationPriority.HIGH;
      default:
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  private formatUnit(units: any, quantity: string, language: string, unit: string): string {
    const num = parseInt(quantity, 10);
    if (isNaN(num)) return units.nominativeSing[unit] || unit;

    const lastDigit = num % 10;
    const lastTwo = num % 100;

    if (language === 'ru') {
      if (lastTwo >= 11 && lastTwo <= 14) {
        return units.genitivePlur[unit] || unit;
      }
      if (lastDigit === 1) {
        return units.nominativeSing[unit] || unit;
      }
      if (lastDigit >= 2 && lastDigit <= 4) {
        return units.genitiveSing[unit] || unit;
      }
      return units.genitivePlur[unit] || unit;
    }

    return num === 1 ? units.nominativeSing[unit] : units.nominativePlur[unit] || unit;
  }

  private async saveScheduledIds() {
    try {
      const data = Array.from(this.scheduledIds.entries());
      await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save scheduled IDs:', error);
    }
  }

  private async loadScheduledIds() {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        this.scheduledIds = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load scheduled IDs:', error);
    }
  }
}

export const notificationService = new NotificationService();