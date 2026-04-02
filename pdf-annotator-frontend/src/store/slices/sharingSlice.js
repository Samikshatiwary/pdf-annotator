import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sharedWith: [],
  permissions: {},
  loading: false,
  error: null,
};

const sharingSlice = createSlice({
  name: 'sharing',
  initialState,
  reducers: {
    setSharedWith: (state, action) => {
      state.sharedWith = action.payload;
    },
    addSharedUser: (state, action) => {
      state.sharedWith.push(action.payload);
    },
    removeSharedUser: (state, action) => {
      state.sharedWith = state.sharedWith.filter(u => u.userId !== action.payload);
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
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

export const {
  setSharedWith,
  addSharedUser,
  removeSharedUser,
  setPermissions,
  setLoading,
  setError,
} = sharingSlice.actions;

export default sharingSlice.reducer;