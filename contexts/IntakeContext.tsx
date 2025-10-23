// contexts/IntakeContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Intake } from './types';

interface IntakeContextType {
  intakes: Intake[];
  addIntake: (intake: Intake) => void;
  addIntakes: (intakes: Intake[]) => void;
  updateIntake: (intake: Intake) => void;
  deleteIntake: (intakeId: string) => void;
  getIntakesForMedicine: (medicineId: string) => Intake[];
  getIntakeCountForMedicine: (medicineId: string) => number;
  getAllIntakes: () => Intake[];
  getIntakesByDay: (day: string) => Intake[];
  getIntakesByStatus: (status: string) => Intake[];
  updateIntakeStatus: (intakeId: string, status: Intake['status']) => void;
  getIntakesForSchedule: (scheduleId: string) => Intake[];
  deleteIntakesForSchedule: (scheduleId: string) => void;
  getIntakesByTimeRange: (startTime: string, endTime: string) => Intake[];
  getUpcomingIntakes: (limit?: number) => Intake[];
}

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

export const IntakeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [intakes, setIntakes] = useState<Intake[]>([]);

  const addIntake = useCallback((intake: Intake) => {
    setIntakes(prev => [...prev, intake]);
  }, []);

  const addIntakes = useCallback((newIntakes: Intake[]) => {
    setIntakes(prev => [...prev, ...newIntakes]);
  }, []);

  const updateIntake = useCallback((intake: Intake) => {
    setIntakes(prev => prev.map(i => (i.id === intake.id ? intake : i)));
  }, []);

  const deleteIntake = useCallback((intakeId: string) => {
    setIntakes(prev => prev.filter(i => i.id !== intakeId));
  }, []);

  const getIntakesForMedicine = useCallback((medicineId: string) => intakes.filter(i => i.medicineIds?.includes(medicineId)), [intakes]);

  const getIntakeCountForMedicine = useCallback((medicineId: string) => intakes.filter(i => i.medicineIds?.includes(medicineId)).length, [intakes]);

  const getAllIntakes = useCallback(() => intakes, [intakes]);

  const getIntakesByDay = useCallback((day: string) => intakes.filter(i => i.intakeDay === day), [intakes]);

  const getIntakesByStatus = useCallback((status: string) => intakes.filter(i => i.status === status), [intakes]);

  const updateIntakeStatus = useCallback((intakeId: string, status: Intake['status']) => {
    setIntakes(prev => prev.map(i => (i.id === intakeId ? { ...i, status } : i)));
  }, []);

  const getIntakesForSchedule = useCallback((scheduleId: string) => intakes.filter(i => i.scheduleIds?.includes(scheduleId)), [intakes]);

  const deleteIntakesForSchedule = useCallback((scheduleId: string) => {
    setIntakes(prev => prev.filter(i => !i.scheduleIds?.includes(scheduleId)));
  }, []);

  const getIntakesByTimeRange = useCallback((startTime: string, endTime: string) => {
    // Предполагается формат "HH:MM"
    return intakes.filter(i => i.intakeTime >= startTime && i.intakeTime <= endTime);
  }, [intakes]);

  const getUpcomingIntakes = useCallback((limit = 10) => {
    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const upcoming = intakes
      .filter(i => i.status === 'active' &&
        (i.intakeDay > currentDate || (i.intakeDay === currentDate && i.intakeTime >= currentTime))
      )
      .sort((a, b) => {
        if (a.intakeDay !== b.intakeDay) return a.intakeDay.localeCompare(b.intakeDay);
        return a.intakeTime.localeCompare(b.intakeTime);
      })
      .slice(0, limit);

    return upcoming;
  }, [intakes]);

  return (
    <IntakeContext.Provider
      value={{
        intakes,
        addIntake,
        addIntakes,
        updateIntake,
        deleteIntake,
        getIntakesForMedicine,
        getIntakeCountForMedicine,
        getAllIntakes,
        getIntakesByDay,
        getIntakesByStatus,
        updateIntakeStatus,
        getIntakesForSchedule,
        deleteIntakesForSchedule,
        getIntakesByTimeRange,
        getUpcomingIntakes,
      }}
    >
      {children}
    </IntakeContext.Provider>
  );
};

export const useIntake = (): IntakeContextType => {
  const ctx = useContext(IntakeContext);
  if (!ctx) throw new Error('useIntake must be used within IntakeProvider');
  return ctx;
};
