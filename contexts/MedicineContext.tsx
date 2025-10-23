// contexts/MedicineContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Medicine,
  TempMedicine,
  Schedule,
  Intake,
  generateId,
  asyncSave,
  asyncLoad,
  ScheduleStatus,
  IntakeStatus,
} from './types';
import { useIntake } from './IntakeContext'; // Добавить этот импорт

interface MedicineContextType {
  medicines: Medicine[];
  tempMedicine: TempMedicine | null;
addMedicine: (
    medicine: Medicine,
    onScheduleCreated?: (schedule: Schedule) => void,
    onIntakesCreated?: (intakes: Intake[]) => void
  ) => Promise<void>;
updateMedicine: (medicine: Medicine) => Promise<void>;
  deleteMedicine: (
    id: string,
    onScheduleDeleted?: (scheduleIds: string[]) => void,
    onIntakesDeleted?: (intakeIds: string[]) => void
  ) => Promise<void>;
setTempMedicine: (medicine: TempMedicine | null) => void;
  getTempMedicine: () => TempMedicine | null;
addScheduleToMedicine: (
    medicineId: string,
    scheduleData: Omit<Schedule, 'medicineIds' | 'intakes'>
  ) => Promise<Schedule>;
createScheduleForMedicine: (
    medicineId: string,
    scheduleData: Omit<Schedule, 'id' | 'medicineIds' | 'intakes'>
  ) => Promise<Schedule>;
updateMedicineStatus: (medicineId: string, status: Medicine['status']) => Promise<void>;
  getMedicinesByStatus: (status: Medicine['status']) => Medicine[];
removeScheduleFromMedicine: (
    medicineId: string,
    scheduleId: string,
    onScheduleRemoved?: (scheduleId: string) => void,
    onIntakesRemoved?: (intakeIds: string[]) => void
  ) => Promise<void>;
}

const MedicineContext = createContext<MedicineContextType | undefined>(undefined);

const STORAGE_KEY = 'medicines_v1';
// ИСПРАВЛЕНИЕ 5: Ограничение количества приёмов до requiredNumberOfIntake
const createIntakesFromSchedule = (schedule: Schedule, medicine: Medicine): Intake[] => {
  
  // --- НАЧАЛО ЛОГИРОВАНИЯ ---
  console.log('[createIntakesFromSchedule] ПОЛУЧЕНЫ ДАННЫЕ ДЛЯ ГЕНЕРАЦИИ:', {
    scheduleId: schedule.id,
    scheduleName: schedule.name,
    intakeDaysCount: schedule.intakeDays?.length || 0,
    // Показать первые 5 дней для проверки
    intakeDaysSample: schedule.intakeDays?.slice(0, 5), 
    requiredNumberOfIntake: schedule.requiredNumberOfIntake,
    intakeTimes: schedule.intakeTimesOption?.intakeTimes,
    endOption: schedule.endOption,
    endOptionCount: schedule.endOptionCount,
  });
  // --- КОНЕЦ ЛОГИРОВАНИЯ ---

  const intakes: Intake[] = [];
const times = schedule.intakeTimesOption?.intakeTimes || [];
  const days = schedule.intakeDays || [];
  const requiredNumber = schedule.requiredNumberOfIntake || (times.length * days.length);
let intakeCount = 0;

  // Проходим по дням
  for (const day of days) {
    // Для каждого дня проходим по временам
    for (const time of times) {
      // Проверяем, не превышен ли лимит приёмов
      if (intakeCount >= requiredNumber) {
        console.log(`[createIntakesFromSchedule] Остановлено создание приёмов на ${intakeCount} (лимит: ${requiredNumber})`);
return intakes; // Прерываем создание
      }

      intakes.push({
        id: generateId(),
        medicineName: medicine.name,
        form: schedule.form ? { ...schedule.form } : undefined,
        dosage: schedule.dosage ? { ...schedule.dosage } : undefined,
        intakeTime: time,
        intakeDay: day,
        medicineIds: [medicine.id],
        scheduleIds: 
[schedule.id],
        status: 'active' as IntakeStatus,
        type: 'schedule',
        scheduleName: schedule.name,
      });

      intakeCount++;
}
  }

  console.log(`[createIntakesFromSchedule] Создано ${intakes.length} приёмов (требовалось: ${requiredNumber})`);
  return intakes;
};
export const MedicineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
const [tempMedicine, setTempMedicineState] = useState<TempMedicine | null>(null);
  const { addIntakes } = useIntake();
