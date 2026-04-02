import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOnline: navigator.onLine,
  syncPending: false,
  lastSyncTime: null,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    setSyncPending: (state, action) => {
      state.syncPending = action.payload;
    },
    setLastSyncTime: (state, action) => {
      state.lastSyncTime = action.payload;
    },
  },
});

export const { setOnlineStatus, setSyncPending, setLastSyncTime } = offlineSlice.actions;
export default offlineSlice.reducer;