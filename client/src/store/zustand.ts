// client/src/store/zustand.ts
import { create } from "zustand";

interface ContractStore {
  analysisResults: Record<string, unknown> | null;
  setAnalysisResults: (results: Record<string, unknown> | null) => void;
}

// Implementación corregida
const useContractStore = create<ContractStore>((set) => ({
  analysisResults: null,
  setAnalysisResults: (results) => set({ analysisResults: results }),
}));

// Tipado completo para ModalState
type ModalState = {
  modals: Record<string, boolean>;
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
  isOpen: (key: string) => boolean;
};

const useModalStore = create<ModalState>((set, get) => ({
  modals: {},
  openModal: (key) =>
    set((state) => ({
      modals: { ...state.modals, [key]: true },
    })),
  closeModal: (key) =>
    set((state) => ({
      modals: { ...state.modals, [key]: false },
    })),
  isOpen: (key) => Boolean(get().modals[key]),
}));

export { useContractStore, useModalStore };
