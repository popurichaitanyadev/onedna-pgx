import { create } from 'zustand';
import { api } from '../lib/api';
import { computeBmi, completionPct } from '../lib/validation';
import { GENE_VARIANTS, type FormData } from '../lib/form-schema';

interface FormState {
  draftId: string | null;
  currentSection: number;
  data: FormData;
  consent: boolean;
  saving: boolean;
  setField: (key: string, value: any) => void;
  toggleArray: (key: string, value: string) => void;
  setSection: (n: number) => void;
  setConsent: (v: boolean) => void;
  reset: () => void;
  loadDraft: (id: string) => Promise<void>;
  saveDraft: () => Promise<void>;
  submit: () => Promise<string>; // returns reference no
}

const initialData = (): FormData => ({
  medications: [{ drugName: '', dose: '', frequency: '', indication: '' }],
  geneVariants: GENE_VARIANTS.map((g) => ({ gene: g, genotype: '', method: '', notes: '' })),
});

export const useFormStore = create<FormState>((set, get) => ({
  draftId: null,
  currentSection: 1,
  data: initialData(),
  consent: false,
  saving: false,

  setField: (key, value) => {
    set((s) => {
      const data = { ...s.data, [key]: value };
      // Auto-calc BMI (PRD §6.2, AC §13.2.8)
      if (key === 'height' || key === 'weight') {
        const bmi = computeBmi(key === 'height' ? value : data.height, key === 'weight' ? value : data.weight);
        if (bmi) data.bmi = bmi;
      }
      return { data };
    });
  },

  toggleArray: (key, value) => {
    set((s) => {
      const arr: string[] = Array.isArray(s.data[key]) ? s.data[key] : [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { data: { ...s.data, [key]: next } };
    });
  },

  setSection: (n) => set({ currentSection: n }),
  setConsent: (v) => set({ consent: v }),
  reset: () => set({ draftId: null, currentSection: 1, data: initialData(), consent: false }),

  loadDraft: async (id) => {
    const { draft } = await api.get<{ draft: any }>(`/drafts/${id}`);
    set({
      draftId: draft.id,
      currentSection: draft.currentSection || 1,
      data: { ...initialData(), ...draft.formData },
      consent: false,
    });
  },

  saveDraft: async () => {
    const s = get();
    set({ saving: true });
    try {
      const payload = {
        patientName: s.data.fullName || '',
        currentSection: s.currentSection,
        formData: s.data,
        completionPct: completionPct(s.data),
      };
      if (s.draftId) {
        await api.patch(`/drafts/${s.draftId}`, payload);
      } else {
        const { draft } = await api.post<{ draft: any }>('/drafts', payload);
        set({ draftId: draft.id });
      }
    } finally {
      set({ saving: false });
    }
  },

  submit: async () => {
    const s = get();
    const { submission } = await api.post<{ submission: { referenceNo: string } }>('/submissions', {
      draftId: s.draftId ?? undefined,
      patientName: s.data.fullName || 'Unknown',
      formData: s.data,
      consent: s.consent,
      signature: s.data.signature || '',
    });
    get().reset();
    return submission.referenceNo;
  },
}));
