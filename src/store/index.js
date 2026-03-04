import { create } from 'zustand';
import { listCorpora } from '../lib/storage';

const useStore = create((set) => ({
  // Corpus list
  corpora: [],
  activeCorpusId: null,

  // Map state
  mapState: {
    zoom: 1,
    center: [0, 0],
  },

  // Selection
  selectedPoint: null,
  lassoSelection: [],

  // Actions
  loadCorpora: async () => {
    const corpora = await listCorpora();
    set({ corpora });
  },

  setActiveCorpus: (id) => set({ activeCorpusId: id }),

  setSelectedPoint: (point) => set({ selectedPoint: point }),

  clearSelectedPoint: () => set({ selectedPoint: null }),

  setLassoSelection: (indices) => set({ lassoSelection: indices }),

  clearLassoSelection: () => set({ lassoSelection: [] }),

  setMapState: (mapState) => set({ mapState }),

  addCorpus: (corpus) =>
    set((state) => ({
      corpora: [
        {
          id: corpus.id,
          name: corpus.name,
          domain: corpus.domain,
          docCount: corpus.documents?.length || 0,
          categories: corpus.categories,
          createdAt: corpus.createdAt,
        },
        ...state.corpora,
      ],
    })),
}));

export default useStore;
