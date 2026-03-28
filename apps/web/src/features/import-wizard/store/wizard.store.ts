import { create } from 'zustand';

interface WizardState {
  currentStep: number;
  projectId: string | null;
  selectedFile: File | null;
  importId: string | null;
  
  // Settings for execution
  databaseType: string;
  tableName: string;

  // SQL state for editing
  generatedSql: string | null;
  editedSql: string | null;

  setStep: (step: number) => void;
  setProjectId: (id: string | null) => void;
  setFile: (file: File | null) => void;
  setImportId: (id: string | null) => void;
  setDatabaseType: (type: string) => void;
  setTableName: (name: string) => void;
  setGeneratedSql: (sql: string | null) => void;
  setEditedSql: (sql: string | null) => void;
  resetSqlToGenerated: () => void;
}

export const useWizardStore = create<WizardState>((set, get) => ({
  currentStep: 0,
  projectId: null,
  selectedFile: null,
  importId: null,
  databaseType: 'postgres',
  tableName: '',
  generatedSql: null,
  editedSql: null,

  setStep: (step) => set({ currentStep: step }),
  setProjectId: (id) => set({ projectId: id }),
  setFile: (file) => set({ selectedFile: file }),
  setImportId: (id) => set({ importId: id }),
  setDatabaseType: (type) => set({ databaseType: type }),
  setTableName: (name) => set({ tableName: name }),
  setGeneratedSql: (sql) => set({ generatedSql: sql, editedSql: sql }),
  setEditedSql: (sql) => set({ editedSql: sql }),
  resetSqlToGenerated: () => set({ editedSql: get().generatedSql }),
}));