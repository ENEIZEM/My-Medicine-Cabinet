// hooks/useNotifications.tsx
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService } from '@/NotificationService';
import { useSettings } from '@/contexts/SettingsContext';
import { useIntake } from '@/contexts/IntakeContext';
import { Intake } from '@/contexts/types';

/**
 * Хук для управления уведомлениями в приложении
 */
export const useNotifications = () => {
  const { userName, t, language } = useSettings();
  const { intakes } = useIntake();
  const appState = useRef(AppState.currentState);
  const isInitialized = useRef(false);

  // Инициализация службы уведомлений
  useEffect(() => {
    const initNotifications = async () => {
      if (!isInitialized.current) {
        await notificationService.initialize();
        isInitialized.current = true;
        console.log('Notification service initialized');
      }
    };

    initNotifications();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  // Планирование уведомлений при изменении приёмов
  useEffect(() => {
    if (!isInitialized.current || !intakes.length) return;

    const scheduleNotifications = async () => {
      // Отменяем все старые уведомления
      await notificationService.cancelAllNotifications();

      // Планируем новые для активных приёмов
      const activeIntakes = intakes.filter(
        (intake: Intake) => intake.status === 'active'
      );

      if (activeIntakes.length > 0) {
        await notificationService.scheduleMultipleIntakeNotifications(
          activeIntakes,
          userName,
          t,
          language
        );
        console.log(`Scheduled ${activeIntakes.length} intake notifications`);
      }
    };

    scheduleNotifications();
  }, [intakes, userName, t, language]);

  // Обновление уведомлений при возвращении в приложение
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Приложение вернулось на передний план - можно обновить уведомления
        console.log('App came to foreground, refreshing notifications');
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    scheduleNotification: notificationService.scheduleNotification.bind(notificationService),
    scheduleIntakeNotification: (intake: Intake) =>
      notificationService.scheduleIntakeNotification(intake, userName, t, language),
    cancelIntakeNotification: notificationService.cancelIntakeNotification.bind(notificationService),
    cancelAllNotifications: notificationService.cancelAllNotifications.bind(notificationService),
    getScheduledNotifications: notificationService.getScheduledNotifications.bind(notificationService),
  };
};