useEffect(() => {
    (async () => {
      const stored = await asyncLoad<Medicine[]>(STORAGE_KEY);
      if (stored) setMedicines(stored);
    })();
  }, []);
const saveMedicines = useCallback(async (list: Medicine[]) => {
    setMedicines(list);
    await asyncSave(STORAGE_KEY, list);
  }, []);
const addMedicine = useCallback(
    async (
      medicine: Medicine,
      onScheduleCreated?: (schedule: Schedule) => void,
      onIntakesCreated?: (intakes: Intake[]) => void
    ) => {
      const newMedicine: Medicine = {
        ...medicine,
        schedules: medicine.schedules ? [...medicine.schedules] : [],
      };

      const allIntakes: Intake[] = [];

      if (newMedicine.schedules && newMedicine.schedules.length > 0) 
{
        newMedicine.schedules = newMedicine.schedules.map(sch => {
          const scheduleWithId: Schedule = {
            ...sch,
            id: sch.id || generateId(),
            medicineIds: [...(sch.medicineIds || []), newMedicine.id],
            status: sch.status || 'active',
            endOption: sch.endOption ?? undefined,
 
           endOptionCount: sch.endOptionCount ?? undefined,
          };
          
          const intakes = createIntakesFromSchedule(scheduleWithId, newMedicine);
          scheduleWithId.intakes = intakes;
allIntakes.push(...intakes);
          onScheduleCreated?.(scheduleWithId);
          return scheduleWithId;
        });

        newMedicine.intakesId = allIntakes.map(i => i.id);
// ДОБАВИТЬ: передать приемы в контекст приёмов
        if (allIntakes.length > 0) {
          addIntakes(allIntakes);
}
        
        onIntakesCreated?.(allIntakes);
}

      const updated = [...medicines, newMedicine];
      await saveMedicines(updated);
},
    [medicines, saveMedicines, addIntakes] // ДОБАВИТЬ addIntakes в зависимости
  );
const updateMedicine = useCallback(
    async (medicine: Medicine) => {
      console.log('MedicineContext.updateMedicine:', {
        id: medicine.id,
        schedulesCount: medicine.schedules?.length || 0,
        firstSchedule: medicine.schedules?.[0] ? {
          id: medicine.schedules[0].id,
          endOption: medicine.schedules[0].endOption,
          endOptionCount: medicine.schedules[0].endOptionCount,
          requiredNumberOfIntake: medicine.schedules[0].requiredNumberOfIntake,
       
   intakeDays: medicine.schedules[0].intakeDays?.length || 0
        } : null
      }); // Отладка
      
      const updated = medicines.map(m => 
        m.id === medicine.id 
          ? { 
              ...medicine, 
              schedules: medicine.schedules || [] // Убедитесь, что chedules полностью сохраняются
            } 
          : m
      );
      await saveMedicines(updated);
    },
    [medicines, saveMedicines]
  );
const deleteMedicine = useCallback(
    async (
      id: string,
      onScheduleDeleted?: (scheduleIds: string[]) => void,
      onIntakesDeleted?: (intakeIds: string[]) => void
    ) => {
      const m = medicines.find(x => x.id === id);
      if (m) {
        const scheduleIds = m.schedules?.map(s => s.id) || [];
        const intakeIds = m.intakesId || [];
        if (scheduleIds.length) 
onScheduleDeleted?.(scheduleIds);
        if (intakeIds.length) onIntakesDeleted?.(intakeIds);
      }
      const updated = medicines.filter(x => x.id !== id);
      await saveMedicines(updated);
    },
    [medicines, saveMedicines]
  );
const setTempMedicine = useCallback((m: TempMedicine | null) => {
    setTempMedicineState(m);
  }, []);
