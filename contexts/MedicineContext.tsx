import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Medicine {
  id: string;
  name: string;
  quantity: number;
  form: string;
  expiryDate: string;
  dosage?: {
    amount: number;
    unit: string; // 'mg', 'ml', etc.
  };
}

type MedicineContextType = {
  medicines: Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Promise<void>;
  updateMedicine: (medicine: Medicine) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
};

const MedicineContext = createContext<MedicineContextType | undefined>(undefined);

export const MedicineProvider = ({ children }: { children: ReactNode }) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const stored = await AsyncStorage.getItem('medicines');
        if (stored) setMedicines(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load medicines', error);
      }
    };
    loadMedicines();
  }, []);

  const addMedicine = async (medicine: Omit<Medicine, 'id'>) => {
    try {
      const newMedicine = { ...medicine, id: Date.now().toString() };
      const updated = [...medicines, newMedicine];
      setMedicines(updated);
      await AsyncStorage.setItem('medicines', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to add medicine', error);
    }
  };

  const updateMedicine = async (updatedMedicine: Medicine) => {
    try {
      const updatedList = medicines.map((m) =>
        m.id === updatedMedicine.id ? updatedMedicine : m
      );
      setMedicines(updatedList);
      await AsyncStorage.setItem('medicines', JSON.stringify(updatedList));
    } catch (error) {
      console.error('Failed to update medicine', error);
    }
  };

  const deleteMedicine = async (id: string) => {
    try {
      const updated = medicines.filter((m) => m.id !== id);
      setMedicines(updated);
      await AsyncStorage.setItem('medicines', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete medicine', error);
    }
  };

  return (
    <MedicineContext.Provider value={{ medicines, addMedicine, updateMedicine, deleteMedicine }}>
      {children}
    </MedicineContext.Provider>
  );
};

export const useMedicine = () => {
  const context = useContext(MedicineContext);
  if (!context) {
    throw new Error('useMedicine must be used within a MedicineProvider');
  }
  return context;
};
