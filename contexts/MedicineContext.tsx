import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Medicine = {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string;
};

type MedicineContextType = {
  medicines: Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Promise<void>;
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

  const deleteMedicine = async (id: string) => {
    try {
      const updated = medicines.filter(m => m.id !== id);
      setMedicines(updated);
      await AsyncStorage.setItem('medicines', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete medicine', error);
    }
  };

  return (
    <MedicineContext.Provider value={{ medicines, addMedicine, deleteMedicine }}>
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