const getTempMedicine = useCallback(() => tempMedicine, [tempMedicine]);

  const addScheduleToMedicine = useCallback(
    async (medicineId: string, scheduleData: Omit<Schedule, 'medicineIds' | 'intakes'>) => {
      const medicine = medicines.find(m => m.id === medicineId);
      if (!medicine) throw new Error(`Medicine ${medicineId} not found`);

      // Создаем Schedule — не читаем medicineIds из scheduleData, просто назначаем новый массив с текущим medicineId
      const schedule: Schedule = {
        ...scheduleData,
        id: (scheduleData as any).id 
|| generateId(),
        medicineIds: [medicineId],      // <-- явное присвоение, не чтение из scheduleData
        intakes: [],
        status: scheduleData.status || 'active',
        // ensure new fields are carried over if present
        endOption: (scheduleData as any).endOption ?? undefined,
        endOptionCount: (scheduleData as any).endOptionCount ?? undefined,
      };

      const newIntakes = 
createIntakesFromSchedule(schedule, medicine);
      schedule.intakes = newIntakes;
const updatedMedicine: Medicine = {
        ...medicine,
        schedules: [...(medicine.schedules || []), schedule],
        intakesId: [...(medicine.intakesId || []), ...newIntakes.map(i => i.id)],
      };
const updated = medicines.map(m => (m.id === medicineId ? updatedMedicine : m));
      await saveMedicines(updated);

      return schedule;
},
    [medicines, saveMedicines]
  );

  const createScheduleForMedicine = useCallback(
    async (medicineId: string, scheduleData: Omit<Schedule, 'id' | 'medicineIds' | 'intakes'>) => {
      const dataWithId: Schedule = {
        ...scheduleData,
        id: generateId(),
        medicineIds: [],
        intakes: [],
        status: scheduleData.status || 'active',
        endOption: (scheduleData as any).endOption ?? undefined,
     
   endOptionCount: (scheduleData as any).endOptionCount ?? undefined,
      };
      const created = await addScheduleToMedicine(medicineId, dataWithId);
      return created;
    },
    [addScheduleToMedicine]
  );
const updateMedicineStatus = useCallback(
    async (medicineId: string, status: Medicine['status']) => {
      const updated = medicines.map(m => (m.id === medicineId ? { ...m, status } : m));
      await saveMedicines(updated);
    },
    [medicines, saveMedicines]
  );
const getMedicinesByStatus = useCallback(
    (status: Medicine['status']) => medicines.filter(m => m.status === status),
    [medicines]
  );
const removeScheduleFromMedicine = useCallback(
    async (
      medicineId: string,
      scheduleId: string,
      onScheduleRemoved?: (scheduleId: string) => void,
      onIntakesRemoved?: (intakeIds: string[]) => void
    ) => {
      const med = medicines.find(m => m.id === medicineId);
      if (!med) throw new Error(`Medicine ${medicineId} not found`);

      const scheduleToRemove = med.schedules?.find(s => s.id === scheduleId);
      const intakeIdsToRemove = scheduleToRemove?.intakes?.map(i => i.id) || 
[];

      const updatedMed: Medicine = {
        ...med,
        schedules: med.schedules?.filter(s => s.id !== scheduleId) || [],
        intakesId: med.intakesId?.filter(id => !intakeIdsToRemove.includes(id)) || [],
      };

      const updated = medicines.map(m => (m.id === medicineId ? updatedMed : m));
      await saveMedicines(updated);

      onScheduleRemoved?.(scheduleId);
      if (intakeIdsToRemove.length) onIntakesRemoved?.(intakeIdsToRemove);
},
    [medicines, saveMedicines]
  );

  return (
    <MedicineContext.Provider
      value={{
        medicines,
        tempMedicine,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        setTempMedicine,
        getTempMedicine,
        addScheduleToMedicine,
        createScheduleForMedicine,
        updateMedicineStatus,
 
       getMedicinesByStatus,
        removeScheduleFromMedicine,
      }}
    >
      {children}
    </MedicineContext.Provider>
  );
};

export const useMedicine = (): MedicineContextType => {
  const ctx = useContext(MedicineContext);
if (!ctx) throw new Error('useMedicine must be used within MedicineProvider');
  return ctx;
};