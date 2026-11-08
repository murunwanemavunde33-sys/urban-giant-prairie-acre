import { create } from "zustand";
import { persist } from "zustand/middleware";

type StudyState = {
  saved: Record<string, boolean>;
  done: Record<string, boolean>;
  toggleSaved: (id: string) => void;
  toggleDone: (id: string) => void;
};

export const useStudy = create<StudyState>()(
  persist(
    (set) => ({
      saved: {},
      done: {},
      toggleSaved: (id) =>
        set((state) => ({
          saved: { ...state.saved, [id]: !state.saved[id] },
        })),
      toggleDone: (id) =>
        set((state) => ({
          done: { ...state.done, [id]: !state.done[id] },
        })),
    }),
    { name: "vula-study", skipHydration: true },
  ),
);
