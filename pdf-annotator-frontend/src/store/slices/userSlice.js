import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  preferences: {
    theme: 'light',
    defaultHighlightColor: '#ffff00',
    autoSave: true,
  },
  activity: [],
  storage: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setActivity: (state, action) => {
      state.activity = action.payload;
    },
    setStorage: (state, action) => {
      state.storage = action.payload;
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

export const {
  setProfile,
  updateProfile,
  setPreferences,
  setActivity,
  setStorage,
  setLoading,
  setError,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;