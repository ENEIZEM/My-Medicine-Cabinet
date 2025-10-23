// contexts/types.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Weekday = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su';

export type MedicineStatus = 'active' | 'archived';
export type ScheduleStatus = 'active' | 'archived';
export type IntakeStatus = 'active' | 'successful' | 'archived' | 'waiting' | 'missed';

export interface Dose {
  amount?: number;
  unit?: string;
}

export interface Form {
  quantity: number;
  form: string;
}

export interface IntakeTimeOption {
  option: 1 | 2;
  intervalStartTime?: string;
  intervalEndTime?: string;
  intervalDuration?: number;
  intakeTimes: string[]; // hh:mm
}

export interface IntakeDaysOption {
  option: 1 | 2;
  intakeWeekdays?: Weekday[];
  intakeDaysInterval?: number;
  intakeDaysType?: 'day' | 'week' | 'month' | 'year';
}

/** Intake */
export interface Intake {
  id: string;
  medicineName: string;
  scheduleName?: string; //пока не использеются
  form?: Form;
  dosage?: Dose;
  type: 'schedule' | 'one-time',
  intakeTime: string; // "HH:MM"
  intakeDay: string; // ISO date "YYYY-MM-DD"
  delayedIntakeTime?: string; // ISO date "YYYY-MM-DD"
  medicineIds?: string[]; // medicine ids
  scheduleIds?: string[]; // schedule ids
  status: IntakeStatus;
}

/** Schedule */
export interface Schedule {
  id: string;
  name: string;
  form?: Form;
  actualNumberOfIntake?: number;
  requiredNumberOfIntake?: number;
  dosage?: Dose;
  intakeTimesOption: IntakeTimeOption;
  intakeDaysOption: IntakeDaysOption;
  startDate: string; // ISO date
  endDate?: string; // ISO date
  intakeDays: string[]; // list of ISO dates
  medicineIds?: string[]; // medicines tied to schedule
  intakes?: Intake[]; // generated intakes
  endOption?: '1' | '2' | '3';            // '1' = ручная, '2' = expiry, '3' = по количеству
  endOptionCount?: number | undefined; 
  status: ScheduleStatus;
}

/** Medicine */
export interface Medicine {
  id: string;
  name: string;
  form: string;
  quantity: number;
  expiryDate: string; // ISO date
  dosage?: Dose;
  schedules?: Schedule[];
  intakesId?: string[]; // list of intake ids
  totalNumberOfIntake?: number;
  status: MedicineStatus;
}

/** Temporary variants (used e.g. during creation) */
export interface TempMedicine {
  id: string;
  name: string;
  form: string;
  quantity: number;
  expiryDate?: string;
  dosage?: Dose;
  schedules?: TempSchedule[];
  totalNumberOfIntake?: number;
}

export interface TempSchedule {
  id: string;
  name: string;
  form?: Form;
  actualNumberOfIntake?: number;
  requiredNumberOfIntake?: number;
  dosage?: Dose;
  intakeTimesOption: IntakeTimeOption;
  intakeDaysOption: IntakeDaysOption;
  startDate: string;
  endDate?: string;
  intakeDays: string[];
  endOption?: '1' | '2' | '3';            // '1' = ручная, '2' = expiry, '3' = по количеству
  endOptionCount?: number | undefined; 
  medicineIds?: string[];
}

/** Утилита для генерации id */
export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

/** Примитивная утилита для сохранения в AsyncStorage */
export const asyncSave = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('asyncSave error', e);
    throw e;
  }
};

export const asyncLoad = async <T = any>(key: string): Promise<T | null> => {
  try {
    const s = await AsyncStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch (e) {
    console.error('asyncLoad error', e);
    return null;
  }
};