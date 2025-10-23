// contexts/ScheduleContext.tsx
// ИСПРАВЛЕНИЕ: убедитесь, что updateSchedule сохраняет ВСЕ поля Schedule

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Schedule, generateId, asyncSave, asyncLoad } from './types';

interface ScheduleContextType {
  schedules: Schedule[];
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (schedule: Schedule) => void;
  deleteSchedule: (scheduleId: string) => void;
  getSchedulesForMedicine: (medicineId: string) => Schedule[];
  getScheduleCountForMedicine: (medicineId: string) => number;
  getAllSchedules: () => Schedule[];
  updateScheduleStatus: (scheduleId: string, status: Schedule['status']) => void;
  getSchedulesByStatus: (status: Schedule['status']) => Schedule[];
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const STORAGE_KEY = 'schedules_v1';

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await asyncLoad<Schedule[]>(STORAGE_KEY);
        if (Array.isArray(stored)) setSchedules(stored);
      } catch (err) {
        console.error('Failed to load schedules from storage', err);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Schedule[]) => {
    try {
      await asyncSave(STORAGE_KEY, next);
    } catch (err) {
      console.error('Failed to save schedules to storage', err);
    }
  }, []);

  const addSchedule = useCallback((schedule: Schedule) => {
    const s: Schedule = { ...schedule, id: schedule.id || generateId() };
    console.log('ScheduleContext.addSchedule:', s); // Отладка
    setSchedules(prev => {
      const next = [...prev, s];
      persist(next);
      return next;
    });
  }, [persist]);

  const updateSchedule = useCallback((schedule: Schedule) => {
    console.log('ScheduleContext.updateSchedule:', {
      id: schedule.id,
      endOption: schedule.endOption,
      endOptionCount: schedule.endOptionCount,
      requiredNumberOfIntake: schedule.requiredNumberOfIntake,
      intakeDays: schedule.intakeDays?.length || 0
    }); // Отладка
    
    setSchedules(prev => {
      // КРИТИЧЕСКИ ВАЖНО: сохраняем ВСЕ поля из обновлённого расписания
      const next = prev.map(s => {
        if (s.id === schedule.id) {
          return {
            ...schedule, // Берём все поля из нового schedule
            id: s.id, // Сохраняем id (на всякий случай)
          };
        }
        return s;
      });
      persist(next);
      return next;
    });
  }, [persist]);

  const deleteSchedule = useCallback((scheduleId: string) => {
    setSchedules(prev => {
      const next = prev.filter(s => s.id !== scheduleId);
      persist(next);
      return next;
    });
  }, [persist]);

  const getSchedulesForMedicine = useCallback(
    (medicineId: string) => schedules.filter(s => s.medicineIds?.includes(medicineId)),
    [schedules]
  );

  const getScheduleCountForMedicine = useCallback(
    (medicineId: string) => schedules.filter(s => s.medicineIds?.includes(medicineId)).length,
    [schedules]
  );

  const getAllSchedules = useCallback(() => schedules, [schedules]);

  const updateScheduleStatus = useCallback((scheduleId: string, status: Schedule['status']) => {
    setSchedules(prev => {
      const next = prev.map(s => (s.id === scheduleId ? { ...s, status } : s));
      persist(next);
      return next;
    });
  }, [persist]);

  const getSchedulesByStatus = useCallback(
    (status: Schedule['status']) => schedules.filter(s => s.status === status),
    [schedules]
  );

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        getSchedulesForMedicine,
        getScheduleCountForMedicine,
        getAllSchedules,
        updateScheduleStatus,
        getSchedulesByStatus,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = (): ScheduleContextType => {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within ScheduleProvider');
  return ctx;
};