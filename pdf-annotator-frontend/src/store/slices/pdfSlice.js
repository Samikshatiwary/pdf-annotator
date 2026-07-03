import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  pdfs: [],
  currentPdf: null,
  sharedPdfs: [],
  publicPdfs: [],
  loading: false,
  uploadProgress: 0,
  error: null,
  filters: {
    search: '',
    isFavorite: false,
    isArchived: false,
  },
  sortBy: 'date',
  viewMode: 'grid',
};

const pdfSlice = createSlice({
  name: 'pdf',
  initialState,
  reducers: {
    setPdfs: (state, action) => {
      state.pdfs = action.payload;
      state.loading = false;
    },
    setCurrentPdf: (state, action) => {
      state.currentPdf = action.payload;
    },
    addPdf: (state, action) => {
      state.pdfs.unshift(action.payload);
    },
    updatePdf: (state, action) => {
      const index = state.pdfs.findIndex(pdf => pdf.uuid === action.payload.uuid);
      if (index !== -1) {
        state.pdfs[index] = { ...state.pdfs[index], ...action.payload };
      }
    },
    removePdf: (state, action) => {
      state.pdfs = state.pdfs.filter(pdf => pdf.uuid !== action.payload);
    },
    setSharedPdfs: (state, action) => {
      state.sharedPdfs = action.payload;
    },
    setPublicPdfs: (state, action) => {
      state.publicPdfs = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setPdfs,
  setCurrentPdf,
  addPdf,
  updatePdf,
  removePdf,
  setSharedPdfs,
  setPublicPdfs,
  setLoading,
  setUploadProgress,
  setError,
  setFilters,
  setSortBy,
  setViewMode,
  clearError,
} = pdfSlice.actions;

export default pdfSlice.reducer;