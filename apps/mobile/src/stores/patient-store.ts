import { create } from 'zustand';
import { apiClient } from '../services/api-client';
import type { PatientProfile, ApiResponse } from '@eyecare/shared';

interface PatientState {
  patients: PatientProfile[];
  activePatientId: string | null;
  isLoading: boolean;

  activePatient: () => PatientProfile | null;
  fetchPatients: () => Promise<void>;
  createPatient: (data: {
    name: string;
    dob?: string;
    relationship?: string;
    preferredLanguage?: string;
  }) => Promise<PatientProfile>;
  setActivePatient: (id: string) => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  activePatientId: null,
  isLoading: false,

  activePatient: () => {
    const { patients, activePatientId } = get();
    return patients.find((p) => p.id === activePatientId) || patients[0] || null;
  },

  fetchPatients: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient<ApiResponse<PatientProfile[]>>('/patients');
      const patients = res.data;
      set({
        patients,
        activePatientId: get().activePatientId || patients[0]?.id || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  createPatient: async (data) => {
    const res = await apiClient<ApiResponse<PatientProfile>>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const patient = res.data;
    set((state) => ({
      patients: [...state.patients, patient],
      activePatientId: state.activePatientId || patient.id,
    }));
    return patient;
  },

  setActivePatient: (id) => set({ activePatientId: id }),
}));
