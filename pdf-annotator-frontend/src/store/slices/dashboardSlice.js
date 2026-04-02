import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: {
    totalPdfs: 0,
    totalHighlights: 0,
    storageUsed: 0,
    recentActivity: [],
  },
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setStats: (state, action) => {
      state.stats = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setStats, setLoading, setError, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;