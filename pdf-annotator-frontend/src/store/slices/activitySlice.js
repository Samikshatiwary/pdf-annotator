import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activities: [],
  loading: false,
  error: null,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    setActivities: (state, action) => {
      state.activities = action.payload;
      state.loading = false;
    },
    addActivity: (state, action) => {
      state.activities.unshift(action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setActivities, addActivity, setLoading, setError } = activitySlice.actions;
export default activitySlice.reducer;